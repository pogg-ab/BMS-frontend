import React, { useEffect, useState } from 'react'
import { 
  listRoles, createRole, updateRole, deleteRole, 
  listPermissions, assignPermissions, createPermission, deletePermission 
} from '../api/roles'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { ShieldCheck, UserCheck, KeySquare, Plus, Trash2, Edit } from 'lucide-react'

type Role = {
  id: string
  name: string
  type?: string
  description?: string
  permissions?: any[]
}

export default function Roles() {
  const { addToast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Forms & Modals
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [manageRoleId, setManageRoleId] = useState<string | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])

  // Role Form State
  const [roleName, setRoleName] = useState('')
  const [roleType, setRoleType] = useState('company')
  const [roleDescription, setRoleDescription] = useState('')

  // Permission Form State
  const [permCode, setPermCode] = useState('')
  const [permDescription, setPermDescription] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const resRoles = await listRoles()
      let rList: any[] = []
      if (Array.isArray(resRoles)) rList = resRoles
      else if (resRoles?.data) rList = resRoles.data
      else if (resRoles?.roles) rList = resRoles.roles
      setRoles(rList)

      const resPerms = await listPermissions()
      let pList: any[] = []
      if (Array.isArray(resPerms)) pList = resPerms
      else if (resPerms?.data) pList = resPerms.data
      else if (resPerms?.permissions) pList = resPerms.permissions
      setPermissions(pList)
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Failed to load RBAC data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // --- Roles Logic ---
  function openCreateRole() {
    setEditingRole(null)
    setRoleName('')
    setRoleType('company')
    setRoleDescription('')
    setShowRoleForm(true)
  }

  function openEditRole(r: Role) {
    if (r.name === 'super_admin') return
    setEditingRole(r)
    setRoleName(r.name || '')
    setRoleType(r.type || 'company')
    setRoleDescription(r.description || '')
    setShowRoleForm(true)
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: roleName, type: roleType, description: roleDescription })
        addToast('Role updated successfully', 'success')
      } else {
        await createRole({ name: roleName, type: roleType, description: roleDescription })
        addToast('Role created successfully', 'success')
      }
      setShowRoleForm(false)
      loadData()
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Operation failed', 'error')
    }
  }

  async function handleDeleteRole(id: string, name: string) {
    if (name === 'super_admin') {
      addToast('Super Admin role cannot be deleted', 'error')
      return
    }
    if (!confirm(`Delete role "${name}"? This fails if users are still assigned.`)) return
    try {
      await deleteRole(id)
      addToast('Role deleted', 'success')
      loadData()
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Failed to delete role', 'error')
    }
  }

  // --- Assign Permissions Logic ---
  function openManagePermissions(r: Role) {
    if (r.name === 'super_admin') {
      addToast('Super Admin naturally possesses all permissions.', 'info')
      return
    }
    setManageRoleId(r.id)
    const currentPerms = r.permissions || []
    setSelectedPermIds(currentPerms.map((p:any) => p.id || p))
  }

  function togglePermissionSelection(id: string) {
    setSelectedPermIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function saveRolePermissions() {
    if (!manageRoleId) return
    try {
      await assignPermissions(manageRoleId, { permissions: selectedPermIds })
      addToast('Permissions assigned successfully', 'success')
      setManageRoleId(null)
      loadData()
    } catch (e:any) {
      addToast(e?.response?.data?.message || 'Failed to assign permissions', 'error')
    }
  }

  // --- Permissions Logic ---
  async function handleCreatePermission(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createPermission({ code: permCode, description: permDescription })
      setPermCode('')
      setPermDescription('')
      addToast('Permission created', 'success')
      loadData()
    } catch (e:any) {
      addToast(e?.response?.data?.message || 'Failed to create permission', 'error')
    }
  }

  async function handleDeletePermission(id: string) {
    if (!confirm('Delete this permission permanently?')) return
    try {
      await deletePermission(id)
      addToast('Permission deleted', 'success')
      loadData()
    } catch (e:any) {
      addToast(e?.response?.data?.message || 'Failed to delete permission', 'error')
    }
  }

  return (
    <PageLayout
      title="Access Control"
      subtitle="Manage roles, permissions, and system access policies."
      actions={
        activeTab === 'roles' && (
          <button onClick={openCreateRole} className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm">
            <Plus size={18} /> New Role
          </button>
        )
      }
    >
      <div className="mb-6 flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'roles' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <UserCheck size={18} /> Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <KeySquare size={18} /> Permissions List
        </button>
      </div>

      {showRoleForm && activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingRole ? 'Update Role' : 'Create New Role'}</h3>
          <form onSubmit={handleRoleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input required value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Front Desk" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Scope (Type)</label>
              <select value={roleType} onChange={e => setRoleType(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="company">Company</option>
                <option value="building">Building</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea value={roleDescription} onChange={e => setRoleDescription(e.target.value)} rows={2} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3">
              <button type="button" onClick={() => setShowRoleForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
                {editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No roles found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scope</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roles.map(r => {
                    const isProtected = r.name === 'super_admin'
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isProtected && <ShieldCheck size={16} className="text-yellow-500" />}
                            <span className={`font-medium ${isProtected ? 'text-gray-900' : 'text-gray-700'}`}>{r.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${r.type === 'system' ? 'bg-purple-100 text-purple-800' : r.type === 'building' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{r.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {isProtected ? 'ALL' : r.permissions?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          {!isProtected ? (
                            <>
                              <button onClick={() => openManagePermissions(r)} className="text-blue-600 hover:text-blue-900">Permissions</button>
                              <button onClick={() => openEditRole(r)} className="text-indigo-600 hover:text-indigo-900"><Edit size={16} className="inline"/></button>
                              <button onClick={() => handleDeleteRole(r.id, r.name)} className="text-red-500 hover:text-red-700"><Trash2 size={16} className="inline"/></button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GET/MANAGE PERMISSIONS MODAL */}
      {manageRoleId && activeTab === 'roles' && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Manage Role Permissions</h3>
              <span className="text-sm px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">Selected: {selectedPermIds.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map(p => (
                  <label key={p.id || p.code} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPermIds.includes(p.id || p.code) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                    <input 
                      type="checkbox" 
                      className="mt-1 flex-shrink-0 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={selectedPermIds.includes(p.id || p.code)} 
                      onChange={() => togglePermissionSelection(p.id || p.code)} 
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{p.code || p.id}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.description || 'No description'}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setManageRoleId(null)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm" onClick={saveRolePermissions}>Save Permissions</button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS TAB */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus size={20} className="text-blue-600"/> Create Permission</h3>
            <form onSubmit={handleCreatePermission} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Code</label>
                <input required placeholder="e.g. documents:download" value={permCode} onChange={e=>setPermCode(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input placeholder="e.g. Allows downloading tenant documents" value={permDescription} onChange={e=>setPermDescription(e.target.value)} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <button type="submit" className="px-6 py-2 h-[42px] text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
                Register
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {permissions.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No permissions registered yet</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map(p => (
                    <tr key={p.id || p.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.code || p.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-red-500 hover:text-red-700" onClick={() => handleDeletePermission(p.id || p.code)}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
