import { FileText, Globe2, Mail, MapPin, Phone, Save, UploadCloud, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { isRecruitmentAdministrator, portalRoles } from '../auth/roles'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { api, type LookupOptions, type User } from '../services/api'

type ProfileForm = Omit<User, 'id' | 'email' | 'role' | 'is_email_verified' | 'resume_name' | 'created_at'>

const emptyLookups: LookupOptions = { countries: [], residence_countries: [], nationalities: [], divisions: [], job_functions: [], career_levels: [] }

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth()
  const [form, setForm] = useState<ProfileForm>({ first_name: '', last_name: '', country_code: '+966', phone: '', country: '', nationality: '', gender: '', city: '', title: '', about: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lookups, setLookups] = useState<LookupOptions>(emptyLookups)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name, last_name: user.last_name, country_code: user.country_code, phone: user.phone, country: user.country, nationality: user.nationality, gender: user.gender, city: user.city, title: user.title, about: user.about })
  }, [user])

  useEffect(() => {
    let active = true
    api.lookups().then((values) => { if (active) setLookups(values) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const update = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const updateCountry = (country: string) => setForm((current) => {
    const cities = citiesByCountry[country] ?? []
    return {
      ...current,
      country,
      city: cities.includes(current.city) ? current.city : cities[0] ?? '',
    }
  })
  const save = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null)
    try { const updated = await api.updateProfile(form); setUser(updated); setMessage({ type: 'success', text: 'Profile saved successfully' }) }
    catch (reason) { setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to save profile' }) }
    finally { setSaving(false) }
  }
  const upload = async (file?: File) => {
    if (!file) return
    setMessage(null)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Resume must be smaller than 5 MB' })
      return
    }
    setUploading(true)
    try { const result = await api.uploadResume(file); await refreshUser(); setMessage({ type: 'success', text: result.message }) }
    catch (reason) { setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to upload resume' }) }
    finally { setUploading(false) }
  }

  const initials = `${user?.first_name[0] ?? ''}${user?.last_name[0] ?? ''}`
  const administrativeProfile = isRecruitmentAdministrator(user?.role)
  const studentProfile = user?.role === portalRoles.student
  const candidateProfile = user?.role === portalRoles.candidate
  const compactProfile = administrativeProfile || studentProfile
  const citiesByCountry = Object.fromEntries(lookups.countries.map((country) => [country.name, country.cities]))
  const lookupCountries = lookups.residence_countries
  const countryOptions = form.country && !lookupCountries.includes(form.country)
    ? [form.country, ...lookupCountries]
    : lookupCountries
  const availableCities = citiesByCountry[form.country] ?? []
  const cityOptions = form.city && !availableCities.includes(form.city)
    ? [form.city, ...availableCities]
    : availableCities
  const selectableCountries = form.country && !countryOptions.includes(form.country)
    ? [form.country, ...countryOptions]
    : countryOptions
  const nationalityOptions = form.nationality && !lookups.nationalities.includes(form.nationality)
    ? [form.nationality, ...lookups.nationalities]
    : lookups.nationalities
  const validGenders = ['Male', 'Female', 'Other']
  const formGenderValid = validGenders.includes(form.gender)
  const savedGenderValid = validGenders.includes(user?.gender ?? '')
  const formNationalityValid = lookups.nationalities.length > 0
    ? lookups.nationalities.includes(form.nationality)
    : Boolean(form.nationality)
  const savedNationalityValid = lookups.nationalities.length > 0
    ? lookups.nationalities.includes(user?.nationality ?? '')
    : Boolean(user?.nationality)
  const candidateNeedsResume = candidateProfile && !user?.resume_name
  const missingCandidateRequirements = candidateProfile
    ? [
        !savedGenderValid ? 'Gender' : null,
        !savedNationalityValid ? 'Nationality' : null,
        candidateNeedsResume ? 'Resume' : null,
      ].filter((item): item is string => Boolean(item))
    : []
  const profileSubtitle = administrativeProfile
    ? 'Keep your administrator contact information up to date.'
    : studentProfile
      ? 'Keep the contact information used with your cooperative training request up to date.'
      : 'Keep your personal information and resume up to date.'
  return (
    <div className="page-container profile-page">
      <PageHeader title="Profile" subtitle={profileSubtitle} />
      {missingCandidateRequirements.length > 0 && <Alert type="error" message={`Complete these mandatory profile items before applying for jobs: ${missingCandidateRequirements.join(', ')}.`} />}
      {message && <Alert type={message.type} message={message.text} />}
      <div className={`profile-layout ${compactProfile ? 'admin-profile-layout' : ''}`}>
        <aside className="panel profile-summary">
          <div className="avatar avatar-large">{initials}</div>
          <h2>{user?.first_name} {user?.last_name}</h2><p>{user?.title}</p>
          <div className="profile-contact"><span><Mail />{user?.email}</span><span><Phone />{user?.country_code} {user?.phone}</span><span><MapPin />{user?.city}, {user?.country}</span>{user?.role === portalRoles.candidate && <span><Globe2 />{user.nationality || 'Nationality not selected'}</span>}</div>
        </aside>
        <form className="panel profile-form" onSubmit={save}>
          <div className="form-section-heading"><span><UserRound /></span><div><h2>Personal details</h2><p>{administrativeProfile ? 'Information used for your administrator account.' : studentProfile ? 'Information used for your Student account.' : 'Information visible with your applications.'}</p></div></div>
          <div className="two-column-fields">
            <label>First name<input value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required /></label>
            <label>Last name<input value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required /></label>
            <label>Job title<input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
            <label>Phone number<span className="phone-field"><select value={form.country_code} onChange={(event) => update('country_code', event.target.value)}><option>+966</option><option>+971</option><option>+973</option><option>+965</option><option>+1</option></select><input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></span></label>
            <label>City{availableCities.length > 0
              ? <select value={form.city} onChange={(event) => update('city', event.target.value)}><option value="" disabled>Select city</option>{cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}</select>
              : <input value={form.city} maxLength={100} onChange={(event) => update('city', event.target.value)} placeholder="Enter your city" />}</label>
            <label>Country<select value={form.country} onChange={(event) => updateCountry(event.target.value)}><option value="" disabled>Select country</option>{selectableCountries.map((country) => <option key={country} value={country}>{country}</option>)}</select></label>
            {(candidateProfile || studentProfile) && <label className={studentProfile ? 'full-field' : undefined}>Gender <em>*</em><select value={form.gender} onChange={(event) => update('gender', event.target.value)} required aria-invalid={candidateProfile && !formGenderValid}><option value="" disabled>Select gender</option><option>Male</option><option>Female</option><option>Other</option></select>{candidateProfile && !formGenderValid && <small className="profile-validation-message">Select your gender to complete your candidate profile.</small>}</label>}
            {candidateProfile && <label>Nationality <em>*</em><select value={form.nationality} onChange={(event) => update('nationality', event.target.value)} required aria-invalid={!formNationalityValid}><option value="" disabled>Select nationality</option>{nationalityOptions.map((nationality) => <option key={nationality} value={nationality}>{nationality}</option>)}</select>{!formNationalityValid && <small className="profile-validation-message">Select a valid nationality to complete your candidate profile.</small>}</label>}
            <label className="full-field">About me<textarea rows={5} value={form.about} onChange={(event) => update('about', event.target.value)} placeholder="Share your experience, strengths and career goals." /></label>
          </div>
          <button className="button button-primary save-button" disabled={saving}><Save size={17} />{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
        {user?.role === portalRoles.candidate && <aside className={`panel resume-panel ${candidateNeedsResume ? 'resume-required' : ''}`}>
          <div className="form-section-heading"><span><FileText /></span><div><h2>Resume <em>*</em></h2><p>Required before applying. PDF, DOC or DOCX up to 5 MB.</p></div></div>
          <div className={`resume-dropzone ${user?.resume_name ? 'has-file' : ''} ${uploading ? 'uploading' : ''}`} onClick={() => !uploading && fileRef.current?.click()}>
            {uploading ? <><span><UploadCloud /></span><strong>Uploading resume…</strong><small>Please keep this page open.</small></> : user?.resume_name ? <><span className="file-icon"><FileText /></span><strong>{user.resume_name}</strong><small>Click to replace your resume</small></> : <><span><UploadCloud /></span><strong>Upload your resume</strong><small>A resume is required to apply for jobs.</small></>}
          </div>
          <input ref={fileRef} className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = '' }} />
          <button className="button button-secondary button-wide" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}><UploadCloud size={17} />{uploading ? 'Uploading…' : user?.resume_name ? 'Change resume' : 'Choose file'}</button>
        </aside>}
      </div>
    </div>
  )
}
