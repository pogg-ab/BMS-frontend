import React, { useEffect, useState } from 'react'
import { listAmenities, createAmenity, updateAmenity, deleteAmenity, getAmenity, linkAmenityToBuilding, removeAmenityFromBuilding, linkAmenityToUnitByIds, removeAmenityFromUnitByIds } from '../api/amenities'
import { listBuildings } from '../api/buildings'
import { listUnits } from '../api/units'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { Plus, Trash2, Edit2, Info, Search, Coffee, Wifi, Car, Shield, Dumbbell, Wind, Sun, Waves, X, Link, Building2, Home } from 'lucide-react'

const AMENITY_ICONS: Record<string, any> = {
  'GYM': Dumbbell,
  'POOL': Waves,
  'PARKING': Car,
  'WIFI': Wifi,
  'SECURITY': Shield,
  'CAFE': Coffee,
  'LOUNGE': Wind,
  'ROOFTOP': Sun,
}

const CATEGORIES = ['General', 'Wellness', 'Utility', 'Security', 'Entertainment']

export default function Amenities() {
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')

  // Manage Links states
  const [manageId, setManageId] = useState<string | number | null>(null)
  const [amenityDetail, setAmenityDetail] = useState<any | null>(null)
  const [linkedBuildings, setLinkedBuildings] = useState<any[]>([])
  const [linkedUnits, setLinkedUnits] = useState<any[]>([])
  const [linkBuildingId, setLinkBuildingId] = useState('')
  const [linkUnitBuildingId, setLinkUnitBuildingId] = useState('')
  const [linkUnitId, setLinkUnitId] = useState('')
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])

  // Filter States
  const [filterBuildingId, setFilterBuildingId] = useState('')
  const [filterUnitId, setFilterUnitId] = useState('')

  const filteredUnitsForLinking = linkUnitBuildingId
    ? allUnits.filter(u => String(u.building?.id || u.buildingId) === linkUnitBuildingId)
    : [];

  const filteredUnitsForFilter = filterBuildingId
    ? allUnits.filter(u => String(u.building?.id || u.buildingId) === filterBuildingId)
    : [];

  async function load() {
    setLoading(true)
    try {
      const params: any = { page: 1, per_page: 200 }
      if (filterBuildingId) params.buildingId = filterBuildingId
      if (filterUnitId) params.unitId = filterUnitId

      const res = await listAmenities(params)
      const list = Array.isArray(res) ? res : (res?.data || [])
      setItems(list)
    } catch (e: any) {
      console.error('load amenities', e)
      toast.addToast('Failed to load amenities', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
  }, [filterBuildingId, filterUnitId])

  useEffect(() => {
    listBuildings({ page: 1, per_page: 500 }).then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || [])
      setAllBuildings(list)
    }).catch(console.error)
    listUnits({ page: 1, per_page: 500 }).then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || [])
      setAllUnits(list)
    }).catch(console.error)
  }, [])

  const filteredItems = items.filter(a => 
    !searchQuery || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateAmenity(editing.id, { name, description, category })
        toast.addToast('Amenity updated successfully', 'success')
      } else {
        await createAmenity({ name, description, category })
        toast.addToast('Amenity created successfully', 'success')
      }
      setName(''); setDescription(''); setCategory('General'); setEditing(null); setShowForm(false)
      load()
    } catch (err: any) {
      console.error('submit amenity', err)
      const msg = err?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(',') : (msg || 'Operation failed'), 'error')
    }
  }

  function openEdit(a: any) {
    setEditing(a)
    setName(a.name || '')
    setDescription(a.description || '')
    setCategory(a.category || 'General')
    setShowForm(true)
  }

  function openCreate() {
    setEditing(null)
    setName(''); setDescription(''); setCategory('General')
    setShowForm(true)
  }

  async function handleDelete(id: any) {
    if (!confirm('Delete amenity?')) return
    try {
      await deleteAmenity(id)
      toast.addToast('Amenity deleted', 'success')
      load()
    } catch (e: any) {
      console.error('delete amenity', e)
      toast.addToast(e?.response?.data?.message || 'Failed to delete amenity', 'error')
    }
  }

  async function openManageLinks(id: any) {
    setManageId(id)
    setAmenityDetail(null)
    try {
      const d = await getAmenity(id)
      setAmenityDetail(d)
      setLinkedBuildings(d.linked_buildings || [])
      setLinkedUnits(d.linked_units || [])
    } catch (e: any) {
      console.error('get amenity details', e)
      toast.addToast('Failed to load amenity details', 'error')
    }
  }

  function closeManageLinks() {
    setManageId(null)
    setAmenityDetail(null)
    setLinkUnitBuildingId('')
    setLinkUnitId('')
    setLinkBuildingId('')
  }

  async function handleLinkToBuilding() {
    if (!manageId || !linkBuildingId) return
    try {
      await linkAmenityToBuilding(linkBuildingId, manageId)
      toast.addToast('Linked to building', 'success')
      openManageLinks(manageId)
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to link', 'error')
    }
  }

  async function handleRemoveBuilding(bId: any) {
    if (!manageId || !confirm('Remove amenity from building?')) return
    try {
      await removeAmenityFromBuilding(bId, manageId)
      toast.addToast('Removed link', 'success')
      openManageLinks(manageId)
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to remove link', 'error')
    }
  }

  async function handleLinkToUnit() {
    if (!manageId || !linkUnitId) return
    try {
      await linkAmenityToUnitByIds(linkUnitId, manageId)
      toast.addToast('Linked to unit', 'success')
      openManageLinks(manageId)
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to link', 'error')
    }
  }

  async function handleRemoveUnit(uId: any) {
    if (!manageId || !confirm('Remove amenity from unit?')) return
    try {
      await removeAmenityFromUnitByIds(uId, manageId)
      toast.addToast('Removed link', 'success')
      openManageLinks(manageId)
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to remove link', 'error')
    }
  }

  function getIcon(name: string) {
    const key = name.toUpperCase()
    for (const [k, Icon] of Object.entries(AMENITY_ICONS)) {
      if (key.includes(k)) return <Icon size={24} />
    }
    return <Plus size={24} />
  }

  return (
    <PageLayout 
      title="Property Amenities" 
      subtitle="Manage shared services and facilities across buildings and units."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative hidden xl:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search amenities..."
              className="pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-sm w-48"
            />
          </div>
          <button onClick={openCreate} className="button shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm">
            <Plus size={16} /> <span className="hidden xs:inline">Create Amenity</span>
            <span className="xs:hidden">Add Amenity</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-10">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 size={16} className="text-slate-400 shrink-0" />
            <select 
              value={filterBuildingId} 
              onChange={e => {setFilterBuildingId(e.target.value); setFilterUnitId('')}}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full"
            >
              <option value="">All Buildings</option>
              {allBuildings.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Home size={16} className="text-slate-400 shrink-0" />
            <select 
              value={filterUnitId} 
              onChange={e => setFilterUnitId(e.target.value)}
              disabled={!filterBuildingId}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 w-full"
            >
              <option value="">All Units</option>
              {filteredUnitsForFilter.map(u => <option key={u.id} value={String(u.id)}>Unit {u.unit_number}</option>)}
            </select>
          </div>

          {(filterBuildingId || filterUnitId) && (
            <button 
              onClick={() => {setFilterBuildingId(''); setFilterUnitId('')}}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors sm:ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Coffee size={48} className="mb-4 opacity-50 text-slate-300" />
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No amenities found</p>
            <p className="text-sm font-medium mt-1">Define amenities and link them to your properties.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((a) => (
              <div 
                key={a.id} 
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative"
              >
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => openManageLinks(a.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors" title="Manage Links">
                    <Link size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-rose-600 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
                    {getIcon(a.name)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2">{a.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 line-clamp-2">{a.description || 'No description provided.'}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                      {a.category || 'General'}
                    </span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                       <span className="text-[10px] items-center flex font-bold text-slate-400 uppercase tracking-wider">
                         {(a.linked_buildings?.length || 0) + (a.linked_units?.length || 0)} Linked
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? `Edit ${editing.name}` : 'New Amenity'}</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => { setShowForm(false); setEditing(null) }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amenity Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Swimming Pool" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the amenity..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all">{editing ? 'Update Amenity' : 'Create Amenity'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE LINKS MODAL */}
      {manageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Link size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manage Links: {amenityDetail?.name || '...'}</h3>
              </div>
              <button 
                className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" 
                onClick={closeManageLinks}
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Building Links */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Building2 size={14} className="text-indigo-500" /> Linked Buildings
                  </h4>
                  <div className="space-y-3 mb-4">
                    {linkedBuildings.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No buildings linked.</p>
                    ) : (
                      linkedBuildings.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{b.name}</span>
                          <button className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleRemoveBuilding(b.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select value={linkBuildingId} onChange={e => setLinkBuildingId(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:bg-white transition-all">
                      <option value="">Select building...</option>
                      {allBuildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code}</option>)}
                    </select>
                    <button className="button text-xs font-bold px-4" onClick={handleLinkToBuilding}>Link Building</button>
                  </div>
                </div>

                {/* Unit Links */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Home size={14} className="text-emerald-500" /> Linked Units
                  </h4>
                  <div className="space-y-3 mb-4">
                    {linkedUnits.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No units linked.</p>
                    ) : (
                      linkedUnits.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                            Unit {u.unit_number || u.id} <span className="text-xs text-slate-400 font-normal ml-1">({u.building?.name || 'Unknown Building'})</span>
                          </span>
                          <button className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors" onClick={() => handleRemoveUnit(u.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <select value={linkUnitBuildingId} onChange={e => {setLinkUnitBuildingId(e.target.value); setLinkUnitId('')}} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:bg-white transition-all">
                      <option value="">1. Select building...</option>
                      {allBuildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <select value={linkUnitId} onChange={e => setLinkUnitId(e.target.value)} disabled={!linkUnitBuildingId} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">2. Select unit...</option>
                        {filteredUnitsForLinking.map((u: any) => <option key={u.id} value={String(u.id)}>Unit {u.unit_number}</option>)}
                      </select>
                      <button className="button bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-xs font-bold px-4 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!linkUnitId} onClick={handleLinkToUnit}>Link Unit</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-colors" onClick={closeManageLinks}>Done</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
