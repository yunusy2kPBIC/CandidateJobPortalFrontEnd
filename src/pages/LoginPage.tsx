import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import PublicLayout from '../components/PublicLayout'
import { Alert } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'
import { api, ApiError, type ExternalAuthProviders } from '../services/api'

export default function LoginPage() {
  const [email, setEmail] = useState('john.doe@example.com')
  const [password, setPassword] = useState('Candidate@123')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [providers, setProviders] = useState<ExternalAuthProviders>({ google: false, microsoft: false })
  const { login, loginWithProvider } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.externalAuthProviders().then(setProviders).catch(() => setProviders({ google: false, microsoft: false }))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      if (remember) localStorage.setItem('candidate_portal_remember', email)
      else localStorage.removeItem('candidate_portal_remember')
      navigate('/dashboard')
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 403) {
        navigate('/verify-email', { state: { email: email.trim().toLowerCase() } })
        return
      }
      setError(reason instanceof Error ? reason.message : 'Unable to sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout action="register">
      <section className="login-layout">
        <div className="login-card">
          <div className="eyebrow"><ShieldCheck size={17} />Secure candidate access</div>
          <h1>Welcome back</h1>
          <p className="auth-lead">Sign in to discover opportunities and track your applications.</p>
          {error && <Alert type="error" message={error} />}
          {(providers.google || providers.microsoft) && <>
            <div className="provider-login-grid">
              {providers.google && <button className="provider-login-button" type="button" onClick={() => loginWithProvider('google')}><span className="google-mark" aria-hidden="true">G</span>Continue with Google</button>}
              {providers.microsoft && <button className="provider-login-button" type="button" onClick={() => loginWithProvider('microsoft')}><span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span>Continue with Microsoft</button>}
            </div>
            <div className="auth-divider provider-divider"><span>or sign in with email</span></div>
          </>}
          <form className="auth-form" onSubmit={submit}>
            <label>Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </label>
            <label>Password
              <span className="password-field">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
            <div className="form-row-between">
              <label className="checkbox-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember me</label>
              <button className="text-button" type="button" onClick={() => navigate('/forgot-password', { state: { email: email.trim() } })}>Forgot password?</button>
            </div>
            <button className="button button-primary button-wide" disabled={submitting}>{submitting ? <span className="button-loading"><span className="loader loader-small" />Signing in</span> : 'Sign In'}</button>
          </form>
          <div className="auth-divider"><span>New to PBIC Career JobPosting?</span></div>
          <Link className="button button-secondary button-wide" to="/register">Create Account</Link>
          <p className="demo-note">Demo access: <strong>john.doe@example.com</strong> / <strong>Candidate@123</strong></p>
        </div>
        <div className="login-visual" role="img" aria-label="Modern office building at dusk">
          <div className="visual-overlay">
            <span className="eyebrow eyebrow-light">Your next chapter starts here</span>
            <h2>Build work that matters.</h2>
            <p>Join ambitious teams creating a better future across the region.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
