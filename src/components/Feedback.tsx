import { AlertCircle, CheckCircle2, Inbox } from 'lucide-react'

export function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return <div className={`alert alert-${type}`}>{type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{message}</span></div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span><Inbox size={30} /></span><h3>{title}</h3><p>{description}</p></div>
}

