import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { listBuildings, createBuilding, getBuilding, updateBuilding, deleteBuilding, listAmenities, assignAdmin, listAdmins, revokeAdmin } from '../api/buildings'
import api from '../api/axios'
import { Building2, MapPin, Plus, Search, Pen, Trash2, Eye, X, Users, Layers, Home, TrendingUp, AlertCircle, DollarSign } from 'lucide-react'

type Building = {
  id: number | string
  name: string
  code?: string
  address?: string
  siteId?: string
  ownerId?: string
  type?: string
  units_count?: number
  is_active?: boolean
  image_url?: string
  total_units?: number
  occupied_units?: number
  floors?: number
  status?: string
  city?: string
  subcity?: string
}

export default function Buildings() {
  const navigate = useNavigate()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [page, setPage] = useState(1)
  const [searchParams, setSearchParams] = useSearchParams()
  const filterSiteId = searchParams.get('siteId') || ''
  const filterOwnerId = searchParams.get('ownerId') || ''
  
  const [searchQuery, setSearchQuery] = useState('')

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [siteId, setSiteId] = useState<string>('')
  const [ownerId, setOwnerId] = useState<string>('')
  const [type, setType] = useState<string>('residential')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const imageRef = useRef<HTMLInputElement | null>(null)

  const [sites, setSites] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [assignAdminUserId, setAssignAdminUserId] = useState('')

  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [amenities, setAmenities] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await listBuildings({ page, per_page: 500 })
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray(res.data)) list = res.data
      else list = []
      setBuildings(list)

      import('../api/sites').then(m => m.listSites().then(s => setSites(Array.isArray(s) ? s : []))).catch(console.error)
      import('../api/owners').then(m => m.listOwners().then(o => setOwners(Array.isArray(o) ? o : (o.data || [])))).catch(console.error)
      import('../api/users').then(m => m.listUsers({ page: 1, per_page: 500 }).then((u: any) => {
        const list = Array.isArray(u) ? u : (u?.data || u?.users || [])
        setAllUsers(list)
      })).catch(console.error)
    } catch (e: any) {
      console.error('load buildings', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  // Filtered buildings
  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) return buildings
    const q = searchQuery.toLowerCase()
    return buildings.filter(b => {
      // 1. Text Search
      if (searchQuery.trim() && !(
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q)
      )) return false

      // 2. Hierarchy Search
      if (filterSiteId && String(b.siteId || (b as any).site_id) !== String(filterSiteId)) return false
      if (filterOwnerId && String(b.ownerId || (b as any).owner_id) !== String(filterOwnerId)) return false

      return true
    })
  }, [buildings, searchQuery, filterSiteId, filterOwnerId])

  // Portfolio stats
  const portfolioStats = useMemo(() => {
    const totalUnits = buildings.reduce((s, b) => s + ((b as any).total_units || b.units_count || 0), 0)
    const occupiedUnits = buildings.reduce((s, b) => s + ((b as any).occupied_units || 0), 0)
    const avgOccupancy = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0'
    const activeCount = buildings.filter(b => (b as any).status === 'ACTIVE' || b.is_active).length
    return { totalUnits, occupiedUnits, avgOccupancy, activeCount, totalBuildings: buildings.length }
  }, [buildings])

  function openCreate() {
    setEditing(null); setName(''); setCode(''); setAddress(''); setSiteId(''); setOwnerId(''); setType('residential'); setImageUrl(''); setDescription(''); setShowForm(true)
  }

  function openEdit(b: Building) {
    setEditing(b); setName(b.name || ''); setCode(b.code || ''); setAddress(b.address || '')
    setSiteId(b.siteId || (b as any).site_id || ''); setOwnerId(b.ownerId || (b as any).owner_id || '')
    setType(b.type || 'residential'); setImageUrl(b.image_url || ''); setDescription((b as any).description || ''); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = { name, code, address, siteId, ownerId, type }
      if (imageUrl) payload.image_url = imageUrl
      if (description) payload.description = description
      if (editing) { await updateBuilding(editing.id, payload) }
      else { await createBuilding(payload) }
      setShowForm(false); load()
    } catch (err: any) {
      console.error('submit building', err)
      const msg = err?.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(',') : (msg || 'Operation failed'))
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await api.post('/upload/image?type=buildings', fd)
      if (res.data?.path) setImageUrl(res.data.path)
    } catch { alert('Image upload failed') }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('Delete this building?')) return
    try { await deleteBuilding(id); load() } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete') }
  }

  function openDetails(id: string | number) {
    navigate(`/units?buildingId=${id}`)
  }

  async function handleAssignAdmin(buildingId: string | number) {
    if (!assignAdminUserId) return
    try { await assignAdmin(buildingId, assignAdminUserId); setAssignAdminUserId(''); openDetails(buildingId) }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed to assign admin') }
  }

  async function handleRevokeAdmin(buildingId: string | number, userId: string | number) {
    if (!confirm('Revoke admin?')) return
    try { await revokeAdmin(buildingId, userId); openDetails(buildingId) }
    catch (e: any) { alert(e?.response?.data?.message || 'Failed to revoke admin') }
  }

  function getOccupancyRate(b: any) {
    const total = b.total_units || b.units_count || 0
    const occupied = b.occupied_units || 0
    if (total === 0) return 0
    return Math.round((occupied / total) * 100)
  }

  function getOccupancyColor(rate: number) {
    if (rate >= 80) return 'bg-emerald-500'
    if (rate >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  function getBuildingStatus(b: any) {
    if (b.status) return b.status
    return b.is_active ? 'ACTIVE' : 'INACTIVE'
  }

  const apiBase = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'

  return (
    <PageLayout
      title="Buildings"
      subtitle={`${buildings.length} properties with real-time telemetry and occupancy tracking across your district portfolio.`}
      searchPlaceholder="Search buildings..."
      actions={
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search properties or addresses..."
              className="pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
          <select
            value={filterSiteId}
            onChange={e => setSearchParams(prev => {
              const p = new URLSearchParams(prev)
              if (e.target.value) p.set('siteId', e.target.value); else p.delete('siteId')
              return p
            })}
            className="py-2 pl-3 pr-8 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer hidden md:block"
          >
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}
          </select>
          <select
            value={filterOwnerId}
            onChange={e => setSearchParams(prev => {
              const p = new URLSearchParams(prev)
              if (e.target.value) p.set('ownerId', e.target.value); else p.delete('ownerId')
              return p
            })}
            className="py-2 pl-3 pr-8 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer hidden md:block"
          >
            <option value="">All Owners</option>
            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button onClick={openCreate} className="button shadow-md">
            <Plus size={16} /> Add Property
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Building Cards Grid */}
        {loading ? (
          <div className="py-16 flex justify-center text-slate-400">
            <div className="flex items-center gap-3">Loading properties...</div>
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No properties found</p>
            <p className="text-sm mt-1">Add a property to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuildings.map(b => {
              const occupancy = getOccupancyRate(b)
              const status = getBuildingStatus(b)
              const totalUnits = (b as any).total_units || b.units_count || 0
              const floors = (b as any).floors || '-'
              const occupiedUnits = (b as any).occupied_units || 0

              return (
                <div key={String(b.id)} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => openDetails(b.id)}>
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                    {b.image_url ? (
                      <img src={`${apiBase}${b.image_url}`} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 size={48} className="text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm ${
                        status === 'ACTIVE' ? 'bg-emerald-500/90 text-white' : status === 'MAINTENANCE' ? 'bg-rose-500/90 text-white' : 'bg-slate-500/90 text-white'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-white' : status === 'MAINTENANCE' ? 'bg-white' : 'bg-white/60'}`} />
                        {status}
                      </span>
                    </div>
                    {/* Action Buttons (hover) */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); openEdit(b) }} className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-white shadow-sm backdrop-blur-sm transition-all">
                        <Pen size={14} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(b.id) }} className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 text-rose-500 hover:bg-white shadow-sm backdrop-blur-sm transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{b.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{b.address || 'No address'}</span>
                    </div>

                    {/* Occupancy Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Occupancy Rate</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{occupancy}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${getOccupancyColor(occupancy)}`} style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-800 dark:text-white">{totalUnits}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Units</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-800 dark:text-white">{floors}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Floors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{occupiedUnits}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Occupied</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Portfolio Overview Card */}
        {buildings.length > 0 && (
          <div className="kpi-gradient-purple rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4">Portfolio Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-white">{portfolioStats.avgOccupancy}%</div>
                <div className="text-sm text-white/70 mt-1">Avg. Occupancy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{portfolioStats.activeCount}</div>
                <div className="text-sm text-white/70 mt-1">Active Properties</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{portfolioStats.totalUnits}</div>
                <div className="text-sm text-white/70 mt-1">Total Units</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{portfolioStats.occupiedUnits}</div>
                <div className="text-sm text-white/70 mt-1">Occupied Units</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Edit Property' : 'Add New Property'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Building Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="e.g. Skyline Tower" />
                </div>
                <div>
                  <label className="form-label">Building Code</label>
                  <input required value={code} onChange={e => setCode(e.target.value)} className="form-input" placeholder="BLD-01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Site</label>
                  <select value={siteId} onChange={e => setSiteId(e.target.value)} className="form-select" required>
                    <option value="">Select site</option>
                    {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Owner</label>
                  <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="form-select" required>
                    <option value="">Select owner</option>
                    {owners.map((o: any) => <option key={o.id} value={o.id}>{o.name || o.id}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="form-select">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed Use</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Address</label>
                  <input required value={address} onChange={e => setAddress(e.target.value)} className="form-input" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="form-label">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input h-20 resize-none" placeholder="Brief description of the property..." />
              </div>
              <div>
                <label className="form-label">Building Image</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                  <button type="button" className="button-secondary text-xs" onClick={() => imageRef.current?.click()}>
                    Upload Image
                  </button>
                  {imageUrl && <img src={`${apiBase}${imageUrl}`} alt="Preview" className="h-12 w-12 object-cover rounded-lg" />}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="button" type="submit">{editing ? 'Save Changes' : 'Add Property'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Building Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Building Details</h3>
              <button onClick={() => { setDetailId(null); setDetail(null) }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18} className="text-slate-400" /></button>
            </div>
            {detail ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex gap-5">
                  {detail.image_url && (
                    <img src={`${apiBase}${detail.image_url}`} alt={detail.name} className="w-32 h-24 object-cover rounded-xl" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{detail.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{detail.address || 'No address'}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm"><strong className="text-slate-700 dark:text-slate-300">Code:</strong> <span className="text-slate-500">{detail.code || '-'}</span></span>
                      <span className="text-sm"><strong className="text-slate-700 dark:text-slate-300">Site:</strong> <span className="text-slate-500">{detail.site?.name || detail.site_id || '-'}</span></span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <Home size={20} className="text-indigo-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{detail.units_count || detail.total_units || 0}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">Units</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <Layers size={20} className="text-emerald-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{detail.floors || '-'}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">Floors</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <Users size={20} className="text-amber-500 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{detail.occupied_units || 0}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider">Occupied</div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Amenities</h4>
                  {amenities.length === 0 ? (
                    <p className="text-sm text-slate-400">No amenities listed</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {amenities.map(a => (
                        <span key={a.id} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-lg">{a.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admins */}
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Building Admins</h4>
                  {admins.length === 0 ? (
                    <p className="text-sm text-slate-400">No admins assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {admins.map(a => (
                        <div key={a.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {(a.name || a.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{a.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{a.email}</div>
                            </div>
                          </div>
                          <button onClick={() => handleRevokeAdmin(detailId!, a.id)} className="text-xs text-rose-500 hover:text-rose-600 font-medium">Revoke</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-end gap-3">
                    <select value={assignAdminUserId} onChange={e => setAssignAdminUserId(e.target.value)} className="form-select flex-1 text-sm">
                      <option value="">Select user to assign as admin</option>
                      {allUsers.map((u: any) => (
                        <option key={u.id} value={String(u.id)}>{u.name || u.email || `User #${u.id}`}</option>
                      ))}
                    </select>
                    <button className="button text-sm" onClick={() => handleAssignAdmin(detailId!)}>Assign</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Loading details...</div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
