import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type ExternalAuthProvider, type RegisterPayload, type User } from '../services/api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithProvider: (provider: ExternalAuthProvider) => void
  completeExternalLogin: (code: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'candidate_portal_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      setUser(await api.me())
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  useEffect(() => {
    const initialize = async () => {
      if (localStorage.getItem(TOKEN_KEY)) await refreshUser()
      setLoading(false)
    }
    void initialize()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    localStorage.setItem(TOKEN_KEY, result.access_token)
    setUser(result.user)
  }

  const loginWithProvider = (provider: ExternalAuthProvider) => {
    window.location.assign(api.externalLoginUrl(provider, `${window.location.origin}/auth/callback`))
  }

  const completeExternalLogin = async (code: string) => {
    const result = await api.exchangeExternalAuthCode(code)
    localStorage.setItem(TOKEN_KEY, result.access_token)
    setUser(result.user)
  }

  const register = async (payload: RegisterPayload) => {
    const result = await api.register(payload)
    localStorage.setItem(TOKEN_KEY, result.access_token)
    setUser(result.user)
  }

  const logout = async () => {
    try {
      await api.logout()
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, loginWithProvider, completeExternalLogin, register, logout, refreshUser, setUser }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
