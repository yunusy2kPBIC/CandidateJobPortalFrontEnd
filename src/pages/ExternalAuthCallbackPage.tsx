import { ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import PublicLayout from '../components/PublicLayout'
import { Alert } from '../components/Feedback'
import { useAuth } from '../context/AuthContext'

export default function ExternalAuthCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { completeExternalLogin } = useAuth()
  const started = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true
    const parameters = new URLSearchParams(location.search)
    const providerError = parameters.get('error')
    const code = parameters.get('code')
    if (providerError) {
      setError(providerError)
      return
    }
    if (!code) {
      setError('The sign-in response is incomplete. Please try again.')
      return
    }
    completeExternalLogin(code)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to complete sign-in'))
  }, [completeExternalLogin, location.search, navigate])

  return (
    <PublicLayout action="signin">
      <section className="external-callback-card panel">
        <span className="external-callback-icon"><ShieldCheck /></span>
        <h1>{error ? 'Sign-in needs attention' : 'Signing you in'}</h1>
        <p>{error ? 'We could not finish signing you in with your selected account.' : 'Your account is verified. We are preparing your candidate dashboard.'}</p>
        {error ? <><Alert type="error" message={error} /><Link className="button button-primary button-wide" to="/login">Return to sign in</Link></> : <span className="loader" />}
      </section>
    </PublicLayout>
  )
}
