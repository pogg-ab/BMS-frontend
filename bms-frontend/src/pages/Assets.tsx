import React, { useEffect, useState, useRef, useMemo } from 'react'
import { listAssets, createAsset, updateAsset, deleteAsset } from '../api/assets'
import { listBuildings } from '../api/buildings'
import { listUnits } from '../api/units'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import api from '../api/axios'
import { 
  Plus, Trash2, Edit2, Search, Package, Armchair, Tv, 
  Refrigerator, Home, Building2, Calendar, DollarSign, 
  Activity, Image as ImageIcon, X, Loader2, Camera, Info, Tag, TrendingUp
} from 'lucide-react'

const ASSET_CATEGORIES = ['Appliance', 'Furniture', 'Equipment', 'Decor', 'Other']
const ASSET_CONDITIONS = ['New', 'Good', 'Fair', 'Damaged', 'Poor']

const CATEGORY_ICONS: Record<string, any> = {
  'Appliance': Refrigerator,
  'Furniture': Armchair,
  'Equipment': Package,
  'Decor': Tv,
  'Other': Package
}

export default function Assets() {
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<any>(null)
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Other')
  const [condition, setCondition] = useState('Good')
  const [value, setValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [unitId, setUnitId] = useState('')

  const imageRef = useRef<HTMLInputElement | null>(null)
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Filter States
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterBuildingId, setFilterBuildingId] = useState('')
  const [filterUnitId, setFilterUnitId] = useState('')

  const filteredUnitsForFilter = useMemo(() => {
    if (!filterBuildingId) return []
    return allUnits.filter(u => String(u.building?.id || u.buildingId) === filterBuildingId)
  }, [filterBuildingId, allUnits])

  const apiBase = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'

  async function loadData() {
    setLoading(true)
    try {
      const params: any = {}
      if (filterCategory) params.category = filterCategory
      if (filterCondition) params.condition = filterCondition
      if (filterBuildingId) params.buildingId = filterBuildingId
      if (filterUnitId) params.unitId = filterUnitId
      
      const res = await listAssets(params)
      const list = Array.isArray(res) ? res : (res?.data || [])
      setItems(list)
    } catch (e) {
      toast.addToast('Failed to load assets', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterCategory, filterCondition, filterBuildingId, filterUnitId])

  useEffect(() => {
    listBuildings({ page: 1, per_page: 500 }).then(res => setAllBuildings(Array.isArray(res) ? res : (res.data || [])))
    listUnits({ page: 1, per_page: 500 }).then(res => setAllUnits(Array.isArray(res) ? res : (res.data || [])))
  }, [])

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUnits = buildingId 
    ? allUnits.filter(u => String(u.building?.id || u.buildingId) === buildingId)
    : []

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    
    try {
      const res = await api.post('/upload/image?type=assets', fd)
      if (res.data?.path) {
        setImageUrl(res.data.path)
        toast.addToast('Image uploaded successfully', 'success')
      }
    } catch (err) {
      toast.addToast('Image upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dto: any = {
      name, category, condition, 
      value: value ? parseFloat(value) : undefined,
      purchase_date: purchaseDate || undefined,
      image_url: imageUrl,
      notes,
      buildingId: buildingId || undefined,
      unitId: unitId || undefined
    }

    try {
      if (editing) {
        await updateAsset(editing.id, dto)
        toast.addToast('Asset updated successfully', 'success')
      } else {
        await createAsset(dto)
        toast.addToast('Asset registered successfully', 'success')
      }
      resetForm()
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Operation failed'), 'error')
    }
  }

  function resetForm() {
    setName(''); setCategory('Other'); setCondition('Good'); setValue('')
    setPurchaseDate(''); setImageUrl(''); setNotes(''); setBuildingId('')
    setUnitId(''); setEditing(null); setShowForm(false)
  }

  function openEdit(item: any) {
    setEditing(item)
    setName(item.name || '')
    setCategory(item.category || 'Other')
    setCondition(item.condition || 'Good')
    setValue(item.value?.toString() || '')
    setPurchaseDate(item.purchase_date ? item.purchase_date.split('T')[0] : '')
    setImageUrl(item.image_url || '')
    setNotes(item.notes || '')
    setBuildingId(item.building?.id || '')
    setUnitId(item.unit?.id || '')
    setShowForm(true)
  }

  async function handleDelete() {
    if (!assetToDelete) return
    try {
      await deleteAsset(assetToDelete.id)
      toast.addToast('Asset removed from inventory', 'success')
      setAssetToDelete(null)
      setShowDeleteConfirm(false)
      loadData()
    } catch (e) {
      toast.addToast('Failed to delete asset', 'error')
    }
  }

  function getIcon(cat: string) {
    const Icon = CATEGORY_ICONS[cat] || Package
    return <Icon size={20} />
  }

  return (
    <PageLayout
      title="Assets & Inventory"
      subtitle="Track physical furnishings, appliances, and equipment across your portfolio."
      actions={
        <div className="flex gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search assets or categories..." 
              className="pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 w-64"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setShowForm(true)} className="button">
            <Plus size={16} /> Add Asset
          </button>
        </div>
      }
    >
      <div className="pb-10 space-y-6">
        
        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-slate-400" />
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-400" />
            <select 
              value={filterCondition} 
              onChange={e => setFilterCondition(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Conditions</option>
              {ASSET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="h-6 w-px bg-slate-100 dark:bg-slate-700 mx-2 hidden md:block" />

          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            <select 
              value={filterBuildingId} 
              onChange={e => {setFilterBuildingId(e.target.value); setFilterUnitId('')}}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Buildings</option>
              {allBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Home size={16} className="text-slate-400" />
            <select 
              value={filterUnitId} 
              onChange={e => setFilterUnitId(e.target.value)}
              disabled={!filterBuildingId}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              <option value="">All Units</option>
              {filteredUnitsForFilter.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number}</option>)}
            </select>
          </div>

          {(filterCategory || filterCondition || filterBuildingId || filterUnitId) && (
            <button 
              onClick={() => {setFilterCategory(''); setFilterCondition(''); setFilterBuildingId(''); setFilterUnitId('')}}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-indigo-500" />
            Showing {filteredItems.length} of {items.length} items
          </div>
          {(filterCategory || filterCondition || filterBuildingId || filterUnitId) && (
            <div className="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">
              Filters Active
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="font-medium">Syncing inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-3xl p-20 text-center border border-dashed border-slate-200 dark:border-slate-700">
            <Package size={60} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No assets tagged yet</h3>
            <p className="text-slate-500 mt-2">Assign furnishings and electronics to your units to keep track of value and condition.</p>
            <button onClick={() => setShowForm(true)} className="mt-6 button-secondary">
              <Plus size={16} /> Log First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 border border-slate-100 dark:border-slate-700/50 group relative flex flex-col">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(item) }} className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-sm text-slate-600 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setAssetToDelete(item); setShowDeleteConfirm(true) }} className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-sm text-slate-600 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                </div>

                <div className="h-48 bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
                  {item.image_url ? (
                    <img src={`${apiBase}${item.image_url}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-700">
                      <Package size={54} />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-500/20 flex items-center gap-2">
                    {getIcon(item.category)} {item.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-5">
                    <span className={`px-2.5 py-1 rounded-lg ${
                      item.condition === 'New' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      item.condition === 'Damaged' || item.condition === 'Poor' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {item.condition}
                    </span>
                    {item.value && <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-lg">ETB {new Intl.NumberFormat().format(item.value)}</span>}
                  </div>

                  <div className="space-y-3 border-t border-slate-50 dark:border-slate-700/50 pt-5 mt-auto">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                        <Building2 size={14} />
                      </div>
                      <span className="truncate">{item.building?.name || 'Assigned to Common Area'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                        <Home size={14} />
                      </div>
                      <span className="truncate">{item.unit ? `Unit ${item.unit.unit_number}` : 'Managed as Property Asset'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL - PREMIUM REDESIGN */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{editing ? 'Update Asset Info' : 'Add New Inventory'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Asset Management System</p>
                </div>
              </div>
              <button 
                onClick={resetForm} 
                className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-600 rounded-full shadow-sm transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Asset Name & Details</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="form-input pl-11 bg-slate-50/50 focus:bg-white transition-all py-3 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-2xl" 
                      placeholder="e.g. Samsung Air Conditioner (24,000 BTU)" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="form-label">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="form-select pl-11 bg-slate-50/50 rounded-2xl py-3 cursor-pointer">
                      {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Condition Level</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={16} />
                    <select value={condition} onChange={e => setCondition(e.target.value)} className="form-select pl-11 bg-slate-50/50 rounded-2xl py-3 cursor-pointer">
                      {ASSET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Valuation (Estimated)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="number" value={value} onChange={e => setValue(e.target.value)} className="form-input pl-11 bg-slate-50 text-sm py-3 rounded-2xl" placeholder="0.00 ETB" />
                  </div>
                </div>

                <div>
                  <label className="form-label">Procurement Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="form-input pl-11 bg-slate-50 py-3 rounded-2xl" />
                  </div>
                </div>

                <div className="md:col-span-2 p-6 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-500/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-500 mb-4 inline-flex items-center gap-2">
                    <Info size={12} /> Geographic Allocation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="form-label text-slate-500 text-[11px]">Parent Building</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                        <select value={buildingId} onChange={e => {setBuildingId(e.target.value); setUnitId('')}} className="form-select pl-11 bg-white border-indigo-100 rounded-xl py-2.5 text-xs font-bold">
                          <option value="">Select Target Property...</option>
                          {allBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="form-label text-slate-500 text-[11px]">Specific Unit (Optional)</label>
                      <div className="relative">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                        <select value={unitId} onChange={e => setUnitId(e.target.value)} disabled={!buildingId} className="form-select pl-11 bg-white border-emerald-100 rounded-xl py-2.5 text-xs font-bold disabled:opacity-40">
                          <option value="">(Common Area Assignment)</option>
                          {filteredUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Asset Documentation & Photo</label>
                  <div className="flex items-center gap-6 p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/30">
                    <div className="relative">
                      {imageUrl ? (
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-100">
                          <img src={`${apiBase}${imageUrl}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setImageUrl('')} 
                            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                           type="button"
                           onClick={() => imageRef.current?.click()}
                           className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-white transition-all flex flex-col items-center justify-center group"
                        >
                          <Camera size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Upload</span>
                        </button>
                      )}
                      <input type="file" ref={imageRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{imageUrl ? 'Item photo captured' : 'No photo attached'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Physical items are easier to track with a visual record. Recommended: Front view of the appliance.</p>
                      {uploading && (
                        <div className="flex items-center gap-2 mt-2 text-indigo-600 font-bold text-[10px]">
                           <Loader2 size={12} className="animate-spin" /> UPLOADING...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">System Notes / Observations</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="form-input min-h-[100px] py-4 bg-slate-50/50 rounded-2xl border-slate-200 resize-none" placeholder="Add warranty expiration, maintenance schedule notes, or item peculiarities..." />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky bottom-0">
                <button type="button" onClick={resetForm} className="px-8 py-3.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Discard</button>
                <button type="submit" className="button px-12 py-3.5 shadow-xl shadow-indigo-600/20 active:scale-95 transition-transform">
                  {editing ? 'Update Record' : 'Commit to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL - PREMIUM UI */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Asset?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              Are you sure you want to remove <span className="font-bold text-slate-700 dark:text-slate-200">{assetToDelete?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowDeleteConfirm(false); setAssetToDelete(null) }} 
                className="flex-1 px-6 py-3.5 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-95 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
