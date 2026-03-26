import React, { useEffect, useState } from 'react'
import { listBuildings, createBuilding, getBuilding, updateBuilding, deleteBuilding, listAmenities, assignAdmin, listAdmins, revokeAdmin } from '../api/buildings'

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
  const [siteId, setSiteId] = useState<string>('')
  const [ownerId, setOwnerId] = useState<string>('')
  const [type, setType] = useState<string>('residential') // default enum value

  // For dropdowns
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
      const res = await listBuildings({ page, per_page: 25 })
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray(res.data)) list = res.data
      else list = []
      setBuildings(list)

      // Fetch sites and owners for dropdowns silently
      import('../api/sites').then(m => m.listSites().then(s => setSites(Array.isArray(s) ? s : []))).catch(console.error)
      import('../api/owners').then(m => m.listOwners().then(o => setOwners(Array.isArray(o) ? o : (o.data || [])))).catch(console.error)
      import('../api/users').then(m => m.listUsers({ page: 1, per_page: 500 }).then((u: any) => {
        const list = Array.isArray(u) ? u : (u?.data || u?.users || [])
        setAllUsers(list)
      })).catch(console.error)

    } catch (e: any) {
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
    setSiteId('')
    setOwnerId('')
    setType('residential')
    setShowForm(true)
  }

  function openEdit(b: Building) {
    setEditing(b)
    setName(b.name || '')
    setCode(b.code || '')
    setAddress(b.address || '')
    setSiteId(b.siteId || (b as any).site_id || '')
    setOwnerId(b.ownerId || (b as any).owner_id || '')
    setType(b.type || 'residential')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { name, code, address, siteId, ownerId, type }
      if (editing) {
        await updateBuilding(editing.id, payload)
        alert('Building updated')
      } else {
        await createBuilding(payload)
        alert('Building created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('submit building', err)
      const msg = err?.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(',') : (msg || 'Operation failed'))
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('Delete this building?')) return
    try {
      await deleteBuilding(id)
      alert('Building deleted')
      load()
    } catch (e: any) {
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
    } catch (e: any) {
      console.error('load detail', e)
      alert('Failed to load building details')
    }
  }

  async function handleAssignAdmin(buildingId: string | number) {
    if (!assignAdminUserId) { alert('Select a user first'); return }
    try {
      await assignAdmin(buildingId, assignAdminUserId)
      alert('Admin assigned')
      setAssignAdminUserId('')
      openDetails(buildingId)
    } catch (e: any) {
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
    } catch (e: any) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Building Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="e.g. Skyline Tower" />
              </div>
              <div>
                <label className="form-label">Building Code</label>
                <input required value={code} onChange={e => setCode(e.target.value)} className="form-input" placeholder="BLD-01" />
              </div>
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
              <div>
                <label className="form-label">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="form-select">
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="MIXED">Mixed Use</option>
                </select>
              </div>
              <div>
                <label className="form-label">Address</label>
                <input required value={address} onChange={e => setAddress(e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <button className="button" type="submit">{editing ? 'Save Changes' : 'Create Building'}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
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
                <tr key={String(b.id)} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900">
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
          <div className="bg-white dark:bg-slate-800 rounded shadow p-6 w-3/4 max-w-3xl">
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
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <select
                    value={assignAdminUserId}
                    onChange={e => setAssignAdminUserId(e.target.value)}
                    className="p-2 border rounded text-sm flex-1 min-w-[200px]"
                  >
                    <option value="">Select user to assign as admin</option>
                    {allUsers.map((u: any) => (
                      <option key={u.id} value={String(u.id)}>{u.name || u.email || `User #${u.id}`}</option>
                    ))}
                  </select>
                  <button className="button text-sm" onClick={() => handleAssignAdmin(detailId!)}>Assign Admin</button>
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
