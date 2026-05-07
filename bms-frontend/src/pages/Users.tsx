import React, { useEffect, useState } from 'react'
import { listUsers, deleteUser, activateUser, assignRole, createUser, updateUser } from '../api/users'
import { listRoles } from '../api/roles'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { Plus, Trash2, Edit2, Shield, User, Mail, Lock, CheckCircle, XCircle, MoreVertical, Search, X, Eye, EyeOff } from 'lucide-react'
import PermissionGate from '../components/PermissionGate'

type UserRow = {
  id: string | number
  name?: string
  email?: string
  roles?: string[]
  status?: string
  is_active?: boolean
}

export default function Users() {
  const toast = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [tab, setTab] = useState<'active' | 'deactivated'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  // form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState<string | undefined>(undefined)

  async function load() {
    setLoading(true)
    try {
      const res = await listUsers({ page, per_page: 500 })
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray((res as any).data)) list = (res as any).data
      else if (res && Array.isArray((res as any).users)) list = (res as any).users
      else list = []

      const normalized = list.map((u: any) => ({
        ...u,
        is_active: typeof u.is_active === 'boolean' ? u.is_active : (u.status ? String(u.status).toLowerCase() === 'active' : false),
        // Normalize role shapes from different API responses:
        // - u.roles: array of strings or objects { name }
        // - u.user_roles or u.userRoles: array of assignments containing role or role.name
        // - u.role: single role object
        // - u.role_id: fallback id
        roles: Array.isArray(u.roles)
          ? u.roles.map((r: any) => (typeof r === 'string' ? r : (r.name || r)))
          : Array.isArray(u.user_roles)
          ? u.user_roles.map((ur: any) => ur.role?.name || ur.name || ur)
          : Array.isArray(u.userRoles)
          ? u.userRoles.map((ur: any) => ur.role?.name || ur.name || ur)
          : (u.role ? [u.role.name || u.role] : (u.role_id ? [u.role_id] : [])),
      }))

      setUsers(normalized)
    } catch (e: any) {
      console.error(e)
      toast.addToast(e?.response?.data?.message || 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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
    setEditing(null); setName(''); setEmail(''); setPassword(''); setRoleId(undefined); setShowForm(true)
  }

  function openEdit(u: UserRow) {
    // Prefill form and attempt to select the primary role if available
    let preRoleId: string | undefined = undefined
    try {
      const firstRole = Array.isArray(u.roles) && u.roles.length ? u.roles[0] : undefined
      if (firstRole && roles && roles.length) {
        const match = roles.find((r: any) => String(r.name).toLowerCase() === String(firstRole).toLowerCase() || String(r.id) === String(firstRole))
        if (match) preRoleId = String(match.id)
      }
    } catch (_) { /* ignore */ }
    setEditing(u); setName(u.name || ''); setEmail(u.email || ''); setPassword(''); setRoleId(preRoleId); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        const updatePayload: any = { name, email }
        if (password) updatePayload.password = password
        await updateUser(editing.id, updatePayload)
        if (roleId) await assignRole({ user_id: editing.id, role_id: String(roleId) })
        toast.addToast('User updated successfully', 'success')
      } else {
        const created = await createUser({ name, email, password, status: 'ACTIVE' })
        // Some APIs don't assign role on create; call assignRole explicitly when role selected
        if (roleId) {
          try {
            await assignRole({ user_id: created.id || created.user?.id || created.user_id || created, role_id: String(roleId) })
          } catch (_) {
            // ignore assign failure here; UI will refresh and show current roles
          }
        }
        toast.addToast('User created successfully', 'success')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.addToast(err?.response?.data?.message || 'Operation failed', 'error')
    }
  }

  async function handleDeactivate(id: string | number) {
    if (!confirm('Deactivate this user?')) return
    try {
      await updateUser(id, { status: 'INACTIVE' })
      toast.addToast('User deactivated', 'success')
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to deactivate', 'error')
    }
  }

  async function handleActivate(id: string | number) {
    try {
      await activateUser(id)
      toast.addToast('User activated', 'success')
      load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to activate', 'error')
    }
  }

  async function handleDeleteUser(id: string | number) {
    try {
      setDeleteLoading(true)
      await deleteUser(id)
      toast.addToast('User deleted', 'success')
      setUserToDelete(null)
      await load()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to delete', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (tab === 'active') return u.is_active && matchesSearch
    return !u.is_active && matchesSearch
  })

  return (
    <PageLayout 
      title="System Users" 
      subtitle="Manage internal administrators, managers, and staff access control."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative hidden xl:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-sm w-48"
            />
          </div>
          <PermissionGate permission="users:create">
            <button onClick={openCreate} className="button shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm">
              <Plus size={16} /> <span className="hidden xs:inline">Create User</span>
              <span className="xs:hidden">Add User</span>
            </button>
          </PermissionGate>
        </div>
      }
    >
      <div className="space-y-6 pb-10">
        
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('active')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'active' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Active
          </button>
          <button
            onClick={() => setTab('deactivated')}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'deactivated' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Deactivated
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <User size={48} className="mb-4 opacity-50 text-slate-300" />
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No users found</p>
            <p className="text-sm font-medium mt-1">{tab === 'active' ? 'You have no active team members.' : 'No deactivated accounts.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((u) => (
              <div key={String(u.id)} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 group hover:shadow-md transition-all">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                    {u.name?.charAt(0).toUpperCase() || <User size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                      <span className="truncate">{u.name || 'Unnamed User'}</span>
                      {u.is_active ? (
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle size={14} className="text-rose-500 shrink-0" />
                      )}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                        <Mail size={12} className="shrink-0" /> {u.email}
                      </div>
                      <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                        <Shield size={12} className="shrink-0" /> <span className="truncate">{u.roles && u.roles.length ? u.roles.join(', ') : 'No Role'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                  <div className="flex items-center gap-1 sm:gap-2 self-end xs:self-center">
                    <PermissionGate permission="users:update">
                      <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all" title="Edit User">
                        <Edit2 size={16} />
                      </button>
                    </PermissionGate>
                    {u.is_active ? (
                      <PermissionGate permission="users:update">
                        <button onClick={() => handleDeactivate(u.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all" title="Deactivate">
                          <XCircle size={16} />
                        </button>
                      </PermissionGate>
                    ) : (
                      <PermissionGate permission="users:update">
                        <button onClick={() => handleActivate(u.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Activate">
                          <CheckCircle size={16} />
                        </button>
                      </PermissionGate>
                    )}
                    <PermissionGate permission="users:delete">
                      <button onClick={() => setUserToDelete(u)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </PermissionGate>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Modify Profile' : 'New User Account'}</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Connor" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@bms.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                </div>
              </div>
              <div>
                  {editing ? 'New Password (Leave blank to keep current)' : <>Initial Password <span className="text-red-500">*</span></>}
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required={!editing} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Primary Role</label>
                <div className="relative">
                  <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none transition-all cursor-pointer">
                    <option value="">Select a role...</option>
                    {roles.map((r: any) => <option key={r.id} value={String(r.id)}>{r.name || r.id}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
                  {editing ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Delete</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setUserToDelete(null)}>✕</button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 mb-4">Are you sure you want to permanently delete <strong>{userToDelete.name || userToDelete.email}</strong>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setUserToDelete(null)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button disabled={deleteLoading} onClick={() => handleDeleteUser(userToDelete.id)} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all">
                  {deleteLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
