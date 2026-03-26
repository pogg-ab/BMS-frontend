import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as notifApi from '../api/notifications'

type Tab = 'inbox' | 'announce'

const TABS: { key: Tab; label: string }[] = [
  { key: 'inbox', label: 'My Notifications' },
  { key: 'announce', label: 'Send Announcement' },
]

export default function Notifications() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('inbox')

  // Current user ID from JWT
  const [userId, setUserId] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Announce
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Extract user ID from JWT
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.sub || payload.id || '')
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    if (userId && tab === 'inbox') loadNotifications()
  }, [userId, tab])

  async function loadNotifications() {
    if (!userId) return
    setLoading(true)
    try {
      const data = await notifApi.getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load notifications', 'error')
    } finally { setLoading(false) }
  }

  async function handleMarkAllRead() {
    try {
      await notifApi.markAllAsRead()
      toast.addToast('All marked as read', 'success')
      loadNotifications()
    } catch (e: any) {
      toast.addToast('Failed to mark as read', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await notifApi.deleteNotification(id)
      toast.addToast('Notification deleted', 'success')
      loadNotifications()
    } catch (e: any) {
      toast.addToast('Delete failed', 'error')
    }
  }

  async function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const result = await notifApi.sendAnnouncement({ title: annTitle, message: annMessage })
      toast.addToast(`Announcement sent to ${result.sent_count || 0} users`, 'success')
      setAnnTitle('')
      setAnnMessage('')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Send failed', 'error')
    } finally { setSending(false) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function typeIcon(type: string) {
    const map: Record<string, string> = {
      lease: '📋', finance: '💰', maintenance: '🛠️', announcement: '📢', system: '⚙️',
    }
    return map[type?.toLowerCase()] || '🔔'
  }

  return (
    <PageLayout title="Notifications" subtitle="In-app notifications and system announcements">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
              {t.key === 'inbox' && unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-red-500 text-white">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ────── INBOX ────── */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · {unreadCount} unread
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Mark All Read
            </button>
          </div>

          {loading ? <div className="text-gray-500">Loading...</div> : notifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-2">🔔</div>
              <div className="text-gray-400">No notifications yet</div>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => (
                <div key={n.id} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-4 flex items-start gap-3 ${n.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
                  <div className="text-2xl">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xs text-gray-400">{n.created_at ? new Date(n.created_at).toLocaleString() : '-'}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{n.type}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-500 text-sm" title="Delete">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────── ANNOUNCE ────── */}
      {tab === 'announce' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">Send Announcement</h3>
            <p className="text-sm text-gray-500 mb-4">This will send a notification to <strong>all users</strong> in the system.</p>
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={annMessage}
                  onChange={e => setAnnMessage(e.target.value)}
                  placeholder="Write your announcement..."
                  rows={4}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : '📢 Send to All Users'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">About Notifications</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div><strong>Lease</strong> — Expiry reminders (30, 14, 7 days before)</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💰</span>
                <div><strong>Finance</strong> — Payment reminders and overdue alerts</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🛠️</span>
                <div><strong>Maintenance</strong> — Work order started/completed, feedback requests</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📢</span>
                <div><strong>Announcement</strong> — System-wide messages from admin</div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⚙️</span>
                <div><strong>System</strong> — Document uploads, password changes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
