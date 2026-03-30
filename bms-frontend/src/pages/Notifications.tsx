import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as notifApi from '../api/notifications'
import { Bell, Megaphone, CheckCircle2, Trash2, Mail, Briefcase, DollarSign, Wrench, Shield, Clock, Send, Info, Search, Filter } from 'lucide-react'

type Tab = 'inbox' | 'announce'

export default function Notifications() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('inbox')
  const [userId, setUserId] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Announce Form
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
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
      toast.addToast('Failed to retrieve communications', 'error')
    } finally { setLoading(false) }
  }

  async function handleMarkAllRead() {
    try {
      await notifApi.markAllAsRead()
      toast.addToast('Communications protocol updated', 'success')
      loadNotifications()
    } catch (e: any) {
      toast.addToast('Sync failed', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await notifApi.deleteNotification(id)
      toast.addToast('Cleared from logs', 'success')
      loadNotifications()
    } catch (e: any) {
      toast.addToast('System error', 'error')
    }
  }

  async function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const result = await notifApi.sendAnnouncement({ title: annTitle, message: annMessage })
      toast.addToast(`Global transmission sent to ${result.sent_count || 0} users`, 'success')
      setAnnTitle(''); setAnnMessage('')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Transmission failed', 'error')
    } finally { setSending(false) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function getTypeMeta(type: string) {
    const t = type?.toLowerCase()
    if (t === 'lease') return { icon: Mail, color: 'text-indigo-500', bg: 'bg-indigo-50' }
    if (t === 'finance') return { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' }
    if (t === 'maintenance') return { icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' }
    if (t === 'announcement') return { icon: Megaphone, color: 'text-rose-500', bg: 'bg-rose-50' }
    if (t === 'system') return { icon: Shield, color: 'text-slate-500', bg: 'bg-slate-50' }
    return { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' }
  }

  return (
    <PageLayout 
      title="Communication Hub" 
      subtitle="Manage system notifications, tenant alerts, and broadcast announcements."
      actions={
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setTab('inbox')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${tab === 'inbox' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Inbox {unreadCount > 0 && <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center animate-pulse">{unreadCount}</span>}
          </button>
          <button
            onClick={() => setTab('announce')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'announce' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Broadcast
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-20 max-w-5xl mx-auto">
        
        {tab === 'inbox' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bell size={16} className="text-indigo-500" /> Incoming Feed
              </h3>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 flex items-center gap-2"
              >
                <CheckCircle2 size={14} /> Clear Unread
              </button>
            </div>

            {loading ? (
               <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
            ) : notifications.length === 0 ? (
               <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Mail size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4 opacity-50" />
                  <p className="font-bold text-slate-500 uppercase tracking-widest">Inbox is empty</p>
                  <p className="text-xs text-slate-400 mt-1">No new transmissions detected.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notifications.map((n) => {
                  const meta = getTypeMeta(n.type)
                  const Icon = meta.icon
                  return (
                    <div key={n.id} className={`group bg-white dark:bg-slate-800 rounded-3xl p-5 border transition-all flex items-start gap-5 ${n.is_read ? 'border-slate-100 dark:border-slate-700 opacity-60' : 'border-indigo-100 dark:border-indigo-900/40 shadow-sm'}`}>
                      <div className={`w-12 h-12 rounded-2xl ${meta.bg} flex items-center justify-center ${meta.color} shadow-sm shrink-0`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{n.title}</h4>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">{n.message}</p>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> {new Date(n.created_at).toLocaleString()}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${meta.bg} ${meta.color}`}>{n.type}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(n.id)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <Megaphone size={24} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast Announcement</h3>
                   <p className="text-sm text-slate-500 font-medium">Notify everyone across the portfolio instantly.</p>
                </div>
              </div>

              <form onSubmit={handleSendAnnouncement} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                  <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} required placeholder="e.g. Scheduled Water Maintenance" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Message</label>
                  <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} required rows={6} placeholder="Describe the announcement details..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none" />
                </div>
                <button 
                  type="submit" 
                  disabled={sending}
                  className="w-full button shadow-xl shadow-indigo-600/20 py-4 font-bold flex items-center justify-center gap-3"
                >
                  {sending ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                  {sending ? 'TRANSMITTING...' : 'SEND BROADCAST'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Info size={120} /></div>
                 <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Communication Standards</h4>
                 <div className="space-y-4 relative z-10">
                    <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <CheckCircle2 size={20} className="text-indigo-400 shrink-0" />
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">Broadcasts are sent via in-app push and historical record logs for all active users.</p>
                    </div>
                    <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <Shield size={20} className="text-amber-400 shrink-0" />
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">Verify legal required notice periods before sending critical building-wide shutdowns.</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-6">Channel Legend</h3>
                 <div className="space-y-4">
                    {['Lease', 'Finance', 'Maintenance', 'Announcement', 'System'].map(t => {
                      const meta = getTypeMeta(t)
                      const Icon = meta.icon
                      return (
                        <div key={t} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center ${meta.color}`}>
                                <Icon size={16} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">{t}</span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-400">AUTOMATED</span>
                        </div>
                      )
                    })}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
