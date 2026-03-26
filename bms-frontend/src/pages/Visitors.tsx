import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import {
  FiUser, FiPhone, FiMapPin, FiPlus, FiTrash2, 
  FiLogOut, FiEdit2, FiSearch, FiInfo, FiActivity, FiClock
} from 'react-icons/fi'
import {
  createVisitor,
  listVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
  checkoutVisitor,
} from '../api/visitors'
import { listUsers } from '../api/users'
import { listSites } from '../api/sites'

export default function Visitors() {
  const toast = useToast()
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [purpose, setPurpose] = useState('')
  const [hostUserId, setHostUserId] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [siteId, setSiteId] = useState('')
  const [notes, setNotes] = useState('')

  // Lookups
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSites, setAllSites] = useState<any[]>([])
  const [querySiteId, setQuerySiteId] = useState('')

  useEffect(() => {
    loadVisitors()
    loadLookups()
  }, [querySiteId])

  async function loadLookups() {
    try {
      const usersRes: any = await listUsers({ page: 1, per_page: 500 })
      setAllUsers(Array.isArray(usersRes) ? usersRes : (usersRes?.data || usersRes?.users || []))
      
      const sitesRes: any = await listSites({ page: 1, per_page: 200 })
      setAllSites(Array.isArray(sitesRes) ? sitesRes : (sitesRes?.data || []))
    } catch (e) { console.error('loadLookups', e) }
  }

  async function loadVisitors() {
    setLoading(true)
    try {
      const params: any = {}
      if (querySiteId) params.site_id = querySiteId
      const list: any = await listVisitors(Object.keys(params).length ? params : undefined)
      setVisitors(Array.isArray(list) ? list : (list?.data || []))
    } catch (e: any) { 
      toast.addToast('Failed to load visitors', 'error') 
    } finally { setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { 
        visitor_name: name, 
        phone, 
        id_card_no: idNumber, 
        purpose, 
        host_user_id: hostUserId || undefined,
        vehicle_number: vehicleNumber,
        site_id: siteId,
        notes 
      }
      
      if (editing) {
        await updateVisitor(editing.id, payload)
        toast.addToast('Visitor details updated', 'success')
      } else {
        await createVisitor(payload)
        toast.addToast('Visitor checked in successfully', 'success')
      }
      
      resetForm()
      loadVisitors()
    } catch (e: any) { 
      toast.addToast(editing ? 'Update failed' : 'Check-in failed', 'error') 
    }
  }

  function resetForm() {
    setName(''); setPhone(''); setIdNumber(''); setPurpose('')
    setHostUserId(''); setVehicleNumber(''); setSiteId(''); setNotes('')
    setEditing(null)
    setShowForm(false)
  }

  function openEdit(v: any) {
    setEditing(v)
    setName(v.visitor_name || v.name || '')
    setPhone(v.phone || '')
    setIdNumber(v.id_card_no || v.id_number || '')
    setPurpose(v.purpose || '')
    setHostUserId(String(v.host_user_id || ''))
    setVehicleNumber(v.vehicle_number || '')
    setSiteId(String(v.site_id || ''))
    setNotes(v.notes || '')
    setShowForm(true)
  }

  async function handleCheckout(id: string | number) {
    try {
      await checkoutVisitor(id)
      toast.addToast('Visitor checked out', 'success')
      loadVisitors()
    } catch (e) { toast.addToast('Checkout failed', 'error') }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteVisitor(deletingId)
      toast.addToast('Visitor record deleted', 'success')
      setDeletingId(null)
      loadVisitors()
    } catch (e) { toast.addToast('Delete failed', 'error') }
  }

  return (
    <PageLayout 
      title="Visitor Management" 
      subtitle="Track and manage on-site visitors, contractors, and guests"
      actions={
        <button onClick={() => { resetForm(); setShowForm(true) }} className="button">
          <FiPlus className="mr-2" /> Check-in Visitor
        </button>
      }
    >
      <div className="space-y-6">
        {/* Form Overlay/Section */}
        {showForm && (
          <div className="card animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {editing ? <FiEdit2 className="text-indigo-600" /> : <FiPlus className="text-emerald-600" />}
                {editing ? 'Edit Visitor Record' : 'Resident/Guest Check-in'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="form-input pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="+251..." value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="form-label">ID Number / Card No</label>
                  <input className="form-input dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="ID-12345" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Site / Entrance</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select className="form-select pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white" required value={siteId} onChange={e => setSiteId(e.target.value)}>
                      <option value="">Select Site</option>
                      {allSites.map(s => <option key={s.id} value={String(s.id)}>{s.name || s.code}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Vehicle Number (Optional)</label>
                  <input className="form-input dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="AA-B12345" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Purpose of Visit</label>
                  <input className="form-input dark:bg-slate-800 dark:border-slate-700 dark:text-white" required placeholder="Maintenance, Delivery, etc." value={purpose} onChange={e => setPurpose(e.target.value)} />
                </div>
                <div className="lg:col-span-3">
                  <label className="form-label">Internal Notes / Instructions</label>
                  <textarea className="form-input h-20 pt-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Any additional details..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={resetForm} className="button-secondary">Cancel</button>
                <button type="submit" className="button px-8">{editing ? 'Save Changes' : 'Complete Check-in'}</button>
              </div>
            </form>
          </div>
        )}

        {/* List Card */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FiActivity className="text-blue-500" /> Current Visitor Log
            </h3>
            <div className="flex items-center gap-2">
              <FiSearch className="text-slate-400 ml-2" />
              <select className="form-select !w-auto !py-1 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={querySiteId} onChange={e => setQuerySiteId(e.target.value)}>
                <option value="">All Sites</option>
                {allSites.map(s => <option key={s.id} value={String(s.id)}>{s.name || s.code}</option>)}
              </select>
              <button onClick={loadVisitors} className="button-secondary !py-1.5 text-sm">Refresh</button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium">Loading visitor records...</p>
            </div>
          ) : visitors.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FiUser className="mx-auto text-4xl text-slate-300 mb-2" />
              <p className="text-slate-500">No active visitors recorded at this time.</p>
            </div>
          ) : (
            <div className="table-container shadow-none ring-0 border border-slate-100 rounded-xl">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Visitor</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Site / Location</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Purpose</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Check-in Time</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {visitors.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <FiUser size={14} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{v.visitor_name || v.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><FiPhone size={10} /> {v.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {allSites.find((s: any) => String(s.id) === String(v.site_id))?.name || v.site_id || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="truncate max-w-[150px] inline-block" title={v.purpose}>{v.purpose || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <FiClock className="text-slate-400" />
                          {v.check_in_time ? new Date(v.check_in_time).toLocaleString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          v.status === 'exited'
                            ? 'bg-slate-100 text-slate-600 border-slate-200 dark:border-slate-700' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {v.status === 'exited' ? 'Away' : 'On Site'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(v)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Record">
                            <FiEdit2 size={16} />
                          </button>
                          {v.status !== 'exited' && (
                            <button onClick={() => handleCheckout(v.id)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Checkout">
                              <FiLogOut size={16} />
                            </button>
                          )}
                          <button onClick={() => setDeletingId(v.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Delete record">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 mx-auto">
              <FiTrash2 size={24} />
            </div>
            <h4 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Confirm Delete</h4>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to remove this visitor record? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)} 
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
