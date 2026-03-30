import React, { useEffect, useState, useMemo } from 'react'
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  BarChart3,
  Filter,
  ArrowRight,
  TrendingUp,
  User,
  MapPin
} from 'lucide-react'
import PageLayout from '../components/PageLayout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastProvider'
import * as maintenanceApi from '../api/maintenance'
import { listTenants } from '../api/tenants'
import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { getRoles, getUserId } from '../utils/jwt'

type Tab = 'requests' | 'work-orders' | 'contractors' | 'reports' | 'schedules'

const TABS: { key: Tab; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'work-orders', label: 'Work Orders' },
  { key: 'contractors', label: 'Contractors' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'reports', label: 'Reports' },
]

const CATEGORIES = ['plumbing', 'electrical', 'hvac', 'structural', 'cleaning', 'pest_control', 'other']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function Maintenance() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('requests')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [filterBuilding, setFilterBuilding] = useState('')

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
  const [buildings, setBuildings] = useState<any[]>([])

  // ── Requests ─────────────────────────────────────────────
  const [requests, setRequests] = useState<any[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [reqTenantId, setReqTenantId] = useState('')
  const [reqUnitId, setReqUnitId] = useState('')
  const [reqCategory, setReqCategory] = useState('plumbing')
  const [customCategory, setCustomCategory] = useState('')
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

  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [startWoId, setStartWoId] = useState<string | null>(null)
  const [startPhoto, setStartPhoto] = useState<File | null>(null)

  const [woPhotoReported, setWoPhotoReported] = useState<File | null>(null)

  // ── Schedules ────────────────────────────────────────────
  const [schedules, setSchedules] = useState<any[]>([])
  const [schLoading, setSchLoading] = useState(false)
  const [schName, setSchName] = useState('')
  const [schCategory, setSchCategory] = useState('elevator')
  const [schPriority, setSchPriority] = useState('medium')
  const [schFreq, setSchFreq] = useState('90')
  const [schDate, setSchDate] = useState(new Date().toISOString().split('T')[0])
  const [schBuildingId, setSchBuildingId] = useState('')
  const [schDesc, setSchDesc] = useState('')

  // ── Load helpers ─────────────────────────────────────────
  useEffect(() => {
    loadLookups()
    loadContractors()
  }, [])

  useEffect(() => {
    if (tab === 'requests') loadRequests()
    if (tab === 'work-orders') { loadWorkOrders(); loadRequests() }
    if (tab === 'schedules') loadSchedules()
    if (tab === 'reports') loadReport()
  }, [tab])

  async function loadLookups() {
    try {
      const t: any = await listTenants({ page: 1, per_page: 500 })
      setTenants(Array.isArray(t) ? t : [])
    } catch (e: any) { console.error('load tenants', e) }
    try {
      const u: any = await listUnits()
      const ul = Array.isArray(u) ? u : (u?.data || [])
      setUnits(ul)
      if (isTenant && ul.length > 0) {
        // Find units belonging to this tenant
        const tenantUnits = ul.filter((unit: any) => unit.tenant?.user?.id === currentUserId)
        if (tenantUnits.length > 0) {
          setReqUnitId(tenantUnits[0].id)
        }
      }
    } catch (e: any) { console.error('load units', e) }
    try {
      const b: any = await listBuildings({ per_page: 500 })
      const bl = Array.isArray(b) ? b : (b?.data || [])
      setBuildings(bl)
    } catch (e: any) { console.error('load buildings', e) }
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

  // ── Stats ──────────────────────────────────────────────
  const maintenanceStats = useMemo(() => {
    const pending = requests.filter(r => ['SUBMITTED', 'submitted', 'APPROVED', 'approved', 'ASSIGNED', 'assigned'].includes(r.status)).length
    const inProgress = requests.filter(r => ['IN_PROGRESS', 'in_progress'].includes(r.status)).length
    const completed = requests.filter(r => ['COMPLETED', 'completed'].includes(r.status)).length
    const critical = requests.filter(r => r.priority === 'urgent' && r.status !== 'COMPLETED' && r.status !== 'completed').length
    
    // Calculate avg response (dummy logic if not in API)
    const avgResponse = "2.4 hrs"
    const efficiency = "94%"

    return { pending, inProgress, completed, critical, avgResponse, efficiency }
  }, [requests])

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
        photo_reported: woPhotoReported || undefined,
      })
      toast.addToast('Work order created', 'success')
      setWoRequestId(''); setWoContractorId(''); setWoScheduledDate(''); setWoCostEstimate(''); setWoPhotoReported(null)
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
    if (status === 'in_progress') {
      setStartWoId(id)
      setIsStartModalOpen(true)
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

  async function handleStartWork(e: React.FormEvent) {
    e.preventDefault()
    if (!startWoId) return
    try {
      await maintenanceApi.updateWorkOrderStatus(startWoId, 'in_progress', undefined, startPhoto || undefined)
      toast.addToast('Work started', 'success')
      setIsStartModalOpen(false)
      setStartWoId(null)
      setStartPhoto(null)
      loadWorkOrders()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to start work', 'error')
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
      await maintenanceApi.submitMaintenanceFeedback({
        work_order_id: ratingWoId,
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

  // ── Schedule Handlers ───────────────────────────────────
  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault()
    try {
      await maintenanceApi.createSchedule({
        name: schName,
        category: schCategory,
        priority: schPriority,
        frequency_days: Number(schFreq),
        next_due_date: schDate,
        description: schDesc,
        building_id: schBuildingId || undefined,
      })
      toast.addToast('Schedule created', 'success')
      setSchName(''); setSchDesc('')
      loadSchedules()
    } catch { toast.addToast('Failed to create schedule', 'error') }
  }

  async function handleRunMaintenanceCron() {
    try {
      const res = await maintenanceApi.runMaintenanceCron()
      toast.addToast(`Automation complete: ${res.generatedRequests} requests generated`, 'info')
      loadRequests()
      loadSchedules()
    } catch { toast.addToast('Failed to run maintenance automation', 'error') }
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm('Delete this maintenance schedule?')) return
    try {
      await maintenanceApi.deleteSchedule(id)
      toast.addToast('Schedule deleted', 'success')
      loadSchedules()
    } catch { toast.addToast('Delete failed', 'error') }
  }

  async function loadSchedules() {
    setSchLoading(true)
    try {
      const data = await maintenanceApi.getSchedules()
      setSchedules(Array.isArray(data) ? data : [])
    } catch { toast.addToast('Failed to load schedules', 'error') }
    finally { setSchLoading(false) }
  }

  async function loadReport() {
    try {
      const data = await maintenanceApi.getReport()
      setReportData(data)
    } catch { toast.addToast('Failed to load reports', 'error') }
  }

  // ── Status label styles ─────────────────────────────────
  function getStatusType(status: string): any {
    const s = status.toLowerCase()
    if (s === 'submitted' || s === 'pending') return 'draft'
    if (s === 'assigned') return 'sent'
    if (s === 'in_progress') return 'sent' // Or add a specific in_progress if needed
    if (s === 'completed' || s === 'closed') return 'active'
    if (s === 'cancelled' || s === 'failed') return 'terminated'
    return 'draft'
  }

  // Assignable requests for work order dropdown (only submitted or approved)
  const assignableRequests = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED' || r.status === 'submitted' || r.status === 'approved')

  // ── Render ───────────────────────────────────────────────
  return (
    <PageLayout 
      title="Maintenance Pulse" 
      subtitle="Operations / Maintenance Board"
      searchPlaceholder="Search requests, tickets..."
      actions={
        <div className="flex items-center gap-3">
          <select 
            value={filterBuilding} 
            onChange={e => setFilterBuilding(e.target.value)}
            className="form-select w-40 h-[42px]"
          >
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)}
          </select>
          <button onClick={() => setTab('requests')} className="button">
            <Plus size={16} /> New Request
          </button>
        </div>
      }
    >
      <div className="space-y-6">

      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {visibleTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${tab === t.key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        {(tab === 'requests' || tab === 'work-orders') && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> List View
            </button>
          </div>
        )}
      </div>

      {/* ────── REQUESTS TAB ────── */}
      {tab === 'requests' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            {viewMode === 'kanban' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PENDING COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">Pending</h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500">
                        {maintenanceStats.pending}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {requests
                      .filter(r => ['SUBMITTED', 'submitted', 'APPROVED', 'approved', 'ASSIGNED', 'assigned'].includes(r.status))
                      .map(req => (
                        <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                              req.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {req.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{req.id.slice(0,6)}</span>
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1 capitalize truncate">{req.category.replace('_',' ')}</h5>
                          <p className="text-xs text-slate-500 mb-4 line-clamp-2">{req.description}</p>
                          <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                              {tenantLabel(req.tenant).charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">{tenantLabel(req.tenant)}</p>
                              <p className="text-[9px] text-slate-400">{unitLabel(req.unit)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* IN PROGRESS COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">In Progress</h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500">
                        {maintenanceStats.inProgress}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {requests
                      .filter(r => ['IN_PROGRESS', 'in_progress'].includes(r.status))
                      .map(req => (
                        <div key={req.id} className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">Active</span>
                            <Clock size={12} className="text-indigo-500 animate-pulse" />
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1 capitalize truncate">{req.category.replace('_',' ')}</h5>
                          <div className="w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full h-1 my-3">
                            <div className="bg-indigo-600 h-1 rounded-full w-[65%]"></div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <User size={12} className="text-slate-400" />
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{req.contractor?.name || 'Assigned'}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* COMPLETED COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs">Completed</h4>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500">
                        {maintenanceStats.completed}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {requests
                      .filter(r => ['COMPLETED', 'completed', 'CLOSED', 'closed'].includes(r.status))
                      .map(req => (
                        <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 opacity-80">
                          <div className="flex justify-between items-center mb-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Resolved</span>
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1 truncate">{req.category.replace('_',' ')}</h5>
                          <p className="text-[10px] text-slate-400 italic">Resolved in 4.2 hrs</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Submit Request */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 tracking-tight text-lg">Submit Request</h3>
              <form onSubmit={handleSubmitRequest} className="space-y-3">
                <div>
                  <label className="form-label">Tenant</label>
                  <select
                    value={isTenant ? (tenants.find(t => String(t.user?.id) === String(currentUserId))?.id || '') : reqTenantId}
                    onChange={e => !isTenant && setReqTenantId(e.target.value)}
                    className={`form-select ${isTenant ? 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed' : ''}`}
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
                  <label className="form-label">Unit</label>
                  <select
                    value={reqUnitId}
                    onChange={e => setReqUnitId(e.target.value)}
                    className="form-select"
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
                    <label className="form-label">Category</label>
                    <select
                      value={reqCategory}
                      onChange={e => setReqCategory(e.target.value)}
                      className="form-select"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                    {reqCategory === 'other' && (
                      <input
                        type="text"
                        placeholder="Specify category..."
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="form-input mt-2"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      value={reqPriority}
                      onChange={e => setReqPriority(e.target.value)}
                      className="form-select"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Describe the maintenance issue..."
                    value={reqDescription}
                    onChange={e => setReqDescription(e.target.value)}
                    className="form-input"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="button">
                    Submit Request
                  </button>
                </div>
              </form>
            </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 text-center">
                      <div className="text-2xl font-bold text-indigo-700">{requests.filter(r => ['SUBMITTED', 'submitted'].includes(r.status)).length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Open</div>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 text-center">
                      <div className="text-2xl font-bold text-amber-700">{requests.filter(r => ['IN_PROGRESS', 'ASSIGNED', 'in_progress', 'assigned'].includes(r.status)).length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</div>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 text-center">
                      <div className="text-2xl font-bold text-emerald-700">{requests.filter(r => ['COMPLETED', 'completed'].includes(r.status)).length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Done</div>
                    </div>
                    <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 text-center">
                      <div className="text-2xl font-bold text-rose-600">{requests.filter(r => ['CANCELLED', 'cancelled'].includes(r.status)).length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cancelled</div>
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
                          <th className="px-6 py-4 font-medium tracking-wider text-center">SLA</th>
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
                               <StatusBadge status={req.status || 'draft'} />
                            </td>
                            <td className="px-6 py-4 text-center">
                              {req.is_sla_breached ? (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase animate-pulse">Breached</span>
                              ) : req.sla_deadline ? (
                                <div className="text-[10px] text-slate-500 leading-tight">
                                  Due: {new Date(req.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              ) : '-'}
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
        </div>

          {/* Operations Digest Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 tracking-tight text-lg">Operations Digest</h3>
                  <p className="text-xs text-slate-500">Fleet performance & workload</p>
               </div>
               <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-medium text-slate-600">Active Workload</span>
                       <span className="text-xl font-bold text-indigo-600">{maintenanceStats.pending + maintenanceStats.inProgress}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                       <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                       <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Avg Response</div>
                       <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{maintenanceStats.avgResponse}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                       <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Efficiency</div>
                       <div className="text-sm font-bold text-emerald-600">{maintenanceStats.efficiency}</div>
                    </div>
                  </div>

                  {maintenanceStats.critical > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600">
                          <AlertCircle size={18} />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-rose-700 dark:text-rose-400">Urgent Alerts</div>
                          <div className="text-[10px] text-rose-600 dark:text-rose-500">{maintenanceStats.critical} critical tickets require immediate attention</div>
                       </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Scheduled Today</h4>
                    <div className="space-y-3">
                       {schedules.slice(0, 3).map(sch => (
                         <div key={sch.id} className="flex items-center gap-3 group">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{sch.name}</p>
                               <p className="text-[10px] text-slate-400">Due {new Date(sch.next_due_date).toLocaleDateString()}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                         </div>
                       ))}
                       {schedules.length === 0 && <p className="text-xs text-slate-400 italic">No schedules for today</p>}
                    </div>
                  </div>
               </div>
            </div>
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
                  <label className="form-label">Request</label>
                  <select
                    value={woRequestId}
                    onChange={e => setWoRequestId(e.target.value)}
                    className="form-select"
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
                  <label className="form-label">Contractor</label>
                  <select
                    value={woContractorId}
                    onChange={e => setWoContractorId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">Select contractor</option>
                    {contractors.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.specialization})
                      </option>
                    ))}
                  </select>
                  {contractors.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">No contractors available. Add one in the Contractors tab.</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Preliminary Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setWoPhotoReported(e.target.files?.[0] || null)}
                    className="form-input text-xs pt-1.5"
                  />
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
                  <button type="submit" className="button">
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
                      <th className="px-6 py-4 font-medium tracking-wider text-center">SLA</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Photos</th>
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
                           <StatusBadge status={wo.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {wo.is_resolution_breached ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase animate-pulse">Breached</span>
                          ) : wo.sla_resolution_deadline ? (
                            <div className="text-[10px] text-slate-500 leading-tight">
                              {new Date(wo.sla_resolution_deadline).toLocaleDateString()}
                            </div>
                          ) : '-'}
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

      {/* ────── START WORK MODAL ────── */}
      {isStartModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4">Start Work Order</h3>
            <form onSubmit={handleStartWork} className="space-y-4">
              <p className="text-sm text-slate-500 italic">Moving this work order to "In Progress".</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Arrival Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setStartPhoto(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-bold">
                  Begin Work
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
                            <StatusBadge status={c.status || 'active'} />
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

      {/* ────── SCHEDULES TAB ────── */}
      {tab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Maintenance Automation</h3>
            <button
              onClick={handleRunMaintenanceCron}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <span className="text-lg">⚙️</span> Run Automation Now
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 tracking-tight text-lg">New Recurring Schedule</h3>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className="form-label">Schedule Name</label>
                  <input
                    placeholder="e.g. Quarterly Elevator Inspection"
                    value={schName}
                    onChange={e => setSchName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Category</label>
                    <select value={schCategory} onChange={e => setSchCategory(e.target.value)} className="form-select">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select value={schPriority} onChange={e => setSchPriority(e.target.value)} className="form-select">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Frequency (Days)</label>
                    <input
                      type="number"
                      value={schFreq}
                      onChange={e => setSchFreq(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Next Due Date</label>
                    <input
                      type="date"
                      value={schDate}
                      onChange={e => setSchDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Target Building (Optional)</label>
                  <select value={schBuildingId} onChange={e => setSchBuildingId(e.target.value)} className="form-select">
                    <option value="">Global / All Buildings</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Note / Instruction</label>
                  <textarea
                    value={schDesc}
                    onChange={e => setSchDesc(e.target.value)}
                    className="form-input h-24"
                    placeholder="Specific instructions for the technician..."
                  />
                </div>
                <button type="submit" className="button w-full justify-center py-3">Create Schedule</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Active Schedules</h3>
              {schLoading ? <div className="py-12 flex justify-center text-slate-500">Loading schedules...</div> : (
                <div className="table-container border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <th className="px-6 py-4">Task Name</th>
                        <th className="px-6 py-4">Building</th>
                        <th className="px-6 py-4">Frequency</th>
                        <th className="px-6 py-4">Next Due</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {schedules.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No recurring schedules configured yet.</td></tr>
                      ) : schedules.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                            <div className="text-xs text-slate-500 capitalize">{s.category} · {s.priority}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{s.building?.name || 'Global'}</td>
                          <td className="px-6 py-4 text-slate-600">{s.frequency_days} days</td>
                          <td className="px-6 py-4">
                            <div className={`font-medium ${new Date(s.next_due_date) <= new Date() ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                              {s.next_due_date}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteSchedule(s.id)} className="text-rose-600 hover:text-rose-900 font-medium">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
    </div>
    </PageLayout>
  )
}
