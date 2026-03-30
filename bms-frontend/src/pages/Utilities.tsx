import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as utilitiesApi from '../api/utilities'
import { listUnits } from '../api/units'
import { getRoles } from '../utils/jwt'
import { Zap, Droplets, Flame, Plus, History, Activity, Home, Search, Calendar, Hash, Tag, DollarSign, Camera, CheckCircle2, MoreVertical, Trash2, Filter, Settings2, RefreshCw } from 'lucide-react'

export default function Utilities() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'meters' | 'readings'>('meters')
  const [meters, setMeters] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const userRoles = getRoles()
  const isAdmin = userRoles.includes('super_admin') || userRoles.includes('nominee_admin')

  // Filters
  const [unitFilter, setUnitFilter] = useState('')
  const [meterFilter, setMeterFilter] = useState('')

  // Modals
  const [showMeterForm, setShowMeterForm] = useState(false)
  const [showReadingForm, setShowReadingForm] = useState(false)

  // Form States
  const [meterForm, setMeterForm] = useState({
    serial_number: '', meter_type: 'electric', manufacturer: '', model: '',
    unit_id: '', installation_date: '', unit_price: '',
  })
  const [readingForm, setReadingForm] = useState({
    meter_id: '', reading_value: '', reading_unit: 'kWh',
    reading_type: 'actual', recorded_at: '', notes: '',
  })
  const [readingPhoto, setReadingPhoto] = useState<File | null>(null)

  useEffect(() => {
    loadMeters()
    loadReadings()
    listUnits({ page: 1, per_page: 500 }).then((res: any) => {
      setAllUnits(Array.isArray(res) ? res : (res?.data || []))
    }).catch(console.error)
  }, [])

  const meterMap = React.useMemo(() => {
    const m: Record<string, any> = {}
    meters.forEach(x => { if (x && x.id) m[String(x.id)] = x })
    return m
  }, [meters])

  async function loadMeters(params?: any) {
    setLoading(true)
    try {
      const data = await utilitiesApi.listMeters(params)
      const list = Array.isArray(data) ? data : []
      setMeters(list.map((m: any) => ({
        id: m.id,
        serial_number: m.serial_number || m.serial_no || m.serial || '',
        meter_type: m.meter_type || m.type || '',
        manufacturer: m.manufacturer || m.make || '',
        model: m.model || m.model_no || m.model_number || '',
        unit_id: m.unit_id || m.unit || null,
        installation_date: m.installation_date || m.created_at || null,
        unit_price: m.unit_price || null,
        last_reading_at: m.last_reading_at || m.last_read || null,
      })))
    } catch (err: any) {
      toast.addToast('Failed to load utility meters', 'error')
    } finally { setLoading(false) }
  }

  async function loadReadings(params?: any) {
    setLoading(true)
    try {
      const data = await utilitiesApi.listReadings(params)
      const list = Array.isArray(data) ? data : []
      setReadings(list.map((r: any) => ({
        id: r.id, meter_id: r.meter_id || r.meter || null,
        reading_value: r.reading_value ?? r.value ?? r.reading ?? null,
        reading_unit: r.reading_unit || r.unit || null,
        reading_type: r.reading_type || r.type || null,
        recorded_at: r.recorded_at || r.reading_date || r.reading_at || r.created_at || null,
        photo_url: r.photo_url || r.photo || null,
        notes: r.notes || r.note || null,
      })))
    } catch (err: any) {
      toast.addToast('Failed to load reading history', 'error')
    } finally { setLoading(false) }
  }

  async function handleCreateMeter(e: React.FormEvent) {
    e.preventDefault()
    try {
      await utilitiesApi.createMeter({
        serial_no: meterForm.serial_number, type: meterForm.meter_type,
        unit_id: String(meterForm.unit_id), unit_price: meterForm.unit_price ? parseFloat(meterForm.unit_price) : undefined
      })
      toast.addToast('Meter commissioned successfully', 'success')
      setShowMeterForm(false); loadMeters()
    } catch (err: any) { toast.addToast('Failed to register meter', 'error') }
  }

  async function handleCreateReading(e: React.FormEvent) {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('meter_id', readingForm.meter_id)
      fd.append('reading_value', String(readingForm.reading_value))
      if (readingForm.recorded_at) fd.append('reading_date', readingForm.recorded_at)
      if (readingPhoto) fd.append('photo', readingPhoto)

      await utilitiesApi.createReading(fd)
      toast.addToast('Consumer reading recorded', 'success')
      setShowReadingForm(false); loadReadings()
    } catch (err: any) { toast.addToast('Failed to submit reading', 'error') }
  }

  const getMeterIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'water': return { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' }
      case 'gas': return { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' }
      default: return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' }
    }
  }

  return (
    <PageLayout 
      title="Utility Management" 
      subtitle="Monitor electric, water, and gas consumption across units and facilities."
      actions={
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
             <button onClick={() => setActiveTab('meters')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'meters' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Meters</button>
             <button onClick={() => setActiveTab('readings')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'readings' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>History</button>
          </div>
          {isAdmin && (
            <button 
              onClick={() => activeTab === 'meters' ? setShowMeterForm(true) : setShowReadingForm(true)} 
              className="button shadow-md"
            >
              <Plus size={16} /> {activeTab === 'meters' ? 'New Meter' : 'Record Reading'}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
           <div className="flex items-center gap-4">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  placeholder={activeTab === 'meters' ? "Search serials..." : "Search history..."}
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-sm w-48 md:w-64 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                 <Filter size={14} className="text-slate-400" />
                 <select 
                  value={unitFilter} 
                  onChange={e => {setUnitFilter(e.target.value); activeTab === 'meters' ? loadMeters({unit_id: e.target.value}) : loadReadings({unit_id: e.target.value})}} 
                  className="text-xs font-bold text-slate-500 bg-transparent border-none focus:ring-0 cursor-pointer"
                 >
                   <option value="">All Units</option>
                   {allUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number || u.id}</option>)}
                 </select>
              </div>
           </div>
           <button onClick={() => activeTab === 'meters' ? loadMeters() : loadReadings()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
             <RefreshCw size={16} />
           </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : activeTab === 'meters' ? (
          meters.length === 0 ? (
            <div className="py-20 text-center bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200">
               <Zap size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="font-bold text-slate-500 uppercase tracking-widest">No Meters Commissioned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meters.map(m => {
                const Meta = getMeterIcon(m.meter_type)
                const Icon = Meta.icon
                return (
                  <div key={m.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${Meta.bg} flex items-center justify-center ${Meta.color} shadow-sm`}>
                        <Icon size={24} />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       {m.serial_number}
                       <span className="text-xs font-medium text-slate-400">· {m.meter_type}</span>
                    </h4>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Home size={14} className="text-slate-300" /> Unit {m.unit_id || 'Shared'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                         <Settings2 size={14} className="text-slate-300" /> {m.manufacturer || 'General'} {m.model}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                        <DollarSign size={14} /> ETB {m.unit_price || '0.00'} / unit
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                          <Activity size={12} /> Last Read: {m.last_reading_at ? new Date(m.last_reading_at).toLocaleDateString() : 'Never'}
                       </div>
                       <button className="text-slate-300 hover:text-rose-500 transition-colors">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {readings.length === 0 ? (
              <div className="py-20 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
                 <History size={48} className="mx-auto text-slate-200 mb-4" />
                 <p className="font-bold text-slate-500 uppercase tracking-widest">No historical readings</p>
              </div>
            ) : (
              readings.map(r => {
                const meter = meterMap[String(r.meter_id)]
                const Meta = getMeterIcon(meter?.meter_type)
                const Icon = Meta?.icon || Activity
                return (
                  <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                       <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{r.reading_value}</span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1">{r.reading_unit || 'Units'}</span>
                       </div>
                       <div className="w-[1px] h-10 bg-slate-100 dark:bg-slate-700" />
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl ${Meta?.bg || 'bg-slate-50'} flex items-center justify-center ${Meta?.color || 'text-slate-400'}`}>
                           <Icon size={20} />
                         </div>
                         <div>
                           <h5 className="font-bold text-slate-900 dark:text-white text-sm">{meter?.serial_number || `ID: ${r.meter_id}`}</h5>
                           <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                             <span className="flex items-center gap-1"><Home size={10} /> Unit {meter?.unit_id || '-'}</span>
                             <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(r.recorded_at).toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {r.photo_url && (
                         <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden relative group/img cursor-zoom-in">
                            <img src={r.photo_url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Reading" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><Camera size={14} className="text-white" /></div>
                         </div>
                       )}
                       <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-white font-bold"><MoreVertical size={16} /></button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* METER FORM MODAL */}
      {showMeterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Utility Meter</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setShowMeterForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateMeter} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Serial Number</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input required value={meterForm.serial_number} onChange={e => setMeterForm({ ...meterForm, serial_number: e.target.value })} placeholder="SN-XXXX-XXXX" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Type</label>
                  <select value={meterForm.meter_type} onChange={e => setMeterForm({ ...meterForm, meter_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none cursor-pointer">
                    <option value="electric">⚡ Electric</option>
                    <option value="water">💧 Water</option>
                    <option value="gas">🔥 Gas</option>
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Assigned Unit</label>
                  <select value={meterForm.unit_id} onChange={e => setMeterForm({ ...meterForm, unit_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none cursor-pointer" required>
                    <option value="">None / Common</option>
                    {allUnits.map(u => <option key={u.id} value={u.id}>Unit {u.unit_number || u.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Manufacturer</label>
                  <input value={meterForm.manufacturer} onChange={e => setMeterForm({ ...meterForm, manufacturer: e.target.value })} placeholder="e.g. Siemens" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Unit Price (ETB)</label>
                  <input type="number" step="0.01" value={meterForm.unit_price} onChange={e => setMeterForm({ ...meterForm, unit_price: e.target.value })} placeholder="Tariff rate" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowMeterForm(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all">Commission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READING FORM MODAL */}
      {showReadingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Consumption Entry</h2>
              <button className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm" onClick={() => setShowReadingForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateReading} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Select Meter</label>
                <select required value={readingForm.meter_id} onChange={e => setReadingForm({ ...readingForm, meter_id: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm appearance-none cursor-pointer">
                  <option value="">Select source...</option>
                  {meters.map(m => <option key={m.id} value={String(m.id)}>{m.meter_type.toUpperCase()} · SN {m.serial_number} (Unit {m.unit_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Current Value</label>
                  <input required value={readingForm.reading_value} onChange={e => setReadingForm({ ...readingForm, reading_value: e.target.value })} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Timestamp</label>
                  <input value={readingForm.recorded_at} onChange={e => setReadingForm({ ...readingForm, recorded_at: e.target.value })} type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Visual Proof (Optional)</label>
                 <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden group">
                    <Camera size={24} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-slate-600">{readingPhoto ? readingPhoto.name : 'Tap to upload counter photo'}</p>
                      <p className="text-[10px] font-medium text-slate-400">JPG, PNG up to 5MB</p>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setReadingPhoto(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowReadingForm(false)} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
                   Record <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
