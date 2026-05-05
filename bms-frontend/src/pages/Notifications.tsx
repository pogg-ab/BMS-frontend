import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { useNotification } from '../contexts/NotificationContext'
import * as notifApi from '../api/notifications'
import * as buildingsApi from '../api/buildings'
import * as sitesApi from '../api/sites'
import { Bell, Megaphone, CheckCircle2, Trash2, Mail, DollarSign, Wrench, Shield, Clock, Send, Info, Search, Filter, ChevronDown, Building2, MapPin, Globe, Users } from 'lucide-react'

type Tab = 'inbox' | 'announce'
type TargetType = 'everyone' | 'building' | 'site'

const TYPES = ['All', 'Lease', 'Finance', 'Maintenance', 'Announcement', 'System']
const BATCH_SIZE = 20

export default function Notifications() {
  const toast = useToast()
  const { unreadCount, refreshUnreadCount } = useNotification()
  const [tab, setTab] = useState<Tab>('inbox')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)

  // Announce Form
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Targeted Broadcasting
  const [targetType, setTargetType] = useState<TargetType>('everyone')
  const [buildings, setBuildings] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState('')

  // Load notifications
  useEffect(() => {
    if (tab === 'inbox') loadNotifications()
  }, [tab])

  // Real-time sync: refresh when unreadCount changes
  useEffect(() => {
    if (tab === 'inbox') loadNotifications()
  }, [unreadCount])

  // Load buildings & sites for targeting
  useEffect(() => {
    if (tab === 'announce') {
      loadBuildingsAndSites()
    }
  }, [tab])

  async function loadBuildingsAndSites() {
    try {
      const [bData, sData] = await Promise.all([
        buildingsApi.listBuildings({ page: 1, per_page: 200 }),
        sitesApi.listSites(),
      ])
      setBuildings(Array.isArray(bData) ? bData : bData?.data || [])
      setSites(Array.isArray(sData) ? sData : sData?.data || [])
    } catch (e) {
      console.error('Failed to load buildings/sites', e)
    }
  }

  async function loadNotifications() {
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
      toast.addToast('All notifications marked as read', 'success')
      loadNotifications()
      refreshUnreadCount()
    } catch (e: any) {
      toast.addToast('Failed to update', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await notifApi.deleteNotification(id)
      toast.addToast('Notification removed', 'success')
      loadNotifications()
      refreshUnreadCount()
    } catch (e: any) {
      toast.addToast('Failed to delete', 'error')
    }
  }

  async function handleNotificationClick(n: any) {
    // Mark as read if it is not read yet
    if (!n.is_read) {
      try {
        await notifApi.markAsRead(n.id)
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item))
        refreshUnreadCount()
      } catch (e) {
        console.error('Failed to mark as read', e)
      }
    }

    // Navigate or expand based on type
    const type = n.type?.toLowerCase()
    if (type === 'maintenance') {
      navigate('/maintenance')
    } else if (type === 'finance') {
      navigate('/finance')
    } else if (type === 'lease') {
      navigate('/leases')
    } else {
      // Toggle expansion for announcements and system notifications
      setExpandedId(prev => prev === n.id ? null : n.id)
    }
  }

  async function handleSendAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const dto: any = { title: annTitle, message: annMessage }
      if (targetType === 'building' && selectedBuildingId) dto.buildingId = selectedBuildingId
      if (targetType === 'site' && selectedSiteId) dto.siteId = selectedSiteId
      const result = await notifApi.sendAnnouncement(dto)
      const targetLabel = targetType === 'everyone' ? 'all users' : targetType === 'building' ? 'building tenants' : 'site tenants'
      toast.addToast(`Broadcast sent to ${result.sent_count || 0} ${targetLabel}`, 'success')
      setAnnTitle(''); setAnnMessage('')
      setTargetType('everyone'); setSelectedBuildingId(''); setSelectedSiteId('')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Broadcast failed', 'error')
    } finally { setSending(false) }
  }

  // Filtering logic
  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (showUnreadOnly) result = result.filter(n => !n.is_read)
    if (filterType !== 'All') result = result.filter(n => n.type?.toLowerCase() === filterType.toLowerCase())
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => n.title?.toLowerCase().includes(q) || n.message?.toLowerCase().includes(q))
    }
    return result
  }, [notifications, showUnreadOnly, filterType, searchQuery])

  const visibleNotifications = filteredNotifications.slice(0, visibleCount)
  const hasMore = visibleCount < filteredNotifications.length
  const localUnread = notifications.filter(n => !n.is_read).length

  function getTypeMeta(type: string) {
    const t = type?.toLowerCase()
    if (t === 'lease') return { icon: Mail, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' }
    if (t === 'finance') return { icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
    if (t === 'maintenance') return { icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    if (t === 'announcement') return { icon: Megaphone, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' }
    if (t === 'system') return { icon: Shield, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' }
    return { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
  }

  function getTargetIcon(t: TargetType) {
    if (t === 'building') return Building2
    if (t === 'site') return MapPin
    return Globe
  }

  return (
    <PageLayout
      title="Communication Hub"
      subtitle="Manage notifications, alerts, and broadcast announcements across your portfolio."
      actions={
        <div className="flex overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setTab('inbox')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'inbox' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Bell size={14} className="sm:w-4 sm:h-4" /> Inbox {localUnread > 0 && <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] flex items-center justify-center animate-pulse">{localUnread}</span>}
          </button>
          <button
            onClick={() => setTab('announce')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'announce' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Megaphone size={14} className="sm:w-4 sm:h-4" /> Broadcast
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-20 max-w-5xl mx-auto px-1 sm:px-0">

        {tab === 'inbox' ? (
          <div className="space-y-5">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
              <div className="flex gap-2 items-center justify-end">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${showUnreadOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                >
                  Unread Only
                </button>
                <button
                  onClick={handleMarkAllRead}
                  disabled={localUnread === 0}
                  className="px-3 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all disabled:opacity-30 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                >
                  <CheckCircle2 size={14} /> <span className="hidden xs:inline">Mark All Read</span><span className="xs:hidden">Mark Read</span>
                </button>
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TYPES.map(t => {
                const isActive = filterType === t
                const meta = t === 'All' ? { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' } : getTypeMeta(t)
                return (
                  <button
                    key={t}
                    onClick={() => { setFilterType(t); setVisibleCount(BATCH_SIZE) }}
                    className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${isActive ? `${meta.bg} ${meta.color} ring-2 ring-offset-1 ring-indigo-400` : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-slate-600'}`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Notification List */}
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 animate-pulse flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <Mail size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4 opacity-50" />
                <p className="font-bold text-slate-500 uppercase tracking-widest">
                  {searchQuery || filterType !== 'All' || showUnreadOnly ? 'No matching notifications' : 'Inbox is empty'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery || filterType !== 'All' || showUnreadOnly ? 'Try adjusting your filters.' : 'No new notifications detected.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {visibleNotifications.map((n) => {
                  const meta = getTypeMeta(n.type)
                  const Icon = meta.icon
                  return (
                    <div key={n.id} onClick={() => handleNotificationClick(n)} className={`group bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all flex items-start gap-4 cursor-pointer hover:shadow-md ${n.is_read ? 'border-slate-100 dark:border-slate-700 opacity-60 hover:opacity-100' : 'border-indigo-100 dark:border-indigo-900/40 shadow-sm'}`}>
                      <div className={`w-11 h-11 rounded-xl ${meta.bg} flex items-center justify-center ${meta.color} shrink-0`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{n.title}</h4>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                        </div>
                        <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${expandedId === n.id ? '' : 'line-clamp-2'}`}>{n.message}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={11} /> {new Date(n.created_at).toLocaleString()}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${meta.bg} ${meta.color}`}>{n.type}</span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + BATCH_SIZE)}
                    className="w-full py-4 text-sm font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronDown size={16} /> Load More ({filteredNotifications.length - visibleCount} remaining)
                  </button>
                )}

                {/* Results count */}
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest py-2">
                  Showing {visibleNotifications.length} of {filteredNotifications.length} notifications
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ===== BROADCAST TAB ===== */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast Announcement</h3>
                  <p className="text-sm text-slate-500 font-medium">Notify tenants instantly via Email, Push, and In-App.</p>
                </div>
              </div>

              <form onSubmit={handleSendAnnouncement} className="space-y-5">
                {/* Target Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Audience</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['everyone', 'building', 'site'] as TargetType[]).map(t => {
                      const Icon = getTargetIcon(t)
                      const labels = { everyone: 'Everyone', building: 'Building', site: 'Site' }
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setTargetType(t); setSelectedBuildingId(''); setSelectedSiteId('') }}
                          className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            targetType === t
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <Icon size={16} /> {labels[t]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Building Selector */}
                {targetType === 'building' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Building</label>
                    <select
                      value={selectedBuildingId}
                      onChange={e => setSelectedBuildingId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">-- Select a building --</option>
                      {buildings.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Site Selector */}
                {targetType === 'site' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Site</label>
                    <select
                      value={selectedSiteId}
                      onChange={e => setSelectedSiteId(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    >
                      <option value="">-- Select a site --</option>
                      {sites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Subject</label>
                  <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} required placeholder="e.g. Scheduled Water Maintenance" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Message</label>
                  <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} required rows={5} placeholder="Describe the announcement details..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none" />
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

            {/* Right Column: Info Panel */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Info size={120} /></div>
                <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">Delivery Channels</h4>
                <div className="space-y-3 relative z-10">
                  {[
                    { icon: Bell, label: 'In-App Notification', desc: 'Appears instantly in the notification feed.' },
                    { icon: Mail, label: 'Email (Gmail SMTP)', desc: 'Branded HTML email sent to every target.' },
                    { icon: Send, label: 'Push Notification', desc: 'Real-time push via Firebase Cloud Messaging.' },
                  ].map(ch => (
                    <div key={ch.label} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <ch.icon size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-white">{ch.label}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{ch.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-5">Channel Legend</h3>
                <div className="space-y-3">
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
