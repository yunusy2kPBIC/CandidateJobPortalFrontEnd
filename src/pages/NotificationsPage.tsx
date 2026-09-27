import { Bell, CalendarCheck2, CheckCheck, FileCheck2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, EmptyState } from '../components/Feedback'
import PageHeader from '../components/PageHeader'
import { api, type Notification } from '../services/api'

const notificationIcons = {
  application: FileCheck2,
  interview: CalendarCheck2,
  job: Sparkles,
  system: Bell,
}

function relativeTime(value: string) {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(elapsedSeconds) < 60) return formatter.format(elapsedSeconds, 'second')
  const minutes = Math.round(elapsedSeconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

function notifyUnreadCountChanged() {
  window.dispatchEvent(new Event('notifications-updated'))
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadNotifications = () => {
      api.notifications()
        .then((items) => { if (active) { setNotifications(items); setError(null) } })
        .catch((caught: Error) => { if (active) setError(caught.message) })
        .finally(() => { if (active) setLoading(false) })
    }
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30_000)
    window.addEventListener('focus', loadNotifications)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', loadNotifications)
    }
  }, [])

  const markAll = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.markAllNotificationsRead()
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
      notifyUnreadCountChanged()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update notifications')
    } finally {
      setSaving(false)
    }
  }

  const openNotification = async (notification: Notification) => {
    setError(null)
    try {
      if (!notification.is_read) {
        const updated = await api.markNotificationRead(notification.id)
        setNotifications((items) => items.map((item) => item.id === updated.id ? updated : item))
        notifyUnreadCountChanged()
      }
      if (notification.link) navigate(notification.link)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the notification')
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Notifications"
        subtitle="Keep up with application updates and new opportunities."
        action={<button className="button button-secondary button-small" onClick={() => void markAll()} disabled={saving || !notifications.some((item) => !item.is_read)}><CheckCheck size={16} />{saving ? 'Saving…' : 'Mark all as read'}</button>}
      />
      {error && <Alert type="error" message={error} />}
      <section className="panel notifications-panel">
        {loading ? <div className="page-loader compact"><span className="loader" /></div> : notifications.length ? notifications.map((notification) => {
          const Icon = notificationIcons[notification.kind as keyof typeof notificationIcons] ?? Bell
          return (
            <button key={notification.id} className={`notification-row ${notification.is_read ? '' : 'unread'}`} onClick={() => void openNotification(notification)}>
              <span className="notification-icon"><Icon /></span>
              <span><strong>{notification.title}</strong><p>{notification.message}</p><small>{relativeTime(notification.created_at)}</small></span>
              {!notification.is_read && <i />}
            </button>
          )
        }) : <EmptyState title="No notifications" description="Application and job updates will appear here." />}
      </section>
    </div>
  )
}
