import { AlignLeft, ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, FileText, HeartHandshake, ListChecks, MapPin, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../components/Feedback'
import { api, type Job } from '../services/api'

export default function JobDetailsPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (jobId) api.job(Number(jobId)).then(setJob).catch(() => setJob(null))
  }, [jobId])

  const apply = async () => {
    if (!job) return
    setApplying(true)
    setMessage(null)
    try {
      const result = await api.apply(job.id)
      setMessage({ type: 'success', text: result.message })
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (reason) {
      setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to apply' })
    } finally {
      setApplying(false)
    }
  }

  if (!job) return <div className="page-loader"><span className="loader" /></div>
  const requirements = job.requirements.split('\n').map((requirement) => requirement.trim()).filter(Boolean)

  return (
    <div className="page-container details-page">
      <Link className="back-link" to="/jobs"><ArrowLeft size={17} />Back to jobs</Link>
      <section className="details-hero panel">
        <div><div className="job-badges"><span className="status-pill status-open">Open</span><span>{job.career_level}</span></div><h1>{job.title}</h1><div className="job-meta detail-meta"><span><Building2 />{job.division}</span><span><MapPin />{job.city}, {job.country}</span><span><Clock3 />{job.employment_type}</span><span><CalendarDays />Posted {new Date(job.posted_at).toLocaleDateString()}</span></div></div>
        <button className="icon-button share-button" onClick={() => navigator.clipboard?.writeText(window.location.href)} title="Copy job link"><Share2 size={19} /></button>
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
        <aside className="panel apply-panel"><span className="apply-icon"><CheckCircle2 /></span><h2>Ready to take the next step?</h2><p>Submit your candidate profile for this opportunity. You can track progress from Jobs Applied.</p><button className="button button-primary button-wide" onClick={apply} disabled={applying}>{applying ? 'Submitting…' : 'Apply Now'}</button><small>By applying, you agree to our candidate privacy statement.</small></aside>
      </div>
    </div>
  )
}
