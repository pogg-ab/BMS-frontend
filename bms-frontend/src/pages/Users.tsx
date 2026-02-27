import React, { useEffect, useState } from 'react'
import { listUsers, deleteUser, activateUser, assignRole, createUser, updateUser } from '../api/users'
import { listRoles } from '../api/roles'

type UserRow = {
  id: string | number
  name?: string
  email?: string
  roles?: string[]
  status?: string
  is_active?: boolean
}

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [roles, setRoles] = useState<any[]>([])

  // form state (shared for create/edit)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState<string | undefined>(undefined)

  async function load() {
    setLoading(true)
    try {
      const res = await listUsers({ page, per_page: 25 })
      // handle different backend shapes: array, { data: [...] }, { users: [...] }
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray((res as any).data)) list = (res as any).data
      else if (res && Array.isArray((res as any).users)) list = (res as any).users
      else list = []

      // normalize items: map `status` -> `is_active`, and ensure `roles` array
      const normalized = list.map((u: any) => ({
        ...u,
        is_active: typeof u.is_active === 'boolean' ? u.is_active : (u.status ? String(u.status).toLowerCase() === 'active' : false),
        roles: Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : (u.role_id ? [u.role_id] : [])),
      }))

      setUsers(normalized)
    } catch (e: any) {
      console.error(e)
      alert(e?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // fetch roles and normalize shapes
    listRoles()
      .then((r: any) => {
        if (Array.isArray(r)) setRoles(r)
        else if (r && Array.isArray(r.data)) setRoles(r.data)
        else if (r && Array.isArray(r.roles)) setRoles(r.roles)
        else setRoles([])
      })
      .catch(() => setRoles([]))
  }, [page])

  function openCreate() {
    setEditing(null)
    setName('')
    setEmail('')
    setPassword('')
    setRoleId(undefined)
    setShowCreate(true)
  }

  function openEdit(u: UserRow) {
    setEditing(u)
    setName(u.name || '')
    setEmail(u.email || '')
    setPassword('')
    setRoleId(u.roles && u.roles.length ? String(u.roles[0]) : undefined)
    setShowCreate(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateUser(editing.id, { name, email })
        if (roleId) await assignRole({ user_id: editing.id, role_id: roleId })
        alert('User updated')
      } else {
        await createUser({ name, email, password, role_id: roleId, status: 'active' })
        alert('User created')
      }
      setShowCreate(false)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Operation failed')
    }
  }

  async function handleDeactivate(id: string | number) {
    if (!confirm('Deactivate this user?')) return
    try {
      await updateUser(id, { status: 'inactive' })
      alert('User deactivated')
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to deactivate')
    }
  }

  async function handleActivate(id: string | number) {
    try {
      await activateUser(id)
      alert('User activated')
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to activate')
    }
  }

  async function handleAssignRolePrompt(id: string | number) {
    const input = prompt('Enter role id to assign:')
    if (!input) return
    try {
      await assignRole({ user_id: id, role_id: input })
      alert('Role assigned')
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to assign role')
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('Delete this user? This action cannot be undone.')) return
    try {
      const res = await deleteUser(id)
      console.log('delete response', res)
      alert('User deleted')
      load()
    } catch (e: any) {
      console.error('delete error', e)
      const status = e?.response?.status
      const msg = e?.response?.data?.message || e?.message || 'Failed to delete user'
      // fallback: if delete not allowed, mark user inactive as a safe fallback
      if (status === 405 || status === 501 || status === 404) {
        try {
          await updateUser(id, { status: 'inactive' })
          alert('User marked inactive (delete not supported)')
          load()
          return
        } catch (e2: any) {
          console.error('fallback update error', e2)
        }
      }
      alert(msg)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-2xl font-bold">Users</h1>
        <div>
          <button className="button" onClick={openCreate}>Create User</button>
        </div>
      </div>

      {showCreate && (
        <div className="card mb-4">
          <h2 className="text-lg font-medium">{editing ? 'Edit User' : 'Create User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={roleId} onChange={e => setRoleId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm">
                <option value="">(none)</option>
                {roles.map((r:any) => <option key={r.id} value={r.id}>{r.name || r.id}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="button" type="submit">{editing ? 'Save' : 'Create'}</button>
              <button type="button" className="px-3 py-1 border rounded" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading && <div>Loading...</div>}
        {!loading && users.length === 0 && <div className="muted">No users found</div>}
        {!loading && users.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={String(u.id)} className="border-b hover:bg-slate-50">
                  <td className="py-2">{u.name || '-'}</td>
                    <td className="py-2">{u.email || '-'}</td>
                    <td className="py-2">{u.roles && u.roles.length ? u.roles.join(', ') : '-'}</td>
                    <td className="py-2">{u.is_active ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                    <button className="mr-2 text-primary" onClick={() => openEdit(u)}>Edit</button>
                    {u.is_active ? (
                      <button className="mr-2 text-red-600" onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                    ) : (
                      <button className="mr-2 text-green-600" onClick={() => handleActivate(u.id)}>Activate</button>
                    )}
                    <button className="text-red-700 ml-2" onClick={() => handleDelete(u.id)}>Delete</button>
                    <button className="text-primary ml-2" onClick={() => handleAssignRolePrompt(u.id)}>Assign Role</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
