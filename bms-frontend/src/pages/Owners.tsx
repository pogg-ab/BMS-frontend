import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listOwners, createOwner, updateOwner, deleteOwner } from '../api/owners'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { Plus, Trash2, Edit2, User, Mail, Phone, Building2, Search, Briefcase, ExternalLink, MoreVertical, X, Camera } from 'lucide-react'
import api from '../api/axios'

type Owner = {
  id: string
  name: string
  email?: string
  phone?: string
  profile_image?: string
  buildings_count?: number
}

export default function Owners() {
  const navigate = useNavigate()
  const toast = useToast()
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Owner | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const imageRef = React.useRef<HTMLInputElement | null>(null)

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

  const filteredOwners = owners.filter(o => 
    !searchQuery || 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.email && o.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  function openCreate() {
    setEditing(null)
    setName('')
    setEmail('')
    setPhone('')
    setProfileImage('')
    setShowForm(true)
  }

  function openEdit(o: Owner) {
    setEditing(o)
    setName(o.name || '')
    setEmail(o.email || '')
    setPhone(o.phone || '')
    setProfileImage(o.profile_image || '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = { name, email, phone }
      if (profileImage) payload.profile_image = profileImage
      
      if (editing) {
        await updateOwner(editing.id, payload)
        toast.addToast('Owner updated successfully', 'success')
      } else {
        await createOwner(payload)
        toast.addToast('Owner registered successfully', 'success')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('owner submit', err)
      const msg = err?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Operation failed'), 'error')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload/image', fd)
      if (res.data?.path) setProfileImage(res.data.path)
    } catch (err) {
      toast.addToast('Image upload failed', 'error')
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
      subtitle="Manage portfolio investors and their real estate holdings."
      actions={
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search owners..."
              className="pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-sm w-64"
            />
          </div>
          <button onClick={openCreate} className="button shadow-md">
            <Plus size={16} /> Register Owner
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10">
        
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : filteredOwners.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <User size={48} className="mb-4 opacity-50 text-slate-300" />
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No owners found</p>
            <p className="text-sm font-medium mt-1">Register owners to link them with buildings and units.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOwners.map((o) => (
              <div 
                key={o.id} 
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative cursor-pointer"
                onClick={() => navigate(`/buildings?ownerId=${o.id}`)}
              >
                {/* Floating Actions */}
                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(o) }} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(o.id) }} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                      {o.profile_image ? (
                        <img src={`http://localhost:3000${o.profile_image}`} alt={o.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">{o.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {o.id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{o.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{o.phone || 'No phone registered'}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-5 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                      <Building2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {(o as any).buildings?.length || o.buildings_count || 0} Assets
                      </span>
                    </div>
                    <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing ? 'Edit Owner Profile' : 'Register New Owner'}</h2>
              <button 
                className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" 
                onClick={() => setShowForm(false)}
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. John Doe" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="owner@example.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+251..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Profile Image</label>
                <div className="flex gap-4 items-center">
                  <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                  <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors" onClick={() => imageRef.current?.click()}>
                    <Camera size={16} /> Upload Photo
                  </button>
                  {profileImage && <img src={`http://localhost:3000${profileImage}`} alt="preview" className="h-10 w-10 object-cover rounded-full border border-slate-200 shadow-sm" />}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {editing ? 'Update Profile' : 'Register Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
