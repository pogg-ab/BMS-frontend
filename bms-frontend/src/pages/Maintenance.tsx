import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as maintenanceApi from '../api/maintenance'
import { listTenants } from '../api/tenants'
import { listUnits } from '../api/units'
import { getRoles, getUserId } from '../utils/jwt'

type Tab = 'requests' | 'work-orders' | 'contractors' | 'reports'

const TABS: { key: Tab; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'work-orders', label: 'Work Orders' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'reports', label: 'Reports' },
]

const CATEGORIES = ['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'pest_control', 'other']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function Maintenance() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('requests')

  const userRoles = getRoles()
  const currentUserId = getUserId()
  const isSuperAdmin = userRoles.includes('super_admin')
  const isNomineeAdmin = userRoles.includes('nominee_admin')
  const isTenant = userRoles.includes('tenant')
  const isAdmin = isSuperAdmin || isNomineeAdmin

  // Filter tabs for tenants
  const visibleTabs = TABS.filter(t => {
    if (isAdmin) return true
    return t.key === 'requests'
  })

  // ── Lookups ──────────────────────────────────────────────
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])

  // ── Requests ─────────────────────────────────────────────
  const [requests, setRequests] = useState<any[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [reqTenantId, setReqTenantId] = useState('')
  const [reqUnitId, setReqUnitId] = useState('')
  const [reqCategory, setReqCategory] = useState('plumbing')
  const [reqPriority, setReqPriority] = useState('medium')
  const [reqDescription, setReqDescription] = useState('')

  // ── Work Orders ──────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [woLoading, setWoLoading] = useState(false)
  const [woRequestId, setWoRequestId] = useState('')
  const [woContractorId, setWoContractorId] = useState('')
  const [woScheduledDate, setWoScheduledDate] = useState('')

  // ── Contractors ──────────────────────────────────────────
  const [contractors, setContractors] = useState<any[]>([])
  const [conName, setConName] = useState('')
  const [conPhone, setConPhone] = useState('')
  const [conSpec, setConSpec] = useState('')

  // ── Reports ──────────────────────────────────────────────
  const [reportData, setReportData] = useState<any>(null)

  // ── Modals / Editing ─────────────────────────────────────
  const [editingContractor, setEditingContractor] = useState<any>(null)
  const [isConModalOpen, setIsConModalOpen] = useState(false)
  const [ratingWoId, setRatingWoId] = useState<string | null>(null)
  const [ratingTenantId, setRatingTenantId] = useState<string | null>(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [ratingComment, setRatingComment] = useState('')

  const [woCostEstimate, setWoCostEstimate] = useState('')
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [completeWoId, setCompleteWoId] = useState<string | null>(null)
  const [actualCost, setActualCost] = useState('0')
  const [proofFile, setProofFile] = useState<File | null>(null)

  // ── Load helpers ─────────────────────────────────────────
  useEffect(() => {
    loadLookups()
    loadContractors()
  }, [])

  useEffect(() => {
    if (tab === 'requests') loadRequests()
    if (tab === 'work-orders') { loadWorkOrders(); loadRequests() }
    if (tab === 'reports') loadReport()
  }, [tab])

  async function loadLookups() {
    try {
      const t: any = await listTenants({ page: 1, per_page: 500 })
      setTenants(Array.isArray(t) ? t : [])
    } catch (e: any) { console.error('load tenants', e) }
    try {
      const u: any = await listUnits({ page: 1, per_page: 500 })
      const ul = Array.isArray(u) ? u : (u?.data || [])
      setUnits(ul)
    } catch (e: any) { console.error('load units', e) }
  }

  async function loadRequests() {
    setReqLoading(true)
    try {
      const data = await maintenanceApi.getRequests()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load requests', 'error')
    } finally { setReqLoading(false) }
  }

  async function loadWorkOrders() {
    setWoLoading(true)
    try {
      const data = await maintenanceApi.getWorkOrders()
      setWorkOrders(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load work orders', 'error')
    } finally { setWoLoading(false) }
  }

  async function loadContractors() {
    try {
      const data = await maintenanceApi.getContractors()
      setContractors(Array.isArray(data) ? data : [])
    } catch (e: any) { console.error('load contractors', e) }
  }

  async function loadReport() {
    try {
      const data = await maintenanceApi.getReport()
      setReportData(data)
    } catch (e: any) {
      toast.addToast('Failed to load report', 'error')
    }
  }

  // ── Tenant / Unit labels ────────────────────────────────
  function tenantLabel(t: any) {
    if (!t) return ''
    return t.name || t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.id
  }

  function unitLabel(u: any) {
    if (!u) return ''
    return u.unit_number || u.name || u.id
  }

  // ── Request CRUD ────────────────────────────────────────
  async function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!reqTenantId || !reqUnitId) {
      toast.addToast('Select a tenant and unit', 'error'); return
    }
    try {
      await maintenanceApi.submitRequest({
        tenant_id: reqTenantId,
        unit_id: reqUnitId,
        category: reqCategory,
        priority: reqPriority,
        description: reqDescription,
      })
      toast.addToast('Request submitted', 'success')
      setReqTenantId(''); setReqUnitId(''); setReqDescription('')
      loadRequests()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join('; ') : (msg || 'Submit request failed'), 'error')
    }
  }

  async function handleCancelRequest(id: string) {
    if (!confirm('Cancel this maintenance request?')) return
    try {
      await maintenanceApi.updateRequest(id, { status: 'cancelled' })
      toast.addToast('Request cancelled', 'success')
      loadRequests()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Cancel failed', 'error')
    }
  }

  // ── Work Order CRUD ─────────────────────────────────────
  async function handleCreateWorkOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!woRequestId || !woContractorId) {
      toast.addToast('Select a request and contractor', 'error'); return
    }
    try {
      // Get current user ID from token for assigned_by
      let assignedBy = 'system'
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          assignedBy = payload.sub || payload.id || 'system'
        }
      } catch (_) { }

      await maintenanceApi.convertToWorkOrder({
        request_id: woRequestId,
        contractor_id: woContractorId,
        scheduled_date: woScheduledDate,
        assigned_by: assignedBy,
        cost_estimate: woCostEstimate ? Number(woCostEstimate) : undefined,
      })
      toast.addToast('Work order created', 'success')
      setWoRequestId(''); setWoContractorId(''); setWoScheduledDate(''); setWoCostEstimate('')
      loadWorkOrders()
      loadRequests()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join('; ') : (msg || 'Create work order failed'), 'error')
    }
  }

  async function handleUpdateWorkOrderStatus(id: string, status: string) {
    if (status === 'completed') {
      setCompleteWoId(id)
      setIsCompleteModalOpen(true)
      return
    }
    try {
      await maintenanceApi.updateWorkOrderStatus(id, status)
      toast.addToast(`Work order → ${status}`, 'success')
      loadWorkOrders()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Update failed', 'error')
    }
  }

  async function handleSubmitCompletion(e: React.FormEvent) {
    e.preventDefault()
    if (!completeWoId) return
    try {
      await maintenanceApi.updateWorkOrderStatus(completeWoId, 'completed', Number(actualCost), proofFile || undefined)
      toast.addToast('Work order completed', 'success')
      setIsCompleteModalOpen(false)
      setCompleteWoId(null)
      setActualCost('0')
      setProofFile(null)
      loadWorkOrders()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Completion failed', 'error')
    }
  }

  // ── Contractor CRUD ─────────────────────────────────────
  async function handleCreateContractor(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingContractor) {
        await maintenanceApi.updateContractor(editingContractor.id, {
          name: conName,
          phone: conPhone,
          specialization: conSpec,
        })
        toast.addToast('Contractor updated', 'success')
      } else {
        await maintenanceApi.createContractor({
          name: conName,
          phone: conPhone,
          specialization: conSpec,
        })
        toast.addToast('Contractor created', 'success')
      }
      setConName(''); setConPhone(''); setConSpec(''); setEditingContractor(null); setIsConModalOpen(false)
      loadContractors()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Operation failed', 'error')
    }
  }

  function openEditContractor(c: any) {
    setEditingContractor(c)
    setConName(c.name)
    setConPhone(c.phone)
    setConSpec(c.specialization)
    setIsConModalOpen(true)
  }

  // ── Rating ──────────────────────────────────────────────
  async function handleRateJob(e: React.FormEvent) {
    e.preventDefault()
    if (!ratingWoId || !ratingTenantId) return
    try {
      await maintenanceApi.submitFeedback({
        work_order_id: ratingWoId,
        tenant_id: ratingTenantId,
        rating: ratingValue,
        comment: ratingComment,
      })
      toast.addToast('Thank you for your feedback!', 'success')
      setRatingWoId(null); setRatingTenantId(null); setRatingComment(''); setRatingValue(5)
      loadRequests() // Refresh to see rating
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Rating failed', 'error')
    }
  }

  // ── Status label styles ─────────────────────────────────
  function statusBadge(status: string) {
    const map: Record<string, string> = {
      SUBMITTED: 'bg-blue-100 text-blue-700',
      APPROVED: 'bg-indigo-100 text-indigo-700',
      ASSIGNED: 'bg-yellow-100 text-yellow-700',
      IN_PROGRESS: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-500',
      CANCELLED: 'bg-red-100 text-red-600',
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-500',
      // Fallbacks just in case
      submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-indigo-100 text-indigo-700',
      assigned: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-500',
      cancelled: 'bg-red-100 text-red-600',
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-500',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  // Assignable requests for work order dropdown (only submitted or approved)
  const assignableRequests = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED' || r.status === 'submitted' || r.status === 'approved')

  // ── Render ───────────────────────────────────────────────
  return (
    <PageLayout title="Maintenance" subtitle="Service Requests, Work Orders, Contractors & Performance">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex overflow-x-auto">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ────── REQUESTS TAB ────── */}
      {tab === 'requests' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit Request */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Submit Request</h3>
              <form onSubmit={handleSubmitRequest} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                  <select
                    value={isTenant ? (tenants.find(t => String(t.user?.id) === String(currentUserId))?.id || '') : reqTenantId}
                    onChange={e => !isTenant && setReqTenantId(e.target.value)}
                    className={`w-full p-2 border rounded ${isTenant ? 'bg-gray-50 dark:bg-slate-900 cursor-not-allowed' : ''}`}
                    required
                    disabled={isTenant}
                  >
                    <option value="">Select tenant</option>
                    {tenants.map((t: any) => (
                      <option key={t.id} value={String(t.id)}>{tenantLabel(t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={reqUnitId}
                    onChange={e => setReqUnitId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select unit</option>
                    {units.map((u: any) => (
                      <option key={u.id} value={String(u.id)}>{unitLabel(u)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={reqCategory}
                      onChange={e => setReqCategory(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={reqPriority}
                      onChange={e => setReqPriority(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Describe the maintenance issue..."
                    value={reqDescription}
                    onChange={e => setReqDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>

            {/* Summary Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded bg-blue-50 text-center">
                  <div className="text-2xl font-bold text-blue-700">{requests.filter(r => r.status === 'SUBMITTED' || r.status === 'submitted').length}</div>
                  <div className="text-xs text-gray-500">Open</div>
                </div>
                <div className="p-3 border rounded bg-yellow-50 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{requests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED' || r.status === 'in_progress' || r.status === 'assigned').length}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="p-3 border rounded bg-green-50 text-center">
                  <div className="text-2xl font-bold text-green-700">{requests.filter(r => r.status === 'COMPLETED' || r.status === 'completed').length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="p-3 border rounded bg-red-50 text-center">
                  <div className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'CANCELLED' || r.status === 'cancelled').length}</div>
                  <div className="text-xs text-gray-500">Cancelled</div>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">All Requests</h3>
            {reqLoading ? <div className="py-12 flex justify-center text-slate-500">Loading requests...</div> : requests.length === 0 ? (
              <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No requests found</div>
            ) : (
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Tenant</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Unit</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Category</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Priority</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Description</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-center">Contractor</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-center">Rating</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {requests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{tenantLabel(req.tenant)}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{unitLabel(req.unit)}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{req.category.replace('_', ' ')}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${req.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                            req.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              req.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>{req.priority}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate" title={req.description}>{req.description}</td>
                        <td className="px-6 py-4 text-center">
                          {req.contractor ? (
                            <div className="text-xs font-medium text-slate-700">{req.contractor.name}</div>
                          ) : req.workOrders?.[0]?.contractor ? (
                            <div className="text-xs font-medium text-slate-700">{req.workOrders[0].contractor.name}</div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {req.feedbacks?.[0]?.rating ? (
                            <span className="text-amber-500 font-bold">⭐ {req.feedbacks[0].rating}</span>
                          ) : req.rating ? (
                            <span className="text-amber-500 font-bold">⭐ {req.rating}</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(req.status).replace('bg-', 'bg-opacity-50 border-')} shadow-sm`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {isTenant && 
                           (req.status === 'COMPLETED' || req.status === 'completed') && 
                           !req.feedbacks?.length && (
                            <button
                              onClick={() => {
                                const woId = req.workOrders?.[0]?.id || req.work_order_id || req.id
                                setRatingWoId(woId)
                                setRatingTenantId(req.tenant?.id || '')
                              }}
                              className="text-amber-600 hover:text-amber-900 text-xs font-bold bg-amber-50 px-2 py-1 rounded"
                            >
                              Rate
                            </button>
                          )}
                          {req.status !== 'COMPLETED' && req.status !== 'CANCELLED' && req.status !== 'CLOSED' && req.status !== 'completed' && req.status !== 'cancelled' && req.status !== 'closed' && (
                            <button onClick={() => handleCancelRequest(req.id)} className="text-rose-600 hover:text-rose-900 text-xs font-medium px-2">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── WORK ORDERS TAB ────── */}
      {tab === 'work-orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Work Order */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Assign Work Order</h3>
              <form onSubmit={handleCreateWorkOrder} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request</label>
                  <select
                    value={woRequestId}
                    onChange={e => setWoRequestId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select request</option>
                    {assignableRequests.map((r: any) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.category} — {tenantLabel(r.tenant)} — {unitLabel(r.unit)}
                      </option>
                    ))}
                  </select>
                  {assignableRequests.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No open requests available. Submit a request first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
                  <select
                    value={woContractorId}
                    onChange={e => setWoContractorId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select contractor</option>
                    {contractors.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} — {c.specialization}
                      </option>
                    ))}
                  </select>
                  {contractors.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No contractors available. Add one in the Contractors tab.</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Cost Estimate (ETB)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">ETB</span>
                    <input
                      type="number"
                      placeholder="Estimated cost"
                      value={woCostEstimate}
                      onChange={e => setWoCostEstimate(e.target.value)}
                      className="form-input pl-12"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Scheduled Date</label>
                  <input
                    type="date"
                    value={woScheduledDate}
                    onChange={e => setWoScheduledDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Create Work Order
                  </button>
                </div>
              </form>
            </div>

            {/* Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-3">Work Order Flow</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                  <span><strong>Assigned</strong> → Contractor receives the job</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span>
                  <span><strong>In Progress</strong> → Work has started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  <span><strong>Completed</strong> → Proof uploaded, tenant notified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Work Orders Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">All Work Orders</h3>
            {woLoading ? <div className="py-12 flex justify-center text-slate-500">Loading work orders...</div> : workOrders.length === 0 ? (
              <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No work orders found</div>
            ) : (
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Request</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Contractor</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Scheduled</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Cost Est.</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Actual Cost</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {workOrders.map((wo: any) => (
                      <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-white capitalize">{wo.request?.category.replace('_', ' ') || '-'}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{tenantLabel(wo.request?.tenant)} · {unitLabel(wo.request?.unit)}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{wo.contractor?.name || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(wo.status).replace('bg-', 'bg-opacity-50 border-')} shadow-sm`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{wo.cost_estimate ? `ETB ${Number(wo.cost_estimate).toLocaleString()}` : '-'}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{wo.actual_cost ? `ETB ${Number(wo.actual_cost).toLocaleString()}` : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {(wo.status === 'ASSIGNED' || wo.status === 'assigned') && (
                            <button onClick={() => handleUpdateWorkOrderStatus(wo.id, 'in_progress')} className="text-orange-600 hover:text-orange-900 text-xs font-medium px-2">
                              Start Work
                            </button>
                          )}
                          {(wo.status === 'IN_PROGRESS' || wo.status === 'in_progress') && (
                            <button onClick={() => handleUpdateWorkOrderStatus(wo.id, 'completed')} className="text-emerald-600 hover:text-emerald-900 text-xs font-medium px-2">
                              Mark Complete (Proof)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── CONTRACTOR MODAL ────── */}
      {isConModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">{editingContractor ? 'Edit Contractor' : 'Add Contractor'}</h3>
            <form onSubmit={handleCreateContractor} className="space-y-4">
              <div>
                <label className="form-label">Name</label>
                <input
                  placeholder="Contractor name"
                  value={conName}
                  onChange={e => setConName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  placeholder="+251..."
                  value={conPhone}
                  onChange={e => setConPhone(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Specialization</label>
                <select
                  value={conSpec}
                  onChange={e => setConSpec(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select specialization</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsConModalOpen(false); setEditingContractor(null); setConName(''); setConPhone(''); setConSpec(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {editingContractor ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────── RATING MODAL ────── */}
      {ratingWoId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Rate Service</h3>
            <p className="text-sm text-gray-500 mb-4">How was the maintenance service?</p>
            <form onSubmit={handleRateJob} className="space-y-4">
              <div className="flex justify-center gap-2 text-4xl">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRatingValue(v)}
                    className={`transition-all duration-150 hover:scale-125 ${v <= ratingValue ? 'text-amber-400 drop-shadow-md' : 'text-gray-300 hover:text-amber-200'}`}
                    style={{ lineHeight: 1 }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{ratingValue} / 5 stars</p>
              <textarea
                placeholder="Optional comments..."
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                rows={3}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setRatingWoId(null); setRatingTenantId(null) }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Skip
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 font-bold">
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────── COMPLETION MODAL ────── */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4">Complete Work Order</h3>
            <form onSubmit={handleSubmitCompletion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost (ETB)</label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={e => setActualCost(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Completion (Photo)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setProofFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Optional — attach proof photo if available</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-bold">
                  Mark as Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────── CONTRACTORS TAB ────── */}
      {tab === 'contractors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-lg">Contractors</h3>
            {isAdmin && (
              <button
                onClick={() => { setEditingContractor(null); setConName(''); setConPhone(''); setConSpec(''); setIsConModalOpen(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Contractor
              </button>
            )}
          </div>
            {contractors.length === 0 ? (
              <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No contractors yet. Add one using the form.</div>
            ) : (
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Name</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Phone</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Specialization</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Rating</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {contractors.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.name}</td>
                        <td className="px-6 py-4 text-slate-600">{c.phone}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{c.specialization.replace('_', ' ')}</td>
                        <td className="px-6 py-4 text-amber-500 font-semibold">{c.rating ? `⭐ ${Number(c.rating).toFixed(1)}` : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAdmin && (
                              <button onClick={() => openEditContractor(c)} className="text-blue-600 hover:text-blue-900 text-xs font-medium">
                                Edit
                              </button>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(c.status).replace('bg-', 'bg-opacity-50 border-')} shadow-sm`}>
                              {c.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      )}

      {/* ────── REPORTS TAB ────── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {reportData ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Avg. Resolution Time</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {reportData.avgResolutionTime
                      ? `${(reportData.avgResolutionTime / 3600).toFixed(1)} hrs`
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Contractors</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {reportData.contractorStats?.length || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Completed Orders</div>
                  <div className="text-2xl font-bold text-green-700">
                    {reportData.contractorStats?.reduce((sum: number, c: any) => sum + (c.completedOrders || 0), 0) || 0}
                  </div>
                </div>
              </div>

              {/* Contractor Performance */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Contractor Performance</h3>
                {reportData.contractorStats?.length > 0 ? (
                  <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 font-medium tracking-wider">Contractor</th>
                          <th className="px-6 py-4 font-medium tracking-wider">Jobs Completed</th>
                          <th className="px-6 py-4 font-medium tracking-wider">Avg. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {reportData.contractorStats.map((cs: any, i: number) => (
                          <tr key={cs.contractor_id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{cs.name}</td>
                            <td className="px-6 py-4 text-emerald-600 font-semibold text-lg">{cs.completedOrders}</td>
                            <td className="px-6 py-4 text-slate-700 font-mono">{cs.avgCost ? `ETB ${Number(cs.avgCost).toLocaleString()}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No performance data available yet.</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-sm">Loading report data...</div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
