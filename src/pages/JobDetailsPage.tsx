import {
  AlignLeft,
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  FileCheck2,
  HeartHandshake,
  ListChecks,
  Mail,
  MapPin,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../components/Feedback'
import { RichTextContent } from '../components/RichText'
import { useAuth } from '../context/AuthContext'
import { api, type Job, type PrivacyNotice } from '../services/api'

export default function JobDetailsPage() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [applied, setApplied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [applying, setApplying] = useState(false)
  const [privacyNotice, setPrivacyNotice] = useState<PrivacyNotice | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)

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

  useEffect(() => {
    let active = true
    api.privacyNotice().then((notice) => { if (active) setPrivacyNotice(notice) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!privacyOpen) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPrivacyOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [privacyOpen])

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

  const applicationRequirements = [
    { label: user?.nationality ? 'Nationality selected' : 'Nationality not selected', met: Boolean(user?.nationality) },
    { label: user?.gender ? 'Gender selected' : 'Gender not selected', met: Boolean(user?.gender) },
    { label: user?.resume_name ? 'Resume uploaded' : 'Resume not uploaded', met: Boolean(user?.resume_name) },
  ]
  const canApply = applicationRequirements.every((requirement) => requirement.met)

  return (
    <div className="page-container details-page">
      <Link className="back-link" to="/jobs"><ArrowLeft size={17} />Back to jobs</Link>
      <section className="details-hero panel">
        <div><div className="job-badges"><span className="status-pill status-open">Open</span><span>{job.career_level}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Building2 />{job.division}</span><span><MapPin />{job.city}, {job.country}</span><span><Clock3 />{job.employment_type}</span><span><CalendarDays />Posted {new Date(job.posted_at).toLocaleDateString()}</span></div></div>
        <div className="job-share-actions">
          <button className="icon-button share-button" onClick={() => void copyLink()} title="Copy job link" aria-label="Copy job link"><Copy size={18} /></button>
        </div>
      </section>
      {message && <Alert type={message.type} message={message.text} />}
      <div className="details-grid">
        <article className="panel prose-panel">
          <section className="job-promise job-promise-header">
            <span className="job-promise-icon"><HeartHandshake /></span>
            <div><small>Grow with us</small><h2>Our Promise</h2><p>PureBeverages offers a competitive package, generous leave, medical coverage, discretionary bonus, and meaningful learning and development opportunities.</p><p>Join a successful and growing global business where your contribution is valued and your career can thrive.</p></div>
          </section>
          <section className="job-detail-section">
            <div className="job-detail-heading"><span><AlignLeft /></span><div><small>Your impact</small><h2>Description</h2></div></div>
            <RichTextContent className="job-detail-copy job-detail-rich-text" value={job.description} />
          </section>
          <section className="job-detail-section">
            <div className="job-detail-heading"><span><ListChecks /></span><div><small>What we are looking for</small><h2>Requirements</h2></div></div>
            <RichTextContent className="job-detail-rich-text job-requirements-content" value={job.requirements} legacyList />
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
          <small>{applied ? 'We will notify you when your application status changes.' : <>By applying, you agree to our {privacyNotice ? <button type="button" className="privacy-inline-trigger apply-privacy-trigger" onClick={() => setPrivacyOpen(true)}>candidate privacy statement</button> : <Link to="/privacy">candidate privacy statement</Link>}.</>}</small>
        </aside>
      </div>
      {privacyOpen && privacyNotice && <div className="privacy-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPrivacyOpen(false) }}>
        <section className="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="application-privacy-title">
          <header className="privacy-modal-heading">
            <div><span className="eyebrow"><FileCheck2 size={16} />Candidate information</span><h2 id="application-privacy-title">{privacyNotice.title}</h2></div>
            <button type="button" className="icon-button" aria-label="Close privacy notice" onClick={() => setPrivacyOpen(false)}><X size={20} /></button>
          </header>
          <div className="privacy-modal-content">
            <div className="privacy-notice-meta">
              <span><FileCheck2 />Version <strong>{privacyNotice.version}</strong></span>
              <span><CalendarDays />Effective <strong>{privacyNotice.effective_date}</strong></span>
            </div>
            <div className="privacy-section-list">
              {privacyNotice.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.content}</p></section>)}
            </div>
            <aside className="privacy-contact"><Mail /><div><strong>Privacy questions</strong><p>Contact <a href={`mailto:${privacyNotice.contact_email}`}>{privacyNotice.contact_email}</a>.</p></div></aside>
          </div>
          <footer className="privacy-modal-actions">
            <button type="button" className="button button-secondary" onClick={() => setPrivacyOpen(false)}>Close</button>
            <button type="button" className="button button-primary" onClick={() => setPrivacyOpen(false)}>Continue application</button>
          </footer>
        </section>
      </div>}
    </div>
  )
}
