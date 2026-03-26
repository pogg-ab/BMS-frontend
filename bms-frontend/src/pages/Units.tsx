import React, { useEffect, useState, useRef } from 'react'
import { listUnits, createUnit, bulkUploadUnits, getUnit, updateUnit, deleteUnit, listUnitAmenities } from '../api/units'
import { listAmenities, linkAmenityToUnitByIds, removeAmenityFromUnitByIds } from '../api/amenities'
import { listBuildings } from '../api/buildings'
import api from '../api/axios'

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

export default function Units() {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [unitNumber, setUnitNumber] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [floor, setFloor] = useState<number | ''>('')
  const [bedrooms, setBedrooms] = useState<number | ''>('')
  const [bathrooms, setBathrooms] = useState<number | ''>('')
  const [sizeSqm, setSizeSqm] = useState<number | ''>('')
  const [rentPrice, setRentPrice] = useState<number | ''>('')
  const [unitType, setUnitType] = useState('studio')
  const [status, setStatus] = useState('vacant')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isOtherType, setIsOtherType] = useState(false)
  const [customType, setCustomType] = useState('')
  const buildings = useRef<any[]>([])
  const imageRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [amenities, setAmenities] = useState<any[]>([])
  const [availableAmenities, setAvailableAmenities] = useState<any[]>([])
  const [newAmenityId, setNewAmenityId] = useState<string | number | ''>('')

  async function load() {
    setLoading(true)
    try {
      const res = await listUnits({ page, per_page: 25 })
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray(res.data)) list = res.data
      else list = []
      setUnits(list)
    } catch (e: any) {
      console.error('load units', e)
      alert('Failed to load units')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    listBuildings({ page: 1, per_page: 200 }).then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || [])
      buildings.current = list
    }).catch(() => { })
  }, [page])

  function openCreate() {
    setEditing(null)
    setUnitNumber('')
    setBuildingId('')
    setFloor('')
    setBedrooms('')
    setBathrooms('')
    setSizeSqm('')
    setRentPrice('')
    setUnitType('studio')
    setStatus('vacant')
    setDescription('')
    setImageUrl('')
    setIsOtherType(false)
    setCustomType('')
    setShowForm(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setUnitNumber(u.unit_number || '')
    setBuildingId(u.buildingId ?? u.building_id ?? (u.building?.id ?? ''))
    setFloor(u.floor ?? '')
    setBedrooms(u.bedrooms ?? '')
    setBathrooms(u.bathrooms ?? '')
    setSizeSqm(u.size_sqm ?? '')
    setRentPrice(u.rent_price ?? '')
    const actType = u.type?.toUpperCase() ?? 'STUDIO'
    const isBuiltIn = UNIT_TYPES.find(t => t.value === actType)
    if (!isBuiltIn) {
      setUnitType('OTHER')
      setIsOtherType(true)
      setCustomType(u.type || '')
    } else {
      setUnitType(actType)
      setIsOtherType(false)
      setCustomType('')
    }
    setStatus(u.status?.toUpperCase() ?? 'VACANT')
    setDescription(u.description ?? '')
    setImageUrl(u.image_url ?? '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const finalType = isOtherType && customType ? customType : unitType
      const dto: any = { unit_number: unitNumber, buildingId, floor, bedrooms, bathrooms, size_sqm: sizeSqm, type: finalType, status }
      if (rentPrice !== '') dto.rent_price = rentPrice
      if (description) dto.description = description
      if (editing) {
        await updateUnit(editing.id, dto)
        alert('Unit updated')
      } else {
        await createUnit(dto)
        alert('Unit created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('submit unit', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload/image', fd)
      if (res.data?.path) setImageUrl(res.data.path)
    } catch (err) {
      console.error('image upload failed', err)
      alert('Image upload failed')
    }
  }

  async function handleDelete(id: any) {
    if (!confirm('Delete this unit?')) return
    try {
      await deleteUnit(id)
      alert('Unit deleted')
      load()
    } catch (e: any) {
      console.error('delete unit', e)
      alert(e?.response?.data?.message || 'Failed to delete unit')
    }
  }

  async function handleBulkUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { alert('Select a CSV file'); return }
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await bulkUploadUnits(fd)
      console.log('bulk upload', res)
      alert('Bulk upload complete')
      load()
    } catch (e: any) {
      console.error('bulk upload', e)
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
      const list = Array.isArray(am) ? am : (am?.data || [])
      setAmenities(list)
      // also load available amenities for selection
      try {
        const aRes = await listAmenities({ page: 1, per_page: 200 })
        const aList = Array.isArray(aRes) ? aRes : (aRes?.data || aRes?.data?.data || [])
        setAvailableAmenities(aList)
      } catch (err) {
        console.warn('failed loading amenities list', err)
      }
    } catch (e: any) {
      console.error('open details', e)
      alert('Failed to load unit details')
    }
  }

  async function handleLinkAmenity(id: any) {
    if (!newAmenityId) { alert('Enter amenity id'); return }
    try {
      await linkAmenityToUnitByIds(id, newAmenityId)
      alert('Amenity linked')
      openDetails(id)
    } catch (e: any) {
      console.error('link amenity', e)
      alert(e?.response?.data?.message || 'Failed to link amenity')
    }
  }

  async function handleRemoveAmenity(id: any, aId: any) {
    if (!confirm('Remove amenity?')) return
    try {
      await removeAmenityFromUnitByIds(id, aId)
      alert('Amenity removed')
      openDetails(id)
    } catch (e: any) {
      console.error('remove amenity', e)
      alert(e?.response?.data?.message || 'Failed to remove amenity')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Units</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage physical properties, floors, and basic configurations</p>
        </div>
        <div>
          <button className="button" onClick={openCreate}>Create Unit</button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input type="file" accept=".csv" ref={fileRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          <button className="button-secondary shrink-0" onClick={handleBulkUpload}>Upload CSV</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit Unit' : 'Create Unit'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="form-label">Unit Number</label>
              <input value={unitNumber} onChange={e => setUnitNumber(e.target.value)} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Building</label>
              <select value={buildingId} onChange={e => setBuildingId(e.target.value)} className="form-select" required>
                <option value="">Select building</option>
                {buildings.current.map((b: any) => <option key={b.id} value={b.id}>{b.name || b.code || b.id}</option>)}
              </select>
            </div>
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <label className="form-label">Type</label>
                <select value={unitType} onChange={e => {
                  setUnitType(e.target.value)
                  setIsOtherType(e.target.value === 'OTHER')
                }} className="form-select" required>
                  {UNIT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  <option value="OTHER">Other...</option>
                </select>
              </div>
              {isOtherType && (
                <div className="flex-1">
                  <label className="form-label">Custom Type</label>
                  <input value={customType} onChange={e => setCustomType(e.target.value)} className="form-input" required placeholder="Custom type" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="form-label !text-xs !mb-0.5">Floor</label>
                <input type="number" value={floor as any} onChange={e => setFloor(e.target.value ? Number(e.target.value) : '')} className="form-input" required />
              </div>
              <div>
                <label className="form-label !text-xs !mb-0.5">Bedrooms</label>
                <input type="number" value={bedrooms as any} onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : '')} className="form-input" required />
              </div>
              <div>
                <label className="form-label !text-xs !mb-0.5">Bathrooms</label>
                <input type="number" value={bathrooms as any} onChange={e => setBathrooms(e.target.value ? Number(e.target.value) : '')} className="form-input" required />
              </div>
              <div>
                <label className="form-label !text-xs !mb-0.5">Size (sqm)</label>
                <input type="number" value={sizeSqm as any} onChange={e => setSizeSqm(e.target.value ? Number(e.target.value) : '')} className="form-input" required />
              </div>
            </div>
            <div>
              <label className="form-label">Rent Price (ETB)</label>
              <input type="number" value={rentPrice as any} onChange={e => setRentPrice(e.target.value ? Number(e.target.value) : '')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="form-select">
                {UNIT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input h-20 pt-2" />
            </div>
            <div>
              <label className="form-label">Image</label>
              <div className="flex gap-2">
                <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" className="button-secondary text-xs" onClick={() => imageRef.current?.click()}>
                  Upload Image
                </button>
                {imageUrl && <img src={`http://localhost:3000${imageUrl}`} alt="Preview" className="h-10 w-10 object-cover rounded" />}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="button" type="submit">{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="px-3 py-1 border rounded" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading && <div className="py-12 flex justify-center text-slate-500">Loading units...</div>}
        {!loading && units.length === 0 && <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No units found</div>}
        {!loading && units.length > 0 && (
          <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Unit</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Building</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-center">Floor / Beds</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Rent (ETB)</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {units.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.unit_number || u.name}</td>
                    <td className="px-6 py-4 text-slate-600">{u.building?.name || u.building_id || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 text-center">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono border border-slate-200 dark:border-slate-700">{u.floor ?? '-'}</span>
                      {' / '}
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono border border-slate-200 dark:border-slate-700">{u.bedrooms ?? '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.status === 'VACANT' || u.status === 'vacant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          u.status === 'OCCUPIED' || u.status === 'occupied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            u.status === 'MAINTENANCE' || u.status === 'maintenance' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-slate-50 dark:bg-slate-900 text-slate-700 border-slate-200 dark:border-slate-700'
                        }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {u.rent ? Number(u.rent).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2" onClick={() => openDetails(u.id)}>Details</button>
                      <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2" onClick={() => openEdit(u)}>Edit</button>
                      <button className="text-rose-600 hover:text-rose-900 font-medium text-xs pl-2 border-l border-slate-200 dark:border-slate-700 ml-2" onClick={() => handleDelete(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailId && (
        <div className="fixed inset-0 flex items-start justify-center bg-black/30 pt-20">
          <div className="bg-white dark:bg-slate-800 rounded shadow p-6 w-3/4 max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Unit details</h3>
              <button className="px-2 py-1 border rounded" onClick={() => { setDetailId(null); setDetail(null); }}>Close</button>
            </div>
            {detail ? (
              <div>
                <p><strong>Unit:</strong> {detail.unit_number}</p>
                <p><strong>Building:</strong> {detail.building?.name || detail.building_id}</p>
                <p><strong>Floor:</strong> {detail.floor}</p>
                <p><strong>Bedrooms:</strong> {detail.bedrooms}</p>
                <p><strong>Bathrooms:</strong> {detail.bathrooms}</p>
                <p><strong>Area (sqm):</strong> {detail.area_sqm}</p>
                <p><strong>Rent:</strong> {detail.rent}</p>
                {detail.image_url && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">Image:</p>
                    <img src={`http://localhost:3000${detail.image_url}`} alt="Unit" className="max-h-48 rounded shadow-sm border" />
                  </div>
                )}
                <hr className="my-3" />
                <h4 className="font-medium">Amenities</h4>
                {amenities.length === 0 && <div className="muted">No amenities</div>}
                {amenities.length > 0 && (
                  <ul className="list-disc pl-5">
                    {amenities.map(a => (
                      <li key={a.id} className="flex items-center justify-between">
                        <span>{a.name} — {a.description}</span>
                        <button className="text-red-700 ml-2" onClick={() => handleRemoveAmenity(detailId, a.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2 items-center">
                  <select value={newAmenityId as any} onChange={e => setNewAmenityId(e.target.value)} className="block w-64 rounded-md border-gray-200 shadow-sm">
                    <option value="">Select amenity</option>
                    {availableAmenities.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}{a.type ? ` — ${a.type}` : ''}</option>
                    ))}
                  </select>
                  <button className="button" onClick={() => handleLinkAmenity(detailId)}>Link Amenity</button>
                </div>
              </div>
            ) : (
              <div>Loading details...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
