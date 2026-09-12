import { Navigate, Route, Routes } from 'react-router'
import { defaultRouteForRole, isRecruitmentAdministrator, portalRoles } from './auth/roles'
import AppShell from './components/AppShell'
import { useAuth } from './context/AuthContext'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'
import ExternalAuthCallbackPage from './pages/ExternalAuthCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import JobDetailsPage from './pages/JobDetailsPage'
import JobsPage from './pages/JobsPage'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import PasswordPage from './pages/PasswordPage'
import ProfilePage from './pages/ProfilePage'
import PrivacyPage from './pages/PrivacyPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import SharePointPage from './pages/SharePointPage'
import StudentCooperativeTrainingPage from './pages/StudentCooperativeTrainingPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

function ProtectedArea() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <AppShell />
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  return user ? <Navigate to={defaultRouteForRole(user.role)} replace /> : children
}

function RecruitmentAdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return isRecruitmentAdministrator(user?.role) ? children : <Navigate to="/dashboard" replace />
}

function AdministratorOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === portalRoles.administrator ? children : <Navigate to={user ? defaultRouteForRole(user.role) : '/login'} replace />
}

function CandidateOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === portalRoles.candidate ? children : <Navigate to={user ? defaultRouteForRole(user.role) : '/login'} replace />
}

function StudentOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === portalRoles.student ? children : <Navigate to={user ? defaultRouteForRole(user.role) : '/login'} replace />
}

function NonStudentOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role !== portalRoles.student ? children : <Navigate to="/cooperative-training" replace />
}

function DefaultRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loader"><span className="loader" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={defaultRouteForRole(user.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/auth/callback" element={<PublicOnly><ExternalAuthCallbackPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/verify-email" element={<PublicOnly><VerifyEmailPage /></PublicOnly>} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route element={<ProtectedArea />}>
        <Route path="/dashboard" element={<CandidateOnly><DashboardPage /></CandidateOnly>} />
        <Route path="/jobs" element={<CandidateOnly><JobsPage /></CandidateOnly>} />
        <Route path="/jobs/:jobId" element={<CandidateOnly><JobDetailsPage /></CandidateOnly>} />
        <Route path="/applications" element={<CandidateOnly><ApplicationsPage /></CandidateOnly>} />
        <Route path="/cooperative-training" element={<StudentOnly><StudentCooperativeTrainingPage /></StudentOnly>} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/notifications" element={<NonStudentOnly><NotificationsPage /></NonStudentOnly>} />
        <Route path="/settings" element={<NonStudentOnly><SettingsPage /></NonStudentOnly>} />
        <Route path="/admin/*" element={<RecruitmentAdminOnly><AdminPage /></RecruitmentAdminOnly>} />
        <Route path="/sharepoint" element={<AdministratorOnly><SharePointPage /></AdministratorOnly>} />
      </Route>
      <Route path="*" element={<DefaultRoute />} />
    </Routes>
  )
}
