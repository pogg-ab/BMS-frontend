import React, { useEffect, useState } from 'react'
import { listSites, createSite, updateSite, deleteSite } from '../api/sites'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { FiMapPin, FiPlus, FiTrash2, FiGlobe, FiEdit2, FiInfo } from 'react-icons/fi'

export default function Sites() {
  const toast = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState<any>(null)
  const [viewingSite, setViewingSite] = useState<any>(null)
  const [deletingSiteId, setDeletingSiteId] = useState<string | number | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [subcity, setSubcity] = useState('')
  const [locationLatLong, setLocationLatLong] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('')
  const [currency, setCurrency] = useState('ETB')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')

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
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name, city, subcity, location_lat_long: locationLatLong,
        code, address, timezone, currency, contact_email: contactEmail, notes
      }
      
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
    setName(''); setCity(''); setSubcity(''); setLocationLatLong('')
    setCode(''); setAddress(''); setTimezone(''); setCurrency('ETB')
    setContactEmail(''); setNotes('')
    setEditingSite(null)
  }

  function openEdit(site: any) {
    setEditingSite(site)
    setName(site.name || '')
    setCity(site.city || '')
    setSubcity(site.subcity || '')
    setLocationLatLong(site.location_lat_long || '')
    setCode(site.code || '')
    setAddress(site.address || '')
    setTimezone(site.timezone || '')
    setCurrency(site.currency || 'ETB')
    setContactEmail(site.contact_email || '')
    setNotes(site.notes || '')
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
      subtitle="Manage geographical locations and organization sites"
      actions={
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="button"
        >
          <FiPlus className="mr-2" /> {showForm ? 'Cancel' : 'Add New Site'}
        </button>
      }
    >
      <div className="space-y-6">
        {showForm && (
          <div className="card animate-in fade-in slide-in-from-top-4 duration-300 ring-2 ring-indigo-500/20">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {editingSite ? `Edit Site: ${editingSite.name}` : 'Register New Site'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="form-label">Site Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Headquarters" className="form-input" />
              </div>
              <div>
                <label className="form-label">City</label>
                <input required value={city} onChange={e => setCity(e.target.value)} placeholder="Addis Ababa" className="form-input" />
              </div>
              <div>
                <label className="form-label">Subcity</label>
                <input required value={subcity} onChange={e => setSubcity(e.target.value)} placeholder="Bole" className="form-input" />
              </div>
              <div className="lg:col-span-2">
                <label className="form-label">Location (Lat/Long)</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required value={locationLatLong} onChange={e => setLocationLatLong(e.target.value)} placeholder="9.145, 40.489" className="form-input pl-10" />
                </div>
              </div>
              <div>
                <label className="form-label">Site Code</label>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="HQ-01" className="form-input" />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <input value={currency} onChange={e => setCurrency(e.target.value)} className="form-input" />
              </div>
              <div className="lg:col-span-2">
                <label className="form-label">Full Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Bole St." className="form-input" />
              </div>
              <div>
                <label className="form-label">Timezone</label>
                <input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="EAT" className="form-input" />
              </div>
              <div>
                <label className="form-label">Contact Email</label>
                <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="site@example.com" className="form-input" />
              </div>
              <div className="lg:col-span-4">
                <label className="form-label">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional information..." className="form-input h-20 pt-2" />
              </div>
              <div className="lg:col-span-4 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-200 font-medium">Cancel</button>
                <button type="submit" disabled={loading} className="button min-w-[120px]">
                  {loading ? 'Saving...' : editingSite ? 'Update Site' : 'Save Site'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight flex items-center gap-2">
            <FiGlobe className="text-indigo-600" /> Existing Sites
          </h3>
          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">Loading site data...</div>
          ) : items.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FiMapPin size={32} className="mb-2 opacity-20" />
              <p>No sites registered yet</p>
            </div>
          ) : (
            <div className="table-container shadow-none border border-slate-100 ring-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Site Name</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Buildings</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {items.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700 uppercase">{s.code || 'NO-CODE'}</span>
                          <span>· {s.contact_email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{s.city}, {s.subcity}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{s.address || 'No address specified'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {Array.isArray(s.buildings) && s.buildings.length > 0 ? (
                          <div className="flex -space-x-2">
                            {s.buildings.slice(0, 3).map((b: any, i: number) => (
                              <div key={b.id} title={b.name} className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                {b.name?.charAt(0) || 'B'}
                              </div>
                            ))}
                            {s.buildings.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                +{s.buildings.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No buildings</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setViewingSite(s)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="View Details"
                          >
                            <FiInfo size={16} />
                          </button>
                          <button 
                            onClick={() => openEdit(s)} 
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Site"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeletingSiteId(s.id)} 
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Site"
                          >
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

      {/* Detail Modal */}
      {viewingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <FiGlobe size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{viewingSite.name}</h3>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{viewingSite.code || 'NO CODE'}</p>
                </div>
              </div>
              <button onClick={() => setViewingSite(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">✕</button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Geographical Info</p>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">{viewingSite.city || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{viewingSite.subcity || 'No subcity'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coordinates</p>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <FiMapPin className="text-rose-500" size={14} />
                    {viewingSite.location_lat_long || 'Not mapped'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Physical Address</p>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">{viewingSite.address || 'Address not registered'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Administrative Contact</p>
                  <p className="text-sm font-semibold text-slate-700">{viewingSite.contact_email || 'Contact email missing'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timezone & Finance</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">{viewingSite.timezone || 'UTC'}</span>
                    <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 uppercase">{viewingSite.currency || 'USD'}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Linked Buildings ({viewingSite.buildings?.length || 0})</p>
                  {Array.isArray(viewingSite.buildings) && viewingSite.buildings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewingSite.buildings.map((b: any) => (
                        <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                           <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                            {b.name?.charAt(0) || 'B'}
                           </div>
                           <div className="min-w-0">
                             <p className="text-sm font-bold text-slate-700 truncate">{b.name}</p>
                             <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{b.code || 'No Code'}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400">
                      <p className="text-xs italic">No buildings linked to this site yet.</p>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Portfolio Summary / Notes</p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 text-slate-600">
                    <p className="text-xs leading-loose italic">
                      {viewingSite.notes || 'No supplementary information provided for this site.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setViewingSite(null)} 
                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 rounded-xl font-bold transition-all shadow-sm"
              >
                Close View
              </button>
              <button 
                onClick={() => { openEdit(viewingSite); setViewingSite(null); }} 
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
              >
                Modify Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingSiteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6 mx-auto">
              <FiTrash2 size={32} />
            </div>
            <h4 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Decommission Site</h4>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              Are you sure you want to remove this site from the portfolio? All associated building data will be inaccessible.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeletingSiteId(null)} 
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200"
              >
                Delete Site
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
