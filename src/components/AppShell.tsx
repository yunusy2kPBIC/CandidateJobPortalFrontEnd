import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CloudCog,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { portalRoles, recruitmentAdministratorRoles, roleLabel, type UserRole } from '../auth/roles'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Brand from './Brand'

type NavigationItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  allowedRoles?: readonly UserRole[]
  end?: boolean
}

const candidateRoles: readonly UserRole[] = [portalRoles.candidate]
const administratorRoles: readonly UserRole[] = [portalRoles.administrator]
const studentRoles: readonly UserRole[] = [portalRoles.student]
const notificationRoles: readonly UserRole[] = [
  portalRoles.candidate,
  portalRoles.administrator,
  portalRoles.hrAdministrator,
]

const navigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: candidateRoles },
  { to: '/jobs', label: 'Available Jobs', icon: BriefcaseBusiness, allowedRoles: candidateRoles },
  { to: '/applications', label: 'Jobs Applied', icon: FileCheck2, allowedRoles: candidateRoles },
  { to: '/cooperative-training', label: 'Cooperative Training', icon: GraduationCap, allowedRoles: studentRoles },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/password', label: 'Password Management', icon: LockKeyhole },
  { to: '/notifications', label: 'Notifications', icon: Bell, allowedRoles: notificationRoles },
  { to: '/settings', label: 'Settings', icon: Settings, allowedRoles: notificationRoles },
  { to: '/admin', label: 'Recruitment admin', icon: ShieldCheck, allowedRoles: recruitmentAdministratorRoles, end: true },
  { to: '/admin/recruitment-requests', label: 'Recruitment Requests', icon: ClipboardList, allowedRoles: recruitmentAdministratorRoles },
  { to: '/admin/cooperative-training', label: 'Cooperative Training', icon: GraduationCap, allowedRoles: recruitmentAdministratorRoles },
  { to: '/sharepoint', label: 'SharePoint diagnostics', icon: CloudCog, allowedRoles: administratorRoles },
]

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = `${user?.first_name[0] ?? ''}${user?.last_name[0] ?? ''}`.toUpperCase()

  useEffect(() => {
    if (user?.role === portalRoles.student) {
      setUnreadNotifications(0)
      return
    }
    let active = true
    const refreshUnreadCount = () => {
      api.unreadNotificationCount()
        .then(({ unread }) => { if (active) setUnreadNotifications(unread) })
        .catch(() => { if (active) setUnreadNotifications(0) })
    }
    refreshUnreadCount()
    window.addEventListener('notifications-updated', refreshUnreadCount)
    return () => {
      active = false
      window.removeEventListener('notifications-updated', refreshUnreadCount)
    }
  }, [user?.id, user?.role])

  const signOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <Brand light compact />
          <button className="icon-button sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.filter((item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-link sidebar-logout" onClick={() => void signOut()}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
      {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <div className="app-column">
        <header className="app-topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <Brand compact />
          <div className="topbar-spacer" />
          {user?.role !== portalRoles.student && <NavLink to="/notifications" className="notification-button" aria-label="Notifications">
            <Bell size={20} />
            {unreadNotifications > 0 && <span>{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
          </NavLink>}
          <button type="button" className="icon-button" onClick={() => void signOut()} aria-label="Logout" title="Logout"><LogOut size={18} /></button>
          <NavLink to="/profile" className="user-menu">
            <span className="avatar avatar-small">{initials}</span>
            <span className="user-menu-name">{user?.first_name} {user?.last_name}{user && user.role !== portalRoles.candidate ? ` · ${roleLabel(user.role)}` : ''}</span>
            <ChevronDown size={15} />
          </NavLink>
        </header>
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  )
}
