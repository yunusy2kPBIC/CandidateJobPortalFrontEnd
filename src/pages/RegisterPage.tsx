import { BriefcaseBusiness, Check, CheckCircle2, CircleX, Clock3, Eye, EyeOff, FileCheck2, GraduationCap, LoaderCircle, ShieldCheck, TrendingUp, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../components/Feedback'
import PublicLayout from '../components/PublicLayout'
import { savePendingVerification } from '../auth/pendingVerification'
import { useAuth } from '../context/AuthContext'
import { api, type LookupOptions, type PrivacyNotice } from '../services/api'

const emptyLookups: LookupOptions = { countries: [], divisions: [], job_functions: [], career_levels: [] }
type EmailAvailabilityState = 'idle' | 'checking' | 'available' | 'pending' | 'unavailable' | 'error'

const initialForm = {
  email: '',
  confirm_email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  country_code: '+966',
  phone: '',
  country: 'Saudi Arabia',
  nationality: 'Saudi Arabia',
  gender: '',
  is_student: false,
  accepted_terms: false,
  privacy_version: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [human, setHuman] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lookups, setLookups] = useState<LookupOptions>(emptyLookups)
  const [privacyNotice, setPrivacyNotice] = useState<PrivacyNotice | null>(null)
  const [emailAvailability, setEmailAvailability] = useState<EmailAvailabilityState>('idle')
  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordChecks = useMemo(() => [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ], [form.password])
  const passwordScore = passwordChecks.filter(Boolean).length
  const lookupCountries = lookups.countries.map((country) => country.name)
  const countryOptions = form.country && !lookupCountries.includes(form.country)
    ? [form.country, ...lookupCountries]
    : lookupCountries

  useEffect(() => {
    let active = true
    api.lookups().then((values) => { if (active) setLookups(values) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    api.privacyNotice().then((notice) => {
      if (!active) return
      setPrivacyNotice(notice)
      setForm((current) => ({ ...current, privacy_version: notice.version }))
    }).catch(() => { if (active) setError('Unable to load the current privacy notice. Please refresh the page.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const email = form.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailAvailability('idle')
      return
    }
    let active = true
    setEmailAvailability('checking')
    const timer = window.setTimeout(() => {
      api.emailAvailability(email)
        .then(({ available, pending_verification }) => {
          if (active) setEmailAvailability(pending_verification ? 'pending' : available ? 'available' : 'unavailable')
        })
        .catch(() => { if (active) setEmailAvailability('error') })
    }, 500)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [form.email])

  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (emailAvailability === 'pending') {
      navigate('/verify-email', { state: { email: form.email.trim().toLowerCase() } })
      return
    }
    if (!human) {
      setError('Please confirm you are human')
      return
    }
    if (emailAvailability === 'unavailable') {
      setError('An account already exists for this email. Sign in or use a different address.')
      return
    }
    if (passwordScore < 5) {
      setError('Choose a password that meets all requirements')
      return
    }
    setSubmitting(true)
    try {
      const pending = await register(form)
      savePendingVerification(pending)
      navigate('/verify-email', { state: pending })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create your account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout action="signin">
      <section className="register-layout">
        <div className="register-card">
          <div className="register-heading">
            <div><h1>Create your account</h1><p>{form.is_student ? 'Fill in your details to start your cooperative training journey.' : 'Fill in your details to start your candidate journey.'}</p></div>
            <a href="#requirements"><ShieldCheck size={17} />Password policy</a>
          </div>
          {error && <Alert type="error" message={error} />}
          <form className="register-form" onSubmit={submit}>
            <label>Email address <em>*</em><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
              <span className={`field-feedback feedback-${emailAvailability}`} aria-live="polite">
                {emailAvailability === 'checking' && <><LoaderCircle className="spin" />Checking availability…</>}
                {emailAvailability === 'available' && <><CheckCircle2 />Email is available</>}
                {emailAvailability === 'pending' && <><Clock3 />Account created.<button type="button" className="text-button" onClick={() => navigate('/verify-email', { state: { email: form.email.trim().toLowerCase() } })}>Verify now</button></>}
                {emailAvailability === 'unavailable' && <><CircleX />An account already exists for this email</>}
                {emailAvailability === 'error' && <>Availability will be confirmed when you submit.</>}
              </span>
            </label>
            <label>Retype email address <em>*</em><span className="validated-field"><input type="email" value={form.confirm_email} onChange={(event) => update('confirm_email', event.target.value)} required />{form.email && form.email === form.confirm_email && <Check size={19} />}</span></label>
            <label>Choose password <em>*</em><span className="password-field"><input type={showPasswords ? 'text' : 'password'} value={form.password} onChange={(event) => update('password', event.target.value)} required /><button type="button" onClick={() => setShowPasswords((value) => !value)}>{showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <label>Retype password <em>*</em><span className="validated-field"><input type={showPasswords ? 'text' : 'password'} value={form.confirm_password} onChange={(event) => update('confirm_password', event.target.value)} required />{form.password && form.password === form.confirm_password && <Check size={19} />}</span></label>
            <div className="password-meter full-field">
              <span className="meter-bars">{[1, 2, 3, 4, 5].map((bar) => <i key={bar} className={bar <= passwordScore ? 'filled' : ''} />)}</span>
              <span>{passwordScore < 3 ? 'Keep going' : passwordScore < 5 ? 'Almost there' : 'Strong password'}</span>
            </div>
            <label>First name <em>*</em><input value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required /></label>
            <label>Last name <em>*</em><input value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required /></label>
            <label>Country/region code <em>*</em><select value={form.country_code} onChange={(event) => update('country_code', event.target.value)}><option value="+966">🇸🇦 +966 (Saudi Arabia)</option><option value="+971">🇦🇪 +971 (United Arab Emirates)</option><option value="+973">🇧🇭 +973 (Bahrain)</option><option value="+965">🇰🇼 +965 (Kuwait)</option><option value="+1">🇺🇸 +1 (United States)</option></select></label>
            <label>Phone number <em>*</em><input type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} required /></label>
            <label className="full-field">Country/region of residence <em>*</em><select value={form.country} onChange={(event) => update('country', event.target.value)}>{countryOptions.map((country) => <option key={country}>{country}</option>)}</select></label>
            <label className={form.is_student ? 'full-field' : undefined}>Gender <em>*</em><select value={form.gender} onChange={(event) => update('gender', event.target.value)} required><option value="" disabled>Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></label>
            {!form.is_student && <label>Nationality <em>*</em><select value={form.nationality} onChange={(event) => update('nationality', event.target.value)} required><option>Saudi Arabia</option><option>GCC</option><option>Others</option></select></label>}
            <label className="checkbox-label full-field student-registration-check"><input type="checkbox" checked={form.is_student} onChange={(event) => update('is_student', event.target.checked)} /><span><strong>Register as a Student</strong><small>Select this option to apply for the Cooperative Training program instead of regular job opportunities.</small></span></label>
            <div className="human-check full-field">
              <button type="button" className={human ? 'checked' : ''} onClick={() => setHuman((value) => !value)}><span>{human && <Check size={20} />}</span>I am human</button>
              <div><ShieldCheck size={25} /><small>Protected form</small></div>
            </div>
            <label className="checkbox-label full-field terms-check"><input type="checkbox" checked={form.accepted_terms} onChange={(event) => update('accepted_terms', event.target.checked)} disabled={!privacyNotice} /><span>I have read and accept the <Link to="/privacy" target="_blank" rel="noreferrer">Candidate Portal Privacy Notice</Link>{privacyNotice && <> (version {privacyNotice.version})</>} and terms of use.</span></label>
            <button className="button button-primary button-wide full-field" disabled={submitting || !privacyNotice}>{submitting ? 'Creating account…' : 'Create Account'}</button>
          </form>
        </div>
        <aside className="register-aside">
          <div className="register-illustration"><div className="illustration-orbit"><ShieldCheck size={34} /></div></div>
          <h2>{form.is_student ? 'Cooperative Training program' : 'Join our talent community'}</h2>
          <p>{form.is_student ? 'Create a Student account to submit your university training request and required documents.' : 'Create an account to apply for jobs, track your progress and manage your profile.'}</p>
          {form.is_student ? <>
            <div className="benefit-mini"><span><GraduationCap /></span><div><strong>Student-only journey</strong><p>Access the dedicated Cooperative Training application.</p></div></div>
            <div className="benefit-mini"><span><FileCheck2 /></span><div><strong>Submit supporting documents</strong><p>Upload your transcript and official university request securely.</p></div></div>
            <div className="benefit-mini"><span><UserRound /></span><div><strong>Manage your details</strong><p>Keep your Student profile and contact information current.</p></div></div>
          </> : <>
            <div className="benefit-mini"><span><BriefcaseBusiness /></span><div><strong>Find great opportunities</strong><p>Discover roles that match your skills and experience.</p></div></div>
            <div className="benefit-mini"><span><TrendingUp /></span><div><strong>Track your applications</strong><p>Stay updated on applications and interviews.</p></div></div>
            <div className="benefit-mini"><span><UserRound /></span><div><strong>Manage your profile</strong><p>Keep your story fresh and stand out to employers.</p></div></div>
          </>}
          <div id="requirements" className="password-policy">
            <strong>Password requirements</strong>
            <span>{passwordChecks.map((passed, index) => <i key={index} className={passed ? 'passed' : ''}><Check size={13} /></i>)}</span>
          </div>
        </aside>
      </section>
    </PublicLayout>
  )
}
