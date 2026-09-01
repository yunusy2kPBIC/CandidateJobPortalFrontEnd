import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Cloud,
  Database,
  FileUp,
  ListChecks,
  Play,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import {
  ApiError,
  api,
  type SharePointDiagnostics,
  type SharePointItem,
  type SharePointList,
  type SharePointStatus,
} from '../services/api'

type LogOutcome = 'success' | 'warning' | 'error'

type DiagnosticLog = {
  id: string
  timestamp: string
  action: string
  outcome: LogOutcome
  details: string
}

type ResourceCounts = {
  candidates: number
  jobs: number
  applications: number
  resumes: number
}

function errorText(error: unknown) {
  if (error instanceof ApiError) return `Portal API ${error.status}: ${error.message}`
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function stateLabel(value: boolean | undefined, yes: string, no: string) {
  if (value === undefined) return 'Not checked'
  return value ? yes : no
}

export default function SharePointPage() {
  const [status, setStatus] = useState<SharePointStatus | null>(null)
  const [diagnostics, setDiagnostics] = useState<SharePointDiagnostics | null>(null)
  const [lists, setLists] = useState<SharePointList[]>([])
  const [counts, setCounts] = useState<ResourceCounts | null>(null)
  const [logs, setLogs] = useState<DiagnosticLog[]>([])
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [candidateItemId, setCandidateItemId] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadedResume, setUploadedResume] = useState<SharePointItem | null>(null)

  const addLog = (action: string, outcome: LogOutcome, details: string) => {
    setLogs((current) => [{
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      action,
      outcome,
      details,
    }, ...current])
  }

  const refreshStatus = async (record = true) => {
    setActiveAction('status')
    setError(null)
    try {
      const nextStatus = await api.sharepointStatus()
      setStatus(nextStatus)
      if (record) addLog('Configuration status', 'success', JSON.stringify(nextStatus, null, 2))
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      if (record) addLog('Configuration status', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  useEffect(() => {
    void refreshStatus(false)
  }, [])

  const runConnectionTest = async () => {
    setActiveAction('connection')
    setError(null)
    setNotice(null)
    try {
      const result = await api.sharepointDiagnostics()
      setDiagnostics(result)
      let discoveredLists: SharePointList[] = []
      if (result.site_access.ok) {
        discoveredLists = await api.sharepointLists()
        setLists(discoveredLists)
      }
      const passed = result.token.acquired && result.site_access.ok
      const details = JSON.stringify({ ...result, discovered_lists: discoveredLists }, null, 2)
      addLog('Graph connection test', passed ? 'success' : 'error', details)
      if (passed) {
        setNotice(`Connected successfully. Microsoft Graph returned ${discoveredLists.length} SharePoint resources.`)
      } else {
        setError(result.token.error || result.site_access.error || 'SharePoint connection test failed')
      }
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Graph connection test', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const runSetup = async () => {
    if (!window.confirm('Create or repair the configured SharePoint lists and document library? Existing data will not be deleted.')) return
    setActiveAction('setup')
    setError(null)
    setNotice(null)
    try {
      const result = await api.setupSharepoint()
      addLog('Provision SharePoint schema', 'success', JSON.stringify(result, null, 2))
      setNotice('SharePoint schema setup completed successfully.')
      setLists(await api.sharepointLists())
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Provision SharePoint schema', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const loadResourceCounts = async () => {
    setActiveAction('counts')
    setError(null)
    setNotice(null)
    try {
      const [candidates, jobs, applications, resumes] = await Promise.all([
        api.sharepointCandidates(),
        api.sharepointJobs(),
        api.sharepointApplications(),
        api.sharepointResumes(),
      ])
      const nextCounts = {
        candidates: candidates.length,
        jobs: jobs.length,
        applications: applications.length,
        resumes: resumes.length,
      }
      setCounts(nextCounts)
      addLog('Read all SharePoint resources', 'success', JSON.stringify(nextCounts, null, 2))
      setNotice('All four SharePoint resources were read successfully.')
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Read all SharePoint resources', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const runPortalSync = async () => {
    if (!window.confirm('Synchronize existing portal candidates, CVs, and jobs to SharePoint? Existing matching items will be updated.')) return
    setActiveAction('portal-sync')
    setError(null)
    setNotice(null)
    try {
      const result = await api.syncPortalToSharepoint()
      addLog('Synchronize portal content', 'success', JSON.stringify(result, null, 2))
      setNotice(`${result.candidates} candidates, ${result.jobs} jobs, and ${result.applications} applications synchronized. ${result.resumes_uploaded} CV files uploaded.`)
      await refreshStatus(false)
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Synchronize portal content', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const runCrudSmokeTest = async () => {
    setActiveAction('crud')
    setError(null)
    setNotice(null)
    const suffix = Date.now()
    const steps: string[] = []
    let candidateId: number | null = null
    let jobId: number | null = null
    let applicationId: number | null = null
    let failure: unknown = null
    let cleanupFailed = false

    const step = async <T,>(label: string, operation: () => Promise<T>) => {
      try {
        const result = await operation()
        steps.push(`PASS  ${label}`)
        return result
      } catch (caught) {
        steps.push(`FAIL  ${label}: ${errorText(caught)}`)
        throw caught
      }
    }

    try {
      const candidate = await step('POST /candidates', () => api.createSharepointCandidate({
        candidate_name: `Frontend API Test ${suffix}`,
        email: `sharepoint-test-${suffix}@example.com`,
        first_name: 'Frontend',
        last_name: 'Test',
        country_code: '+966',
        phone: '500000000',
        country: 'Saudi Arabia',
        city: 'Riyadh',
        professional_title: 'SharePoint API Test',
        about: 'Temporary record created by the frontend SharePoint smoke test.',
        role: 'Candidate',
      }))
      candidateId = Number(candidate.id)
      await step('GET /candidates/{id}', () => api.sharepointCandidate(candidateId!))
      await step('PATCH /candidates/{id}', () => api.updateSharepointCandidate(candidateId!, { professional_title: 'SharePoint API Test Updated' }))

      const job = await step('POST /jobs', () => api.createSharepointJob({
        job_title: `Frontend API Test Job ${suffix}`,
        division: 'Information Technology',
        country: 'Saudi Arabia',
        city: 'Riyadh',
        job_function: 'Technology',
        career_level: 'Mid-level',
        employment_type: 'Full-time',
        summary: 'Temporary SharePoint API test job.',
        description: 'Created by the frontend diagnostic smoke test.',
        requirements: 'Temporary test data only.',
        is_open: true,
        is_featured: false,
      }))
      jobId = Number(job.id)
      await step('GET /jobs/{id}', () => api.sharepointJob(jobId!))
      await step('PATCH /jobs/{id}', () => api.updateSharepointJob(jobId!, { summary: 'Updated by the frontend diagnostic smoke test.' }))

      const application = await step('POST /applications', () => api.createSharepointApplication({
        application_code: `TEST-${suffix}`,
        candidate_id: candidateId!,
        job_id: jobId!,
        status: 'Under Review',
      }))
      applicationId = Number(application.id)
      await step('GET /applications/{id}', () => api.sharepointApplication(applicationId!))
      await step('PATCH /applications/{id}', () => api.updateSharepointApplication(applicationId!, { status: 'Shortlisted' }))
      await step('GET candidate/job/application collections', () => Promise.all([
        api.sharepointCandidates(),
        api.sharepointJobs(),
        api.sharepointApplications(),
      ]))
    } catch (caught) {
      failure = caught
    } finally {
      const cleanup = async (label: string, operation: () => Promise<unknown>) => {
        try {
          await operation()
          steps.push(`PASS  cleanup ${label}`)
        } catch (caught) {
          cleanupFailed = true
          steps.push(`WARN  cleanup ${label}: ${errorText(caught)}`)
        }
      }
      if (applicationId) await cleanup('application', () => api.deleteSharepointApplication(applicationId!))
      if (jobId) await cleanup('job', () => api.deleteSharepointJob(jobId!))
      if (candidateId) await cleanup('candidate', () => api.deleteSharepointCandidate(candidateId!))
    }

    const outcome: LogOutcome = failure ? 'error' : cleanupFailed ? 'warning' : 'success'
    addLog('Candidate/job/application CRUD smoke test', outcome, steps.join('\n'))
    if (failure) setError(`CRUD smoke test failed: ${errorText(failure)}`)
    else if (cleanupFailed) setError('CRUD operations passed, but one or more temporary test records could not be removed. See the report.')
    else setNotice('Candidate, job, and application CRUD passed. Temporary test records were removed.')
    setActiveAction(null)
  }

  const uploadResume = async (event: FormEvent) => {
    event.preventDefault()
    const parsedCandidateId = Number(candidateItemId)
    if (!Number.isInteger(parsedCandidateId) || parsedCandidateId < 1 || !candidateEmail.trim() || !resumeFile) {
      setError('Enter a valid SharePoint candidate item ID, email address, and resume file.')
      return
    }
    setActiveAction('resume')
    setError(null)
    setNotice(null)
    try {
      const result = await api.uploadSharepointResume(parsedCandidateId, candidateEmail.trim(), resumeFile)
      setUploadedResume(result)
      addLog('Upload resume', 'success', JSON.stringify({ item_id: result.id, filename: resumeFile.name }, null, 2))
      setNotice(`Resume uploaded successfully as SharePoint item ${result.id}.`)
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Upload resume', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const deleteUploadedResume = async () => {
    if (!uploadedResume || !window.confirm(`Delete uploaded SharePoint resume item ${uploadedResume.id}?`)) return
    setActiveAction('delete-resume')
    setError(null)
    try {
      await api.deleteSharepointResume(Number(uploadedResume.id))
      addLog('Delete uploaded resume', 'success', `Deleted SharePoint resume item ${uploadedResume.id}`)
      setUploadedResume(null)
      setNotice('Uploaded test resume was removed.')
    } catch (caught) {
      const message = errorText(caught)
      setError(message)
      addLog('Delete uploaded resume', 'error', message)
    } finally {
      setActiveAction(null)
    }
  }

  const report = useMemo(() => [
    `SharePoint frontend diagnostic report - ${new Date().toISOString()}`,
    `Configuration: ${status ? JSON.stringify(status) : 'not loaded'}`,
    `Diagnostics: ${diagnostics ? JSON.stringify(diagnostics) : 'not run'}`,
    '',
    ...logs.flatMap((entry) => [
      `[${entry.timestamp}] ${entry.outcome.toUpperCase()} - ${entry.action}`,
      entry.details,
      '',
    ]),
  ].join('\n'), [diagnostics, logs, status])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setNotice('Diagnostic report copied. It contains no client secret or access token.')
    } catch {
      setError('The browser blocked clipboard access. Select and copy the report manually.')
    }
  }

  const roles = diagnostics?.token.application_roles ?? []

  return (
    <div className="page-container sharepoint-page">
      <PageHeader
        title="SharePoint diagnostics"
        subtitle="Test Microsoft Graph access, provision resources, and produce an administrator-ready failure report."
        action={<button className="button button-secondary button-small" onClick={() => void refreshStatus()} disabled={activeAction !== null}><RefreshCw size={16} />Refresh status</button>}
      />

      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      <section className="sharepoint-summary-grid">
        <article className="panel sharepoint-summary-card">
          <span className={`sharepoint-state-icon ${status?.configured ? 'state-good' : 'state-bad'}`}><ShieldCheck /></span>
          <div><small>Backend configuration</small><strong>{stateLabel(status?.configured, 'Configured', 'Incomplete')}</strong><p>{status?.site_url ?? 'No SharePoint site URL configured'}{status && <><br />Portal sync: {status.portal_sync_enabled ? 'enabled' : 'disabled'}</>}</p></div>
        </article>
        <article className="panel sharepoint-summary-card">
          <span className={`sharepoint-state-icon ${diagnostics?.token.acquired ? 'state-good' : diagnostics ? 'state-bad' : ''}`}><Cloud /></span>
          <div><small>Microsoft identity</small><strong>{stateLabel(diagnostics?.token.acquired, 'Token acquired', 'Token failed')}</strong><p>{diagnostics ? `${roles.length} Graph application role${roles.length === 1 ? '' : 's'}` : 'Run the connection test'}</p></div>
        </article>
        <article className="panel sharepoint-summary-card">
          <span className={`sharepoint-state-icon ${diagnostics?.site_access.ok ? 'state-good' : diagnostics ? 'state-bad' : ''}`}><Database /></span>
          <div><small>SharePoint site</small><strong>{stateLabel(diagnostics?.site_access.ok, 'Accessible', 'Access failed')}</strong><p>{diagnostics?.site_access.site_id ?? 'Site ID not resolved'}</p></div>
        </article>
      </section>

      {diagnostics && (!diagnostics.token.acquired || !diagnostics.site_access.ok || roles.length === 0) && (
        <section className="sharepoint-admin-warning">
          <AlertTriangle size={22} />
          <div>
            <strong>Administrator action may be required</strong>
            <p>{diagnostics.token.error || diagnostics.site_access.error || (roles.length === 0 ? 'The token has no Microsoft Graph application roles. Grant Sites.ReadWrite.All application permission and admin consent, then restart the backend.' : 'Review the diagnostic report below.')}</p>
          </div>
        </section>
      )}

      <section className="panel sharepoint-actions-panel">
        <div className="panel-heading"><div><h2>Integration checks</h2><p>Run these from left to right. Provisioning changes only the configured SharePoint site.</p></div></div>
        <div className="sharepoint-action-grid">
          <button className="sharepoint-action" onClick={() => void runConnectionTest()} disabled={activeAction !== null}>
            <span><Activity /></span><strong>1. Test connection</strong><small>Inspect token roles and resolve the site</small>
          </button>
          <button className="sharepoint-action" onClick={() => void runSetup()} disabled={activeAction !== null}>
            <span><Wrench /></span><strong>2. Setup resources</strong><small>Create or repair lists and columns</small>
          </button>
          <button className="sharepoint-action" onClick={() => void runPortalSync()} disabled={activeAction !== null}>
            <span><RefreshCw /></span><strong>3. Sync portal content</strong><small>Write candidates, CVs, jobs, and applications to SharePoint</small>
          </button>
          <button className="sharepoint-action" onClick={() => void loadResourceCounts()} disabled={activeAction !== null}>
            <span><ListChecks /></span><strong>4. Read resources</strong><small>Load candidates, jobs, applications, and resumes</small>
          </button>
          <button className="sharepoint-action" onClick={() => void runCrudSmokeTest()} disabled={activeAction !== null}>
            <span><Play /></span><strong>5. Run CRUD test</strong><small>Create, update, read, and clean up test records</small>
          </button>
        </div>
        {activeAction && <div className="sharepoint-running"><RefreshCw className="spin" size={17} />Running {activeAction.replaceAll('-', ' ')}…</div>}
      </section>

      <section className="sharepoint-detail-grid">
        <article className="panel sharepoint-resource-panel">
          <div className="panel-heading"><div><h2>Discovered resources</h2><p>Lists returned by the configured SharePoint site.</p></div></div>
          {lists.length ? (
            <div className="table-wrap"><table><thead><tr><th>Name</th><th>Template</th><th>Open</th></tr></thead><tbody>{lists.map((list) => (
              <tr key={list.id}><td><strong>{list.display_name ?? list.name ?? 'Unnamed'}</strong><small>{list.id}</small></td><td>{list.template ?? '—'}</td><td>{list.web_url ? <a href={list.web_url} target="_blank" rel="noreferrer">View</a> : '—'}</td></tr>
            ))}</tbody></table></div>
          ) : <div className="sharepoint-empty">Run the connection test to discover SharePoint lists.</div>}
          {counts && <div className="sharepoint-counts">{Object.entries(counts).map(([label, value]) => <span key={label}><strong>{value}</strong><small>{label}</small></span>)}</div>}
        </article>

        <article className="panel sharepoint-resume-panel">
          <div className="panel-heading"><div><h2>Resume API test</h2><p>Upload against an existing SharePoint candidate item.</p></div></div>
          <form onSubmit={(event) => void uploadResume(event)}>
            <label>Candidate item ID<input inputMode="numeric" value={candidateItemId} onChange={(event) => setCandidateItemId(event.target.value)} placeholder="Example: 12" /></label>
            <label>Candidate email<input type="email" value={candidateEmail} onChange={(event) => setCandidateEmail(event.target.value)} placeholder="candidate@example.com" /></label>
            <label>Resume file<input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} /></label>
            <button className="button button-primary button-small" disabled={activeAction !== null}><FileUp size={16} />Upload resume</button>
          </form>
          {uploadedResume && <div className="sharepoint-uploaded"><CheckCircle2 size={18} /><span>Uploaded item <strong>{uploadedResume.id}</strong></span><button className="text-button" onClick={() => void deleteUploadedResume()} disabled={activeAction !== null}><Trash2 size={15} />Delete test upload</button></div>}
        </article>
      </section>

      <section className="panel sharepoint-report-panel">
        <div className="panel-heading"><div><h2>Administrator report</h2><p>Safe to share: client secrets and access tokens are never included.</p></div><button className="button button-secondary button-small" onClick={() => void copyReport()}><Clipboard size={16} />Copy report</button></div>
        <textarea aria-label="SharePoint diagnostic report" readOnly value={report} rows={14} />
      </section>
    </div>
  )
}
