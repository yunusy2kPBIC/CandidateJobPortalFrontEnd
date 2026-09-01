import { ArrowRight, BriefcaseBusiness, CalendarCheck2, CheckCircle2, FileCheck2, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { api, type Dashboard } from '../services/api'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)

  useEffect(() => {
    api.dashboard().then(setData).catch(() => setData(null))
  }, [])

  const cards = [
    { label: 'Applications', value: data?.applications ?? '—', detail: 'Total applied', icon: FileCheck2, tone: 'blue' },
    { label: 'Interviews', value: data?.interviews ?? '—', detail: 'Upcoming & shortlisted', icon: CalendarCheck2, tone: 'violet' },
    { label: 'Open jobs', value: data?.open_jobs ?? '—', detail: 'Available now', icon: BriefcaseBusiness, tone: 'green' },
    { label: 'Profile complete', value: data ? `${data.profile_complete}%` : '—', detail: data && data.profile_complete >= 90 ? 'Looking great' : 'Keep improving', icon: UserRound, tone: 'amber' },
  ]

  return (
    <div className="page-container dashboard-page">
      <PageHeader title={`Welcome back, ${user?.first_name}!`} subtitle="Here’s what’s happening with your applications." action={<Link className="button button-primary button-small" to="/jobs"><Sparkles size={16} />Explore jobs</Link>} />
      <section className="stats-grid">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon tone-${tone}`}><Icon size={21} /></span>
            <div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest candidate updates.</p></div><Link to="/applications">View applications <ArrowRight size={15} /></Link></div>
          <div className="activity-list">
            {data?.recent_activity.length ? data.recent_activity.map((item, index) => (
              <div className="activity-item" key={`${item.label}-${index}`}>
                <span><CheckCircle2 size={17} /></span>
                <div><strong>{item.label}</strong><small>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.date))}</small></div>
              </div>
            )) : <div className="activity-item"><span><Sparkles size={17} /></span><div><strong>Your journey starts here</strong><small>Explore available jobs to submit your first application.</small></div></div>}
          </div>
        </article>
        <article className="panel quick-panel">
          <div className="panel-heading"><div><h2>Quick links</h2><p>Continue where you left off.</p></div></div>
          <div className="quick-links">
            <Link to="/jobs"><span><BriefcaseBusiness /></span><div><strong>Browse jobs</strong><small>Find your next role</small></div><ArrowRight /></Link>
            <Link to="/profile"><span><UserRound /></span><div><strong>Update profile</strong><small>Tell your best story</small></div><ArrowRight /></Link>
            <Link to="/password"><span><CheckCircle2 /></span><div><strong>Account security</strong><small>Review your password</small></div><ArrowRight /></Link>
          </div>
        </article>
      </section>
      <section className="dashboard-banner">
        <div><span className="eyebrow eyebrow-light">Your profile is your first impression</span><h2>Make every application stronger.</h2><p>Add a fresh resume and complete your profile before you apply.</p></div>
        <Link className="button button-white" to="/profile">Complete my profile <ArrowRight size={16} /></Link>
      </section>
    </div>
  )
}
