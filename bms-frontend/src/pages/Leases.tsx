import React, { useEffect, useState, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastProvider'
import {
  createLease,
  listLeases,
  activateLease,
  terminateLease,
  renewLease,
  uploadLeaseDocument,
  downloadLease,
  deleteDraftLease,
} from '../api/leases'
import { listTenants, createAndVerifyFromTenant, listDocuments } from '../api/tenants'
import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { Filter, Plus, FileSignature, Building2, Pen, Archive, RefreshCw, Upload, Download, Eye, X, Trash2 } from 'lucide-react'

export default function Leases() {
  const toast = useToast()
  const [leases, setLeases] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  // Track lease IDs that we created client-side as drafts from existing leases
  const [clientReferencedPreviousIds, setClientReferencedPreviousIds] = useState<Array<string | number>>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [leaseToDelete, setLeaseToDelete] = useState<any>(null)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [selectedTenantForVerify, setSelectedTenantForVerify] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)

  // Create form
  const [unitId, setUnitId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [leaseBuildingId, setLeaseBuildingId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rent, setRent] = useState('')
  const [serviceCharge, setServiceCharge] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState('MONTHLY')

  // Quick actions
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [quickActionMode, setQuickActionMode] = useState<'all' | 'terminate' | 'renew' | 'attach'>('all')
  const [activateOnlyLeaseId, setActivateOnlyLeaseId] = useState<string | number>('')
  const [terminateOnlyLeaseId, setTerminateOnlyLeaseId] = useState<string | number>('')
  const [terminateOnlyDate, setTerminateOnlyDate] = useState('')
  const [terminateOnlyReason, setTerminateOnlyReason] = useState('')
  const [terminateOnlyDepositDeduction, setTerminateOnlyDepositDeduction] = useState('')
  const [renewOnlyLeaseId, setRenewOnlyLeaseId] = useState<string | number>('')
  const [renewOnlyStart, setRenewOnlyStart] = useState('')
  const [renewOnlyEnd, setRenewOnlyEnd] = useState('')
  const [renewOnlyRent, setRenewOnlyRent] = useState('')
  const [renewOnlyBillingCycle, setRenewOnlyBillingCycle] = useState('MONTHLY')
  const [uploadOnlyLeaseId, setUploadOnlyLeaseId] = useState<string | number>('')
  const [uploadOnlyFile, setUploadOnlyFile] = useState<File | null>(null)

  function tenantLabel(t: any) {
    if (!t) return ''
    if (typeof t === 'string' || typeof t === 'number') return String(t)
    return t.name || t.full_name || ((t.first_name || t.last_name) ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : String(t.id))
  }

  function unitLabel(u: any) {
    if (!u) return ''
    return u.unit_number || u.name || String(u.id)
  }

  function leaseTenantLabel(l: any) {
    if (!l) return ''
    if (l.tenant) return tenantLabel(l.tenant)
    return l.tenant_name || l.tenant_id || ''
  }

  useEffect(() => { loadLeases(); loadLookups() }, [])

  async function loadLookups() {
    try { const t: any = await listTenants({ page: 1, per_page: 200 }); setTenants(Array.isArray(t) ? t : (t?.data || t || [])) } catch (e: any) { console.error('load tenants', e) }
    try { const u: any = await listUnits({ page: 1, per_page: 500 }); setUnits(Array.isArray(u) ? u : (u?.data || u || [])) } catch (e: any) { console.error('load units', e) }
    try { const b: any = await listBuildings({ page: 1, per_page: 200 }); setAllBuildings(Array.isArray(b) ? b : (b?.data || b || [])) } catch (e: any) { console.error('load buildings', e) }
  }

  async function loadLeases() {
    setLoading(true)
    try {
      const list: any = await listLeases({ page: 1, per_page: 50 })
      const normalized = Array.isArray(list) ? list : (list?.data || list || [])
      // Expose for debugging in browser console and log details to help diagnose duplicates
      try {
        (window as any).__leases = normalized
        console.debug('loadLeases: received', normalized)
        const refs = normalized.reduce((acc: any[], l: any) => {
          acc.push({ id: l.id, status: l.status, previous_lease: l.previous_lease || l.previous_lease_id || l.previousLease })
          return acc
        }, [])
        console.debug('loadLeases: lease refs (id/status/previous_lease)', refs)
      } catch (err) { /* ignore in non-browser contexts */ }
      setLeases(normalized)
    } catch (e: any) { console.error(e); toast.addToast('Failed to fetch leases. Please try again later.', 'error') }
    finally { setLoading(false) }
  }

  // KPI calculations
  const kpis = useMemo(() => {
    const activeLeases = leases.filter(l => l.status === 'ACTIVE' || l.status === 'active' || l.status === 'RENEWED')
    const monthlyRevenue = activeLeases.reduce((sum, l) => sum + (Number(l.rent_amount || l.rent || l.rent_price || 0)), 0)
    const pendingCount = leases.filter(l => l.status === 'DRAFT' || l.status === 'draft').length
    const terminatedCount = leases.filter(l => l.status === 'TERMINATED' || l.status === 'terminated').length

    // Upcoming renewals (within 90 days)
    const now = new Date()
    const renewalsNeeded = activeLeases.filter(l => {
      if (!l.end_date) return false
      const end = new Date(l.end_date)
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays > 0 && diffDays <= 90
    }).length

    const totalUnits = units.length || 1
    const occupancyRate = totalUnits > 0 ? ((activeLeases.length / totalUnits) * 100).toFixed(1) : '0'

    return { monthlyRevenue, renewalsNeeded, occupancyRate, activeCount: activeLeases.length, pendingCount, terminatedCount }
  }, [leases, units])

  // Tab filtering
  const filteredLeases = useMemo(() => {
    // Build a set of lease IDs that are referenced as `previous_lease` by other leases.
    // Some APIs return the relation as an object `{ id }`, others as a plain id — handle both.
    const referencedPreviousIds = new Set<string | number>()
    for (const cand of leases) {
      const prev = (cand as any).previous_lease || (cand as any).previous_lease_id || (cand as any).previousLease
      if (!prev) continue
      if (typeof prev === 'object') {
        const pid = (prev as any).id || (prev as any).lease_id || undefined
        if (pid !== undefined) referencedPreviousIds.add(pid)
      } else {
        referencedPreviousIds.add(prev as string | number)
      }
    }

    // include client-side marked previous ids (created drafts) so originals are hidden
    for (const id of clientReferencedPreviousIds) referencedPreviousIds.add(id)

    // Default base list: hide leases that have been superseded by a renewed draft
    const baseList = leases.filter(l => !referencedPreviousIds.has(l.id))

    if (activeTab === 'all') return baseList
    if (activeTab === 'active') return baseList.filter(l => ['ACTIVE', 'active', 'RENEWED'].includes(l.status))
    if (activeTab === 'pending') return baseList.filter(l => ['DRAFT', 'draft'].includes(l.status))
    if (activeTab === 'terminated') return baseList.filter(l => ['TERMINATED', 'terminated', 'EXPIRED', 'expired'].includes(l.status))
    return baseList
  }, [leases, activeTab, clientReferencedPreviousIds])

  const tabs = [
    { key: 'all', label: `All Leases (${leases.length})` },
    { key: 'active', label: `Active (${kpis.activeCount})` },
    { key: 'pending', label: `Pending (${kpis.pendingCount})` },
    { key: 'terminated', label: `Terminated (${kpis.terminatedCount})` },
  ]

  // Handlers (preserved from original)
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = { unit_id: unitId, tenant_id: tenantId, building_id: leaseBuildingId, start_date: startDate, end_date: endDate, rent_amount: Number(rent) }
      if (serviceCharge) payload.service_charge = Number(serviceCharge)
      if (depositAmount) payload.deposit_amount = Number(depositAmount)
      if (billingCycle) payload.billing_cycle = billingCycle
      const newLease = await createLease(payload)
      toast.addToast('Lease draft created', 'success')
      setShowCreateModal(false)
      loadLeases()
      try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: newLease?.tenant?.id || newLease?.tenant_id || tenantId } })) } catch (err) { }
    } catch (e: any) {
      const server = e?.response?.data
      let msg = e?.message || 'Create lease failed'
      try { if (server) msg = Array.isArray(server?.message) ? server.message.join('; ') : (server?.message || JSON.stringify(server)) } catch { }
      toast.addToast(msg, 'error')
    }
  }

  const handleOpenVerifyModal = (tenant: any) => {
    setSelectedTenantForVerify(tenant)
    setShowVerifyModal(true)
  }

  const handleVerifyAll = async (tenantId: string) => {
    setVerifying(true)
    try {
      await createAndVerifyFromTenant(tenantId, { type: 'ALL' })
      toast.addToast('All tenant documents verified successfully', 'success')
      setShowVerifyModal(false)
      loadLeases()
    } catch (err: any) {
      toast.addToast(err?.response?.data?.message || 'Failed to verify documents', 'error')
    } finally {
      setVerifying(false)
    }
  }

  async function handleActivateOnly(id: string | number) {
    const lease = leases.find(l => String(l.id) === String(id));
    const tId = lease?.tenant?.id || lease?.tenant_id;

    // Check if documents are verified
    try {
      const docs = await listDocuments({ tenant_id: tId });
      const unverified = docs.filter((d: any) => !d.verified);
      if (unverified.length > 0) {
        if (!window.confirm(`Warning: This tenant has ${unverified.length} unverified documents. Are you sure you want to activate the lease anyway?`)) {
          return;
        }
      }
    } catch (err) {
      console.warn('Could not check document verification status', err);
    }

    try {
      const res = await activateLease(id, {})
      toast.addToast('Lease activated', 'success')
      loadLeases()
      try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: res?.tenant?.id || res?.tenant_id } })) } catch (err) { }
    } catch (e: any) {
      console.error('Activate error', e)
      const server = e?.response?.data
      let msg = 'Activate failed'
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

  async function handleTerminateOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!terminateOnlyLeaseId) { toast.addToast('Select lease to terminate', 'error'); return }
    try {
      const payload: any = { termination_date: terminateOnlyDate || undefined, reason: terminateOnlyReason || undefined }
      if (terminateOnlyDepositDeduction) payload.deposit_deduction = Number(terminateOnlyDepositDeduction)
      const res = await terminateLease(terminateOnlyLeaseId, payload)
      toast.addToast('Lease terminated', 'success')
      setTerminateOnlyLeaseId(''); setTerminateOnlyDate(''); setTerminateOnlyReason(''); setTerminateOnlyDepositDeduction('')
      loadLeases()
      try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: res?.tenant?.id || res?.tenant_id } })) } catch (err) { }
    } catch { toast.addToast('Terminate failed', 'error') }
  }

  async function handleRenewOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!renewOnlyLeaseId) { toast.addToast('Select lease to renew', 'error'); return }
    try {
      // If the selected lease is terminated, backend renew will reject — create a new draft instead
      const lease = leases.find(l => String(l.id) === String(renewOnlyLeaseId))
      const isTerminated = lease && (String(lease.status).toUpperCase() === 'TERMINATED')
      if (isTerminated) {
        const payload: any = {
          tenant_id: lease?.tenant?.id || lease?.tenant_id,
          unit_id: lease?.unit?.id || lease?.unit_id,
          building_id: lease?.building?.id || lease?.building_id,
          start_date: renewOnlyStart || undefined,
          end_date: renewOnlyEnd || undefined,
          rent_amount: renewOnlyRent ? Number(renewOnlyRent) : (lease ? Number(lease.rent_amount || lease.rent || lease.rent_price || 0) : undefined),
        }
        if (renewOnlyBillingCycle) payload.billing_cycle = renewOnlyBillingCycle
        const newLease = await createLease(payload)
        toast.addToast('New lease draft created (from terminated lease)', 'success')
        // mark original as superseded locally and add new draft to state so the UI doesn't duplicate
        try {
          if (lease?.id) setClientReferencedPreviousIds(prev => Array.from(new Set([...prev, lease.id])))
          setLeases(prev => [newLease, ...prev])
          try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: newLease?.tenant?.id || newLease?.tenant_id || lease?.tenant?.id || lease?.tenant_id } })) } catch (err) { }
        } catch (err) { /* ignore */ }
      } else {
        const renewed = await renewLease(renewOnlyLeaseId, { start_date: renewOnlyStart || undefined, end_date: renewOnlyEnd || undefined, rent_amount: renewOnlyRent ? Number(renewOnlyRent) : undefined, billing_cycle: renewOnlyBillingCycle || undefined })
        toast.addToast('Renewal created', 'success')
        try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: renewed?.tenant?.id || renewed?.tenant_id } })) } catch (err) { }
      }
      setRenewOnlyLeaseId(''); setRenewOnlyStart(''); setRenewOnlyEnd(''); setRenewOnlyRent(''); setRenewOnlyBillingCycle('MONTHLY')
      loadLeases()
    } catch (e: any) {
      console.error('Renew failed', e)
      const server = e?.response?.data
      let msg = 'Renew failed'
      try {
        if (server) {
          if (Array.isArray(server?.message)) msg = server.message.join('; ')
          else if (typeof server?.message === 'string') msg = server.message
          else if (server?.message) msg = JSON.stringify(server.message)
          else msg = JSON.stringify(server)
        } else if (e?.message) msg = e.message
      } catch { }
      toast.addToast(msg, 'error')
    }
  }

  async function handleUploadOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!uploadOnlyLeaseId || !uploadOnlyFile) { toast.addToast('Select lease and file', 'error'); return }
    try {
      const fd = new FormData(); fd.append('file', uploadOnlyFile)
      await uploadLeaseDocument(uploadOnlyLeaseId, fd)
      toast.addToast('File uploaded', 'success')
      setUploadOnlyLeaseId(''); setUploadOnlyFile(null); loadLeases()
    } catch { toast.addToast('Upload failed', 'error') }
  }

  async function handleDownload(id: string | number, mode: 'view' | 'download' = 'download') {
    if (!id) { toast.addToast('Select lease id', 'error'); return }
    try {
      const res = await downloadLease(id)
      const contentType = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || ''
      if (contentType.includes('application/json') || res.data instanceof ArrayBuffer || res.data instanceof Blob) {
        let textContent = ''
        if (res.data instanceof ArrayBuffer) textContent = new TextDecoder().decode(res.data)
        else if (res.data instanceof Blob) textContent = await res.data.text()
        if (textContent.trim().startsWith('{')) {
          try { const json = JSON.parse(textContent); if (json.statusCode >= 400 || json.message) { toast.addToast(`Error: ${json.message || 'Server error'}`, 'error'); return } } catch { }
        }
      }
      let blob: Blob
      if (res.data instanceof Blob) blob = res.data
      else blob = new Blob([res.data], { type: contentType || 'application/pdf' })
      const url = URL.createObjectURL(blob)
      if (mode === 'view') window.open(url, '_blank')
      else { const link = document.createElement('a'); link.href = url; link.download = `Lease_${id}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link) }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch { toast.addToast('Failed to process document', 'error') }
  }

  function renderLeaseProgress(l: any) {
    if (!l.start_date || !l.end_date) return null
    const start = new Date(l.start_date).getTime()
    const end = new Date(l.end_date).getTime()
    const now = Date.now()
    const total = end - start
    const elapsed = now - start
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
    const isExpired = now > end
    return (
      <div className="flex items-center gap-3 flex-1">
        <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
          {new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isExpired ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
          {new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
        </span>
      </div>
    )
  }

  function getDuration(l: any) {
    if (!l.start_date || !l.end_date) return ''
    const start = new Date(l.start_date)
    const end = new Date(l.end_date)
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    return `${months} mo.`
  }

  function getDaysLeft(l: any) {
    if (!l.end_date) return null
    const end = new Date(l.end_date)
    const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { text: `Expired ~${Math.abs(diffDays)} days`, color: 'text-rose-500' }
    if (diffDays <= 30) return { text: `Expires in ${diffDays} days`, color: 'text-rose-500' }
    if (diffDays <= 90) return { text: `${diffDays} days left`, color: 'text-amber-500' }
    return null
  }

  return (
    <PageLayout
      title="Lease Portfolio"
      subtitle={`Managing ${leases.length} active commercial and residential leases across the Northern District properties.`}
      searchPlaceholder="Search leases, tenants, or units..."
      actions={
        <div className="flex items-center gap-3">
          <button onClick={() => { const open = !showQuickActions; setShowQuickActions(open); if (open) setQuickActionMode('all') }} className="button-secondary">
            <Filter size={16} /> Filter View
          </button>
          <button onClick={() => setShowCreateModal(true)} className="button">
            <Plus size={16} /> New Lease Agreement
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Monthly Revenue"
            value={`$${kpis.monthlyRevenue.toLocaleString()}`}
            trend={{ value: '8.2% vs last month', direction: 'up' }}
            variant="purple"
          />
          <KPICard
            title="Upcoming Renewals"
            value={kpis.renewalsNeeded}
            variant="white"
          >
            {kpis.renewalsNeeded > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                Action Required
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1">Next 30 days portfolio window</p>
          </KPICard>
          <KPICard
            title="Occupancy Rate"
            value={`${kpis.occupancyRate}%`}
            variant="white"
          >
            <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-700" style={{ width: `${kpis.occupancyRate}%` }} />
            </div>
          </KPICard>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lease Cards */}
        {loading ? (
          <div className="py-16 flex justify-center text-slate-400">
            <div className="flex items-center gap-3"><RefreshCw size={20} className="animate-spin" /> Loading leases...</div>
          </div>
        ) : filteredLeases.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileSignature size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No leases found</p>
            <p className="text-sm mt-1">Create a new lease agreement to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeases.map((l: any) => {
              const daysInfo = getDaysLeft(l)
              return (
                <div key={l.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 p-5 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-5">
                    {/* Tenant Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-indigo-500" />
                    </div>

                    {/* Tenant Info */}
                    <div className="min-w-[180px]">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{leaseTenantLabel(l) || 'Unknown Tenant'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {l.unit?.unit_number || l.unit_number || l.unit_id || 'N/A'} • {l.building?.name || 'N/A'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 hidden md:flex items-center gap-3">
                      {renderLeaseProgress(l)}
                    </div>

                    {/* Duration */}
                    <div className="text-center px-3 hidden lg:block">
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{getDuration(l)}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</div>
                    </div>

                    {/* Status */}
                    <StatusBadge status={l.status} size="md" />

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(l.status === 'DRAFT' || l.status === 'draft') && (
                        <button onClick={() => handleActivateOnly(l.id)} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          Activate
                        </button>
                      )}
                      {(l.status === 'DRAFT' || l.status === 'draft') && (
                        <button
                          onClick={() => handleOpenVerifyModal(l.tenant || { id: l.tenant_id, name: l.tenant_name })}
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          View Documents
                        </button>
                      )}
                      <button onClick={() => {
                        // prefill renew form from this lease and open renew modal
                        setRenewOnlyLeaseId(l.id)
                        try {
                          const origStart = l.start_date ? new Date(l.start_date) : null
                          const origEnd = l.end_date ? new Date(l.end_date) : null
                          let durationDays = 365
                          if (origStart && origEnd) {
                            durationDays = Math.max(1, Math.round((origEnd.getTime() - origStart.getTime()) / (1000 * 60 * 60 * 24)))
                          }
                          const today = new Date()
                          const newStart = today.toISOString().split('T')[0]
                          const newEndDate = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000)
                          const newEnd = newEndDate.toISOString().split('T')[0]
                          setRenewOnlyStart(newStart)
                          setRenewOnlyEnd(newEnd)
                        } catch (err) { console.error('prefill renew', err) }
                        setShowRenewModal(true)
                      }} className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        Renew Now
                      </button>
                      {(l.status === 'ACTIVE' || l.status === 'active' || l.status === 'RENEWED') && (
                        <button onClick={() => { setTerminateOnlyLeaseId(l.id); setShowTerminateModal(true) }} className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                          Terminate
                        </button>
                      )}
                      <button onClick={() => handleDownload(l.id, 'view')} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="View Document">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(l.id, 'download')} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                      {(['DRAFT', 'draft', 'TERMINATED', 'terminated'].includes(String(l.status))) && (
                        <button onClick={(e) => { e.stopPropagation(); setLeaseToDelete(l); setShowDeleteConfirm(true) }} className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors" title="Delete Lease">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Days Left Warning */}
                  {daysInfo && (
                    <div className={`mt-2 ml-16 text-xs font-semibold ${daysInfo.color}`}>{daysInfo.text}</div>
                  )}

                  {/* Termination Info */}
                  {String(l.status).toUpperCase() === 'TERMINATED' && (Number(l.penalty_amount) > 0 || Number(l.deposit_refund_amount) > 0) && (
                    <div className="mt-3 ml-16 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                      {Number(l.penalty_amount) > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penalty:</span>
                          <span className="text-xs font-bold text-rose-600">{(Number(l.penalty_amount)).toLocaleString()} ETB</span>
                        </div>
                      )}
                      {Number(l.deposit_refund_amount) >= 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Refunded:</span>
                          <span className="text-xs font-bold text-emerald-600">{(Number(l.deposit_refund_amount)).toLocaleString()} ETB</span>
                        </div>
                      )}
                      {l.deposit_refund_date && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date:</span>
                          <span className="text-xs font-medium text-slate-500">{new Date(l.deposit_refund_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Actions Panel (collapsible) */}
        {showQuickActions && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Quick Actions</h3>
              <button onClick={() => { setShowQuickActions(false); setQuickActionMode('all') }} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Terminate */}
              {(quickActionMode === 'all' || quickActionMode === 'terminate') && (
                <form onSubmit={handleTerminateOnly}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Terminate</label>
                  <div className="space-y-2">
                    <select value={String(terminateOnlyLeaseId)} onChange={e => setTerminateOnlyLeaseId(e.target.value)} className="form-select w-full">
                      <option value="">Select lease</option>
                      {leases.filter(l => ['ACTIVE', 'RENEWED', 'active', 'renewed'].includes(l.status)).map(l => (
                        <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={terminateOnlyDate} onChange={e => setTerminateOnlyDate(e.target.value)} className="form-input" placeholder="Date" />
                      <input value={terminateOnlyReason} onChange={e => setTerminateOnlyReason(e.target.value)} className="form-input" placeholder="Reason" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ETB</span>
                      <input
                        type="number"
                        value={terminateOnlyDepositDeduction}
                        onChange={e => setTerminateOnlyDepositDeduction(e.target.value)}
                        className="form-input w-full pl-12"
                        placeholder="Deposit Deduction"
                      />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                      Terminate & Invoice
                    </button>
                  </div>
                </form>
              )}
            {(quickActionMode === 'all' || quickActionMode === 'renew') && (
              <form onSubmit={handleRenewOnly}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Renew</label>
                <div className="space-y-2">
                  <select value={String(renewOnlyLeaseId)} onChange={e => setRenewOnlyLeaseId(e.target.value)} className="form-select w-full">
                    <option value="">Select lease</option>
                    {leases.map(l => (
                      <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={renewOnlyStart} onChange={e => setRenewOnlyStart(e.target.value)} className="form-input" placeholder="Start" />
                    <input type="date" value={renewOnlyEnd} onChange={e => setRenewOnlyEnd(e.target.value)} className="form-input" placeholder="End" />
                  </div>
                  <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Renew</button>
                </div>
              </form>
            )}

            {(quickActionMode === 'all' || quickActionMode === 'attach') && (
              <form onSubmit={handleUploadOnly}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Attach Document</label>
                <div className="space-y-2">
                  <select value={String(uploadOnlyLeaseId)} onChange={e => setUploadOnlyLeaseId(e.target.value)} className="form-select w-full">
                    <option value="">Select lease</option>
                    {leases.map(l => (<option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
                  </select>
                  <input type="file" onChange={e => setUploadOnlyFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <button type="submit" className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors">Attach</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>

    {/* MODALS */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Lease Agreement</h3>
            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Tenant</label>
              <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="form-select" required>
                <option value="">Select tenant</option>
                {tenants.map((t: any) => (<option key={t.id} value={String(t.id)}>{tenantLabel(t)}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Building</label>
                <select value={leaseBuildingId} onChange={e => setLeaseBuildingId(e.target.value)} className="form-select" required>
                  <option value="">Select building</option>
                  {allBuildings.map((b: any) => (<option key={b.id} value={String(b.id)}>{b.name || b.code || b.id}</option>))}
                </select>
              </div>
              <div>
                <label className="form-label">Unit</label>
                <select value={unitId} onChange={e => setUnitId(e.target.value)} className="form-select" required>
                  <option value="">Select unit</option>
                  {units.map((u: any) => (<option key={u.id} value={String(u.id)}>{unitLabel(u)}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="form-input" required />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="form-input" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Rent Amount (ETB)</label>
                <input placeholder="0.00" value={rent} onChange={e => setRent(e.target.value)} className="form-input" required />
              </div>
              <div>
                <label className="form-label">Billing Cycle</label>
                <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="form-select">
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Service Charge</label>
                <input placeholder="Optional" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Deposit</label>
                <input placeholder="Optional" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowCreateModal(false)} className="button-secondary">Cancel</button>
              <button type="submit" className="button">Create Draft</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showDeleteConfirm && leaseToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
            <Trash2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Lease?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Are you sure you want to remove this lease ({leaseToDelete.lease_number || leaseToDelete.id})? This action cannot be undone.
          </p>
          <div className="flex gap-4">
            <button onClick={() => { setShowDeleteConfirm(false); setLeaseToDelete(null) }} className="flex-1 px-6 py-3.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancel</button>
            <button onClick={async () => {
              try {
                await deleteDraftLease(leaseToDelete.id)
                toast.addToast('Lease removed', 'success')
                setShowDeleteConfirm(false)
                setLeaseToDelete(null)
                loadLeases()
                try { window.dispatchEvent(new CustomEvent('lease:updated', { detail: { tenantId: leaseToDelete?.tenant?.id || leaseToDelete?.tenant_id } })) } catch (err) { }
              } catch (e: any) { console.error('Delete failed', e); toast.addToast('Delete failed', 'error') }
            }} className="flex-1 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg">Delete</button>
          </div>
        </div>
      </div>
    )}

    {showRenewModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Renew Lease</h3>
            <button onClick={() => setShowRenewModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <form onSubmit={async (e) => { e.preventDefault(); await handleRenewOnly(); setShowRenewModal(false) }} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-600">Start Date</label>
              <input type="date" value={renewOnlyStart} onChange={e => setRenewOnlyStart(e.target.value)} className="form-input w-full" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">End Date</label>
              <input type="date" value={renewOnlyEnd} onChange={e => setRenewOnlyEnd(e.target.value)} className="form-input w-full" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowRenewModal(false)} className="px-4 py-2 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Renew</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showTerminateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 p-8">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Terminate Lease</h3>
            <button onClick={() => setShowTerminateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
          <form onSubmit={async (e) => { e.preventDefault(); await handleTerminateOnly(); setShowTerminateModal(false) }} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-600">Termination Date</label>
              <input type="date" value={terminateOnlyDate} onChange={e => setTerminateOnlyDate(e.target.value)} className="form-input w-full" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">Reason</label>
              <input value={terminateOnlyReason} onChange={e => setTerminateOnlyReason(e.target.value)} className="form-input w-full" placeholder="e.g. Early termination by tenant" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">Deposit Deduction (Repairs/Cleaning)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ETB</span>
                <input
                  type="number"
                  value={terminateOnlyDepositDeduction}
                  onChange={e => setTerminateOnlyDepositDeduction(e.target.value)}
                  className="form-input w-full pl-12"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">This will be deducted from the held deposit before refund. Penalties are calculated separately.</p>
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={() => setShowTerminateModal(false)} className="px-4 py-2 rounded-lg font-bold text-slate-500">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold shadow-lg hover:bg-rose-700">Terminate & Invoice Penalty</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showVerifyModal && selectedTenantForVerify && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50">
          <div className="p-8 pb-0 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <FileSignature size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verify Documents</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Review tenant identification & licenses</p>
              </div>
            </div>
            <button
              onClick={() => setShowVerifyModal(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Tenant</span>
                <StatusBadge status="PENDING" size="sm" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">{selectedTenantForVerify.name || tenantLabel(selectedTenantForVerify)}</h4>
              <p className="text-xs text-slate-500 mt-1">Tenant ID: {selectedTenantForVerify.id}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Eye size={16} />
                  </div>
                  <span className="text-sm font-medium dark:text-slate-200">ID / Passport Image</span>
                </div>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md uppercase">Pending</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Eye size={16} />
                  </div>
                  <span className="text-sm font-medium dark:text-slate-200">Contract / License</span>
                </div>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md uppercase">Pending</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-6 py-4 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
              >
                Later
              </button>
              <button
                onClick={() => handleVerifyAll(selectedTenantForVerify.id)}
                disabled={verifying}
                className="flex-1 px-6 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <RefreshCw size={18} className="animate-spin" /> : <FileSignature size={18} />}
                Verify All
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 px-4">
              By clicking verify all, you confirm that you have reviewed the uploaded documents and they are valid for this lease.
            </p>
          </div>
        </div>
      </div>
    )}
  </PageLayout>
)
}
