import { BriefcaseBusiness, Check, Eye, EyeOff, ShieldCheck, TrendingUp, UserRound } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '../components/Feedback'
import PublicLayout from '../components/PublicLayout'
import { useAuth } from '../context/AuthContext'

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
  accepted_terms: false,
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [human, setHuman] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
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

  const update = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!human) {
      setError('Please confirm you are human')
      return
    }
    if (passwordScore < 5) {
      setError('Choose a password that meets all requirements')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
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
            <div><h1>Create your account</h1><p>Fill in your details to start your candidate journey.</p></div>
            <a href="#requirements"><ShieldCheck size={17} />Password policy</a>
          </div>
          {error && <Alert type="error" message={error} />}
          <form className="register-form" onSubmit={submit}>
            <label>Email address <em>*</em><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required /></label>
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
            <label className="full-field">Country/region of residence <em>*</em><select value={form.country} onChange={(event) => update('country', event.target.value)}><option>Saudi Arabia</option><option>United Arab Emirates</option><option>Bahrain</option><option>Kuwait</option><option>United States</option></select></label>
            <div className="human-check full-field">
              <button type="button" className={human ? 'checked' : ''} onClick={() => setHuman((value) => !value)}><span>{human && <Check size={20} />}</span>I am human</button>
              <div><ShieldCheck size={25} /><small>Protected form</small></div>
            </div>
            <label className="checkbox-label full-field terms-check"><input type="checkbox" checked={form.accepted_terms} onChange={(event) => update('accepted_terms', event.target.checked)} />I accept the <a href="#privacy">data privacy statement</a> and terms of use.</label>
            <button className="button button-primary button-wide full-field" disabled={submitting}>{submitting ? 'Creating account…' : 'Create Account'}</button>
          </form>
        </div>
        <aside className="register-aside">
          <div className="register-illustration"><div className="illustration-orbit"><ShieldCheck size={34} /></div></div>
          <h2>Join our talent community</h2>
          <p>Create an account to apply for jobs, track your progress and manage your profile.</p>
          <div className="benefit-mini"><span><BriefcaseBusiness /></span><div><strong>Find great opportunities</strong><p>Discover roles that match your skills and experience.</p></div></div>
          <div className="benefit-mini"><span><TrendingUp /></span><div><strong>Track your applications</strong><p>Stay updated on applications and interviews.</p></div></div>
          <div className="benefit-mini"><span><UserRound /></span><div><strong>Manage your profile</strong><p>Keep your story fresh and stand out to employers.</p></div></div>
          <div id="requirements" className="password-policy">
            <strong>Password requirements</strong>
            <span>{passwordChecks.map((passed, index) => <i key={index} className={passed ? 'passed' : ''}><Check size={13} /></i>)}</span>
          </div>
        </aside>
      </section>
    </PublicLayout>
  )
}
