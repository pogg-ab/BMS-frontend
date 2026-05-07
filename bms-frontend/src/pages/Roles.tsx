import React, { useEffect, useState } from 'react'
import { 
  listRoles, createRole, updateRole, deleteRole, 
  listPermissions, assignPermissions, createPermission, deletePermission 
} from '../api/roles'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import ConfirmModal from '../components/ConfirmModal'
import { ShieldCheck, UserCheck, KeySquare, Plus, Trash2, Edit2, Shield, Lock, Check, X, Info } from 'lucide-react'
import PermissionGate from '../components/PermissionGate'

type Role = {
  id: string
  name: string
  type?: string
  description?: string
  permissions?: any[]
}

export default function Roles() {
  const toast = useToast()
  
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Forms & Modals
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [manageRoleId, setManageRoleId] = useState<string | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])
  const [toDeleteRole, setToDeleteRole] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Role Form State
  const [roleName, setRoleName] = useState('')
  const [roleType, setRoleType] = useState('company')
  const [roleDescription, setRoleDescription] = useState('')

  // Permission Form State
  // (Removed)

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
      toast.addToast(e?.response?.data?.message || 'Failed to load RBAC data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // --- Roles Logic ---
  function openCreateRole() {
    setEditingRole(null); setRoleName(''); setRoleType('company'); setRoleDescription(''); setShowRoleForm(true)
  }

  function openEditRole(r: Role) {
    if (r.name === 'super_admin') {
      toast.addToast('Super Admin role is protected.', 'info')
      return
    }
    setEditingRole(r); setRoleName(r.name || ''); setRoleType(r.type || 'company'); setRoleDescription(r.description || ''); setShowRoleForm(true)
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: roleName, type: roleType, description: roleDescription })
        toast.addToast('Role updated successfully', 'success')
      } else {
        await createRole({ name: roleName, type: roleType, description: roleDescription })
        toast.addToast('Role created successfully', 'success')
      }
      setShowRoleForm(false); loadData()
    } catch (err: any) {
      toast.addToast(err?.response?.data?.message || 'Operation failed', 'error')
    }
  }

  async function handleDeleteRole(id: string, name: string) {
    // open modal instead
    if (name === 'super_admin') return
    setToDeleteRole({ id, name } as Role)
  }

  // --- Assign Permissions Logic ---
  function openManagePermissions(r: Role) {
    if (r.name === 'super_admin') {
      toast.addToast('Super Admin naturally possesses all permissions.', 'info')
      return
    }
    setManageRoleId(r.id)
    const currentPerms = r.permissions || []
    setSelectedPermIds(currentPerms.map((p:any) => String(p.id || p)))
  }

  function togglePermissionSelection(id: string) {
    const sId = String(id)
    setSelectedPermIds(prev => prev.includes(sId) ? prev.filter(x => x !== sId) : [...prev, sId])
  }

  async function saveRolePermissions() {
    if (!manageRoleId) return
    try {
      await assignPermissions(manageRoleId, { permissions: selectedPermIds })
      toast.addToast('Permissions updated', 'success')
      setManageRoleId(null); loadData()
    } catch (e:any) {
      toast.addToast(e?.response?.data?.message || 'Failed to assign permissions', 'error')
    }
  }

  // (Removed permission creation/deletion logic)

  async function confirmDeleteRole() {
    if (!toDeleteRole) return
    setDeleting(true)
    try {
      await deleteRole(toDeleteRole.id)
      toast.addToast('Role deleted', 'success')
      setToDeleteRole(null)
      loadData()
    } catch (e:any) {
      toast.addToast(e?.response?.data?.message || 'Failed to delete role', 'error')
    } finally { setDeleting(false) }
  }

  // (Removed permission delete confirmation logic)

  return (
    <PageLayout
      title="Access Control"
      subtitle="Manage security roles and fine-grained system permissions."
      actions={null}
    >
      <div className="space-y-8 pb-10">
        
        <>
          <PermissionGate permission="roles:create">
            <div className="flex justify-end px-1 sm:px-0">
              <button onClick={openCreateRole} className="button shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Plus size={16} /> <span className="hidden xs:inline">Create Role</span>
                <span className="xs:hidden">New Role</span>
              </button>
            </div>
          </PermissionGate>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
          ) : roles.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <Shield size={48} className="mb-4 opacity-50 text-slate-300" />
              <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No roles defined</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(r => {
                const isSudo = r.name === 'super_admin'
                return (
                  <div key={r.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 group hover:shadow-md transition-all relative overflow-hidden">
                    {isSudo && <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full -mr-12 -mt-12 flex items-end justify-start p-4"><ShieldCheck size={24} className="text-yellow-500" /></div>}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSudo ? 'bg-yellow-50 text-yellow-600' : 'bg-indigo-50 text-indigo-600'} dark:bg-slate-900 border border-slate-100`}>
                        <UserCheck size={20} />
                      </div>
                      <div className="flex items-center gap-1">
                            {!isSudo && (
                          <>
                            <PermissionGate permission="roles:update">
                              <button onClick={() => openEditRole(r)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                            </PermissionGate>
                            <PermissionGate permission="roles:delete">
                              <button onClick={() => handleDeleteRole(r.id, r.name)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                            </PermissionGate>
                          </>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{r.name.replace('_', ' ')}</h3>
                    <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">{r.type || 'Staff'}</p>
                    
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 line-clamp-2 min-h-[40px] italic">
                      {r.description || 'No system description provided for this security role.'}
                    </p>

                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Lock size={14} className="text-slate-400" />
                         <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{isSudo ? 'Unlimited' : r.permissions?.length || 0} Permissions</span>
                       </div>
                       {!isSudo && (
                         <button 
                          onClick={() => openManagePermissions(r)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                         >
                          View Rights
                         </button>
                       )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      </div>

      {/* ROLE FORM MODAL */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingRole ? 'Update Role' : 'New System Role'}</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setShowRoleForm(false)}>✕</button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Role Identifier <span className="text-red-500">*</span></label>
                <input required value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. front_desk" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">System Scope</label>
                <select value={roleType} onChange={e => setRoleType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm">
                  <option value="company">Company Global</option>
                  <option value="building">Building Restricted</option>
                  <option value="system">Pure System/Dev</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <textarea value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm h-24 shadow-sm" placeholder="Purpose of this role..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowRoleForm(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!toDeleteRole}
        title="Delete Role"
        message={toDeleteRole ? `Delete role "${toDeleteRole.name}"? This cannot be undone.` : 'Delete role?'}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onConfirm={confirmDeleteRole}
        onCancel={() => setToDeleteRole(null)}
      />

  // (Removed permission delete modal)

      {/* MANAGE PERMISSIONS MODAL */}
      {manageRoleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Role Privileges</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{selectedPermIds.length} ACTIVE</span>
                <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setManageRoleId(null)}>✕</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map(p => {
                  const isChecked = selectedPermIds.includes(String(p.id || p.code))
                  return (
                    <label key={p.id || p.code} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${isChecked ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'bg-white/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700 hover:border-slate-300'}`}>
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                        {isChecked && <Check size={14} className="text-white" />}
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isChecked} 
                          onChange={() => togglePermissionSelection(p.id || p.code)} 
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{p.code || p.id}</div>
                        <div className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{p.description || 'No description listed.'}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
              <button className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors" onClick={() => setManageRoleId(null)}>Discard</button>
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all" onClick={saveRolePermissions}>
                Update Privileges
              </button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
