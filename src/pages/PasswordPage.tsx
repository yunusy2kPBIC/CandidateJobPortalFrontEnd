import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Alert } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { api } from '../services/api'

export default function PasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const checks = useMemo(() => [
    ['At least 8 characters', next.length >= 8], ['One uppercase letter', /[A-Z]/.test(next)], ['One lowercase letter', /[a-z]/.test(next)], ['One number', /\d/.test(next)], ['One special character', /[^A-Za-z0-9]/.test(next)],
  ] as const, [next])

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setMessage(null)
    if (checks.some(([, passed]) => !passed)) { setMessage({ type: 'error', text: 'Your new password does not meet all requirements' }); return }
    try { const result = await api.updatePassword(current, next, confirm); setMessage({ type: 'success', text: result.message }); setCurrent(''); setNext(''); setConfirm('') }
    catch (reason) { setMessage({ type: 'error', text: reason instanceof Error ? reason.message : 'Unable to update password' }) }
  }

  const passwordInput = (label: string, value: string, setter: (value: string) => void, autocomplete: string) => <label>{label}<span className="password-field"><input type={visible ? 'text' : 'password'} value={value} onChange={(event) => setter(event.target.value)} autoComplete={autocomplete} required /><button type="button" onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
  return (
    <div className="page-container">
      <PageHeader title="Password management" subtitle="Update your password to keep your account secure." />
      {message && <Alert type={message.type} message={message.text} />}
      <div className="password-layout">
        <form className="panel password-form" onSubmit={submit}>
          <div className="form-section-heading"><span><KeyRound /></span><div><h2>Change password</h2><p>Enter your current password before choosing a new one.</p></div></div>
          {passwordInput('Current password', current, setCurrent, 'current-password')}
          {passwordInput('New password', next, setNext, 'new-password')}
          {passwordInput('Confirm new password', confirm, setConfirm, 'new-password')}
          <button className="button button-primary"><ShieldCheck size={17} />Update password</button>
        </form>
        <aside className="panel password-requirements"><span className="requirements-icon"><ShieldCheck /></span><h2>Password requirements</h2><p>A strong password helps keep your candidate profile safe.</p><div>{checks.map(([label, passed]) => <span className={passed ? 'passed' : ''} key={label}><CheckCircle2 />{label}</span>)}</div></aside>
      </div>
    </div>
  )
}

