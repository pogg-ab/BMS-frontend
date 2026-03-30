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
} from '../api/leases'
import { listTenants } from '../api/tenants'
import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { Filter, Plus, FileSignature, Building2, Pen, Archive, RefreshCw, Upload, Download, Eye, X } from 'lucide-react'

export default function Leases() {
  const toast = useToast()
  const [leases, setLeases] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

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
      setLeases(Array.isArray(list) ? list : [])
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
    if (activeTab === 'all') return leases
    if (activeTab === 'active') return leases.filter(l => ['ACTIVE', 'active', 'RENEWED'].includes(l.status))
    if (activeTab === 'pending') return leases.filter(l => ['DRAFT', 'draft'].includes(l.status))
    if (activeTab === 'terminated') return leases.filter(l => ['TERMINATED', 'terminated', 'EXPIRED', 'expired'].includes(l.status))
    return leases
  }, [leases, activeTab])

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
      await createLease(payload)
      toast.addToast('Lease draft created', 'success')
      setShowCreateModal(false)
      loadLeases()
    } catch (e: any) {
      const server = e?.response?.data
      let msg = e?.message || 'Create lease failed'
      try { if (server) msg = Array.isArray(server?.message) ? server.message.join('; ') : (server?.message || JSON.stringify(server)) } catch { }
      toast.addToast(msg, 'error')
    }
  }

  async function handleActivateOnly(id: string | number) {
    try { await activateLease(id, {}); toast.addToast('Lease activated', 'success'); loadLeases() }
    catch { toast.addToast('Activate failed', 'error') }
  }

  async function handleTerminateOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!terminateOnlyLeaseId) { toast.addToast('Select lease to terminate', 'error'); return }
    try {
      const payload: any = { termination_date: terminateOnlyDate || undefined, reason: terminateOnlyReason || undefined }
      if (terminateOnlyDepositDeduction) payload.deposit_deduction = Number(terminateOnlyDepositDeduction)
      await terminateLease(terminateOnlyLeaseId, payload)
      toast.addToast('Lease terminated', 'success')
      setTerminateOnlyLeaseId(''); setTerminateOnlyDate(''); setTerminateOnlyReason(''); setTerminateOnlyDepositDeduction('')
      loadLeases()
    } catch { toast.addToast('Terminate failed', 'error') }
  }

  async function handleRenewOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!renewOnlyLeaseId) { toast.addToast('Select lease to renew', 'error'); return }
    try {
      await renewLease(renewOnlyLeaseId, { start_date: renewOnlyStart || undefined, end_date: renewOnlyEnd || undefined, rent_amount: renewOnlyRent ? Number(renewOnlyRent) : undefined, billing_cycle: renewOnlyBillingCycle || undefined })
      toast.addToast('Renewal created', 'success')
      setRenewOnlyLeaseId(''); setRenewOnlyStart(''); setRenewOnlyEnd(''); setRenewOnlyRent(''); setRenewOnlyBillingCycle('MONTHLY')
      loadLeases()
    } catch { toast.addToast('Renew failed', 'error') }
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
          <button onClick={() => setShowQuickActions(!showQuickActions)} className="button-secondary">
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
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                activeTab === tab.key
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
                      {(l.status === 'EXPIRED' || l.status === 'expired') && (
                        <button onClick={() => { setRenewOnlyLeaseId(l.id); setShowQuickActions(true) }} className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                          Renew Now
                        </button>
                      )}
                      <button onClick={() => handleDownload(l.id, 'view')} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="View Document">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(l.id, 'download')} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Days Left Warning */}
                  {daysInfo && (
                    <div className={`mt-2 ml-16 text-xs font-semibold ${daysInfo.color}`}>{daysInfo.text}</div>
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
              <button onClick={() => setShowQuickActions(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Terminate */}
              <form onSubmit={handleTerminateOnly}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Terminate</label>
                <div className="space-y-2">
                  <select value={String(terminateOnlyLeaseId)} onChange={e => setTerminateOnlyLeaseId(e.target.value)} className="form-select w-full">
                    <option value="">Select lease</option>
                    {leases.filter(l => ['ACTIVE', 'RENEWED'].includes(l.status)).map(l => (
                      <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={terminateOnlyDate} onChange={e => setTerminateOnlyDate(e.target.value)} className="form-input" placeholder="Date" />
                    <input value={terminateOnlyReason} onChange={e => setTerminateOnlyReason(e.target.value)} className="form-input" placeholder="Reason" />
                  </div>
                  <button type="submit" className="px-4 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Terminate</button>
                </div>
              </form>

              {/* Quick Renew */}
              <form onSubmit={handleRenewOnly}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Renew</label>
                <div className="space-y-2">
                  <select value={String(renewOnlyLeaseId)} onChange={e => setRenewOnlyLeaseId(e.target.value)} className="form-select w-full">
                    <option value="">Select lease</option>
                    {leases.filter(l => ['ACTIVE', 'EXPIRED'].includes(l.status)).map(l => (
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

              {/* Quick Upload */}
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
            </div>
          </div>
        )}
      </div>

      {/* Create Lease Modal */}
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
    </PageLayout>
  )
}
