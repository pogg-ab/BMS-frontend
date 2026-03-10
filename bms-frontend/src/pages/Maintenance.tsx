import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as maintenanceApi from '../api/maintenance'
import { listTenants } from '../api/tenants'
import { listUnits } from '../api/units'

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
      })
      toast.addToast('Work order created', 'success')
      setWoRequestId(''); setWoContractorId(''); setWoScheduledDate('')
      loadWorkOrders()
      loadRequests()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join('; ') : (msg || 'Create work order failed'), 'error')
    }
  }

  async function handleUpdateWorkOrderStatus(id: string, status: string) {
    if (status === 'completed') {
      // For completed status, prompt for a proof file
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async () => {
        const file = input.files?.[0]
        try {
          await maintenanceApi.updateWorkOrderStatus(id, status, file || undefined)
          toast.addToast('Work order completed', 'success')
          loadWorkOrders()
        } catch (e: any) {
          toast.addToast(e?.response?.data?.message || 'Update failed', 'error')
        }
      }
      input.click()
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

  // ── Contractor CRUD ─────────────────────────────────────
  async function handleCreateContractor(e: React.FormEvent) {
    e.preventDefault()
    try {
      await maintenanceApi.createContractor({
        name: conName,
        phone: conPhone,
        specialization: conSpec,
      })
      toast.addToast('Contractor created', 'success')
      setConName(''); setConPhone(''); setConSpec('')
      loadContractors()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Create contractor failed', 'error')
    }
  }

  // ── Status label styles ─────────────────────────────────
  function statusBadge(status: string) {
    const map: Record<string, string> = {
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
  const assignableRequests = requests.filter(r => r.status === 'submitted' || r.status === 'approved')

  // ── Render ───────────────────────────────────────────────
  return (
    <PageLayout title="Maintenance" subtitle="Service Requests, Work Orders, Contractors & Performance">
      {/* Tab Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Submit Request</h3>
              <form onSubmit={handleSubmitRequest} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                  <select
                    value={reqTenantId}
                    onChange={e => setReqTenantId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded bg-blue-50 text-center">
                  <div className="text-2xl font-bold text-blue-700">{requests.filter(r => r.status === 'submitted').length}</div>
                  <div className="text-xs text-gray-500">Open</div>
                </div>
                <div className="p-3 border rounded bg-yellow-50 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{requests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length}</div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="p-3 border rounded bg-green-50 text-center">
                  <div className="text-2xl font-bold text-green-700">{requests.filter(r => r.status === 'completed').length}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="p-3 border rounded bg-red-50 text-center">
                  <div className="text-2xl font-bold text-red-600">{requests.filter(r => r.status === 'cancelled').length}</div>
                  <div className="text-xs text-gray-500">Cancelled</div>
                </div>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">All Requests</h3>
            {reqLoading ? <div className="text-gray-500">Loading...</div> : requests.length === 0 ? (
              <div className="text-gray-400 text-sm">No requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="p-3">Tenant</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req: any) => (
                      <tr key={req.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{tenantLabel(req.tenant)}</td>
                        <td className="p-3">{unitLabel(req.unit)}</td>
                        <td className="p-3 capitalize">{req.category}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${req.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              req.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                req.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                            }`}>{req.priority}</span>
                        </td>
                        <td className="p-3 max-w-[200px] truncate" title={req.description}>{req.description}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</td>
                        <td className="p-3">
                          {req.status !== 'completed' && req.status !== 'cancelled' && req.status !== 'closed' && (
                            <button onClick={() => handleCancelRequest(req.id)} className="text-red-600 hover:underline text-xs">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={woScheduledDate}
                    onChange={e => setWoScheduledDate(e.target.value)}
                    className="w-full p-2 border rounded"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">All Work Orders</h3>
            {woLoading ? <div className="text-gray-500">Loading...</div> : workOrders.length === 0 ? (
              <div className="text-gray-400 text-sm">No work orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="p-3">Request</th>
                      <th className="p-3">Contractor</th>
                      <th className="p-3">Scheduled</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Cost Est.</th>
                      <th className="p-3">Actual Cost</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo: any) => (
                      <tr key={wo.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium capitalize">{wo.request?.category || '-'}</div>
                          <div className="text-xs text-gray-400">{tenantLabel(wo.request?.tenant)} · {unitLabel(wo.request?.unit)}</div>
                        </td>
                        <td className="p-3">{wo.contractor?.name || '-'}</td>
                        <td className="p-3 text-xs">{wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString() : '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(wo.status)}`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="p-3">{wo.cost_estimate ? `ETB ${Number(wo.cost_estimate).toLocaleString()}` : '-'}</td>
                        <td className="p-3">{wo.actual_cost ? `ETB ${Number(wo.actual_cost).toLocaleString()}` : '-'}</td>
                        <td className="p-3 space-x-2">
                          {wo.status === 'assigned' && (
                            <button onClick={() => handleUpdateWorkOrderStatus(wo.id, 'in_progress')} className="text-orange-600 hover:underline text-xs">
                              Start
                            </button>
                          )}
                          {wo.status === 'in_progress' && (
                            <button onClick={() => handleUpdateWorkOrderStatus(wo.id, 'completed')} className="text-green-600 hover:underline text-xs">
                              Complete + Proof
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

      {/* ────── CONTRACTORS TAB ────── */}
      {tab === 'contractors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">Add Contractor</h3>
            <form onSubmit={handleCreateContractor} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  placeholder="Contractor name"
                  value={conName}
                  onChange={e => setConName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  placeholder="+251..."
                  value={conPhone}
                  onChange={e => setConPhone(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={conSpec}
                  onChange={e => setConSpec(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select specialization</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  Add Contractor
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">Contractors</h3>
            {contractors.length === 0 ? (
              <div className="text-gray-400 text-sm">No contractors yet. Add one using the form.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="p-3">Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Specialization</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3 capitalize">{c.specialization}</td>
                        <td className="p-3">{c.rating ? `⭐ ${Number(c.rating).toFixed(1)}` : '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(c.status)}`}>
                            {c.status}
                          </span>
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

      {/* ────── REPORTS TAB ────── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {reportData ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Avg. Resolution Time</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {reportData.avgResolutionTime
                      ? `${(reportData.avgResolutionTime / 3600).toFixed(1)} hrs`
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Contractors</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {reportData.contractorStats?.length || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                  <div className="text-sm text-gray-500 mb-1">Completed Orders</div>
                  <div className="text-2xl font-bold text-green-700">
                    {reportData.contractorStats?.reduce((sum: number, c: any) => sum + (c.completedOrders || 0), 0) || 0}
                  </div>
                </div>
              </div>

              {/* Contractor Performance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold mb-4">Contractor Performance</h3>
                {reportData.contractorStats?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="text-left border-b bg-gray-50">
                          <th className="p-3">Contractor</th>
                          <th className="p-3">Completed</th>
                          <th className="p-3">Avg. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.contractorStats.map((cs: any, i: number) => (
                          <tr key={cs.contractor_id || i} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{cs.name}</td>
                            <td className="p-3">{cs.completedOrders}</td>
                            <td className="p-3">{cs.avgCost ? `ETB ${Number(cs.avgCost).toLocaleString()}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">No performance data available yet.</div>
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
