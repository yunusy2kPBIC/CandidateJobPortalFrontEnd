import { BellRing, Languages, Moon, Save, ShieldCheck } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { api, type PreferenceUpdate } from '../services/api'

const defaultPreferences: PreferenceUpdate = {
  email_updates: true,
  job_alerts: true,
  marketing: false,
  language: 'English',
  theme: 'light',
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<PreferenceUpdate>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.preferences()
      .then(({ updated_at: _updatedAt, ...stored }) => setPreferences(stored))
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false))
  }, [])

  const setBoolean = (field: 'email_updates' | 'job_alerts' | 'marketing', value: boolean) => {
    setPreferences((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const { updated_at: _updatedAt, ...stored } = await api.updatePreferences(preferences)
      setPreferences(stored)
      setSaved(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loader"><span className="loader" /></div>

  return (
    <div className="page-container">
      <PageHeader title="Settings" subtitle="Choose how the portal works for you." />
      {saved && <Alert type="success" message="Preferences saved to your account" />}
      {error && <Alert type="error" message={error} />}
      <form className="settings-grid" onSubmit={(event) => void submit(event)}>
        <section className="panel settings-card">
          <div className="form-section-heading"><span><BellRing /></span><div><h2>Communication</h2><p>Control the updates sent to your email.</p></div></div>
          <label className="switch-row"><span><strong>Application updates</strong><small>Status and interview notifications</small></span><input type="checkbox" checked={preferences.email_updates} onChange={(event) => setBoolean('email_updates', event.target.checked)} /><i /></label>
          <label className="switch-row"><span><strong>Job recommendations</strong><small>Roles selected for your profile</small></span><input type="checkbox" checked={preferences.job_alerts} onChange={(event) => setBoolean('job_alerts', event.target.checked)} /><i /></label>
          <label className="switch-row"><span><strong>Career news</strong><small>Talent community announcements</small></span><input type="checkbox" checked={preferences.marketing} onChange={(event) => setBoolean('marketing', event.target.checked)} /><i /></label>
        </section>
        <section className="panel settings-card">
          <div className="form-section-heading"><span><Languages /></span><div><h2>Experience</h2><p>Personalize language and appearance.</p></div></div>
          <label>Language<select value={preferences.language} onChange={(event) => { setPreferences((current) => ({ ...current, language: event.target.value as PreferenceUpdate['language'] })); setSaved(false) }}><option value="English">English</option><option value="Arabic">العربية</option></select></label>
          <div className="setting-note"><Moon /><span><strong>Appearance</strong><small>Light theme is currently active</small></span></div>
          <div className="setting-note"><ShieldCheck /><span><strong>Privacy</strong><small>Your preferences are stored securely with your portal account</small></span></div>
        </section>
        <div className="settings-actions"><button className="button button-primary" disabled={saving}><Save size={17} />{saving ? 'Saving…' : 'Save preferences'}</button></div>
      </form>
    </div>
  )
}
