import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { listUnits, createUnit, bulkUploadUnits, getUnit, updateUnit, deleteUnit, listUnitAmenities } from '../api/units'
import { listAmenities as listAmenitiesApi, linkAmenityToUnitByIds, removeAmenityFromUnitByIds } from '../api/amenities'
import { listBuildings, getBuilding } from '../api/buildings'
import api from '../api/axios'
import { Search, LayoutGrid, List as ListIcon, Star, Maximize, Bed, MapPin, Building2, Edit2, Info, Plus, Upload, Trash2, X, Download } from 'lucide-react'
import { downloadReport } from '../utils/export'
import PermissionGate from '../components/PermissionGate'

// Constants
const UNIT_TYPES = [
  { value: 'STUDIO', label: 'Studio' },
  { value: '1BR', label: '1 Bedroom' },
  { value: '2BR', label: '2 Bedroom' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'SHOP', label: 'Shop' },
]
const UNIT_STATUSES = [
  { value: 'VACANT', label: 'Vacant' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
]

// Helper for random fallback images
const fallbackImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80'
]

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://bms.skylinkict.com'

export default function Units() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialBuildingId = searchParams.get('buildingId') || ''
  
  // State
  const [selectedBuildingId, setSelectedBuildingId] = useState(initialBuildingId)
  const [currentBuilding, setCurrentBuilding] = useState<any>(null)
  const [buildingsList, setBuildingsList] = useState<any[]>([])
  
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [floorFilter, setFloorFilter] = useState('All Floors')
  const [statusFilter, setStatusFilter] = useState('Status: All')
  const [typeFilter, setTypeFilter] = useState('Type: All')

  // Form states
  const fileRef = useRef<HTMLInputElement | null>(null)
  const imageRef = useRef<HTMLInputElement | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  
  // Form fields
  const [unitNumber, setUnitNumber] = useState('')
  const [formBuildingId, setFormBuildingId] = useState('')
  const [floor, setFloor] = useState<number | ''>('')
  const [bedrooms, setBedrooms] = useState<number | ''>('')
  const [bathrooms, setBathrooms] = useState<number | ''>('')
  const [sizeSqm, setSizeSqm] = useState<number | ''>('')
  const [rentPrice, setRentPrice] = useState<number | ''>('')
  const [unitType, setUnitType] = useState('STUDIO')
  const [status, setStatus] = useState('VACANT')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Detail / Amenity modal states
  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [unitAmenities, setUnitAmenities] = useState<any[]>([])
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([])
  const [newAmenityId, setNewAmenityId] = useState<string | number | ''>('')

  // Initialization
  useEffect(() => {
    listBuildings({ page: 1, per_page: 200 })
      .then((res: any) => setBuildingsList(Array.isArray(res) ? res : (res?.data || [])))
      .catch((e) => console.error('buildings load fail', e))
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch context Building
      if (selectedBuildingId) {
        const b = await getBuilding(selectedBuildingId)
        setCurrentBuilding(b)
      } else {
        setCurrentBuilding(null)
      }

      // Fetch Units
      // If a building is selected, fetch all units for it. Otherwise, fetch all units across buildings.
      let uRes
      if (selectedBuildingId) {
        uRes = await listUnits({ building_id: selectedBuildingId, per_page: 500 })
      } else {
        uRes = await listUnits({ page: 1, per_page: 500 })
      }

      setUnits(Array.isArray(uRes) ? uRes : (uRes?.data || []))
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBuildingId])

  function handleBuildingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setSelectedBuildingId(val)
    if (val) setSearchParams({ buildingId: val })
    else setSearchParams({})
  }

  // Derived Stats for context building
  const totalUnits = units.length || 1 
  const occupiedUnits = units.filter(u => u.status?.toUpperCase() === 'OCCUPIED').length
  const occupancyRate = units.length === 0 ? 0 : Math.round((occupiedUnits / totalUnits) * 100)

  // Filter Units
  const filteredUnits = units.filter(u => {
    if (search && !(
      (u.unit_number && u.unit_number.toLowerCase().includes(search.toLowerCase())) ||
      (u.type && u.type.toLowerCase().includes(search.toLowerCase())) ||
      (u.building?.name && u.building.name.toLowerCase().includes(search.toLowerCase()))
    )) return false

    if (floorFilter !== 'All Floors' && String(u.floor ?? '') !== floorFilter) return false
    if (statusFilter !== 'Status: All') {
      const match = statusFilter.split(': ')[1].toUpperCase()
      if ((u.status || 'VACANT').toUpperCase() !== match) return false
    }
    if (typeFilter !== 'Type: All') {
      const matchValue = typeFilter.split(': ')[1]
      if ((u.type || 'STUDIO').toUpperCase() !== matchValue.toUpperCase()) return false
    }
    return true
  })

  // Grouping logic (by floor if building selected, otherwise by building)
  let groups: { name: string, items: any[] }[] = []
  if (selectedBuildingId) {
    const activeFloors = Array.from(new Set(filteredUnits.map(u => String(u.floor ?? '')))).sort((a,b)=>Number(a)-Number(b))
    groups = activeFloors.map(f => ({
      name: f === '' ? 'Floor 0' : `Floor ${f}`,
      items: filteredUnits.filter(u => String(u.floor ?? '') === f)
    }))
  } else {
    const activeBuildings = Array.from(new Set(filteredUnits.map(u => u.building?.name || 'Unknown Building')))
    groups = activeBuildings.map(b => ({
      name: b,
      items: filteredUnits.filter(u => (u.building?.name || 'Unknown Building') === b).sort((a,b) => Number(a.floor??0) - Number(b.floor??0))
    }))
  }

  // --- CRUD Functions ---
  function openCreate() {
    setEditing(null)
    setUnitNumber('')
    setFormBuildingId(selectedBuildingId || '')
    setFloor('')
    setBedrooms('')
    setBathrooms('')
    setSizeSqm('')
    setRentPrice('')
    setUnitType('STUDIO')
    setStatus('VACANT')
    setDescription('')
    setImageUrl('')
    setShowForm(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setUnitNumber(u.unit_number || '')
    setFormBuildingId(u.buildingId ?? u.building_id ?? (u.building?.id ?? ''))
    setFloor(u.floor ?? '')
    setBedrooms(u.bedrooms ?? '')
    setBathrooms(u.bathrooms ?? '')
    setSizeSqm(u.size_sqm ?? '')
    setRentPrice(u.rent_price || u.rent || '')
    setUnitType(u.type?.toUpperCase() ?? 'STUDIO')
    setStatus(u.status?.toUpperCase() ?? 'VACANT')
    setDescription(u.description ?? '')
    setImageUrl(u.image_url ?? '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const isCommercial = unitType === 'SHOP' || unitType === 'OFFICE';
      const dto: any = { 
        unit_number: unitNumber, 
        buildingId: formBuildingId, 
        floor, 
        bedrooms: isCommercial ? 0 : (bedrooms || 0), 
        bathrooms: isCommercial ? 0 : (bathrooms || 0), 
        size_sqm: sizeSqm, 
        type: unitType, 
        status 
      }
      if (rentPrice !== '') dto.rent_price = rentPrice
      if (description) dto.description = description
      if (imageUrl) dto.image_url = imageUrl

      if (editing) {
        await updateUnit(editing.id, dto)
      } else {
        await createUnit(dto)
      }
      setShowForm(false)
      loadData()
    } catch (err: any) {
      console.error('submit unit', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDelete(id: any) {
    if (!confirm('Delete this unit completely?')) return
    try {
      await deleteUnit(id)
      loadData()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete unit')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload/image?type=units', fd)
      if (res.data?.path) setImageUrl(res.data.path)
    } catch (err) {
      alert('Image upload failed')
    }
  }

  async function handleBulkUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { alert('Select a CSV file'); return }
    const fd = new FormData()
    fd.append('file', file)
    try {
      await bulkUploadUnits(fd)
      if (fileRef.current) fileRef.current.value = ''
      loadData()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Bulk upload failed')
    }
  }

  async function openDetails(id: any) {
    setDetailId(id)
    setDetail(null)
    try {
      const d = await getUnit(id)
      setDetail(d)
      const am = await listUnitAmenities(id)
      setUnitAmenities(Array.isArray(am) ? am : (am?.data || []))
      const aRes = await listAmenitiesApi({ page: 1, per_page: 200 })
      setAvailableAmenities(Array.isArray(aRes) ? aRes : (aRes?.data || aRes?.data?.data || []))
    } catch (e: any) {
      console.error('detail fail', e)
    }
  }

  async function handleLinkAmenity(id: any) {
    if (!newAmenityId) return
    try {
      const selectedAm = availableAmenities.find(a => String(a.id) === String(newAmenityId))
      if (!selectedAm) return
      await linkAmenityToUnitByIds(id, newAmenityId)
      openDetails(id)
    } catch (e: any) {
      console.error(e)
    }
  }

  async function doRemoveAmenity(uId: any, aId: any) {
    if (!confirm('Remove amenity?')) return
    try {
      await removeAmenityFromUnitByIds(uId, aId)
      openDetails(uId)
    } catch (e) { console.error(e) }
  }


  return (
    <PageLayout
      title="Property Units"
      subtitle="Manage physical assets, configurations, and occupancy status."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <PermissionGate permission="units:bulk_upload">
            <input type="file" accept=".csv" ref={fileRef} className="hidden" onChange={handleBulkUpload} />
            <button 
              type="button"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> <span className="hidden xs:inline">Bulk</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="reports:view">
            <button 
              type="button"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
              onClick={() => downloadReport('units')}
            >
              <Download size={16} /> <span className="hidden xs:inline">Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="units:create">
            <button 
              type="button"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm shadow-indigo-600/20 text-xs sm:text-sm font-semibold"
              onClick={openCreate}
            >
              <Plus size={16} /> <span className="hidden xs:inline">Create</span>
            </button>
          </PermissionGate>
        </div>
      }
    >
      <div className="space-y-8 pb-20">
        
        {/* Dynamic Context Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 sm:w-64">
              <select 
                value={selectedBuildingId} 
                onChange={handleBuildingChange}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg py-2.5 pl-3 pr-10 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-600/30 cursor-pointer"
              >
                <option value="">Exploring: All Buildings</option>
                {buildingsList.map(b => (
                  <option key={b.id} value={b.id}>Exploring: {b.name || b.code}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-4">
             <div className="text-center">
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Units</span>
               <span className="font-extrabold text-slate-900 dark:text-white">{loading ? '-' : units.length}</span>
             </div>
             <div className="text-center border-l pl-6 border-slate-100 dark:border-slate-700">
               <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy</span>
               <span className="font-extrabold text-slate-900 dark:text-white">{loading ? '-' : occupancyRate}%</span>
             </div>
          </div>
        </div>

        {/* Hero Banner (Only if a specific building is selected) */}
        {selectedBuildingId && currentBuilding && (
          <div className="relative w-full h-[200px] sm:h-[320px] rounded-[24px] sm:rounded-[32px] overflow-hidden group shadow-lg">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{ backgroundImage: `url("${currentBuilding?.image_url ? `${API_BASE}${currentBuilding.image_url}` : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2 drop-shadow-md">{currentBuilding.name || currentBuilding.code}</h1>
              <div className="flex items-center text-white/80 text-xs sm:text-sm font-medium">
                <MapPin size={14} className="mr-1.5 opacity-80" />
                {currentBuilding.address || 'Location Verified'}
              </div>
            </div>
            
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live System Context
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mt-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by unit number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-11 pr-4 py-2.5 w-full sm:w-64 bg-white dark:bg-slate-800 border-none rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-shadow text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3">
              <select 
                className="bg-white dark:bg-slate-800 border-none rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
              >
                <option>All Floors</option>
                {Array.from(new Set(units.map(u => String(u.floor ?? '')))).sort((a,b)=>Number(a)-Number(b)).map(f => (
                  <option key={f} value={f}>{f === '' ? 'Floor 0' : `Floor ${f}`}</option>
                ))}
              </select>
              <select 
                className="bg-white dark:bg-slate-800 border-none rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option>Status: All</option>
                <option>Status: Vacant</option>
                <option>Status: Occupied</option>
                <option>Status: Maintenance</option>
              </select>
              <select 
                className="bg-white dark:bg-slate-800 border-none rounded-xl py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option>Type: All</option>
                {UNIT_TYPES.map(t => (
                  <option key={t.value} value={`Type: ${t.value}`}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm self-end">
            <button className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 shadow-sm">
              <LayoutGrid size={18} />
            </button>
            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Grouped Unit Grids */}
        <div className="space-y-10">
          {groups.map((group, groupIdx) => {
            if (group.items.length === 0) return null
            return (
              <div key={group.name} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{group.name}</h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                      {group.items.length} UNITS
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {group.items.map((u, i) => {
                    const fallbackImg = u.building?.image_url ? `${API_BASE}${u.building.image_url}` : fallbackImages[i % fallbackImages.length]
                    const imgUrl = u.image_url ? `${API_BASE}${u.image_url}` : fallbackImg
                    
                    const statUpper = (u.status || 'VACANT').toUpperCase()
                    let statStyle = 'bg-slate-50 border-t-slate-200 text-slate-600'
                    let statText = 'UNKNOWN'
                    if (statUpper === 'VACANT' || statUpper === 'AVAILABLE') { statStyle = 'bg-emerald-500 text-white'; statText = 'AVAILABLE' }
                    else if (statUpper === 'OCCUPIED' || statUpper === 'RENTED') { statStyle = 'bg-rose-500 text-white'; statText = 'OCCUPIED' }
                    else if (statUpper === 'MAINTENANCE') { statStyle = 'bg-amber-500 text-white'; statText = 'MAINTENANCE' }

                    const rawType = u.type?.toUpperCase() || 'STUDIO'
                    let prettyType = 'Studio'
                    if (rawType.includes('1BR')) prettyType = '1 Bedroom'
                    if (rawType.includes('2BR')) prettyType = '2 Bedroom'
                    if (rawType === 'OFFICE') prettyType = 'Office'
                    if (rawType === 'SHOP') prettyType = 'Shop'

                    return (
                      <div key={u.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative">
                        
                        {/* Hover Overlay Actions */}
                        <div className="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PermissionGate permission="units:update">
                            <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors" title="Edit Unit">
                              <Edit2 size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="units:read">
                            <button onClick={() => openDetails(u.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors" title="View Details">
                              <Info size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="units:delete">
                            <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-rose-600 transition-colors" title="Delete Unit">
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>

                        <div className="h-44 relative overflow-hidden">
                          <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                            style={{ backgroundImage: `url("${imgUrl}")` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm z-10">
                            UNIT {u.unit_number || `10${i+1}`}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col z-10 bg-white dark:bg-slate-800 relative">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{prettyType}</h3>
                          {!selectedBuildingId && (
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                              {u.building?.name || 'Unknown Building'}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                              <Maximize size={12} className="text-slate-400" /> {u.size_sqm || 45} sqm
                            </div>
                            {u.type !== 'OFFICE' && u.type !== 'SHOP' && (
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                <Bed size={12} className="text-slate-400" /> {u.bedrooms || 0}
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-5 flex items-baseline gap-1.5">
                            <span className="text-indigo-600 text-lg font-extrabold tracking-tight">
                              ETB {Number(u.rent_price || u.rent || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className={`py-2 text-center text-[10px] font-bold tracking-[0.2em] uppercase ${statStyle} z-10`}>
                          {statText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        
        {!loading && filteredUnits.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Search size={32} className="mb-4 opacity-50 text-slate-300" />
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No units found</p>
            <p className="text-sm font-medium mt-1">Try adjusting your filters or building context.</p>
          </div>
        )}

      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Edit Unit Details' : 'Create New Unit'}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Unit Number</label>
                    <input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Building</label>
                    <select value={formBuildingId} onChange={e => setFormBuildingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" required>
                      <option value="">Select building</option>
                      {buildingsList.map(b => <option key={b.id} value={b.id}>{b.name || b.code}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Type</label>
                    <select 
                      value={unitType} 
                      onChange={e => {
                        const val = e.target.value;
                        setUnitType(val);
                        if (val === 'SHOP' || val === 'OFFICE') {
                          setBedrooms(0);
                          setBathrooms(0);
                        }
                      }} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    >
                      {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all">
                      {UNIT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Floor</label>
                    <input type="number" value={floor as any} onChange={e => setFloor(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Beds</label>
                    <input type="number" value={bedrooms as any} onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:opacity-50" required disabled={unitType === 'SHOP' || unitType === 'OFFICE'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Baths</label>
                    <input type="number" value={bathrooms as any} onChange={e => setBathrooms(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm disabled:opacity-50" required disabled={unitType === 'SHOP' || unitType === 'OFFICE'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sqm</label>
                    <input type="number" value={sizeSqm as any} onChange={e => setSizeSqm(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Rent Price (ETB)</label>
                  <input type="number" value={rentPrice as any} onChange={e => setRentPrice(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm h-20 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Unit Image</label>
                  <div className="flex gap-4 items-center">
                    <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                    <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors" onClick={() => imageRef.current?.click()}>
                      Choose File
                    </button>
                    {imageUrl && <img src={`${API_BASE}${imageUrl}`} alt="preview" className="h-12 w-20 object-cover rounded-lg border border-slate-200 shadow-sm" />}
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors" onClick={() => setShowForm(false)}>Cancel</button>
              <button form="unit-form" type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
                {editing ? 'Save Changes' : 'Create Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS / AMENITIES MODAL */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unit Amenities & Details</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => { setDetailId(null); setDetail(null) }}><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {detail ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Number</p>
                      <p className="font-bold text-slate-900 dark:text-white text-lg">{detail.unit_number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Building</p>
                      <p className="font-bold text-slate-900 dark:text-white text-lg">{detail.building?.name || detail.building_id}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Linked Amenities</h4>
                    {unitAmenities.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium italic">No amenities linked yet.</p>
                    ) : (
                      <ul className="space-y-3">
                        {unitAmenities.map(a => (
                          <li key={a.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{a.name} <span className="text-slate-400 font-normal ml-2">{a.description}</span></span>
                            <button className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition-colors" onClick={() => doRemoveAmenity(detailId, a.id)}>
                              <Trash2 size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Add Amenity</h4>
                    <div className="flex gap-3 items-center">
                      <select value={newAmenityId as any} onChange={e => setNewAmenityId(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:bg-white transition-all">
                        <option value="">Select an amenity to link...</option>
                        {availableAmenities.map((a: any) => (
                          <option key={a.id} value={a.id}>{a.name}{a.type ? ` — ${a.type}` : ''}</option>
                        ))}
                      </select>
                      <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors whitespace-nowrap" onClick={() => handleLinkAmenity(detailId)}>
                        Link Amenity
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 rounded-xl transition-colors" onClick={() => { setDetailId(null); setDetail(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
