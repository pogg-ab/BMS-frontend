import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listSites, createSite, updateSite, deleteSite } from '../api/sites'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { Plus, Trash2, Globe, Edit2, Info, MapPin, Search, Building2, User, Mail, Navigation, Camera } from 'lucide-react'
import api from '../api/axios'

// Helper for fallback site imagery (e.g., maps, generic landscapes)
const fallbackImages = [
  'https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80'
]

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://bms.skylinkict.com'

export default function Sites() {
  const navigate = useNavigate()
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState<any>(null)
  const [viewingSite, setViewingSite] = useState<any>(null)
  const [deletingSiteId, setDeletingSiteId] = useState<string | number | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [subcity, setSubcity] = useState('')
  const [location, setLocation] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('')
  const [currency, setCurrency] = useState('ETB')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [managerId, setManagerId] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const imageRef = React.useRef<HTMLInputElement | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await listSites({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setItems(list)
    } catch (e: any) {
      console.error('load sites', e)
      toast.addToast('Failed to load sites', 'error')
    } finally { setLoading(false) }

    // Load users for the manager dropdown
    import('../api/users').then(m => m.listUsers({ per_page: 500 }).then(res => {
      const list = Array.isArray(res) ? res : (res?.data || res?.users || [])
      setUsers(list)
    })).catch(console.error)
  }

  useEffect(() => { load() }, [])

  const filteredItems = items.filter(s => 
    !search || 
    (s.name?.toLowerCase().includes(search.toLowerCase()) || 
     s.city?.toLowerCase().includes(search.toLowerCase()) ||
     s.code?.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        name, city, subcity, location,
        code, address, timezone, currency, contact_email: contactEmail, notes,
        manager_id: managerId || null
      }
      if (imageUrl) payload.image_url = imageUrl
      if (editingSite) {
        await updateSite(editingSite.id, payload)
        toast.addToast('Site updated successfully', 'success')
      } else {
        await createSite(payload)
        toast.addToast('Site created successfully', 'success')
      }
      resetForm()
      setShowForm(false)
      load()
    } catch (err: any) {
      console.error('submit site', err)
      const msg = err?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(', ') : (msg || 'Operation failed'), 'error')
    } finally { setLoading(false) }
  }

  function resetForm() {
    setName(''); setCity(''); setSubcity(''); setLocation('')
    setCode(''); setAddress(''); setTimezone(''); setCurrency('ETB')
    setContactEmail(''); setNotes(''); setImageUrl(''); setManagerId(''); setEditingSite(null)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload/image?type=sites', fd)
      if (res.data?.path) setImageUrl(res.data.path)
    } catch (err) {
      toast.addToast('Image upload failed', 'error')
    }
  }

  function openEdit(site: any) {
    setEditingSite(site)
    setName(site.name || '')
    setCity(site.city || '')
    setSubcity(site.subcity || '')
    setLocation(site.location || '')
    setCode(site.code || '')
    setAddress(site.address || '')
    setTimezone(site.timezone || '')
    setCurrency(site.currency || 'ETB')
    setContactEmail(site.contact_email || '')
    setNotes(site.notes || '')
    setImageUrl(site.image_url || '')
    setManagerId(site.manager_id || site.manager?.id || '')
    setShowForm(true)
  }

  async function handleDelete() {
    if (!deletingSiteId) return
    try {
      await deleteSite(deletingSiteId)
      toast.addToast('Site deleted', 'success')
      setDeletingSiteId(null)
      load()
    } catch (e: any) {
      console.error('delete site', e)
      toast.addToast(e?.response?.data?.message || 'Failed to delete site', 'error')
    }
  }

  return (
    <PageLayout 
      title="Sites Portfolio" 
      subtitle="Manage geographical locations and organization campuses."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative hidden xl:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sites..."
              className="pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 shadow-sm w-48"
            />
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="button shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm">
            <Plus size={16} /> <span className="hidden xs:inline">Register Site</span>
            <span className="xs:hidden">Add Site</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10">

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Globe size={48} className="mb-4 opacity-50 text-slate-300" />
            <p className="font-bold text-lg text-slate-600 dark:text-slate-300">No sites found</p>
            <p className="text-sm font-medium mt-1">Add a geographical site to organize your buildings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((s, i) => {
              const bCount = Array.isArray(s.buildings) ? s.buildings.length : 0
              const fallbackUrl = fallbackImages[i % fallbackImages.length]
              const imgUrl = s.image_url ? `${API_BASE}${s.image_url}` : fallbackUrl

              return (
                <div 
                  key={s.id} 
                  className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-700 overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative cursor-pointer"
                  onClick={() => navigate(`/buildings?siteId=${s.id}`)}
                >
                  {/* Hover Quick Actions */}
                  <div className="absolute top-4 left-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(s) }} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-indigo-600 transition-colors" title="Edit Site">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setViewingSite(s) }} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-blue-600 transition-colors" title="Site Info">
                      <Info size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingSiteId(s.id) }} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-rose-600 transition-colors" title="Delete Site">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="h-32 relative overflow-hidden bg-slate-100">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-80 mix-blend-multiply" style={{ backgroundImage: `url("${imgUrl}")` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                      <Navigation size={12} className="text-indigo-400" /> {s.code || 'NO-CODE'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col z-10 bg-white dark:bg-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm font-medium text-slate-500">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      <span className="truncate">{s.city}, {s.subcity}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                      <Mail size={12} className="opacity-70" /> {s.contact_email || 'No Contact Email'}
                    </div>

                    <div className="mt-auto pt-6 flex items-center justify-between">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <Building2 size={14} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{bCount} Buildings</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {s.currency || 'ETB'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* CREATE / EDIT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingSite ? `Edit ${editingSite.name}` : 'Register New Site'}</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="site-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Name <span className="text-red-500">*</span></label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Headquarters" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">City <span className="text-red-500">*</span></label>
                  <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Addis Ababa" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subcity <span className="text-red-500">*</span></label>
                  <input required value={subcity} onChange={e => setSubcity(e.target.value)} placeholder="Bole" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Location <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Addis Ababa" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Code</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="HQ-01" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Currency</label>
                  <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Full Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Bole St." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Timezone</label>
                  <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="EAT" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contact Email</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="site@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Admin (Optional)</label>
                  <select 
                    value={managerId} 
                    onChange={e => setManagerId(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">No Admin Assigned</option>
                    {users
                      .filter(u => u.userRoles?.some((ur: any) => ur.role?.name === 'site_admin'))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))
                    }
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional information..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Site Image</label>
                  <div className="flex gap-4 items-center">
                    <input type="file" accept="image/*" ref={imageRef} onChange={handleImageUpload} className="hidden" />
                    <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors" onClick={() => imageRef.current?.click()}>
                      Choose File
                    </button>
                    {imageUrl && <img src={`${API_BASE}${imageUrl}`} alt="preview" className="h-12 w-20 object-cover rounded-lg border border-slate-200 shadow-sm" />}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button form="site-form" type="submit" disabled={loading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all">
                {loading ? 'Saving...' : editingSite ? 'Update Site' : 'Save Site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {viewingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingSite.name}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{viewingSite.code || 'NO CODE'}</p>
                </div>
              </div>
              <button onClick={() => setViewingSite(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Geographical Info</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewingSite.city || 'N/A'}</p>
                  <p className="text-xs font-medium text-slate-500">{viewingSite.subcity || 'No subcity'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Site Location</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="text-rose-500" size={14} /> {viewingSite.location || 'Not specified'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Physical Address</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewingSite.address || 'Address not registered'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contact Email</p>
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"><Mail size={14}/> {viewingSite.contact_email || 'None'}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Settings (TZ / Cur)</p>
                   <div className="flex items-center gap-2">
                     <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300">{viewingSite.timezone || 'UTC'}</span>
                     <span className="bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded text-xs font-bold text-emerald-700 dark:text-emerald-400">{viewingSite.currency || 'USD'}</span>
                   </div>
                 </div>
                 <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Site Admin</p>
                    {viewingSite.manager ? (
                      <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {viewingSite.manager.name?.[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{viewingSite.manager.name}</p>
                          <p className="text-[10px] text-indigo-500/70">{viewingSite.manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">No admin assigned to this site.</p>
                    )}
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setViewingSite(null)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Close View</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingSiteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-500 mb-6 mx-auto shadow-sm">
              <Trash2 size={32} />
            </div>
            <h4 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Decommission Site</h4>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">
              Are you sure you want to remove this site? Associated buildings must be detached first.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingSiteId(null)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md">Delete Site</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
