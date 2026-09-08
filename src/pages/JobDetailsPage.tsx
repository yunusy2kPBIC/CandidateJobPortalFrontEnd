import {
  AlignLeft,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  HeartHandshake,
  ListChecks,
  Mail,
  MapPin,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { api, type Job } from '../services/api'

export default function JobDetailsPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applied, setApplied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const id = Number(jobId)
    if (!Number.isInteger(id) || id <= 0) {
      setLoadError('This job could not be found.')
      setLoading(false)
      return
    }
    let active = true
    Promise.all([api.job(id), api.applications()])
      .then(([nextJob, applications]) => {
        if (!active) return
        setJob(nextJob)
        setApplied(applications.some((application) => application.job.id === id))
      })
      .catch((reason) => {
        if (active) setLoadError(reason instanceof Error ? reason.message : 'Unable to load this job')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [jobId])

  const apply = async () => {
    if (!job) return
    setApplying(true)
    setMessage(null)
    try {
      const result = await api.apply(job.id)
      setApplied(true)
      setMessage({ type: 'success', text: result.message })
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (reason) {
      setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to apply' })
    } finally {
      setApplying(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage({ type: 'success', text: 'Job link copied to your clipboard.' })
    } catch {
      setMessage({ type: 'error', text: 'Unable to copy the job link.' })
    }
  }

  if (loading) return <div className="page-loader"><span className="loader" /></div>
  if (!job) return <div className="page-container details-page"><Link className="back-link" to="/jobs"><ArrowLeft size={17} />Back to jobs</Link><Alert type="error" message={loadError || 'This job could not be found.'} /></div>

  const requirements = job.requirements.split('\n').map((requirement) => requirement.trim()).filter(Boolean)
  const applicationRequirements = [
    { label: 'Nationality selected', met: Boolean(user?.nationality) },
    { label: 'Gender selected', met: Boolean(user?.gender) },
    { label: 'Resume uploaded', met: Boolean(user?.resume_name) },
  ]
  const canApply = applicationRequirements.every((requirement) => requirement.met)
  const emailSubject = encodeURIComponent(`Career opportunity: ${job.title}`)
  const emailBody = encodeURIComponent(`I thought you might be interested in this ${job.title} opportunity at PureBeverages:\n\n${window.location.href}`)

  return (
    <div className="page-container details-page">
      <Link className="back-link" to="/jobs"><ArrowLeft size={17} />Back to jobs</Link>
      <section className="details-hero panel">
        <div><div className="job-badges"><span className="status-pill status-open">Open</span><span>{job.career_level}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Building2 />{job.division}</span><span><MapPin />{job.city}, {job.country}</span><span><Clock3 />{job.employment_type}</span><span><CalendarDays />Posted {new Date(job.posted_at).toLocaleDateString()}</span></div></div>
        <div className="job-share-actions">
          <a className="button button-secondary button-small" href={`mailto:?subject=${emailSubject}&body=${emailBody}`}><Mail size={16} />Email to a friend</a>
          <button className="icon-button share-button" onClick={() => void copyLink()} title="Copy job link" aria-label="Copy job link"><Copy size={18} /></button>
        </div>
      </section>
      {message && <Alert type={message.type} message={message.text} />}
      <div className="details-grid">
        <article className="panel prose-panel">
          <section className="job-detail-section">
            <div className="job-detail-heading"><span><FileText /></span><div><small>At a glance</small><h2>Summary</h2></div></div>
            <p className="job-detail-copy">{job.summary}</p>
          </section>
          <section className="job-detail-section">
            <div className="job-detail-heading"><span><AlignLeft /></span><div><small>Your impact</small><h2>Description</h2></div></div>
            <p className="job-detail-copy">{job.description}</p>
          </section>
          <section className="job-detail-section">
            <div className="job-detail-heading"><span><ListChecks /></span><div><small>What we are looking for</small><h2>Requirements</h2></div></div>
            <ul>{requirements.map((requirement) => <li key={requirement}><CheckCircle2 size={17} />{requirement}</li>)}</ul>
          </section>
          <section className="job-promise">
            <span className="job-promise-icon"><HeartHandshake /></span>
            <div><small>Grow with us</small><h2>Our Promise</h2><p>PureBeverages offers a competitive package, generous leave, medical coverage, discretionary bonus, and meaningful learning and development opportunities.</p><p>Join a successful and growing global business where your contribution is valued and your career can thrive.</p></div>
          </section>
        </article>
        <aside className={`panel apply-panel ${applied ? 'application-complete' : ''}`}>
          <span className="apply-icon"><CheckCircle2 /></span>
          <h2>{applied ? 'Application submitted' : 'Ready to take the next step?'}</h2>
          <p>{applied ? 'You have already applied for this opportunity. Track its progress from Jobs Applied.' : 'Your candidate profile and resume will be shared with the recruitment team.'}</p>
          {!applied && <div className="application-checklist">{applicationRequirements.map((requirement) => <span className={requirement.met ? 'complete' : ''} key={requirement.label}><i>{requirement.met ? <Check size={14} /> : '!'}</i>{requirement.label}</span>)}</div>}
          {applied
            ? <Link className="button button-secondary button-wide" to="/applications">View my applications</Link>
            : canApply
              ? <button className="button button-primary button-wide" onClick={() => void apply()} disabled={applying}>{applying ? 'Submitting…' : 'Apply Now'}</button>
              : <Link className="button button-primary button-wide" to="/profile">Complete profile to apply</Link>}
          <small>{applied ? 'We will notify you when your application status changes.' : 'By applying, you agree to our candidate privacy statement.'}</small>
        </aside>
      </div>
    </div>
  )
}
