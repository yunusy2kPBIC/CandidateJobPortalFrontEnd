import type { RegistrationPending } from '../services/api'

const STORAGE_KEY = 'candidate_portal_pending_verification'

export function readPendingVerification(): RegistrationPending | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as RegistrationPending : null
  } catch {
    return null
  }
}

export function savePendingVerification(pending: RegistrationPending) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
}

export function clearPendingVerification() {
  sessionStorage.removeItem(STORAGE_KEY)
}
