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
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import Brand from './Brand'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, candidateOnly: true },
  { to: '/jobs', label: 'Available Jobs', icon: BriefcaseBusiness, candidateOnly: true },
  { to: '/applications', label: 'Jobs Applied', icon: FileCheck2, candidateOnly: true },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/password', label: 'Password Management', icon: LockKeyhole },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/admin', label: 'Recruitment admin', icon: ShieldCheck, adminOnly: true, end: true },
  { to: '/admin/recruitment-requests', label: 'Recruitment Requests', icon: ClipboardList, adminOnly: true },
  { to: '/admin/cooperative-training', label: 'Cooperative Training', icon: GraduationCap, adminOnly: true },
  { to: '/sharepoint', label: 'SharePoint diagnostics', icon: CloudCog, adminOnly: true },
]

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = `${user?.first_name[0] ?? ''}${user?.last_name[0] ?? ''}`.toUpperCase()

  useEffect(() => {
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
  }, [user?.id])

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
          {navigation.filter((item) => (
            (!item.adminOnly || user?.role === 'admin')
            && (!item.candidateOnly || user?.role === 'candidate')
          )).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
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
          <NavLink to="/notifications" className="notification-button" aria-label="Notifications">
            <Bell size={20} />
            {unreadNotifications > 0 && <span>{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
          </NavLink>
          <button type="button" className="icon-button" onClick={() => void signOut()} aria-label="Logout" title="Logout"><LogOut size={18} /></button>
          <NavLink to="/profile" className="user-menu">
            <span className="avatar avatar-small">{initials}</span>
            <span className="user-menu-name">{user?.first_name} {user?.last_name}{user?.role === 'admin' ? ' · Admin' : ''}</span>
            <ChevronDown size={15} />
          </NavLink>
        </header>
        <main className="app-content"><Outlet /></main>
      </div>
    </div>
  )
}
