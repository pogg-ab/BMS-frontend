import React, { useEffect, useState, useRef } from 'react'
import {
  listTenants,
  registerTenant,
  listPendingApplications,
  getTenant,
  updateTenant,
  createDocument,
  listDocuments,
  verifyDocument,
  createAnnouncement,
  listAnnouncements,
  sendMessage,
  getMessages,
  createApplication,

} from '../api/tenants'
import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { listSites } from '../api/sites'
import { useToast } from '../components/ToastProvider'
import PageLayout from '../components/PageLayout'
import { FiUserPlus, FiEye } from 'react-icons/fi'

interface Tenant { id: string | number; name?: string; first_name?: string; last_name?: string; email?: string; phone?: string; status?: string; tin_number?: string; vat_reg_number?: string; created_at?: string }
// documents removed from UI — document interface omitted
interface Message { id: number; subject?: string; body?: string }

export default function Tenants() {
  const toast = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)

  const [showRegister, setShowRegister] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | number | ''>('')
  const [applications, setApplications] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [docsList, setDocsList] = useState<any[]>([])
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('ID')
  const [adminMessages, setAdminMessages] = useState<any[]>([])
  const [adminAnnouncements, setAdminAnnouncements] = useState<any[]>([])
  const [appBody, setAppBody] = useState('')
  const [appUnitId, setAppUnitId] = useState('')
  const [appBuildingId, setAppBuildingId] = useState<string | number>('')
  const [appMoveInDate, setAppMoveInDate] = useState('')
  // accordion state
  const [openDocs, setOpenDocs] = useState(true)
  const [openAnnouncements, setOpenAnnouncements] = useState(false)
  const [openMessages, setOpenMessages] = useState(false)
  const [openApplications, setOpenApplications] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [announceTarget, setAnnounceTarget] = useState('all')
  const [announceBuildingId, setAnnounceBuildingId] = useState<string | number>('')
  const [announceSiteId, setAnnounceSiteId] = useState<string | number>('')
  const [msgSubject, setMsgSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  async function load() {
    setLoading(true)
    try {
      const res = await listTenants({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setTenants(list)
      // load buildings and sites for selects
      try { const bRes: any = await listBuildings({ page: 1, per_page: 200 }); const bList = Array.isArray(bRes) ? bRes : (bRes?.data || bRes || []); setBuildings(bList) } catch (e) { /* ignore */ }
      try { const sRes: any = await listSites({ page: 1, per_page: 200 }); const sList = Array.isArray(sRes) ? sRes : (sRes?.data || sRes || []); setSites(sList) } catch (e) { /* ignore */ }
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load tenants', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    try {
      await registerTenant({ first_name: firstName, last_name: lastName, email, password, phone })
      toast.addToast('Registered', 'success')
      setShowRegister(false)
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPhone('')
      load()
    } catch (err: any) {
      console.error(err)
      toast.addToast(err?.response?.data?.message || 'Register failed', 'error')
    }
  }

  async function openDetail(idOrTenant: number | string | Tenant) {
    const isObj = typeof idOrTenant === 'object'
    const id = isObj ? (idOrTenant as Tenant).id : idOrTenant
    try {
      let d: any = null
      if (isObj) {
        d = idOrTenant as Tenant
        setDetailTenant(d)
      } else {
        d = await getTenant(id)
        setDetailTenant(d)
      }

      // load related lists (best-effort)
      try { const msgs = await getMessages(id); setMessages(Array.isArray(msgs) ? msgs : (msgs?.data || msgs || [])) } catch { setMessages([]) }
      // announcements removed from UI
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load tenant', 'error')
    }
  }

  // document upload/verify removed from tenant modal

  // --- Admin actions on the Tenants page (not in detail modal) ---
  async function handleUploadForSelected(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenantId) { toast.addToast('Select tenant first', 'error'); return }
    if (!docFile) { toast.addToast('Select file', 'error'); return }
    const fd = new FormData()
    fd.append('tenant_id', String(selectedTenantId))
    fd.append('type', String(docType || 'ID'))
    fd.append('file', docFile)
    try {
      // Debug: list FormData entries to confirm payload
      try {
        for (const [k, v] of (fd as any).entries()) {
          // file objects will appear as File; log name for clarity
          if (v instanceof File) console.debug('FormData', k, v.name, v.type, v.size)
          else console.debug('FormData', k, v)
        }
      } catch (err) { console.debug('Could not enumerate FormData entries', err) }
      console.debug('upload document for tenant', selectedTenantId, 'file:', docFile.name)
      const res = await createDocument(fd)
      toast.addToast('Document uploaded', 'success')
      // refresh list for selected tenant
      try { await handleListDocs() } catch { /* ignore */ }
      return res
    } catch (e: any) {
      console.error('Upload error', e)
      const server = e?.response?.data
      let msg = e?.message || 'Upload failed'
      try {
        if (server) {
          if (Array.isArray(server?.message)) msg = server.message.join('; ')
          else if (typeof server?.message === 'string') msg = server.message
          else if (server?.message) msg = JSON.stringify(server.message)
          else msg = JSON.stringify(server)
        }
      } catch { /* ignore */ }
      toast.addToast(msg, 'error')
    }
  }

  async function handleListDocs() {
    try {
      // If a tenant is selected, filter by tenant_id; otherwise fetch all documents
      if (selectedTenantId) console.debug('Listing documents for tenant (tenant_id)', selectedTenantId)
      else console.debug('Listing all documents (no tenant filter)')
      const params = selectedTenantId ? { tenant_id: selectedTenantId } : undefined
      const res: any = await listDocuments(params)
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      console.debug('Documents list response', list)
      setDocsList(list || [])
    } catch (e: any) { console.error(e); toast.addToast('Failed to list documents', 'error') }
  }

  async function handleGetMessages() {
    if (!selectedTenantId) { toast.addToast('Select tenant first', 'error'); return }
    try {
      const res = await getMessages(selectedTenantId)
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setAdminMessages(list)
    } catch (e: any) { console.error(e); toast.addToast('Failed to load messages', 'error') }
  }

  async function handleListAnnouncements() {
    try {
      const res = await listAnnouncements({})
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setAdminAnnouncements(list)
    } catch (e: any) { console.error(e); toast.addToast('Failed to load announcements', 'error') }
  }



  // Verify a single document by id (used from the documents list)
  async function handleVerifyDocument(id: string | number) {
    try {
      await verifyDocument(id, { action: 'verify' })
      toast.addToast('Document verified', 'success')
      // refresh list to reflect verification state
      try { await handleListDocs() } catch { /* ignore */ }
    } catch (e: any) {
      console.error('Verify failed', e)
      const server = e?.response?.data
      let msg = e?.message || 'Verify failed'
      try {
        if (server) {
          if (Array.isArray(server?.message)) msg = server.message.join('; ')
          else if (typeof server?.message === 'string') msg = server.message
          else if (server?.message) msg = JSON.stringify(server.message)
          else msg = JSON.stringify(server)
        }
      } catch { /* ignore */ }
      toast.addToast(msg, 'error')
    }
  }

  async function handleListPendingApps() {
    try {
      const res = await listPendingApplications()
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setApplications(list)
    } catch (e: any) { console.error(e); toast.addToast('Failed to load applications', 'error') }
  }

  async function handleCreateApplication(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenantId) { toast.addToast('Select tenant first', 'error'); return }
    if (appUnitId) {
      const unit = units.find(u => String(u.id) === String(appUnitId))
      const status = (unit?.status || '').toString().toLowerCase()
      if (unit && !['vacant', 'available', 'free', 'empty', 'unoccupied', ''].includes(status)) {
        toast.addToast('Selected unit is not vacant - choose another unit', 'error')
        return
      }
    }
    try {
      const payload: any = { tenant_id: String(selectedTenantId) }
      if (appUnitId) payload.unit_id = String(appUnitId)
      if (appBuildingId) payload.building_id = appBuildingId
      if (appMoveInDate) payload.move_in_date = appMoveInDate
      if (appBody) payload.details = appBody
      console.debug('create application payload', payload)
      await createApplication(payload)
      toast.addToast('Application created', 'success')
      setAppBody('')
      setAppUnitId('')
      setAppBuildingId('')
      setAppMoveInDate('')
    } catch (e: any) {
      console.error('Create application error', e)
      const server = e?.response?.data
      let msg = e?.message || 'Create application failed'
      try {
        if (server) {
          if (Array.isArray(server?.message)) msg = server.message.join('; ')
          else if (typeof server?.message === 'string') msg = server.message
          else if (server?.message) msg = JSON.stringify(server.message)
          else msg = JSON.stringify(server)
        }
      } catch { /* ignore */ }
      toast.addToast(msg, 'error')
    }
  }

  useEffect(() => {
    // load units when a building is selected for application
    async function loadUnits() {
      if (!appBuildingId) { setUnits([]); return }
      try {
        const res: any = await listUnits({ building_id: appBuildingId, page: 1, per_page: 200 })
        const list = Array.isArray(res) ? res : (res?.data || res || [])
        setUnits(list)
      } catch (err) { console.error(err); setUnits([]) }
    }
    loadUnits()
  }, [appBuildingId])

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = {
        title: announceTitle,
        message: announceMessage,
        target: announceTarget,
      }
      if (announceBuildingId) payload.building_id = announceBuildingId
      if (announceSiteId) payload.site_id = announceSiteId
      await createAnnouncement(payload)
      toast.addToast('Announcement created', 'success')
      setAnnounceTitle(''); setAnnounceMessage(''); setAnnounceTarget('all'); setAnnounceBuildingId(''); setAnnounceSiteId('')
    } catch (e: any) { console.error(e); toast.addToast('Create announcement failed', 'error') }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTenantId) { toast.addToast('Select tenant first', 'error'); return }
    try {
      // API expects { tenant_id, content }
      const content = `${msgSubject ? msgSubject + "\n\n" : ''}${msgBody}`
      await sendMessage({ tenant_id: selectedTenantId, content })
      toast.addToast('Message sent', 'success')
      setMsgSubject(''); setMsgBody('')
    } catch (e: any) { console.error(e); toast.addToast('Send message failed', 'error') }
  }

  return (
    <PageLayout
      title="Tenants Portfolio"
      subtitle="Manage tenant lifecycles, applications, and documents"
      actions={
        <button onClick={() => setShowRegister(true)} className="button">
          <FiUserPlus className="mr-2" /> Register Tenant
        </button>
      }
    >
      <div className="space-y-6">

        {loading ? (<div className="flex justify-center py-12 text-slate-500">Loading tenants...</div>) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* Tenants table (left / main) */}
            <div className="xl:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4">Active Tenants</h3>
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Name</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Email</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {tenants.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{t.first_name || t.name}</td>
                        <td className="px-6 py-4 text-slate-600">{t.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {t.status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openDetail(t)} className="text-indigo-600 hover:text-indigo-900 px-3 py-1 flex items-center justify-end gap-1 ml-auto transition-colors">
                            <FiEye /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin actions card (right) */}
            <aside className="xl:col-span-1 space-y-6">

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Communications</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select tenant</label>
                  <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                    <option value="">-- context --</option>
                    {tenants.map(t => (<option key={t.id} value={String(t.id)}>{t.first_name || t.name}</option>))}
                  </select>
                </div>

                {/* Documents moved to a separate card below */}

                {/* Announcements moved below messages (rendered after messages) */}

                <form onSubmit={handleSendMessage}>
                  <label className="block text-sm text-gray-600 mb-1">Message</label>
                  <input placeholder="Subject" value={msgSubject} onChange={e => setMsgSubject(e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <textarea placeholder="Body" value={msgBody} onChange={e => setMsgBody(e.target.value)} className="w-full p-2 border rounded mb-2" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded">Send</button>
                    <button type="button" onClick={handleGetMessages} className="px-3 py-2 bg-white dark:bg-slate-800 border rounded">Load</button>
                  </div>
                </form>

                {adminMessages.length > 0 ? (
                  <div className="mt-3 text-sm">
                    <strong>Messages</strong>
                    <ul className="list-disc pl-6">
                      {adminMessages.map((m: any) => (
                        <li key={m.id} className="mb-2">
                          <div className="font-medium">{m.subject || ''}</div>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">{m.body || m.content || ''}</div>
                          <div className="text-xs text-gray-500">{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No messages loaded</div>
                )}
              </div>

              {/* Announcements accordion (moved below messages) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                <button type="button" onClick={() => { setOpenAnnouncements(s => !s); if (!openAnnouncements) handleListAnnouncements() }} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 flex items-center justify-between transition-colors">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Announcements</span>
                  <span className="text-xl text-slate-400 font-light leading-none">{openAnnouncements ? '−' : '+'}</span>
                </button>
                {openAnnouncements && (
                  <div className="p-3">
                    <form onSubmit={handleCreateAnnouncement} className="mb-3">
                      <div className="space-y-4">
                        <div>
                          <label className="form-label">Announcement Title</label>
                          <input value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)} placeholder="Title" className="form-input" required />
                        </div>
                        <div>
                          <label className="form-label">Target Audience</label>
                          <select value={announceTarget} onChange={e => setAnnounceTarget(e.target.value)} className="form-select">
                            <option value="all">All Users</option>
                            <option value="tenants">All Tenants</option>
                            <option value="contractors">All Contractors</option>
                            <option value="site">Specific Site</option>
                            <option value="building">Specific Building</option>
                          </select>
                        </div>
                        {announceTarget === 'site' && (
                          <div>
                            <label className="form-label">Select Site</label>
                            <select value={announceSiteId as string} onChange={e => setAnnounceSiteId(e.target.value)} className="form-select">
                              <option value="">-- select site --</option>
                              {sites.map(s => <option key={s.id} value={String(s.id)}>{s.name || s.title || s.id}</option>)}
                            </select>
                          </div>
                        )}
                        {announceTarget === 'building' && (
                          <div>
                            <label className="form-label">Select Building</label>
                            <select value={announceBuildingId as string} onChange={e => setAnnounceBuildingId(e.target.value)} className="form-select">
                              <option value="">-- select building --</option>
                              {buildings.map(b => (
                                <option key={b.id} value={String(b.id)}>{b.name || b.title || b.id}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div>
                          <label className="form-label">Message Content</label>
                          <textarea value={announceMessage} onChange={e => setAnnounceMessage(e.target.value)} placeholder="Message content..." className="form-input h-24 pt-2" required />
                        </div>
                        <button type="submit" className="button w-full">Broadcast Announcement</button>
                      </div>
                    </form>

                    {adminAnnouncements.length > 0 && (
                      <div className="mt-3 text-sm">
                        <strong>Announcements</strong>
                        <ul className="list-disc pl-6">
                          {adminAnnouncements.map(a => (<li key={a.id}>{a.title} — {a.message}</li>))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Documents list moved to the Documents card below */}

              {/* applications moved to separate card below */}
            </aside>

            {/* Documents (separate card) */}
            <div className="md:col-span-3 bg-white dark:bg-slate-800 p-4 rounded shadow-sm mb-4">
              <h3 className="font-semibold mb-3">Documents</h3>
              <div className="mb-3">
                <button onClick={handleListDocs} className="px-3 py-2 bg-white dark:bg-slate-800 border rounded hover:bg-gray-50 dark:bg-slate-900">List Documents</button>
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Select tenant</label>
                <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">-- select tenant --</option>
                  {tenants.map(t => (<option key={t.id} value={String(t.id)}>{t.first_name || t.name} ({t.email})</option>))}
                </select>
              </div>
              <form onSubmit={handleUploadForSelected} className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Upload document</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <select value={docType} onChange={e => setDocType(e.target.value)} className="p-2 border rounded">
                    <option value="ID">ID</option>
                    <option value="Passport">Passport</option>
                    <option value="Contract">Contract</option>
                    <option value="Primary ID">Primary ID</option>
                  </select>
                  <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} className="col-span-2 md:col-span-1" />
                  <div className="md:col-span-3">
                    <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Upload</button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Required: tenant_id, type, file (multipart/form-data)</p>
              </form>
              {/* Manual Verify-by-ID form removed; use per-document Verify buttons in the list below */}
              {docsList.length > 0 && (
                <div className="mt-3 text-sm">
                  <strong>Documents</strong>
                  <ul className="list-disc pl-6">
                    {docsList.map(d => {
                      const fileUrl = d?.file_url || d?.fileUrl || d?.url || ''
                      const baseUrl = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
                      const href = fileUrl && fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : fileUrl
                      return (
                        <li key={d.id} className="mb-1">
                          <span className="font-medium">{d.type || d.name || 'Document'}</span>
                          {d.verified ? (
                            <span className="ml-2 text-xs text-green-700">(verified)</span>
                          ) : (
                            <>
                              <span className="ml-2 text-xs text-yellow-700">(unverified)</span>
                              <button type="button" onClick={() => handleVerifyDocument(d.id)} className="ml-2 text-sm px-2 py-1 bg-green-600 text-white rounded">Verify</button>
                            </>
                          )}
                          {href ? (
                            <a className="ml-2 text-blue-600 hover:underline" href={href} target="_blank" rel="noreferrer">View</a>
                          ) : null}
                          <div className="text-xs text-gray-500">{d.created_at ? new Date(d.created_at).toLocaleString() : ''}</div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Applications (separate card) */}
            <div className="md:col-span-3 bg-white dark:bg-slate-800 p-4 rounded shadow-sm">
              <h3 className="font-semibold mb-3">Applications</h3>
              <div className="mb-3">
                <button onClick={handleListPendingApps} className="px-3 py-2 bg-white dark:bg-slate-800 border rounded hover:bg-gray-50 dark:bg-slate-900">List pending applications</button>
              </div>
              <div>
                {applications.length > 0 ? (
                  <div className="text-sm">
                    <strong>Pending Applications</strong>
                    <ul className="list-disc pl-6">
                      {applications.map(a => (<li key={a.id}>{a.id} — {a.email || a.name}</li>))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No pending applications loaded</div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Create Application</h4>
                <form onSubmit={handleCreateApplication}>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Select tenant</label>
                      <select value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)} className="form-select">
                        <option value="">-- select tenant --</option>
                        {tenants.map(t => (<option key={t.id} value={String(t.id)}>{t.first_name || t.name} ({t.email})</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Building</label>
                      <div className="flex gap-2">
                        <select value={appBuildingId as string} onChange={e => setAppBuildingId(e.target.value)} className="form-select flex-1">
                          <option value="">-- optional --</option>
                          {buildings.map(b => (<option key={b.id} value={String(b.id)}>{b.name || b.title || b.id}</option>))}
                        </select>
                        <button type="button" onClick={async () => {
                          try {
                            const res: any = await listUnits({ building_id: appBuildingId, page: 1, per_page: 200 })
                            const list = Array.isArray(res) ? res : (res?.data || res || [])
                            console.debug('loaded units (manual):', list)
                            setUnits(list)
                          } catch (err) { console.error('failed load units (manual)', err); toast.addToast('Failed to load units', 'error') }
                        }} className="px-3 py-2 bg-white dark:bg-slate-800 border rounded">Load units</button>
                      </div>
                      {appBuildingId && units.length === 0 && (
                        <div className="text-xs text-gray-500 mt-1">No units found for selected building (try "Load units")</div>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Unit</label>
                      <select value={appUnitId} onChange={e => setAppUnitId(e.target.value)} className="form-select">
                        <option value="">-- optional --</option>
                        {units.map(u => {
                          const status = (u.status || '').toString()
                          const available = ['vacant', 'available', 'free', 'empty', 'unoccupied'].includes(status.toLowerCase()) || status === ''
                          const label = `${u.unit_number || u.unit_number || u.name || u.number || u.id}${status ? ' — ' + status : ''}`
                          return (<option key={u.id} value={String(u.id)} disabled={!available}>{label}</option>)
                        })}
                      </select>
                      <div className="text-xs text-gray-500 mt-1">Occupied units are disabled in the list.</div>
                    </div>
                    <div>
                      <label className="form-label">Move-in date</label>
                      <input type="date" value={appMoveInDate} onChange={e => setAppMoveInDate(e.target.value)} className="form-input" />
                    </div>
                    <div>
                      <label className="form-label">Additional Details</label>
                      <textarea placeholder="Details (optional)" value={appBody} onChange={e => setAppBody(e.target.value)} className="form-input h-24 pt-2" />
                    </div>
                    <button type="submit" className="button w-full">Create Application</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Register modal */}
        {showRegister && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">Register Tenant</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input required placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input required placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input required placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="form-input" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowRegister(false)} className="px-3 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Register</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tenant detail simple modal */}
        {detailTenant && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center py-10 z-50">
            <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Tenant #{detailTenant.id} - {detailTenant.first_name || detailTenant.name}</h3>
                <button onClick={() => setDetailTenant(null)} className="px-2 py-1 border rounded">Close</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>ID:</strong> {detailTenant.id}</p>
                  <p><strong>First name:</strong> {detailTenant.first_name}</p>
                  <p><strong>Last name:</strong> {detailTenant.last_name}</p>
                  <p><strong>Email:</strong> {detailTenant.email}</p>
                </div>
                <div>
                  <p><strong>Phone:</strong> {detailTenant.phone}</p>
                  <p><strong>TIN:</strong> {detailTenant.tin_number || '-'}</p>
                  <p><strong>VAT Reg:</strong> {detailTenant.vat_reg_number || '-'}</p>
                  <p><strong>Status:</strong> {detailTenant.status || '-'}</p>
                  <p className="text-sm text-gray-500"><strong>Created:</strong> {detailTenant.created_at || '-'}</p>
                </div>
              </div>

              <hr className="my-4" />
              <div>
                <div className="mt-2 space-y-2">
                  {messages.map(m => (<div key={m.id} className="p-2 border rounded"><strong>{m.subject}</strong><div>{m.body}</div></div>))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
