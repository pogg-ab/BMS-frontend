import React, { useEffect, useState } from 'react'
import { listBuildings, createBuilding, getBuilding, updateBuilding, deleteBuilding, listAmenities, assignAdmin, listAdmins, revokeAdmin } from '../api/buildings'

type Building = {
  id: number | string
  name: string
  code?: string
  address?: string
  site_id?: number
  floors?: number
  units_count?: number
  is_active?: boolean
}

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [page, setPage] = useState(1)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [siteId, setSiteId] = useState<number | undefined>(undefined)
  const [floors, setFloors] = useState<number | undefined>(undefined)

  const [detailId, setDetailId] = useState<string | number | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [amenities, setAmenities] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await listBuildings({ page, per_page: 25 })
      // normalize possible shapes
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray(res.data)) list = res.data
      else list = []
      setBuildings(list)
    } catch (e:any) {
      console.error('load buildings', e)
      alert('Failed to load buildings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  function openCreate() {
    setEditing(null)
    setName('')
    setCode('')
    setAddress('')
    setSiteId(undefined)
    setFloors(undefined)
    setShowForm(true)
  }

  function openEdit(b: Building) {
    setEditing(b)
    setName(b.name || '')
    setCode(b.code || '')
    setAddress(b.address || '')
    setSiteId(b.site_id)
    setFloors(b.floors)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateBuilding(editing.id, { name, code, address, site_id: siteId, floors })
        alert('Building updated')
      } else {
        await createBuilding({ name, code, address, site_id: siteId, floors })
        alert('Building created')
      }
      setShowForm(false)
      load()
    } catch (err:any) {
      console.error('submit building', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('Delete this building?')) return
    try {
      await deleteBuilding(id)
      alert('Building deleted')
      load()
    } catch (e:any) {
      console.error('delete building', e)
      alert(e?.response?.data?.message || 'Failed to delete')
    }
  }

  async function openDetails(id: string | number) {
    setDetailId(id)
    setDetail(null)
    try {
      const d = await getBuilding(id)
      setDetail(d)
      const a = await listAmenities(id)
      setAmenities(Array.isArray(a) ? a : (a?.data || []))
      const ad = await listAdmins(id)
      setAdmins(Array.isArray(ad) ? ad : (ad?.data || []))
    } catch (e:any) {
      console.error('load detail', e)
      alert('Failed to load building details')
    }
  }

  async function handleAssignAdmin(buildingId: string | number) {
    const input = prompt('Enter user id to assign as admin:')
    if (!input) return
    try {
      await assignAdmin(buildingId, input)
      alert('Admin assigned')
      openDetails(buildingId)
    } catch (e:any) {
      console.error('assign admin', e)
      alert(e?.response?.data?.message || 'Failed to assign admin')
    }
  }

  async function handleRevokeAdmin(buildingId: string | number, userId: string | number) {
    if (!confirm('Revoke admin?')) return
    try {
      await revokeAdmin(buildingId, userId)
      alert('Admin revoked')
      openDetails(buildingId)
    } catch (e:any) {
      console.error('revoke admin', e)
      alert(e?.response?.data?.message || 'Failed to revoke admin')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-2xl font-bold">Buildings</h1>
        <div>
          <button className="button" onClick={openCreate}>Create Building</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit Building' : 'Create Building'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Code</label>
              <input value={code} onChange={e=>setCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site ID</label>
                <input type="number" value={siteId ?? ''} onChange={e=>setSiteId(e.target.value ? Number(e.target.value) : undefined)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Floors</label>
                <input type="number" value={floors ?? ''} onChange={e=>setFloors(e.target.value ? Number(e.target.value) : undefined)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
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
        {loading && <div>Loading...</div>}
        {!loading && buildings.length === 0 && <div className="muted">No buildings found</div>}
        {!loading && buildings.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Code</th>
                <th className="py-2">Type</th>
                <th className="py-2">City</th>
                <th className="py-2">Subcity</th>
                <th className="py-2">Address</th>
                <th className="py-2">Units</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map(b => (
                <tr key={String(b.id)} className="border-b hover:bg-slate-50">
                  <td className="py-2">{b.name}</td>
                  <td className="py-2">{b.code || '-'}</td>
                  <td className="py-2">{(b as any).type || '-'}</td>
                  <td className="py-2">{(b as any).city || '-'}</td>
                  <td className="py-2">{(b as any).subcity || '-'}</td>
                  <td className="py-2">{b.address || '-'}</td>
                  <td className="py-2">{(b as any).total_units ?? (b.units_count ?? '-')}</td>
                  <td className="py-2">{(b as any).status ? String((b as any).status) : (b.is_active ? 'active' : 'inactive')}</td>
                  <td className="py-2">
                    <button className="mr-2 text-primary" onClick={() => openDetails(b.id)}>Details</button>
                    <button className="mr-2 text-primary" onClick={() => openEdit(b)}>Edit</button>
                    <button className="text-red-700 ml-2" onClick={() => handleDelete(b.id)}>Delete</button>
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
              <h3 className="text-lg font-medium">Building details</h3>
              <button className="px-2 py-1 border rounded" onClick={() => { setDetailId(null); setDetail(null); }}>Close</button>
            </div>
            {detail ? (
              <div>
                <p><strong>Name:</strong> {detail.name}</p>
                <p><strong>Code:</strong> {detail.code}</p>
                <p><strong>Address:</strong> {detail.address}</p>
                <p><strong>Site:</strong> {detail.site?.name || detail.site_id || '-'}</p>
                <p><strong>Floors:</strong> {detail.floors}</p>
                <p><strong>Units count:</strong> {detail.units_count}</p>
                <hr className="my-3" />
                <h4 className="font-medium">Amenities</h4>
                {amenities.length === 0 && <div className="muted">No amenities</div>}
                {amenities.length > 0 && (
                  <ul className="list-disc pl-5">
                    {amenities.map(a => <li key={a.id}>{a.name} — {a.description}</li>)}
                  </ul>
                )}
                <hr className="my-3" />
                <h4 className="font-medium">Admins</h4>
                {admins.length === 0 && <div className="muted">No admins assigned</div>}
                {admins.length > 0 && (
                  <ul className="list-disc pl-5">
                    {admins.map(a => (
                      <li key={a.id} className="flex items-center justify-between">
                        <span>{a.name} — {a.email}</span>
                        <div>
                          <button className="text-red-700 ml-2" onClick={() => handleRevokeAdmin(detailId, a.id)}>Revoke</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <button className="button" onClick={() => handleAssignAdmin(detailId)}>Assign Admin (by user id)</button>
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
