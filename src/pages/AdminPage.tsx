import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { portalRoles } from '../auth/roles'
import { Alert, EmptyState } from '../components/Feedback'
import CooperativeTrainingPanel from '../components/CooperativeTrainingPanel'
import PageHeader from '../components/PageHeader'
import { normalizeRichText, RichTextEditor, richTextCharacterCount } from '../components/RichText'
import { useAuth } from '../context/AuthContext'
import {
  api,
  type AdminApplication,
  type AdminAuditLog,
  type AdminCandidate,
  type AdminJobPayload,
  type AdminJobOptions,
  type AdminSummary,
  type Job,
  type RecruitmentRequest,
  type RecruitmentRequestPayload,
} from '../services/api'

type AdminTab = 'applications' | 'jobs' | 'candidates' | 'requests' | 'training' | 'audit'

const adminTabPaths: Record<AdminTab, string> = {
  applications: '/admin',
  jobs: '/admin/jobs',
  candidates: '/admin/candidates',
  requests: '/admin/recruitment-requests',
  training: '/admin/cooperative-training',
  audit: '/admin/activity-log',
}

const tabFromPath = (pathname: string): AdminTab => {
  if (pathname.endsWith('/jobs')) return 'jobs'
  if (pathname.endsWith('/candidates')) return 'candidates'
  if (pathname.endsWith('/recruitment-requests')) return 'requests'
  if (pathname.endsWith('/cooperative-training')) return 'training'
  if (pathname.endsWith('/activity-log')) return 'audit'
  return 'applications'
}

const applicationStatuses: AdminApplication['status'][] = [
  'Under Review',
  'Interview',
  'Shortlisted',
  'Rejected',
  'Hired',
  'Withdrawn',
]

const dateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const defaultExpiryDate = () => {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  return dateInputValue(expiry)
}

const latestAdultBirthDate = () => {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dateInputValue(cutoff)
}

const createEmptyJob = (): AdminJobPayload => ({
  title: '',
  division: '',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  job_function: '',
  career_level: 'Mid-level',
  employment_type: 'Full-time',
  summary: '',
  description: '',
  requirements: '',
  is_open: true,
  is_published: true,
  is_featured: false,
  posted_at: dateInputValue(new Date()),
  expires_at: defaultExpiryDate(),
})

const emptyRecruitmentRequest: RecruitmentRequestPayload = {
  preferred_position: '',
  name: '',
  nationality: 'Saudi',
  gender: 'Male',
  driver_license_type: 'None',
  mobile_number: '966',
  email_address: '',
  iqama_number: '',
  iqama_profession: '',
  current_employer: 'Not currently employed',
  date_of_birth: '',
  city: 'Riyadh',
  accept_work_in_another_city: true,
  qualification: "Bachelor's Degree",
  current_salary: 0,
  comments: '',
}

const cityOptions = ['Riyadh', 'Jeddah', 'Dammam', 'Al Khobar', 'Other']
const employerOptions = ['ABC Technologies', 'Global Solutions', 'Tech Services Co.', 'Digital Innovations', 'Smart Systems', 'Other', 'Not currently employed']
const preferredPositionSuggestions = ['Applications Project Manager', 'Business Analyst', 'System Administrator', 'Software Developer', 'IT Support Engineer']
const preferredNationality = (values: string[]) =>
  values.find((value) => value.toLowerCase().startsWith('saudi')) ?? values[0] ?? emptyRecruitmentRequest.nationality

const emptyJobOptions: AdminJobOptions = {
  countries: [],
  cities: [],
  cities_by_country: {},
  nationalities: [],
  divisions: [],
  job_functions: [],
  career_levels: [],
}

const jobToPayload = (job: Job): AdminJobPayload => ({
  title: job.title,
  division: job.division,
  country: job.country,
  city: job.city,
  job_function: job.job_function,
  career_level: job.career_level as AdminJobPayload['career_level'],
  employment_type: job.employment_type as AdminJobPayload['employment_type'],
  summary: job.summary,
  description: job.description,
  requirements: job.requirements,
  is_open: job.is_open,
  is_published: job.is_published,
  is_featured: job.is_featured,
  posted_at: job.posted_at.slice(0, 10),
  expires_at: job.expires_at?.slice(0, 10) ?? defaultExpiryDate(),
})

const isJobExpired = (job: Job) => Boolean(job.expires_at && job.expires_at.slice(0, 10) < dateInputValue(new Date()))
const isJobAvailable = (job: Job) => job.is_published && job.is_open &&
  job.posted_at.slice(0, 10) <= dateInputValue(new Date()) && !isJobExpired(job)

export default function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdministrator = user?.role === portalRoles.administrator
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobOptions, setJobOptions] = useState<AdminJobOptions>(emptyJobOptions)
  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [candidates, setCandidates] = useState<AdminCandidate[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [recruitmentRequests, setRecruitmentRequests] = useState<RecruitmentRequest[]>([])
  const [trainingRequestCount, setTrainingRequestCount] = useState(0)
  const [trainingRefreshKey, setTrainingRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const requestedTab = tabFromPath(location.pathname)
    return requestedTab === 'audit' && !isAdministrator ? 'applications' : requestedTab
  })
  const [jobForm, setJobForm] = useState<AdminJobPayload>(createEmptyJob)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [showJobForm, setShowJobForm] = useState(false)
  const [requestForm, setRequestForm] = useState<RecruitmentRequestPayload>(emptyRecruitmentRequest)
  const [editingRequest, setEditingRequest] = useState<RecruitmentRequest | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadAdminData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextSummary, nextJobs, nextJobOptions, nextApplications, nextCandidates, nextAuditLogs] = await Promise.all([
        api.adminSummary(),
        api.adminJobs(),
        api.adminJobOptions(),
        api.adminApplications(),
        api.adminCandidates(),
        isAdministrator ? api.adminAuditLogs() : Promise.resolve([]),
      ])
      setSummary(nextSummary)
      setJobs(nextJobs)
      setJobOptions(nextJobOptions)
      setApplications(nextApplications)
      setCandidates(nextCandidates)
      setAuditLogs(nextAuditLogs)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load administration data')
    } finally {
      setLoading(false)
    }
  }

  const refreshAuditLogs = async () => {
    if (!isAdministrator) return
    try {
      setAuditLogs(await api.adminAuditLogs())
    } catch {
      // The main refresh surfaces load failures; background log refreshes stay unobtrusive.
    }
  }

  const refreshSummary = async () => {
    try {
      setSummary(await api.adminSummary())
    } catch {
      // The next full refresh will reconcile summary counts.
    }
  }

  const loadRecruitmentRequests = async () => {
    setRequestsLoading(true)
    setRequestsError(null)
    try {
      setRecruitmentRequests(await api.recruitmentRequests())
    } catch (caught) {
      setRequestsError(caught instanceof Error ? caught.message : 'Unable to load recruitment requests from SharePoint')
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    void loadAdminData()
    void loadRecruitmentRequests()
  }, [])

  useEffect(() => {
    const requestedTab = tabFromPath(location.pathname)
    if (requestedTab === 'audit' && !isAdministrator) {
      setActiveTab('applications')
      navigate('/admin', { replace: true })
      return
    }
    setActiveTab(requestedTab)
  }, [isAdministrator, location.pathname, navigate])

  const selectTab = (tab: AdminTab) => {
    if (tab === 'audit' && !isAdministrator) return
    setActiveTab(tab)
    navigate(adminTabPaths[tab])
  }

  const openCreateJob = () => {
    if (!hasJobOptions) {
      setError('Job dropdown values are not available in the database yet.')
      return
    }
    const initialJob = createEmptyJob()
    const country = jobOptions.countries[0] ?? ''
    selectTab('jobs')
    setEditingJob(null)
    setJobForm({
      ...initialJob,
      country,
      city: jobOptions.cities_by_country[country]?.[0] ?? '',
      division: jobOptions.divisions[0] ?? '',
      job_function: jobOptions.job_functions[0] ?? '',
      career_level: jobOptions.career_levels[0] ?? initialJob.career_level,
    })
    setShowJobForm(true)
  }

  const openEditJob = (job: Job) => {
    selectTab('jobs')
    setEditingJob(job)
    setJobForm(jobToPayload(job))
    setShowJobForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeJobForm = () => {
    setShowJobForm(false)
    setEditingJob(null)
    setJobForm(createEmptyJob())
  }

  const openCreateRequest = () => {
    selectTab('requests')
    setEditingRequest(null)
    setRequestForm({ ...emptyRecruitmentRequest, nationality: preferredNationality(jobOptions.nationalities) })
    setShowRequestForm(true)
  }

  const openEditRequest = (request: RecruitmentRequest) => {
    selectTab('requests')
    setEditingRequest(request)
    setRequestForm({
      preferred_position: request.preferred_position,
      name: request.name,
      nationality: request.nationality,
      gender: request.gender,
      driver_license_type: request.driver_license_type,
      mobile_number: request.mobile_number,
      email_address: request.email_address,
      iqama_number: request.iqama_number,
      iqama_profession: request.iqama_profession,
      current_employer: request.current_employer,
      date_of_birth: request.date_of_birth.slice(0, 10),
      city: request.city,
      accept_work_in_another_city: request.accept_work_in_another_city,
      qualification: request.qualification,
      current_salary: request.current_salary,
      comments: request.comments,
    })
    setShowRequestForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeRequestForm = () => {
    setShowRequestForm(false)
    setEditingRequest(null)
    setRequestForm(emptyRecruitmentRequest)
  }

  const saveJob = async (event: FormEvent) => {
    event.preventDefault()
    const description = normalizeRichText(jobForm.description)
    const requirements = normalizeRichText(jobForm.requirements, true)
    if (richTextCharacterCount(description) === 0 || richTextCharacterCount(requirements) === 0) {
      setError('Description and requirements are required.')
      setNotice(null)
      return
    }
    if (description.length > 10000 || requirements.length > 10000) {
      setError('Description and requirements must each remain within 10,000 characters, including formatting.')
      setNotice(null)
      return
    }
    const payload = { ...jobForm, description, requirements }
    setSaving(editingJob ? `edit-job-${editingJob.id}` : 'create-job')
    setError(null)
    setNotice(null)
    try {
      if (editingJob) {
        const updated = await api.updateAdminJob(editingJob.id, payload)
        setJobs((current) => current.map((item) => item.id === updated.id ? updated : item))
        if (isJobAvailable(updated) !== isJobAvailable(editingJob)) {
          setSummary((current) => current ? { ...current, open_jobs: current.open_jobs + (isJobAvailable(updated) ? 1 : -1) } : current)
        }
        setNotice(`Job “${updated.title}” was updated successfully.`)
      } else {
        const created = await api.createAdminJob(payload)
        setJobs((current) => [created, ...current])
        setSummary((current) => current ? { ...current, open_jobs: current.open_jobs + (isJobAvailable(created) ? 1 : 0) } : current)
        setNotice(`Job “${created.title}” was ${created.is_published ? 'published' : 'saved as unpublished'} successfully.`)
      }
      void refreshAuditLogs()
      void refreshSummary()
      closeJobForm()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the job')
    } finally {
      setSaving(null)
    }
  }

  const deleteJob = async (job: Job) => {
    if (!window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return
    setSaving(`delete-job-${job.id}`)
    setError(null)
    setNotice(null)
    try {
      const result = await api.deleteAdminJob(job.id)
      setJobs((current) => current.filter((item) => item.id !== job.id))
      if (isJobAvailable(job)) {
        setSummary((current) => current ? { ...current, open_jobs: Math.max(0, current.open_jobs - 1) } : current)
      }
      if (editingJob?.id === job.id) closeJobForm()
      setNotice(result.message)
      void refreshAuditLogs()
      void refreshSummary()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the job')
    } finally {
      setSaving(null)
    }
  }

  const updateJobFlags = async (job: Job, changes: Partial<AdminJobPayload>) => {
    setSaving(`job-${job.id}`)
    setError(null)
    setNotice(null)
    try {
      const updated = await api.updateAdminJob(job.id, changes)
      setJobs((current) => current.map((item) => item.id === updated.id ? updated : item))
      if (isJobAvailable(updated) !== isJobAvailable(job)) {
        setSummary((current) => current ? { ...current, open_jobs: current.open_jobs + (isJobAvailable(updated) ? 1 : -1) } : current)
      }
      setNotice(`Job “${updated.title}” was updated.`)
      void refreshAuditLogs()
      void refreshSummary()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the job')
    } finally {
      setSaving(null)
    }
  }

  const updateApplicationStatus = async (application: AdminApplication, status: AdminApplication['status']) => {
    setSaving(`application-${application.id}`)
    setError(null)
    setNotice(null)
    try {
      const updated = await api.updateAdminApplicationStatus(application.id, status)
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`${updated.application_code} moved to ${updated.status}. The candidate was notified.`)
      void refreshAuditLogs()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the application')
    } finally {
      setSaving(null)
    }
  }

  const viewCandidateCv = async (candidate: AdminCandidate) => {
    if (!candidate.resume_url) return
    if (candidate.resume_url.startsWith('https://') || candidate.resume_url.startsWith('http://')) {
      window.open(candidate.resume_url, '_blank', 'noopener,noreferrer')
      return
    }

    setSaving(`resume-${candidate.id}`)
    setError(null)
    try {
      const blob = await api.adminCandidateResume(candidate.id)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      if (blob.type !== 'application/pdf') link.download = candidate.resume_name || 'candidate-cv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open the candidate CV')
    } finally {
      setSaving(null)
    }
  }

  const saveRecruitmentRequest = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(editingRequest ? `edit-request-${editingRequest.id}` : 'create-request')
    setError(null)
    setNotice(null)
    try {
      if (editingRequest) {
        const updated = await api.updateRecruitmentRequest(editingRequest.id, requestForm)
        setRecruitmentRequests((current) => current.map((item) => item.id === updated.id ? updated : item))
        setNotice(`Recruitment request for ${updated.name} was updated successfully.`)
      } else {
        const created = await api.createRecruitmentRequest(requestForm)
        setRecruitmentRequests((current) => [created, ...current])
        setNotice(`Recruitment request for ${created.name} was created successfully.`)
      }
      void refreshAuditLogs()
      closeRequestForm()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the recruitment request')
    } finally {
      setSaving(null)
    }
  }

  const deleteRecruitmentRequest = async (request: RecruitmentRequest) => {
    if (!window.confirm(`Delete the recruitment request for ${request.name}? This cannot be undone.`)) return
    setSaving(`delete-request-${request.id}`)
    setError(null)
    setNotice(null)
    try {
      await api.deleteRecruitmentRequest(request.id)
      setRecruitmentRequests((current) => current.filter((item) => item.id !== request.id))
      if (editingRequest?.id === request.id) closeRequestForm()
      setNotice(`Recruitment request for ${request.name} was deleted successfully.`)
      void refreshAuditLogs()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to delete the recruitment request')
    } finally {
      setSaving(null)
    }
  }

  const provisionRecruitmentRequests = async () => {
    setSaving('setup-recruitment-requests')
    setError(null)
    setNotice(null)
    try {
      await api.setupSharepoint()
      await loadRecruitmentRequests()
      setNotice('The Recruitment Requests list is ready in SharePoint.')
      void refreshAuditLogs()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to provision the SharePoint list')
    } finally {
      setSaving(null)
    }
  }

  const stats = [
    { label: 'Candidates', value: summary?.candidates ?? '—', icon: UsersRound, tone: 'blue' },
    { label: 'Applications', value: summary?.applications ?? '—', icon: ClipboardList, tone: 'violet' },
    { label: 'Open jobs', value: summary?.open_jobs ?? '—', icon: BriefcaseBusiness, tone: 'green' },
    { label: 'Administrators', value: summary?.admins ?? '—', icon: ShieldCheck, tone: 'amber' },
  ]
  const todayDate = dateInputValue(new Date())
  const originalPostingDate = editingJob?.posted_at.slice(0, 10)
  const minimumPostingDate = originalPostingDate && originalPostingDate < todayDate
    ? originalPostingDate
    : todayDate
  const hasJobOptions = jobOptions.countries.length > 0 && jobOptions.cities.length > 0 &&
    jobOptions.divisions.length > 0 && jobOptions.job_functions.length > 0 && jobOptions.career_levels.length > 0
  const availableJobCities = jobOptions.cities_by_country[jobForm.country] ?? []
  const selectableJobCities = jobForm.city && !availableJobCities.includes(jobForm.city)
    ? [jobForm.city, ...availableJobCities]
    : availableJobCities
  const recruitmentNationalityOptions = requestForm.nationality && !jobOptions.nationalities.includes(requestForm.nationality)
    ? [requestForm.nationality, ...jobOptions.nationalities]
    : jobOptions.nationalities
  const iqamaProfessionRequired = !requestForm.iqama_number.startsWith('1')

  return (
    <div className="page-container admin-page">
      <PageHeader
        title="Recruitment administration"
        subtitle="Publish opportunities, review candidates, and move applications through the hiring workflow."
        action={<div className="admin-header-actions"><button className="button button-secondary button-small" onClick={() => { void loadAdminData(); void loadRecruitmentRequests(); setTrainingRefreshKey((current) => current + 1) }} disabled={loading || requestsLoading}><RefreshCw size={16} />Refresh</button><button className="button button-primary button-small" onClick={openCreateJob} disabled={!hasJobOptions} title={hasJobOptions ? undefined : 'No job dropdown values are available in the database'}><Plus size={16} />New job</button></div>}
      />
      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      <section className="stats-grid admin-stats-grid">
        {stats.map(({ label, value, icon: Icon, tone }) => <article className="stat-card" key={label}><span className={`stat-icon tone-${tone}`}><Icon size={21} /></span><div><small>{label}</small><strong>{value}</strong><span>SQL records</span></div></article>)}
      </section>

      <div className="admin-tabs" role="tablist" aria-label="Administration sections">
        <button className={activeTab === 'applications' ? 'active' : ''} onClick={() => selectTab('applications')}><ClipboardList size={17} />Applications <span>{applications.length}</span></button>
        <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => selectTab('jobs')}><BriefcaseBusiness size={17} />Job postings <span>{jobs.length}</span></button>
        <button className={activeTab === 'candidates' ? 'active' : ''} onClick={() => selectTab('candidates')}><UsersRound size={17} />Candidates <span>{candidates.length}</span></button>
        <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => selectTab('requests')}><UserRound size={17} />Recruitment requests <span>{recruitmentRequests.length}</span></button>
        <button className={activeTab === 'training' ? 'active' : ''} onClick={() => selectTab('training')}><GraduationCap size={17} />Cooperative training <span>{trainingRequestCount}</span></button>
        {isAdministrator && <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => selectTab('audit')}><History size={17} />Activity log <span>{auditLogs.length}</span></button>}
      </div>

      {loading ? <div className="page-loader compact"><span className="loader" /></div> : (
        <>
          {activeTab === 'applications' && <section className="panel admin-table-panel">
            <div className="panel-heading"><div><h2>Candidate applications</h2><p>Changing a status updates PBICareerPosting and creates a notification.</p></div></div>
            {applications.length ? <div className="table-wrap"><table><thead><tr><th>Application</th><th>Candidate</th><th>CV</th><th>Job</th><th>Applied</th><th>Status</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id}><td><strong>{application.application_code}</strong></td><td><strong>{application.candidate.first_name} {application.candidate.last_name}</strong><small>{application.candidate.email}</small></td><td>{application.candidate.resume_url ? <button className="text-button" disabled={saving === `resume-${application.candidate.id}`} onClick={() => void viewCandidateCv(application.candidate)}><FileText size={14} />{saving === `resume-${application.candidate.id}` ? 'Opening...' : 'View CV'}</button> : <small>{application.candidate.resume_name ? 'CV unavailable' : 'Not uploaded'}</small>}</td><td><strong>{application.job.title}</strong><small>{application.job.city}, {application.job.country}</small></td><td>{new Date(application.applied_at).toLocaleDateString()}</td><td><select className="admin-status-select" value={application.status} disabled={saving === `application-${application.id}`} onChange={(event) => void updateApplicationStatus(application, event.target.value as AdminApplication['status'])}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div> : <EmptyState title="No applications" description="Candidate applications will appear here after jobs are published." />}
          </section>}

          {activeTab === 'jobs' && <>
            {showJobForm && <form className="panel admin-job-form" onSubmit={(event) => void saveJob(event)}>
              <div className="panel-heading"><div><h2>{editingJob ? 'Edit job posting' : 'Create job posting'}</h2><p>These fields feed the candidate search and job-details screens.</p></div><button type="button" className="icon-button" onClick={closeJobForm} aria-label="Close form"><X size={18} /></button></div>
              <div className="admin-job-fields">
                <label>Job title<input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} /></label>
                <label>Division<select required value={jobForm.division} onChange={(event) => setJobForm({ ...jobForm, division: event.target.value })}><option value="" disabled>Select division</option>{jobOptions.divisions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Country<select required value={jobForm.country} onChange={(event) => { const country = event.target.value; const cities = jobOptions.cities_by_country[country] ?? []; setJobForm({ ...jobForm, country, city: cities.includes(jobForm.city) ? jobForm.city : cities[0] ?? '' }) }}><option value="" disabled>Select country</option>{jobOptions.countries.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>City<select required value={jobForm.city} onChange={(event) => setJobForm({ ...jobForm, city: event.target.value })}><option value="" disabled>Select city</option>{selectableJobCities.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Job function<select required value={jobForm.job_function} onChange={(event) => setJobForm({ ...jobForm, job_function: event.target.value })}><option value="" disabled>Select job function</option>{jobOptions.job_functions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Career level<select required value={jobForm.career_level} onChange={(event) => setJobForm({ ...jobForm, career_level: event.target.value as AdminJobPayload['career_level'] })}>{jobOptions.career_levels.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Employment type<select value={jobForm.employment_type} onChange={(event) => setJobForm({ ...jobForm, employment_type: event.target.value as AdminJobPayload['employment_type'] })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option></select></label>
                <label>Job status<select value={jobForm.is_open ? 'open' : 'closed'} onChange={(event) => setJobForm({ ...jobForm, is_open: event.target.value === 'open' })}><option value="open">Open</option><option value="closed">Closed</option></select></label>
                <div className="admin-job-date-fields admin-job-wide">
                  <label>Posting date<input required type="date" min={minimumPostingDate} value={jobForm.posted_at} onChange={(event) => setJobForm({ ...jobForm, posted_at: event.target.value })} /></label>
                  <label>Expiry date<input required type="date" min={jobForm.posted_at} value={jobForm.expires_at} onChange={(event) => setJobForm({ ...jobForm, expires_at: event.target.value })} /></label>
                </div>
                <label className="admin-job-wide">Summary<textarea required rows={2} maxLength={2000} value={jobForm.summary} onChange={(event) => setJobForm({ ...jobForm, summary: event.target.value })} /><small className="field-character-count">{jobForm.summary.length.toLocaleString()} / 2,000 characters</small></label>
                <RichTextEditor className="admin-job-wide" label="Description" required maxLength={10000} value={jobForm.description} onChange={(description) => setJobForm((current) => ({ ...current, description }))} placeholder="Describe the role, responsibilities, and impact." />
                <RichTextEditor className="admin-job-wide" label="Requirements" required legacyList maxLength={10000} value={jobForm.requirements} onChange={(requirements) => setJobForm((current) => ({ ...current, requirements }))} placeholder="Add the qualifications and experience required for this role." />
                <label className="checkbox-label"><input type="checkbox" checked={jobForm.is_published} onChange={(event) => setJobForm({ ...jobForm, is_published: event.target.checked })} />{editingJob ? 'Published' : 'Publish immediately'}</label>
              </div>
              <div className="admin-form-actions"><button className="button button-primary" disabled={saving === 'create-job' || saving === `edit-job-${editingJob?.id}`}><Save size={17} />{saving ? 'Saving…' : editingJob ? 'Save changes' : 'Publish job'}</button></div>
            </form>}
            <section className="panel admin-table-panel">
              <div className="panel-heading"><div><h2>Job postings</h2><p>Open jobs appear immediately in candidate search.</p></div>{!showJobForm && <button className="button button-secondary button-small" onClick={openCreateJob} disabled={!hasJobOptions} title={hasJobOptions ? undefined : 'No job dropdown values are available in the database'}><Plus size={16} />Add job</button>}</div>
              <div className="table-wrap"><table><thead><tr><th>Job</th><th>Location</th><th>Posted</th><th>Expiry date</th><th>Status</th><th>Publish status</th><th>Actions</th></tr></thead><tbody>{jobs.map((job) => { const expired = isJobExpired(job); const scheduled = job.posted_at.slice(0, 10) > dateInputValue(new Date()); return <tr key={job.id}><td><strong>{job.title}</strong><small>{job.division} · {job.career_level}</small></td><td>{job.city}, {job.country}</td><td>{new Date(job.posted_at).toLocaleDateString()}</td><td>{job.expires_at ? new Date(`${job.expires_at.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'Not set'}</td><td><span className={`status-pill ${job.is_open && !expired ? 'status-open' : 'status-withdrawn'}`}>{!job.is_open ? 'Closed' : scheduled ? 'Scheduled' : expired ? 'Expired' : 'Open'}</span></td><td><span className={`status-pill ${job.is_published ? 'status-open' : 'status-withdrawn'}`}>{job.is_published ? 'Published' : 'Unpublished'}</span></td><td><div className="admin-row-actions">{!job.is_published && <button className="text-button" disabled={saving === `job-${job.id}`} onClick={() => void updateJobFlags(job, { is_published: true })}>Publish</button>}{job.is_published && job.is_open && <button className="text-button" disabled={saving === `job-${job.id}`} onClick={() => void updateJobFlags(job, { is_open: false })}>Close</button>}<button className="text-button" disabled={saving !== null} onClick={() => openEditJob(job)}><Pencil size={14} />Edit</button>{isAdministrator && <button className="text-button text-button-danger" disabled={saving !== null} onClick={() => void deleteJob(job)}><Trash2 size={14} />Delete</button>}</div></td></tr> })}</tbody></table></div>
            </section>
          </>}

          {activeTab === 'requests' && <>
            {showRequestForm && <form className="panel admin-job-form recruitment-request-form" onSubmit={(event) => void saveRecruitmentRequest(event)}>
              <div className="panel-heading"><div><h2>{editingRequest ? 'Edit recruitment request' : 'Create recruitment request'}</h2><p>This record is stored directly in SharePoint and is not saved in SQL.</p></div><button type="button" className="icon-button" onClick={closeRequestForm} aria-label="Close form"><X size={18} /></button></div>
              <div className="admin-job-fields recruitment-request-fields">
                <label>Preferred position<input required list="preferred-position-options" value={requestForm.preferred_position} onChange={(event) => setRequestForm({ ...requestForm, preferred_position: event.target.value })} /><datalist id="preferred-position-options">{Array.from(new Set([...jobs.map((job) => job.title), ...preferredPositionSuggestions])).map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Name<input required maxLength={255} value={requestForm.name} onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })} /></label>
                <label>Nationality<select required value={requestForm.nationality} onChange={(event) => setRequestForm({ ...requestForm, nationality: event.target.value })}><option value="" disabled>Select nationality</option>{recruitmentNationalityOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label>Gender<select value={requestForm.gender} onChange={(event) => setRequestForm({ ...requestForm, gender: event.target.value as RecruitmentRequestPayload['gender'] })}><option>Male</option><option>Female</option><option>Other</option></select></label>
                <label>Driver license type<select value={requestForm.driver_license_type} onChange={(event) => setRequestForm({ ...requestForm, driver_license_type: event.target.value as RecruitmentRequestPayload['driver_license_type'] })}><option>Saudi License</option><option>Valid GCC License</option><option>Other License</option><option>None</option></select></label>
                <label>Mobile number<input required type="tel" inputMode="numeric" minLength={9} maxLength={14} pattern="(?:966|00966|0)?5[0-9]{8}" title="Enter a Saudi mobile number such as 05XXXXXXXX or 9665XXXXXXXX" value={requestForm.mobile_number} onChange={(event) => setRequestForm({ ...requestForm, mobile_number: event.target.value.replace(/\D/g, '').slice(0, 14) })} placeholder="9665XXXXXXXX" /></label>
                <label>Email address<input required type="email" maxLength={255} value={requestForm.email_address} onChange={(event) => setRequestForm({ ...requestForm, email_address: event.target.value })} /></label>
                <label>ID/Iqama number<input required inputMode="numeric" minLength={10} maxLength={10} pattern="[12][0-9]{9}" title="Enter a 10-digit ID or Iqama number beginning with 1 or 2" value={requestForm.iqama_number} onChange={(event) => setRequestForm({ ...requestForm, iqama_number: event.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
                <label>{`Iqama profession${iqamaProfessionRequired ? '' : ' (optional)'}`}<input required={iqamaProfessionRequired} maxLength={150} value={requestForm.iqama_profession} onChange={(event) => setRequestForm({ ...requestForm, iqama_profession: event.target.value })} /></label>
                <label>Current employer<input list="employer-options" maxLength={180} value={requestForm.current_employer} onChange={(event) => setRequestForm({ ...requestForm, current_employer: event.target.value })} /><datalist id="employer-options">{employerOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Date of birth<input required type="date" max={latestAdultBirthDate()} title="Applicant must be at least 18 years old" value={requestForm.date_of_birth} onChange={(event) => setRequestForm({ ...requestForm, date_of_birth: event.target.value })} /></label>
                <label>City (current location)<input required list="request-city-options" maxLength={100} value={requestForm.city} onChange={(event) => setRequestForm({ ...requestForm, city: event.target.value })} /><datalist id="request-city-options">{cityOptions.map((value) => <option key={value} value={value} />)}</datalist></label>
                <label>Accept work in another city?<select value={requestForm.accept_work_in_another_city ? 'yes' : 'no'} onChange={(event) => setRequestForm({ ...requestForm, accept_work_in_another_city: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label>Qualification<select value={requestForm.qualification} onChange={(event) => setRequestForm({ ...requestForm, qualification: event.target.value as RecruitmentRequestPayload['qualification'] })}><option>High School</option><option>Diploma</option><option>Bachelor's Degree</option><option>Master's Degree</option><option>Doctorate</option><option>Other</option></select></label>
                <label>Current salary (SAR)<input required type="number" min={0} max={100000000} step="0.01" value={requestForm.current_salary} onChange={(event) => setRequestForm({ ...requestForm, current_salary: Number(event.target.value) })} /></label>
                <label className="admin-job-wide recruitment-comments">Comments<textarea rows={4} maxLength={5000} value={requestForm.comments} onChange={(event) => setRequestForm({ ...requestForm, comments: event.target.value })} /></label>
              </div>
              <div className="admin-form-actions recruitment-form-actions"><button type="button" className="button button-secondary" onClick={() => setRequestForm({ ...emptyRecruitmentRequest, nationality: preferredNationality(jobOptions.nationalities) })}>Reset</button><button type="button" className="button button-secondary" onClick={closeRequestForm}>Cancel</button><button className="button button-primary" disabled={saving === 'create-request' || saving === `edit-request-${editingRequest?.id}`}><Save size={17} />{saving ? 'Saving...' : editingRequest ? 'Save changes' : 'Submit request'}</button></div>
            </form>}
            <section className="panel admin-table-panel">
              <div className="panel-heading"><div><h2>Recruitment requests</h2><p>SharePoint-only records based on the recruitment request form.</p></div>{!showRequestForm && !requestsError && <button className="button button-secondary button-small" onClick={openCreateRequest}><Plus size={16} />Add request</button>}</div>
              {requestsError ? <div className="recruitment-setup-state"><Alert type="error" message={`${requestsError}. ${isAdministrator ? 'Run SharePoint setup to create or repair the Recruitment Requests list.' : 'Ask an Administrator to verify the SharePoint setup.'}`} />{isAdministrator && <button className="button button-primary button-small" disabled={saving === 'setup-recruitment-requests'} onClick={() => void provisionRecruitmentRequests()}>{saving === 'setup-recruitment-requests' ? 'Setting up...' : 'Set up SharePoint list'}</button>}</div> : requestsLoading ? <div className="page-loader compact"><span className="loader" /></div> : recruitmentRequests.length ? <div className="table-wrap"><table><thead><tr><th>Name / position</th><th>Contact</th><th>Identity</th><th>Current work</th><th>Location</th><th>Salary</th><th>Actions</th></tr></thead><tbody>{recruitmentRequests.map((request) => <tr key={request.id}><td><strong>{request.name}</strong><small>{request.preferred_position}</small></td><td><strong>{request.mobile_number}</strong><small>{request.email_address}</small></td><td><strong>{request.iqama_number}</strong><small>{request.nationality} · {request.gender}</small></td><td><strong>{request.iqama_profession}</strong><small>{request.current_employer || 'Not currently employed'}</small></td><td><strong>{request.city}</strong><small>{request.accept_work_in_another_city ? 'Open to relocation' : 'Current city only'}</small></td><td><strong>SAR {request.current_salary.toLocaleString()}</strong><small>{request.qualification}</small></td><td><div className="admin-row-actions"><button className="text-button" disabled={saving !== null} onClick={() => openEditRequest(request)}><Pencil size={14} />Edit</button><button className="text-button text-button-danger" disabled={saving !== null} onClick={() => void deleteRecruitmentRequest(request)}><Trash2 size={14} />Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No recruitment requests" description="Add the first recruitment request. Records are saved directly in SharePoint." />}
            </section>
          </>}

          {activeTab === 'training' && <CooperativeTrainingPanel refreshKey={trainingRefreshKey} canManageSetup={isAdministrator} onCountChange={setTrainingRequestCount} onChanged={() => void refreshAuditLogs()} />}

          {activeTab === 'candidates' && <section className="panel admin-table-panel">
            <div className="panel-heading"><div><h2>Registered candidates</h2><p>Portal profiles and application activity stored in SQL.</p></div></div>
            {candidates.length ? <div className="table-wrap"><table><thead><tr><th>Candidate</th><th>Contact</th><th>Location</th><th>Nationality / gender</th><th>Applications</th><th>Resume</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.first_name} {candidate.last_name}</strong><small>{candidate.title}</small></td><td><strong>{candidate.email}</strong><small>{candidate.phone || 'No phone'}</small></td><td>{candidate.city || '—'}, {candidate.country}</td><td><strong>{candidate.nationality || 'Not selected'}</strong><small>{candidate.gender || 'Gender not selected'}</small></td><td><span className="admin-count-badge">{candidate.application_count}</span></td><td>{candidate.resume_url ? <button className="text-button" disabled={saving === `resume-${candidate.id}`} onClick={() => void viewCandidateCv(candidate)}><FileText size={14} />{saving === `resume-${candidate.id}` ? 'Opening...' : candidate.resume_name || 'View CV'}</button> : candidate.resume_name ? <span className="admin-resume-present"><CheckCircle2 size={15} />{candidate.resume_name}</span> : 'Not uploaded'}</td></tr>)}</tbody></table></div> : <EmptyState title="No candidates" description="Registered candidate accounts will appear here." />}
          </section>}

          {isAdministrator && activeTab === 'audit' && <section className="panel admin-table-panel">
            <div className="panel-heading"><div><h2>Administrator activity log</h2><p>A permanent record of changes made through administration pages.</p></div></div>
            {auditLogs.length ? <div className="table-wrap"><table><thead><tr><th>Date and time</th><th>Administrator</th><th>Action</th><th>Area</th><th>Details</th></tr></thead><tbody>{auditLogs.map((entry) => <tr key={entry.id}><td><strong>{new Date(entry.created_at).toLocaleDateString()}</strong><small>{new Date(entry.created_at).toLocaleTimeString()}</small></td><td><strong>{entry.admin_name}</strong><small>{entry.admin_email}</small></td><td><span className="status-pill status-open">{entry.action}</span></td><td><strong>{entry.entity_type}</strong><small>{entry.entity_id ? `ID ${entry.entity_id}` : 'System'}</small></td><td className="admin-audit-details">{entry.details}</td></tr>)}</tbody></table></div> : <EmptyState title="No administrator activity yet" description="Changes made by administrators will appear here." />}
          </section>}
        </>
      )}
    </div>
  )
}
