import { MailCheck, RotateCcw, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { clearPendingVerification, readPendingVerification, savePendingVerification } from '../auth/pendingVerification'
import { defaultRouteForRole } from '../auth/roles'
import { Alert } from '../components/Feedback'
import PublicLayout from '../components/PublicLayout'
import { useAuth } from '../context/AuthContext'
import { api, type RegistrationPending } from '../services/api'

function secondsUntil(value: string) {
  return value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000)) : 0
}

function countdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export default function VerifyEmailPage() {
  const location = useLocation()
  const routeState = location.state as Partial<RegistrationPending> | null
  const stored = readPendingVerification()
  const storedMatchesRoute = !routeState?.email || routeState.email.trim().toLowerCase() === stored?.email.trim().toLowerCase()
  const initial = routeState?.expires_at ? routeState as RegistrationPending : storedMatchesRoute ? stored : null
  const [email, setEmail] = useState(routeState?.email ?? initial?.email ?? '')
  const [code, setCode] = useState(initial?.dev_verification_code ?? '')
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at ?? '')
  const [resendAvailableAt, setResendAvailableAt] = useState(initial?.resend_available_at ?? '')
  const [devCode, setDevCode] = useState(initial?.dev_verification_code ?? '')
  const [expiresIn, setExpiresIn] = useState(() => secondsUntil(initial?.expires_at ?? ''))
  const [resendIn, setResendIn] = useState(() => secondsUntil(initial?.resend_available_at ?? ''))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const { verifyEmail } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExpiresIn(secondsUntil(expiresAt))
      setResendIn(secondsUntil(resendAvailableAt))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt, resendAvailableAt])

  const applyPending = (pending: RegistrationPending) => {
    savePendingVerification(pending)
    setEmail(pending.email)
    setExpiresAt(pending.expires_at)
    setResendAvailableAt(pending.resend_available_at)
    setDevCode(pending.dev_verification_code ?? '')
    setExpiresIn(secondsUntil(pending.expires_at))
    setResendIn(secondsUntil(pending.resend_available_at))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const user = await verifyEmail(email.trim(), code)
      clearPendingVerification()
      navigate(defaultRouteForRole(user.role), { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to verify this email')
    } finally {
      setSubmitting(false)
    }
  }

  const resend = async () => {
    setError('')
    setNotice('')
    setResending(true)
    try {
      const pending = await api.resendVerification(email.trim())
      applyPending(pending)
      setCode(pending.dev_verification_code ?? '')
      setNotice('A new six-digit verification code has been generated.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to resend the verification code')
    } finally {
      setResending(false)
    }
  }

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <PublicLayout action="signin">
      <section className="verify-email-card">
        <div className="verify-email-icon"><MailCheck /></div>
        <div className="eyebrow"><ShieldCheck size={17} />Secure account activation</div>
        <h1>Verify your email</h1>
        <p className="auth-lead">Enter the six-digit code generated for <strong>{email || 'your email address'}</strong>.</p>
        {error && <Alert type="error" message={error} />}
        {notice && <Alert type="success" message={notice} />}

        {devCode && <div className="dev-verification-code">
          <span>Development email code</span>
          <strong>{devCode}</strong>
          <small>Sender: dev-no-reply@candidateportal.local</small>
        </div>}

        <form className="auth-form verify-email-form" onSubmit={submit}>
          <label>Email address
            <input type="email" value={email} onChange={(event) => {
              setEmail(event.target.value)
              if (event.target.value.trim().toLowerCase() !== initial?.email.trim().toLowerCase()) {
                setExpiresAt('')
                setResendAvailableAt('')
                setDevCode('')
              }
            }} required autoComplete="email" />
          </label>
          <label>Verification code
            <input className="verification-code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoComplete="one-time-code" />
          </label>
          <div className={`verification-expiry ${expiresAt && expiresIn === 0 ? 'expired' : ''}`} aria-live="polite">
            {expiresAt ? expiresIn > 0 ? `Code expires in ${countdown(expiresIn)}` : 'This code has expired. Request a new one.' : 'Request a code to continue.'}
          </div>
          <button className="button button-primary button-wide" disabled={submitting || code.length !== 6 || !validEmail}>
            {submitting ? <span className="button-loading"><span className="loader loader-small" />Verifying</span> : 'Verify and continue'}
          </button>
        </form>

        <div className="verification-resend">
          <span>Did not receive a code?</span>
          <button type="button" className="text-button" onClick={resend} disabled={resending || resendIn > 0 || !validEmail}>
            <RotateCcw size={15} />{resending ? 'Generating code' : resendIn > 0 ? `Resend in ${countdown(resendIn)}` : 'Generate a new code'}
          </button>
        </div>
        <p className="development-email-note">Development mode does not contact an external mailbox. The code is shown here and written to the API log.</p>
      </section>
    </PublicLayout>
  )
}
