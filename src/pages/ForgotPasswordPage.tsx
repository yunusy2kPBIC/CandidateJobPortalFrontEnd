import { Check, Eye, EyeOff, KeyRound, RotateCcw, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Alert } from '../components/Feedback'
import PublicLayout from '../components/PublicLayout'
import { api, type PasswordRecoveryPending } from '../services/api'

function secondsUntil(value: string) {
  return value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000)) : 0
}

function countdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function ForgotPasswordPage() {
  const location = useLocation()
  const routeState = location.state as { email?: string } | null
  const [step, setStep] = useState<'request' | 'reset' | 'complete'>('request')
  const [email, setEmail] = useState(routeState?.email ?? '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [pending, setPending] = useState<PasswordRecoveryPending | null>(null)
  const [expiresIn, setExpiresIn] = useState(0)
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const passwordChecks = useMemo(() => [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[a-z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ], [newPassword])
  const strongPassword = passwordChecks.every(Boolean)

  useEffect(() => {
    if (!pending) return
    const updateCountdowns = () => {
      setExpiresIn(secondsUntil(pending.expires_at))
      setResendIn(secondsUntil(pending.resend_available_at))
    }
    updateCountdowns()
    const timer = window.setInterval(updateCountdowns, 1000)
    return () => window.clearInterval(timer)
  }, [pending])

  const requestCode = async (event?: FormEvent) => {
    event?.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const response = await api.requestPasswordRecovery(email.trim())
      setPending(response)
      setEmail(response.email)
      setCode(response.dev_reset_code ?? '')
      setStep('reset')
      setNotice(response.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to generate password reset instructions')
    } finally {
      setSubmitting(false)
    }
  }

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!strongPassword) {
      setError('Choose a password that meets all requirements')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await api.resetPassword(email.trim(), code, newPassword, confirmPassword)
      setStep('complete')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to reset your password')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'complete') {
    return (
      <PublicLayout action="signin">
        <section className="verify-email-card password-reset-complete">
          <div className="verify-email-icon"><Check /></div>
          <h1>Password updated</h1>
          <p className="auth-lead">Your active sessions have been signed out. Use your new password the next time you sign in.</p>
          <Alert type="success" message="Your password was reset successfully." />
          <Link className="button button-primary button-wide" to="/login">Return to sign in</Link>
        </section>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout action="signin">
      <section className="verify-email-card forgot-password-card">
        <div className="verify-email-icon"><KeyRound /></div>
        <div className="eyebrow"><ShieldCheck size={17} />Secure password recovery</div>
        <h1>{step === 'request' ? 'Forgot your password?' : 'Create a new password'}</h1>
        <p className="auth-lead">{step === 'request' ? 'Enter your account email to generate a temporary reset code.' : <>Enter the six-digit code generated for <strong>{email}</strong>.</>}</p>
        {error && <Alert type="error" message={error} />}
        {notice && <Alert type="success" message={notice} />}

        {step === 'request' ? <form className="auth-form" onSubmit={requestCode}>
          <label>Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <button className="button button-primary button-wide" disabled={submitting}>{submitting ? 'Generating code…' : 'Continue'}</button>
        </form> : <>
          {pending?.dev_reset_code && <div className="dev-verification-code">
            <span>Development reset code</span>
            <strong>{pending.dev_reset_code}</strong>
            <small>Sender: dev-no-reply@candidateportal.local</small>
          </div>}
          <form className="auth-form verify-email-form" onSubmit={resetPassword}>
            <label>Reset code
              <input className="verification-code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required autoComplete="one-time-code" />
            </label>
            <div className={`verification-expiry ${pending && expiresIn === 0 ? 'expired' : ''}`}>
              {expiresIn > 0 ? `Code expires in ${countdown(expiresIn)}` : 'This code has expired. Request a new one.'}
            </div>
            <label>New password
              <span className="password-field"><input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required autoComplete="new-password" /><button type="button" onClick={() => setShowPasswords((value) => !value)} aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>{showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
            </label>
            <label>Confirm new password
              <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required autoComplete="new-password" />
            </label>
            <div className="password-meter password-reset-meter">
              <span className="meter-bars">{passwordChecks.map((passed, index) => <i key={index} className={passed ? 'filled' : ''} />)}</span>
              <span>{strongPassword ? 'Strong password' : 'Use upper, lower, number and symbol'}</span>
            </div>
            <button className="button button-primary button-wide" disabled={submitting || code.length !== 6}>{submitting ? 'Updating password…' : 'Reset password'}</button>
          </form>
          <div className="verification-resend">
            <button type="button" className="text-button" onClick={() => { setStep('request'); setPending(null); setNotice(''); setError('') }}>Use a different email</button>
            <button type="button" className="text-button" onClick={() => void requestCode()} disabled={submitting || resendIn > 0}><RotateCcw size={15} />{resendIn > 0 ? `Resend in ${countdown(resendIn)}` : 'Generate a new code'}</button>
          </div>
          <p className="development-email-note">Development mode shows the reset code here and writes both reset messages to the API log.</p>
        </>}
      </section>
    </PublicLayout>
  )
}
