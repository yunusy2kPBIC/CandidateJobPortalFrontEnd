import { ArrowRight, Eye, FileCheck2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { api, type Application } from '../services/api'

const statusClass = (status: string) => `application-status status-${status.toLowerCase().replace(/\s+/g, '-')}`

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.applications().then(setApplications).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader title="Jobs applied" subtitle="Track your applications and their current status." action={<Link className="button button-primary button-small" to="/jobs">Browse jobs <ArrowRight size={16} /></Link>} />
      <section className="panel applications-panel">
        {loading ? <div className="page-loader compact"><span className="loader" /></div> : applications.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Application ID</th><th>Job title</th><th>Location</th><th>Applied date</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{applications.map((application) => <tr key={application.id}><td><span className="application-code"><FileCheck2 size={15} />{application.application_code}</span></td><td><strong>{application.job.title}</strong><small>{application.job.division}</small></td><td>{application.job.city}, {application.job.country}</td><td>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(application.applied_at))}</td><td><span className={statusClass(application.status)}>{application.status}</span></td><td><Link className="icon-button" to={`/jobs/${application.job.id}`} aria-label={`View ${application.job.title}`}><Eye size={18} /></Link></td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No applications yet" description="When you apply for a role, its progress will appear here." />}
      </section>
    </div>
  )
}
