import React, { useEffect, useState, useRef } from 'react'
import { listUnits, createUnit, bulkUploadUnits, getUnit, updateUnit, deleteUnit, listUnitAmenities } from '../api/units'
import { listAmenities, linkAmenityToUnitByIds, removeAmenityFromUnitByIds } from '../api/amenities'

export default function Units() {
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [unitNumber, setUnitNumber] = useState('')
  const [buildingId, setBuildingId] = useState<string | number | ''>('')
  const [floor, setFloor] = useState<number | ''>('')
  const [bedrooms, setBedrooms] = useState<number | ''>('')
  const [bathrooms, setBathrooms] = useState<number | ''>('')
  const [area, setArea] = useState<number | ''>('')
  const [rent, setRent] = useState<number | ''>('')
  const [status, setStatus] = useState('vacant')
  const [notes, setNotes] = useState('')
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
    } catch (e:any) {
      console.error('load units', e)
      alert('Failed to load units')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  function openCreate() {
    setEditing(null)
    setUnitNumber('')
    setBuildingId('')
    setFloor('')
    setBedrooms('')
    setBathrooms('')
    setArea('')
    setRent('')
    setStatus('vacant')
    setNotes('')
    setShowForm(true)
  }

  function openEdit(u:any) {
    setEditing(u)
    setUnitNumber(u.unit_number || '')
    setBuildingId(u.building_id ?? (u.building?.id ?? ''))
    setFloor(u.floor ?? '')
    setBedrooms(u.bedrooms ?? '')
    setBathrooms(u.bathrooms ?? '')
    setArea(u.area_sqm ?? '')
    setRent(u.rent ?? '')
    setStatus(u.status ?? 'vacant')
    setNotes(u.notes ?? '')
    setShowForm(true)
  }

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault()
    try {
      const dto = { unit_number: unitNumber, building_id: buildingId, floor, bedrooms, bathrooms, area_sqm: area, rent, status, notes }
      if (editing) {
        await updateUnit(editing.id, dto)
        alert('Unit updated')
      } else {
        await createUnit(dto)
        alert('Unit created')
      }
      setShowForm(false)
      load()
    } catch (err:any) {
      console.error('submit unit', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDelete(id:any) {
    if (!confirm('Delete this unit?')) return
    try {
      await deleteUnit(id)
      alert('Unit deleted')
      load()
    } catch (e:any) {
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
    } catch (e:any) {
      console.error('bulk upload', e)
      alert(e?.response?.data?.message || 'Bulk upload failed')
    }
  }

  async function openDetails(id:any) {
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
    } catch (e:any) {
      console.error('open details', e)
      alert('Failed to load unit details')
    }
  }

  async function handleLinkAmenity(id:any) {
    if (!newAmenityId) { alert('Enter amenity id'); return }
    try {
      await linkAmenityToUnitByIds(id, newAmenityId)
      alert('Amenity linked')
      openDetails(id)
    } catch (e:any) {
      console.error('link amenity', e)
      alert(e?.response?.data?.message || 'Failed to link amenity')
    }
  }

  async function handleRemoveAmenity(id:any, aId:any) {
    if (!confirm('Remove amenity?')) return
    try {
      await removeAmenityFromUnitByIds(id, aId)
      alert('Amenity removed')
      openDetails(id)
    } catch (e:any) {
      console.error('remove amenity', e)
      alert(e?.response?.data?.message || 'Failed to remove amenity')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-2xl font-bold">Units</h1>
        <div>
          <button className="button" onClick={openCreate}>Create Unit</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv" ref={fileRef} />
          <button className="button" onClick={handleBulkUpload}>Upload CSV</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit Unit' : 'Create Unit'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number</label>
              <input value={unitNumber} onChange={e=>setUnitNumber(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Building ID</label>
              <input value={buildingId as any} onChange={e=>setBuildingId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <input placeholder="floor" type="number" value={floor as any} onChange={e=>setFloor(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
              <input placeholder="bedrooms" type="number" value={bedrooms as any} onChange={e=>setBedrooms(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
              <input placeholder="bathrooms" type="number" value={bathrooms as any} onChange={e=>setBathrooms(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
              <input placeholder="area sqm" type="number" value={area as any} onChange={e=>setArea(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rent</label>
              <input type="number" value={rent as any} onChange={e=>setRent(e.target.value ? Number(e.target.value) : '')} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm">
                <option value="vacant">vacant</option>
                <option value="occupied">occupied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div className="flex items-center gap-2">
              <button className="button" type="submit">{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="px-3 py-1 border rounded" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading && <div>Loading...</div>}
        {!loading && units.length === 0 && <div className="muted">No units found</div>}
        {!loading && units.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Unit</th>
                <th className="py-2">Building</th>
                <th className="py-2">Floor</th>
                <th className="py-2">Beds</th>
                <th className="py-2">Status</th>
                <th className="py-2">Rent</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id} className="border-b hover:bg-slate-50">
                  <td className="py-2">{u.unit_number}</td>
                  <td className="py-2">{u.building?.name || u.building_id || '-'}</td>
                  <td className="py-2">{u.floor ?? '-'}</td>
                  <td className="py-2">{u.bedrooms ?? '-'}</td>
                  <td className="py-2">{u.status}</td>
                  <td className="py-2">{u.rent ?? '-'}</td>
                  <td className="py-2">
                    <button className="mr-2 text-primary" onClick={() => openDetails(u.id)}>Details</button>
                    <button className="mr-2 text-primary" onClick={() => openEdit(u)}>Edit</button>
                    <button className="text-red-700 ml-2" onClick={() => handleDelete(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailId && (
        <div className="fixed inset-0 flex items-start justify-center bg-black/30 pt-20">
          <div className="bg-white rounded shadow p-6 w-3/4 max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Unit details</h3>
              <button className="px-2 py-1 border rounded" onClick={()=>{ setDetailId(null); setDetail(null); }}>Close</button>
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
                <hr className="my-3" />
                <h4 className="font-medium">Amenities</h4>
                {amenities.length === 0 && <div className="muted">No amenities</div>}
                {amenities.length > 0 && (
                  <ul className="list-disc pl-5">
                    {amenities.map(a => (
                      <li key={a.id} className="flex items-center justify-between">
                        <span>{a.name} — {a.description}</span>
                        <button className="text-red-700 ml-2" onClick={()=>handleRemoveAmenity(detailId, a.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2 items-center">
                  <select value={newAmenityId as any} onChange={e=>setNewAmenityId(e.target.value)} className="block w-64 rounded-md border-gray-200 shadow-sm">
                    <option value="">Select amenity</option>
                    {availableAmenities.map((a:any) => (
                      <option key={a.id} value={a.id}>{a.name}{a.type ? ` — ${a.type}` : ''}</option>
                    ))}
                  </select>
                  <button className="button" onClick={()=>handleLinkAmenity(detailId)}>Link Amenity</button>
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
