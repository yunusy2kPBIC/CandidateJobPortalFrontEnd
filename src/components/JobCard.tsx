import { Building2, Clock3, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import type { Job } from '../services/api'

export default function JobCard({ job, applied = false }: { job: Job; applied?: boolean }) {
  const posted = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(job.posted_at))
  return (
    <article className="job-card">
      <div className="job-card-main">
        <div className="job-title-row">
          <h3>{job.title}</h3>
          <span className={`status-pill ${applied ? 'status-applied' : job.is_featured ? 'status-new' : 'status-open'}`}>{applied ? 'Applied' : job.is_featured ? 'New' : 'Open'}</span>
        </div>
        <div className="job-meta">
          <span><Building2 size={15} />{job.division}</span>
          <span><MapPin size={15} />{job.city === 'Remote' ? 'Remote' : `${job.city}, ${job.country}`}</span>
          <span><Clock3 size={15} />{job.employment_type}</span>
        </div>
        <p>{job.summary}</p>
      </div>
      <div className="job-card-action">
        <small>Posted {posted}</small>
        <Link className="button button-primary button-small" to={`/jobs/${job.id}`}>View Details</Link>
      </div>
    </article>
  )
}
