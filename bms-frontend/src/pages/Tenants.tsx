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
  createAndVerifyFromTenant,
} from '../api/tenants'
import * as financeApi from '../api/finance'
import api from '../api/axios'

import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { listSites } from '../api/sites'
import { useToast } from '../components/ToastProvider'
import PageLayout from '../components/PageLayout'
import StatusBadge from '../components/StatusBadge'
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreVertical,
  MoreHorizontal,
  Edit3,
  Building2,
  Info,
  CreditCard,
  MessageCircle,
  FileText,
  UserPlus,
  MapPin,
  Shield,
  ArrowRight,
  Calendar,
  Briefcase,
  Hash,
  Clock,
  Eye
} from 'lucide-react'


interface Tenant { id: string | number; name?: string; first_name?: string; last_name?: string; email?: string; phone?: string; status?: string; tin_number?: string; vat_reg_number?: string; created_at?: string; tenant_type?: string; profile_image?: string }
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

  const [tenantType, setTenantType] = useState('personal')
  const [idImage, setIdImage] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [licenseImage, setLicenseImage] = useState('')
  const [tinNumber, setTinNumber] = useState('')
  const [vatRegNumber, setVatRegNumber] = useState('')
  const [profileImage, setProfileImage] = useState('')

  const idImageRef = useRef<HTMLInputElement>(null)
  const licenseImageRef = useRef<HTMLInputElement>(null)
  const profileImageRef = useRef<HTMLInputElement>(null)

  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'ledger' | 'messages' | 'documents'>('info')
  const [ledger, setLedger] = useState<any[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | number>('')
  const [showFullModal, setShowFullModal] = useState(false)
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
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone,
        tenant_type: tenantType,
      }
      // Always attach optional documentation fields if provided
      if (idImage) payload.id_image = idImage
      if (licenseImage) payload.license_image = licenseImage
      if (profileImage) payload.profile_image = profileImage
      if (tinNumber) payload.tin_number = tinNumber
      if (vatRegNumber) payload.vat_reg_number = vatRegNumber
      if (detailedAddress) payload.detailed_address = detailedAddress
      await registerTenant(payload)
      toast.addToast('Registered', 'success')
      setShowRegister(false)
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPhone(''); setIdImage(''); setDetailedAddress(''); setLicenseImage(''); setTinNumber(''); setVatRegNumber(''); setProfileImage(''); setTenantType('personal')
      load()
    } catch (err: any) {
      console.error(err)
      toast.addToast(err?.response?.data?.message || 'Register failed', 'error')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload/image?type=tenants', fd)
      if (res.data?.path) setter(res.data.path)
    } catch {
      toast.addToast('Image upload failed', 'error')
    }
  }

  async function openDetail(idOrTenant: number | string | Tenant) {
    const isObj = typeof idOrTenant === 'object'
    const id = isObj ? (idOrTenant as Tenant).id : idOrTenant
    try {
      // Always fetch full tenant details from the API so fields like
      // TIN, VAT, lease and unit are populated even if the list item
      // provided a lightweight object.
      const d: any = await getTenant(id)
      setDetailTenant(d)
      setActiveDetailTab('info')

      // load related lists (best-effort)
      try { const msgs = await getMessages(id); setMessages(Array.isArray(msgs) ? msgs : (msgs?.data || msgs || [])) } catch { setMessages([]) }
      try {
        setLedgerLoading(true)
        const lRes = await financeApi.getTenantLedger(String(id))
        setLedger(lRes)
      } catch { setLedger([]) } finally { setLedgerLoading(false) }
      try { await handleListDocs() } catch { setDocsList([]) }
    } catch (e: any) {
      console.error(e)
      // Fallback: if a lightweight object was passed, display it
      if (isObj) setDetailTenant(idOrTenant as Tenant)
      toast.addToast('Failed to load tenant details (showing basic info)', 'warning')
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
      // If tenantId overridden, use it; else use selectedTenantId
      const tenantId = arguments[0] || selectedTenantId
      if (tenantId) console.debug('Listing documents for tenant (tenant_id)', tenantId)
      else console.debug('Listing all documents (no tenant filter)')
      const params = tenantId ? { tenant_id: tenantId } : undefined
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
      await verifyDocument(id, { verified: true })
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

  // Verify a tenant-stored image (profile/license/id) by creating a document record and auto-verifying it
  async function handleVerifyTenantImage(type: string) {
    if (!detailTenant || !detailTenant.id) { toast.addToast('Tenant not loaded', 'error'); return }
    try {
      await createAndVerifyFromTenant(detailTenant.id, { type })
      toast.addToast('Document verified', 'success')
      try { await handleListDocs(detailTenant.id) } catch { /* ignore */ }
    } catch (e: any) {
      console.error('Verify tenant image failed', e)
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

  // compute lease value to display (try multiple possible fields)
  const leaseAmountRaw = (
    (detailTenant as any)?.lease?.monthly_amount ??
    (detailTenant as any)?.lease?.rent ??
    (detailTenant as any)?.lease?.amount ??
    (detailTenant as any)?.unit?.rent_price ??
    (detailTenant as any)?.rent_price ??
    (detailTenant as any)?.monthly_rent ??
    null
  )
  const formattedLease = leaseAmountRaw ? `${new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(Number(leaseAmountRaw))} / mo` : '—'

  return (
    <PageLayout
      title="Tenant Management"
      subtitle={`Curating ${tenants.length.toLocaleString()} active lease agreements across 14 properties.`}
      actions={
        <button onClick={() => setShowRegister(true)} className="button flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">
          <Plus size={18} /> Register Tenant
        </button>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-medium animate-pulse">Curation in progress...</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${selectedTenantId ? 'xl:grid-cols-12' : ''} gap-10 transition-all duration-500 items-start`}>
            
            {/* Tenant List Section */}
            <div className={`${selectedTenantId ? 'xl:col-span-8' : 'xl:col-span-12'}`}>

              <div className="grid grid-cols-12 px-10 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-5">Tenant Identity</div>
                <div className="col-span-3">Building</div>
                <div className="col-span-2 text-center ml-[-40px]">Lease Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="space-y-4">
                {tenants.map(t => {
                  const isSelected = String(t.id) === String(selectedTenantId)
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTenantId('')
                        } else {
                          setSelectedTenantId(t.id)
                          openDetail(t)
                        }
                      }}
                      className={`group grid grid-cols-12 items-center px-10 py-7 rounded-[32px] border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200 dark:shadow-none' 
                          : 'bg-white/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 shadow-sm hover:shadow-xl'
                      }`}
                    >
                      {/* Selection Indigo Bar */}
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>}

                      {/* Identity */}
                      <div className="col-span-5 flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[24px] overflow-hidden flex items-center justify-center shadow-sm">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${t.first_name}+${t.last_name || ''}&background=f1f5f9&color=64748b&bold=true`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                            {t.first_name} {t.last_name || ''}
                          </div>
                          <div className="text-xs font-bold text-slate-400 flex items-center gap-2 mt-1 lowercase">
                            <Mail size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /> {t.email}
                          </div>
                        </div>
                      </div>

                      {/* Building */}
                      <div className="col-span-3">
                        <div className="text-sm font-black text-slate-700 dark:text-slate-300">{t.building?.name || t.building_name || t.building || '—'}</div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex justify-center ml-[-40px]">
                        <StatusBadge status={t.status || 'ACTIVE'} size="md" />
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-3">
                        <button className="p-3.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 rounded-2xl transition-all">
                          <Phone size={20} />
                        </button>
                        <button className={`p-3.5 rounded-2xl transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}>
                          {isSelected ? <Plus size={20} className="rotate-45" /> : <MoreVertical size={20} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selection Sidebar (Pixel-Perfect Match & Spacious Fix) */}
            {selectedTenantId && detailTenant && (
              <div className="xl:col-span-4 animate-in slide-in-from-right duration-500">
                <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700/60 p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)]">
                  
                  {/* Sidebar Header Area */}
                  <div className="relative mb-8">
                    <div className="absolute top-2 right-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-amber-100 dark:border-amber-900/50 z-10">
                      Due in 14 Days
                    </div>
                    <div className="w-36 h-36 mx-auto rounded-[35px] overflow-hidden border-4 border-slate-50 dark:border-slate-900 shadow-lg">
                      <img
                        src={
                          detailTenant.profile_image
                            ? `http://localhost:3000${detailTenant.profile_image}`
                            : `https://ui-avatars.com/api/?name=${detailTenant.first_name}+${detailTenant.last_name || ''}&background=6366f1&color=fff&size=512&bold=true`
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      {detailTenant.first_name} {detailTenant.last_name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center justify-center gap-2">
                      <span>Individual</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      <span>Professional</span>
                    </p>
                  </div>

                  {/* Property Identity Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Building</div>
                           <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{detailTenant?.building?.name || detailTenant?.building_name || detailTenant?.building || '—'}</div>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[24px] border border-slate-100 dark:border-slate-800">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Unit</div>
                       <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{detailTenant?.unit_number || detailTenant?.unit?.unit_number || detailTenant?.unit?.name || '—'}</div>
                    </div>
                  </div>

                  {/* Contact Channels */}
                  <div className="space-y-5 mb-8">
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 transition-all duration-300">
                        <Mail size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Email</div>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-200 truncate">{detailTenant.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 transition-all duration-300">
                        <Phone size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</div>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-200 truncate">{detailTenant.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 transition-all duration-300">
                        <CreditCard size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lease Value</div>
                        <div className="text-xs font-black text-slate-900 dark:text-slate-200 truncate">{formattedLease}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setShowFullModal(true)}
                      className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all"
                    >
                      View Full Profile
                    </button>
                    <button className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">
                      Send Notice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Register Tenant Modal */}
        {showRegister && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-[16px] p-6 w-full max-w-full md:max-w-xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.10)] border border-white dark:border-slate-700/50 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Register New Tenant</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Initialize a new lease agreement profile.</p>
                </div>
                <button onClick={() => setShowRegister(false)} className="p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">
                  <ArrowRight className="rotate-45 text-slate-400" size={20} />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input required placeholder="Helena" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input required placeholder="Thorne" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input required type="email" placeholder="helena.thorne@example.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input required placeholder="+1 234 567 890" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tenant Type</label>
                    <select value={tenantType} onChange={e => setTenantType(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none cursor-pointer">
                      <option value="personal">Individual Tenant</option>
                      <option value="organizational">Corporate Entity</option>
                    </select>
                  </div>
                </div>

                

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <input required type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" />
                </div>

                {/* Conditional Fields based on Tenant Type */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={12} className="text-indigo-500" /> Professional Documentation
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ID / Passport</label>
                      <div onClick={() => idImageRef.current?.click()} className="w-full h-12 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-all overflow-hidden">
                        <input type="file" accept="image/*" ref={idImageRef} onChange={e => handleImageUpload(e, setIdImage)} className="hidden" />
                        {idImage ? (<img src={`http://localhost:3000${idImage}`} className="h-full w-full object-cover rounded-xl" />) : (<Plus size={18} className="text-slate-300" />)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">License</label>
                      <div onClick={() => licenseImageRef.current?.click()} className="w-full h-12 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                        <input type="file" accept="image/*" ref={licenseImageRef} onChange={e => handleImageUpload(e, setLicenseImage)} className="hidden" />
                        {licenseImage ? (<img src={`http://localhost:3000${licenseImage}`} className="h-full w-full object-cover rounded-xl" />) : (<Plus size={16} className="text-slate-300" />)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Profile</label>
                      <div onClick={() => profileImageRef.current?.click()} className="w-full h-12 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden">
                        <input type="file" accept="image/*" ref={profileImageRef} onChange={e => handleImageUpload(e, setProfileImage)} className="hidden" />
                        {profileImage ? (<img src={`http://localhost:3000${profileImage}`} className="h-full w-full object-cover rounded-xl" />) : (<Plus size={16} className="text-slate-300" />)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">TIN Number</label>
                      <input placeholder="TIN Number" value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">VAT Number</label>
                      <input placeholder="VAT Reg #" value={vatRegNumber} onChange={e => setVatRegNumber(e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detailed Address</label>
                    <input placeholder="Suite / House #" value={detailedAddress} onChange={e => setDetailedAddress(e.target.value)} className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                  <button type="button" onClick={() => setShowRegister(false)} className="px-8 py-3.5 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all">Cancel</button>
                  <button type="submit" className="px-8 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all">Initialize Tenant</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Profile Detail Modal */}
        {showFullModal && detailTenant && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 animate-in zoom-in duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-[50px] w-full max-w-5xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border border-white/20 dark:border-slate-700/50 overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Profile Header Block */}
              <div className="relative h-64 bg-indigo-600 dark:bg-indigo-950 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.9),rgba(79,70,229,0.95))]"></div>
                <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-10 flex items-end justify-between">
                  <div className="flex items-end gap-8">
                    <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-2xl border-4 border-white/20 -mb-20">
                      <img
                        src={
                          detailTenant.profile_image
                            ? `http://localhost:3000${detailTenant.profile_image}`
                            : `https://ui-avatars.com/api/?name=${detailTenant.first_name}+${detailTenant.last_name || ''}&background=f1f5f9&color=4f46e5&size=512&bold=true`
                        }
                        className="w-full h-full object-cover rounded-[32px]"
                      />
                    </div>
                    <div className="pb-2">
                       <h2 className="text-4xl font-black text-white tracking-tight">{detailTenant.first_name} {detailTenant.last_name}</h2>
                       <div className="flex items-center gap-3 mt-1.5">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/10">ID: {detailTenant.id}</span>
                          <span className="px-3 py-1 bg-emerald-400/20 backdrop-blur-md rounded-lg text-[10px] font-black text-emerald-300 uppercase tracking-widest border border-emerald-400/20">Active Lease</span>
                       </div>
                    </div>
                  </div>
                    <button onClick={() => setShowFullModal(false)} className="mb-2 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-[24px] border border-white/10 transition-all">
                      <Plus className="rotate-45" size={24} />
                    </button>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="px-10 mt-20 flex gap-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                {[
                  { id: 'info', icon: Info, label: 'Overview' },
                  { id: 'ledger', icon: CreditCard, label: 'Financial Ledger' },
                  { id: 'messages', icon: MessageCircle, label: 'Communication' },
                  { id: 'documents', icon: FileText, label: 'Documents' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                      activeDetailTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {activeDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
                  </button>
                ))}
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {activeDetailTab === 'info' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="lg:col-span-2 space-y-10">
                      <div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[.25em] mb-6 flex items-center gap-3">
                          <UserPlus size={14} className="text-indigo-500" /> Administrative Identity
                        </h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                           {[
                             { label: 'Primary Contact', value: detailTenant.phone },
                             { label: 'Official Email', value: detailTenant.email },
                             { label: 'Tenant Classification', value: detailTenant.tenant_type === 'personal' ? 'Individual / Residential' : 'Corporate / Commercial' },
                             { label: 'Tax Identification (TIN)', value: detailTenant.tin_number || 'Not Provided' },
                             { label: 'Registration Date', value: detailTenant.created_at ? new Date(detailTenant.created_at).toLocaleDateString() : 'Legacy Entry' },
                             { label: 'VAT Registration', value: detailTenant.vat_reg_number || 'N/A' }
                           ].map((item, idx) => (
                             <div key={idx} className="group">
                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">{item.label}</div>
                               <div className="text-sm font-black text-slate-700 dark:text-slate-200">{item.value || '—'}</div>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[.25em] mb-6 flex items-center gap-3">
                          <MapPin size={14} className="text-emerald-500" /> Assigned Location
                        </h3>
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[35px] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-100 transition-all">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                <Building2 size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <div>
                                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary Residence</div>
                                <div className="text-lg font-black text-slate-800 dark:text-slate-200">{(detailTenant?.building?.name || detailTenant?.building_name || detailTenant?.building || '—')}{(detailTenant?.unit_number || detailTenant?.unit?.unit_number || detailTenant?.unit?.name) ? ' • ' + (detailTenant?.unit_number || detailTenant?.unit?.unit_number || detailTenant?.unit?.name) : ''}</div>
                                 <div className="text-xs font-medium text-slate-400 mt-0.5">Northern District • Commercial Zone A</div>
                              </div>
                           </div>
                           <button className="p-4 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-110 active:scale-95">
                              <ArrowRight size={20} />
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                       <div className="p-8 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[40px] border border-indigo-100 dark:border-indigo-900/30">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                             <span>Operational Status</span>
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          </div>
                          <div className="space-y-6">
                             <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.15em] mb-1">Lease Renewal</div>
                                <div className="text-lg font-black text-slate-800 dark:text-slate-200">14 Days Remaining</div>
                                <div className="mt-2 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                   <div className="w-[85%] h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
                                </div>
                             </div>
                             <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[.15em] mb-1">Portfolio Value</div>
                                <div className="text-lg font-black text-indigo-600">{formattedLease}</div>
                                <div className="text-[10px] font-medium text-slate-400">Total lifetime value assigned</div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <button className="w-full py-4 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                             Issue Site Notice
                          </button>
                          <button className="w-full py-4 bg-white dark:bg-slate-800 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all">
                             Archive Tenant
                          </button>
                       </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'ledger' && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 space-y-8">
                     <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-[24px] bg-indigo-600 shadow-xl shadow-indigo-200 flex items-center justify-center text-white">
                              <CreditCard size={28} />
                           </div>
                           <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Balance</div>
                              <div className={`text-4xl font-black ${(ledger[ledger.length - 1]?.balance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ETB {Number(ledger[ledger.length - 1]?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                           </div>
                        </div>
                        <a
                          href={financeApi.getTenantLedgerPdfUrl(String(detailTenant.id))}
                          target="_blank"
                          rel="noreferrer"
                          className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
                        >
                          <FileText size={16} className="text-indigo-600" /> Download PDF Statement
                        </a>
                     </div>

                     {ledgerLoading ? (
                       <div className="py-20 flex flex-col items-center justify-center text-slate-400 italic">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                          <span className="text-xs font-bold uppercase tracking-widest">Auditing Accounts...</span>
                       </div>
                     ) : ledger.length === 0 ? (
                       <div className="py-20 text-center text-slate-400 italic font-medium">No financial history found for this profile.</div>
                     ) : (
                       <div className="rounded-[35px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                         <table className="w-full text-left">
                           <thead className="bg-slate-50 dark:bg-slate-900/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                             <tr>
                               <th className="px-8 py-5">Date</th>
                               <th className="px-8 py-5">Descriptor</th>
                               <th className="px-8 py-5 text-right">Debit</th>
                               <th className="px-8 py-5 text-right">Credit</th>
                               <th className="px-8 py-5 text-right bg-indigo-50/30 dark:bg-indigo-900/10">Running Balance</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {ledger.map((entry, idx) => (
                               <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                 <td className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">{entry.date}</td>
                                 <td className="px-8 py-5">
                                    <div className="text-sm font-black text-slate-800 dark:text-slate-200">{entry.description}</div>
                                    <div className="text-[10px] font-bold text-slate-400 tracking-wider">REF: {entry.reference}</div>
                                 </td>
                                 <td className="px-8 py-5 text-right text-sm font-black text-rose-600">{entry.debit > 0 ? entry.debit.toFixed(2) : '—'}</td>
                                 <td className="px-8 py-5 text-right text-sm font-black text-emerald-600">{entry.credit > 0 ? entry.credit.toFixed(2) : '—'}</td>
                                 <td className="px-8 py-5 text-right text-sm font-black text-slate-900 dark:text-white bg-indigo-50/10 dark:bg-indigo-900/5">{entry.balance.toFixed(2)}</td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     )}
                  </div>
                )}

                {activeDetailTab === 'messages' && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                          <MessageCircle size={24} className="text-indigo-600" /> Communication Log
                       </h3>
                       <button className="px-6 py-2.5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                          New Message
                       </button>
                    </div>

                    {messages.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                        No active communication history found.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(m => (
                          <div key={m.id} className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[35px] hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                             <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-500">
                                      <Mail size={18} />
                                   </div>
                                   <div>
                                      <h5 className="font-black text-slate-900 dark:text-slate-200 text-sm tracking-tight">{m.subject}</h5>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outbound Announcement</p>
                                   </div>
                                </div>
                                <div className="text-[11px] font-bold text-slate-400">12:45 PM</div>
                             </div>
                             <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-14">
                                {m.body}
                             </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeDetailTab === 'documents' && (
                  <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <FileText size={24} className="text-indigo-600" /> Documents
                      </h3>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleListDocs(detailTenant?.id)} className="button-secondary">Refresh</button>
                      </div>
                    </div>

                    {/* If there are no document records, also show tenant image fields saved on the tenant record */}
                    {(() => {
                      const extraDocs: any[] = [];
                      if (detailTenant?.profile_image) {
                        extraDocs.push({ id: 'tenant-profile', type: 'Profile Image', file_url: detailTenant.profile_image, verified: detailTenant.profile_image_verified ?? false });
                      }
                      if (detailTenant?.license_image) {
                        extraDocs.push({ id: 'tenant-license', type: 'License / Work Permit', file_url: detailTenant.license_image, verified: detailTenant.license_image_verified ?? false });
                      }
                      if (detailTenant?.id_image) {
                        extraDocs.push({ id: 'tenant-id', type: 'ID / Passport', file_url: detailTenant.id_image, verified: detailTenant.id_image_verified ?? false });
                      }

                      const displayDocs = [...extraDocs, ...docsList];

                      if (displayDocs.length === 0) {
                        return (
                          <div className="py-20 text-center text-slate-400 italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                            No documents uploaded for this tenant.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {displayDocs.map((doc: any) => (
                            <div key={doc.id} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] flex items-center justify-between">
                              <div>
                                <div className="text-sm font-black text-slate-800 dark:text-white">{doc.type || 'Document'}</div>
                                <div className="text-xs text-slate-500 mt-1 truncate max-w-xl">{doc.file_url || doc.fileUrl || 'No file'}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{doc.verified ? 'Verified' : 'Not verified'}{doc.reject_reason ? ` — ${doc.reject_reason}` : ''}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                {doc.file_url && (
                                  <a href={doc.file_url.startsWith('/') ? `http://localhost:3000${doc.file_url}` : doc.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl">View</a>
                                )}
                                {!doc.verified && (
                                  (typeof doc.id === 'string' && !String(doc.id).startsWith('tenant-')) ? (
                                    <button onClick={() => handleVerifyDocument(doc.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">Verify</button>
                                  ) : null
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
