import React, { useEffect, useState } from 'react'
import { listRoles, createRole, updateRole, deleteRole, listPermissions, assignPermissions, createPermission, deletePermission } from '../api/roles'

type Role = {
  id: string
  name: string
  type?: string
  description?: string
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [permissions, setPermissions] = useState<any[]>([])
  const [permCode, setPermCode] = useState('')
  const [permDescription, setPermDescription] = useState('')
  const [manageRoleId, setManageRoleId] = useState<string | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])

  const [name, setName] = useState('')
  const [typeV, setTypeV] = useState('')
  const [description, setDescription] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await listRoles()
      // normalize shapes
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray(res.data)) list = res.data
      else if (res && Array.isArray(res.roles)) list = res.roles
      else list = []
      setRoles(list)
      // also load permissions for management UI
      try {
        const pres = await listPermissions()
        let plist: any[] = []
        if (Array.isArray(pres)) plist = pres
        else if (pres && Array.isArray(pres.data)) plist = pres.data
        else if (pres && Array.isArray(pres.permissions)) plist = pres.permissions
        setPermissions(plist)
      } catch (pe:any) {
        console.error('load permissions error', pe)
        setPermissions([])
      }
    } catch (e: any) {
      console.error('load roles error', e)
      alert(e?.response?.data?.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setTypeV('')
    setDescription('')
    setShowForm(true)
  }

  function openEdit(r: Role) {
    setEditing(r)
    setName(r.name || '')
    setTypeV(r.type || '')
    setDescription(r.description || '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateRole(editing.id, { name, type: typeV, description })
        alert('Role updated')
      } else {
        await createRole({ name, type: typeV, description })
        alert('Role created')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('role submit error', err)
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this role? This will fail if users are assigned.')) return
    try {
      await deleteRole(id)
      alert('Role deleted')
      load()
    } catch (e: any) {
      console.error('delete role error', e)
      alert(e?.response?.data?.message || 'Failed to delete role')
    }
  }

  function openManagePermissions(r: Role) {
    setManageRoleId(r.id)
    // try to pre-select if role has `permissions` field
    const pre = (r as any).permissions
    if (Array.isArray(pre)) setSelectedPermIds(pre.map((p:any)=>p.id || p))
    else setSelectedPermIds([])
  }

  function togglePermission(id: string) {
    setSelectedPermIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  async function saveRolePermissions() {
    if (!manageRoleId) return
    try {
      await assignPermissions(manageRoleId, { permissions: selectedPermIds })
      alert('Permissions assigned')
      setManageRoleId(null)
      load()
    } catch (e:any) {
      console.error('assign permissions error', e)
      alert(e?.response?.data?.message || 'Failed to assign permissions')
    }
  }

  async function handleCreatePermission(e:React.FormEvent) {
    e.preventDefault()
    try {
      await createPermission({ code: permCode, description: permDescription })
      setPermCode('')
      setPermDescription('')
      load()
      alert('Permission created')
    } catch (e:any) {
      console.error('create permission error', e)
      alert(e?.response?.data?.message || 'Failed to create permission')
    }
  }

  async function handleDeletePermission(id:string) {
    if (!confirm('Delete this permission?')) return
    try {
      await deletePermission(id)
      load()
      alert('Permission deleted')
    } catch (e:any) {
      console.error('delete permission error', e)
      alert(e?.response?.data?.message || 'Failed to delete permission')
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-2xl font-bold">Roles</h1>
        <div>
          <button className="button" onClick={openCreate}>Create Role</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit Role' : 'Create Role'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <input value={typeV} onChange={e => setTypeV(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
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
        {!loading && roles.length === 0 && <div className="muted">No roles found</div>}
        {!loading && roles.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Description</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.type || '-'}</td>
                  <td className="py-2">{r.description || '-'}</td>
                  <td className="py-2">
                    <button className="mr-2 text-primary" onClick={() => openEdit(r)}>Edit</button>
                    <button className="mr-2 text-red-700" onClick={() => handleDelete(r.id)}>Delete</button>
                    <button className="text-primary ml-2" onClick={() => openManagePermissions(r)}>Manage Permissions</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="header mt-6">
        <h2 className="text-xl font-semibold">Permissions</h2>
        <div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="mb-4">
          <form onSubmit={handleCreatePermission} className="grid grid-cols-3 gap-2">
            <input placeholder="code" value={permCode} onChange={e=>setPermCode(e.target.value)} className="block w-full rounded-md border-gray-200 shadow-sm" />
            <input placeholder="description" value={permDescription} onChange={e=>setPermDescription(e.target.value)} className="block w-full rounded-md border-gray-200 shadow-sm" />
            <button className="button" type="submit">Create Permission</button>
          </form>
        </div>

        {permissions.length === 0 && <div className="muted">No permissions</div>}
        {permissions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Code</th>
                <th className="py-2">Description</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id || p.code} className="border-b hover:bg-slate-50">
                  <td className="py-2">{p.code || p.id}</td>
                  <td className="py-2">{p.description || '-'}</td>
                  <td className="py-2">
                    <button className="text-red-700" onClick={() => handleDeletePermission(p.id || p.code)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {manageRoleId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-6 w-3/4 max-w-2xl">
            <h3 className="text-lg font-medium mb-3">Manage Permissions</h3>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto mb-4">
              {permissions.map(p => (
                <label key={p.id || p.code} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedPermIds.includes(p.id || p.code)} onChange={() => togglePermission(p.id || p.code)} />
                  <span>{p.code || p.id} — {p.description}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 border rounded" onClick={() => setManageRoleId(null)}>Cancel</button>
              <button className="button" onClick={saveRolePermissions}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
