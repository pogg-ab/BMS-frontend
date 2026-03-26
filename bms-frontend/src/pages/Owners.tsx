import React, { useEffect, useState } from 'react'
import { listOwners, createOwner, updateOwner, deleteOwner } from '../api/owners'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { FiUser, FiPlus, FiTrash2, FiEdit2, FiPhone, FiMail } from 'react-icons/fi'

type Owner = {
  id: string
  name: string
  email?: string
  phone?: string
}

export default function Owners() {
  const toast = useToast()
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await listOwners()
      let list: any[] = []
      if (Array.isArray(res)) list = res
      else if (res && Array.isArray((res as any).data)) list = (res as any).data
      else list = []
      setOwners(list)
    } catch (e: any) {
      console.error('load owners', e)
      toast.addToast('Failed to load owners', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setShowForm(true)
  }

  function openEdit(o: Owner) {
    setEditing(o)
    setName(o.name || '')
    setEmail(o.email || '')
    setPhone(o.phone || '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
        await updateOwner(editing.id, { name, email, phone })
        toast.addToast('Owner updated successfully', 'success')
      } else {
        await createOwner({ name, email, phone })
        toast.addToast('Owner created successfully', 'success')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('owner submit', err)
      const msg = err?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Operation failed'), 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this owner? This will fail if the owner still has assigned buildings.')) return
    try {
      await deleteOwner(id)
      toast.addToast('Owner deleted', 'success')
      load()
    } catch (e: any) {
      console.error('delete owner', e)
      toast.addToast(e?.response?.data?.message || 'Failed to delete owner', 'error')
    }
  }

  return (
    <PageLayout 
      title="Property Owners" 
      subtitle="Manage property owners and their contact information"
      actions={
        <button onClick={openCreate} className="button">
          <FiPlus className="mr-2" /> Register Owner
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <div className="card animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">
              {editing ? 'Edit Owner Profile' : 'Register New Owner'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" className="form-input pl-10" />
                </div>
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@example.com" className="form-input pl-10" />
                </div>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+251..." className="form-input pl-10" />
                </div>
              </div>
              <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-200 font-medium">Cancel</button>
                <button type="submit" className="button">
                  {editing ? 'Update Profile' : 'Register Owner'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight flex items-center gap-2">
            <FiUser className="text-indigo-600" /> Registered Owners
          </h3>
          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">Loading owner profiles...</div>
          ) : owners.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FiUser size={32} className="mb-2 opacity-20" />
              <p>No owners found</p>
            </div>
          ) : (
            <div className="table-container shadow-none border border-slate-100 ring-0">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Owner Name</th>
                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {owners.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{o.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono uppercase">ID: {o.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-600">
                            <FiMail className="text-slate-400 text-xs" /> {o.email || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <FiPhone className="text-slate-400 text-xs" /> {o.phone || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEdit(o)} 
                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-all inline-flex items-center gap-1.5 font-medium text-xs"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(o.id)} 
                            className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all inline-flex items-center gap-1.5 font-medium text-xs"
                          >
                            <FiTrash2 /> Delete
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
    </PageLayout>
  )
}
