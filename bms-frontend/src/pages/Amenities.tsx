import React, { useEffect, useState } from 'react'
import { listAmenities, createAmenity, deleteAmenity, getAmenity, linkAmenityToBuilding, removeAmenityFromBuilding, linkAmenityToUnitByIds, removeAmenityFromUnitByIds } from '../api/amenities'

export default function Amenities() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await listAmenities({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || [])
      setItems(list)
    } catch (e:any) {
      console.error('load amenities', e)
      alert('Failed to load amenities')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e:React.FormEvent) {
    e.preventDefault()
    try {
      await createAmenity({ name, description, category })
      setName('')
      setDescription('')
      setCategory('')
      load()
      alert('Amenity created')
    } catch (err:any) {
      console.error('create amenity', err)
      const msg = err?.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(',') : (msg || 'Failed to create amenity'))
    }
  }

  async function handleDelete(id:any) {
    if (!confirm('Delete amenity?')) return
    try {
      await deleteAmenity(id)
      alert('Amenity deleted')
      load()
    } catch (e:any) {
      console.error('delete amenity', e)
      alert(e?.response?.data?.message || 'Failed to delete amenity')
    }
  }

  const [manageId, setManageId] = useState<string | number | null>(null)
  const [amenityDetail, setAmenityDetail] = useState<any | null>(null)
  const [linkedBuildings, setLinkedBuildings] = useState<any[]>([])
  const [linkedUnits, setLinkedUnits] = useState<any[]>([])
  const [linkBuildingId, setLinkBuildingId] = useState('')
  const [linkUnitId, setLinkUnitId] = useState('')

  async function openManageLinks(id:any) {
    setManageId(id)
    setAmenityDetail(null)
    try {
      const d = await getAmenity(id)
      setAmenityDetail(d)
      setLinkedBuildings(d.linked_buildings || [])
      setLinkedUnits(d.linked_units || [])
    } catch (e:any) {
      console.error('get amenity details', e)
      alert('Failed to load amenity details')
    }
  }

  async function handleLinkToBuilding() {
    if (!manageId) return
    if (!linkBuildingId) { alert('Enter building id'); return }
    try {
      await linkAmenityToBuilding(linkBuildingId, manageId)
      alert('Linked to building')
      openManageLinks(manageId)
      load()
    } catch (e:any) {
      console.error('link to building', e)
      alert(e?.response?.data?.message || 'Failed to link')
    }
  }

  async function handleRemoveBuilding(bId:any) {
    if (!manageId) return
    if (!confirm('Remove amenity from building?')) return
    try {
      await removeAmenityFromBuilding(bId, manageId)
      alert('Removed link')
      openManageLinks(manageId)
      load()
    } catch (e:any) {
      console.error('remove link building', e)
      alert(e?.response?.data?.message || 'Failed to remove link')
    }
  }

  async function handleLinkToUnit() {
    if (!manageId) return
    if (!linkUnitId) { alert('Enter unit id'); return }
    try {
      await linkAmenityToUnitByIds(linkUnitId, manageId)
      alert('Linked to unit')
      openManageLinks(manageId)
      load()
    } catch (e:any) {
      console.error('link to unit', e)
      alert(e?.response?.data?.message || 'Failed to link')
    }
  }

  async function handleRemoveUnit(uId:any) {
    if (!manageId) return
    if (!confirm('Remove amenity from unit?')) return
    try {
      await removeAmenityFromUnitByIds(uId, manageId)
      alert('Removed link')
      openManageLinks(manageId)
      load()
    } catch (e:any) {
      console.error('remove link unit', e)
      alert(e?.response?.data?.message || 'Failed to remove link')
    }
  }

  return (
    <div className="container">
      <div className="header flex items-center justify-between">
        <h1 className="text-2xl font-bold">Amenities</h1>
      </div>

      <div className="card my-4">
        <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input value={category} onChange={e=>setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <button className="button ml-auto" type="submit">Create</button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading && <div>Loading...</div>}
        {!loading && items.length === 0 && <div className="muted">No amenities found</div>}
        {!loading && items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Shared</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a=> (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="py-2">{a.name}</td>
                  <td className="py-2">{a.category || '-'}</td>
                  <td className="py-2">-</td>
                  <td className="py-2">
                      <div className="flex items-center gap-3">
                        <button className="text-primary" onClick={()=>openManageLinks(a.id)}>Manage Links</button>
                        <button className="text-red-700" onClick={()=>handleDelete(a.id)}>Delete</button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        {manageId && (
          <div className="fixed inset-0 flex items-start justify-center bg-black/30 pt-20">
            <div className="bg-white rounded shadow p-6 w-3/4 max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Manage links for {amenityDetail?.name || manageId}</h3>
                <button className="px-2 py-1 border rounded" onClick={()=>{ setManageId(null); setAmenityDetail(null); }}>Close</button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Linked Buildings</h4>
                  {linkedBuildings.length === 0 && <div className="muted">No buildings linked</div>}
                  {linkedBuildings.length > 0 && (
                    <ul className="list-disc pl-5">
                      {linkedBuildings.map((b:any)=> (
                        <li key={b.id} className="flex items-center justify-between">
                          <span>{b.name} ({b.id})</span>
                          <button className="text-red-700" onClick={()=>handleRemoveBuilding(b.id)}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex gap-2">
                    <input placeholder="building id" value={linkBuildingId} onChange={e=>setLinkBuildingId(e.target.value)} className="block w-48 rounded-md border-gray-200 shadow-sm" />
                    <button className="button" onClick={handleLinkToBuilding}>Link to Building</button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Linked Units</h4>
                  {linkedUnits.length === 0 && <div className="muted">No units linked</div>}
                  {linkedUnits.length > 0 && (
                    <ul className="list-disc pl-5">
                      {linkedUnits.map((u:any)=> (
                        <li key={u.id} className="flex items-center justify-between">
                          <span>{u.unit_number || u.id}</span>
                          <button className="text-red-700" onClick={()=>handleRemoveUnit(u.id)}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex gap-2">
                    <input placeholder="unit id" value={linkUnitId} onChange={e=>setLinkUnitId(e.target.value)} className="block w-48 rounded-md border-gray-200 shadow-sm" />
                    <button className="button" onClick={handleLinkToUnit}>Link to Unit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
