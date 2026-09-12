import { CalendarDays, FileCheck2, Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../components/Feedback'
import PublicLayout from '../components/PublicLayout'
import { api, type PrivacyNotice } from '../services/api'

export default function PrivacyPage() {
  const [notice, setNotice] = useState<PrivacyNotice | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.privacyNotice().then(setNotice).catch((reason) => {
      setError(reason instanceof Error ? reason.message : 'Unable to load the privacy notice')
    })
  }, [])

  return (
    <PublicLayout action="signin">
      <article className="privacy-notice-card">
        <header className="privacy-notice-heading">
          <span className="privacy-notice-icon"><ShieldCheck /></span>
          <div>
            <div className="eyebrow"><FileCheck2 size={16} />Candidate information</div>
            <h1>{notice?.title ?? 'Candidate Portal Privacy Notice'}</h1>
            <p>Review how information submitted through PBICareerPosting is collected, used, protected, and recorded.</p>
          </div>
        </header>

        {error && <Alert type="error" message={error} />}
        {!notice && !error && <div className="privacy-notice-loading"><span className="loader" />Loading the current notice…</div>}
        {notice && <>
          <div className="privacy-notice-meta">
            <span><FileCheck2 />Version <strong>{notice.version}</strong></span>
            <span><CalendarDays />Effective <strong>{notice.effective_date}</strong></span>
          </div>
          <div className="privacy-section-list">
            {notice.sections.map((section) => <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </section>)}
          </div>
          <aside className="privacy-contact">
            <Mail />
            <div><strong>Privacy questions</strong><p>Contact <a href={`mailto:${notice.contact_email}`}>{notice.contact_email}</a>.</p></div>
          </aside>
          <div className="privacy-actions">
            <Link className="button button-primary" to="/register">Return to registration</Link>
            <Link className="button button-secondary" to="/login">Return to sign in</Link>
          </div>
        </>}
      </article>
    </PublicLayout>
  )
}
