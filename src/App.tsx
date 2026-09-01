import { Navigate, Route, Routes } from 'react-router'
import AppShell from './components/AppShell'
import { useAuth } from './context/AuthContext'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'
import ExternalAuthCallbackPage from './pages/ExternalAuthCallbackPage'
import JobDetailsPage from './pages/JobDetailsPage'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import PasswordPage from './pages/PasswordPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import SharePointPage from './pages/SharePointPage'

function ProtectedArea() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <AppShell />
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : children
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

function CandidateOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'candidate' ? children : <Navigate to="/admin" replace />
}

function DefaultRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/auth/callback" element={<PublicOnly><ExternalAuthCallbackPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route element={<ProtectedArea />}>
        <Route path="/dashboard" element={<CandidateOnly><DashboardPage /></CandidateOnly>} />
        <Route path="/jobs" element={<CandidateOnly><JobsPage /></CandidateOnly>} />
        <Route path="/jobs/:jobId" element={<CandidateOnly><JobDetailsPage /></CandidateOnly>} />
        <Route path="/applications" element={<CandidateOnly><ApplicationsPage /></CandidateOnly>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin/*" element={<AdminOnly><AdminPage /></AdminOnly>} />
        <Route path="/sharepoint" element={<AdminOnly><SharePointPage /></AdminOnly>} />
      </Route>
      <Route path="*" element={<DefaultRoute />} />
    </Routes>
  )
}
