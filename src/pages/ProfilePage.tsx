import { FileText, Mail, MapPin, Phone, Save, UploadCloud, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { api, type User } from '../services/api'

type ProfileForm = Omit<User, 'id' | 'email' | 'role' | 'resume_name' | 'created_at'>

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth()
  const [form, setForm] = useState<ProfileForm>({ first_name: '', last_name: '', country_code: '+966', phone: '', country: '', city: '', title: '', about: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name, last_name: user.last_name, country_code: user.country_code, phone: user.phone, country: user.country, city: user.city, title: user.title, about: user.about })
  }, [user])

  const update = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null)
    try { const updated = await api.updateProfile(form); setUser(updated); setMessage({ type: 'success', text: 'Profile saved successfully' }) }
    catch (reason) { setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to save profile' }) }
    finally { setSaving(false) }
  }
  const upload = async (file?: File) => {
    if (!file) return
    setMessage(null)
    try { const result = await api.uploadResume(file); await refreshUser(); setMessage({ type: 'success', text: result.message }) }
    catch (reason) { setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to upload resume' }) }
  }

  const initials = `${user?.first_name[0] ?? ''}${user?.last_name[0] ?? ''}`
  return (
    <div className="page-container profile-page">
      <PageHeader title="Profile" subtitle={user?.role === 'admin' ? 'Keep your administrator contact information up to date.' : 'Keep your personal information and resume up to date.'} />
      {message && <Alert type={message.type} message={message.text} />}
      <div className={`profile-layout ${user?.role === 'admin' ? 'admin-profile-layout' : ''}`}>
        <aside className="panel profile-summary">
          <div className="avatar avatar-large">{initials}</div>
          <h2>{user?.first_name} {user?.last_name}</h2><p>{user?.title}</p>
          <div className="profile-contact"><span><Mail />{user?.email}</span><span><Phone />{user?.country_code} {user?.phone}</span><span><MapPin />{user?.city}, {user?.country}</span></div>
        </aside>
        <form className="panel profile-form" onSubmit={save}>
          <div className="form-section-heading"><span><UserRound /></span><div><h2>Personal details</h2><p>{user?.role === 'admin' ? 'Information used for your administrator account.' : 'Information visible with your applications.'}</p></div></div>
          <div className="two-column-fields">
            <label>First name<input value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required /></label>
            <label>Last name<input value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required /></label>
            <label>Job title<input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
            <label>Phone number<span className="phone-field"><select value={form.country_code} onChange={(event) => update('country_code', event.target.value)}><option>+966</option><option>+971</option><option>+973</option><option>+965</option><option>+1</option></select><input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></span></label>
            <label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
            <label>Country<input value={form.country} onChange={(event) => update('country', event.target.value)} /></label>
            <label className="full-field">About me<textarea rows={5} value={form.about} onChange={(event) => update('about', event.target.value)} placeholder="Share your experience, strengths and career goals." /></label>
          </div>
          <button className="button button-primary save-button" disabled={saving}><Save size={17} />{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
        {user?.role === 'candidate' && <aside className="panel resume-panel">
          <div className="form-section-heading"><span><FileText /></span><div><h2>Resume</h2><p>PDF, DOC or DOCX up to 5 MB.</p></div></div>
          <div className={`resume-dropzone ${user?.resume_name ? 'has-file' : ''}`} onClick={() => fileRef.current?.click()}>
            {user?.resume_name ? <><span className="file-icon"><FileText /></span><strong>{user.resume_name}</strong><small>Click to replace your resume</small></> : <><span><UploadCloud /></span><strong>Upload your resume</strong><small>Click to choose a file</small></>}
          </div>
          <input ref={fileRef} className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => void upload(event.target.files?.[0])} />
          <button className="button button-secondary button-wide" type="button" onClick={() => fileRef.current?.click()}><UploadCloud size={17} />{user?.resume_name ? 'Change resume' : 'Choose file'}</button>
        </aside>}
      </div>
    </div>
  )
}
