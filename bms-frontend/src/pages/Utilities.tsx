import React, { useEffect, useState } from 'react'
import { useToast } from '../components/ToastProvider'
import * as utilitiesApi from '../api/utilities'
import { listUnits } from '../api/units'
import { getRoles } from '../utils/jwt'

export default function Utilities() {
  const toast = useToast()
  const [meters, setMeters] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])
  
  const userRoles = getRoles()
  const isSuperAdmin = userRoles.includes('super_admin')
  const isNomineeAdmin = userRoles.includes('nominee_admin')
  const isTenant = userRoles.includes('tenant')
  const isAdmin = isSuperAdmin || isNomineeAdmin

  const [meterForm, setMeterForm] = useState({
    serial_number: '',
    meter_type: 'electric',
    manufacturer: '',
    model: '',
    unit_id: '' as any,
    installation_date: '',
    unit_price: '',
  })

  const [readingForm, setReadingForm] = useState({
    meter_id: '' as any,
    reading_value: '' as any,
    reading_unit: 'kWh',
    reading_type: 'actual',
    recorded_at: '',
    notes: '',
  })
  const [readingPhoto, setReadingPhoto] = useState<File | null>(null)
  const [unitFilter, setUnitFilter] = useState('')
  const [meterFilter, setMeterFilter] = useState('')
  const [allUnits, setAllUnits] = useState<any[]>([])

  useEffect(() => {
    loadMeters()
    loadReadings()
    listUnits({ page: 1, per_page: 500 }).then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || [])
      setAllUnits(list)
    }).catch(console.error)
  }, [])

  const meterMap = React.useMemo(() => {
    const m: Record<string, any> = {}
    meters.forEach(x => { if (x && x.id) m[String(x.id)] = x })
    return m
  }, [meters])

  function fmtDate(d: string | null) {
    if (!d) return ''
    try {
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return d
      return dt.toLocaleString()
    } catch (e) { return d }
  }

  async function loadMeters(params?: any) {
    try {
      const data = await utilitiesApi.listMeters(params)
      const list = Array.isArray(data) ? data : []
      const normalized = list.map((m: any) => ({
        id: m.id,
        serial_number: m.serial_number || m.serial_no || m.serial || '',
        meter_type: m.meter_type || m.type || '',
        manufacturer: m.manufacturer || m.make || '',
        model: m.model || m.model_no || m.model_number || '',
        unit_id: m.unit_id || m.unit || null,
        installation_date: m.installation_date || m.created_at || null,
        status: m.status || null,
        metadata: m.metadata || {},
        last_reading_at: m.last_reading_at || m.last_read || null,
        unit_price: m.unit_price || null,
      }))
      setMeters(normalized)
    } catch (err: any) {
      toast.addToast('Failed to load meters', 'error')
    }
  }

  async function loadReadings(params?: any) {
    try {
      const data = await utilitiesApi.listReadings(params)
      const list = Array.isArray(data) ? data : []
      const normalized = list.map((r: any) => ({
        id: r.id,
        meter_id: r.meter_id || r.meter || null,
        reading_value: r.reading_value ?? r.value ?? r.reading ?? null,
        reading_unit: r.reading_unit || r.unit || null,
        reading_type: r.reading_type || r.type || null,
        recorded_at: r.recorded_at || r.reading_date || r.reading_at || r.created_at || null,
        photo_url: r.photo_url || r.photo || null,
        notes: r.notes || r.note || null,
        recorded_by: r.recorded_by || r.user_id || null,
      }))
      setReadings(normalized)
    } catch (err: any) {
      toast.addToast('Failed to load readings', 'error')
    }
  }

  async function handleCreateMeter(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = {
        serial_no: meterForm.serial_number,
        type: meterForm.meter_type,
        unit_id: String(meterForm.unit_id),
      }
      if (meterForm.unit_price) payload.unit_price = parseFloat(meterForm.unit_price)

      await utilitiesApi.createMeter(payload)
      toast.addToast('Meter created', 'success')
      setMeterForm({ serial_number: '', meter_type: 'electric', manufacturer: '', model: '', unit_id: '', installation_date: '', unit_price: '' })
      loadMeters()
    } catch (err: any) {
      toast.addToast('Failed to create meter', 'error')
    }
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
      toast.addToast('Reading recorded', 'success')
      setReadingForm({ meter_id: '', reading_value: '', reading_unit: 'kWh', reading_type: 'actual', recorded_at: '', notes: '' })
      setReadingPhoto(null)
      loadReadings()
    } catch (err: any) {
      toast.addToast('Failed to record reading', 'error')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Utilities</h1>

      <section className="grid grid-cols-2 gap-6">
        {isAdmin && (
          <div className="p-4 border rounded shadow-sm bg-white dark:bg-slate-800">
            <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Create Meter</h2>
            <p className="text-sm text-gray-500 mb-4">Link a physical meter to a unit</p>
            <form onSubmit={handleCreateMeter} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input required value={meterForm.serial_number} onChange={e => setMeterForm({ ...meterForm, serial_number: e.target.value })} placeholder="Serial number" className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meter Type</label>
                <select value={meterForm.meter_type} onChange={e => setMeterForm({ ...meterForm, meter_type: e.target.value })} className="w-full p-2 border rounded">
                  <option value="electric">Electric</option>
                  <option value="water">Water</option>
                  <option value="gas">Gas</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input value={meterForm.manufacturer} onChange={e => setMeterForm({ ...meterForm, manufacturer: e.target.value })} placeholder="Manufacturer" className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input value={meterForm.model} onChange={e => setMeterForm({ ...meterForm, model: e.target.value })} placeholder="Model" className="w-full p-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Unit</label>
                <select value={meterForm.unit_id} onChange={e => setMeterForm({ ...meterForm, unit_id: e.target.value })} className="w-full p-2 border rounded" required>
                  <option value="">Select unit</option>
                  {allUnits.map((u: any) => <option key={u.id} value={String(u.id)}>{u.unit_number || `Unit #${u.id}`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                <input type="date" value={meterForm.installation_date} onChange={e => setMeterForm({ ...meterForm, installation_date: e.target.value })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input type="number" step="0.01" value={meterForm.unit_price} onChange={e => setMeterForm({ ...meterForm, unit_price: e.target.value })} placeholder="e.g. 1.50" className="w-full p-2 border rounded" />
              </div>
              <div>
                <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium" type="submit">Create Meter</button>
              </div>
            </form>
          </div>
        )}

        <div className={`p-4 border rounded shadow-sm bg-white dark:bg-slate-800 ${!isAdmin ? 'col-span-2' : ''}`}>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Meter List</h2>
          <p className="text-sm text-gray-500 mb-4">View and refresh meter data</p>
          <div className="mt-3 flex items-center gap-2">
            <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="input">
              <option value="">(all units)</option>
              {allUnits.map((u: any) => (
                <option key={u.id} value={String(u.id)}>{u.unit_number || `Unit #${u.id}`}</option>
              ))}
            </select>
            <button className="btn" onClick={() => loadMeters(unitFilter ? { unit_id: unitFilter } : undefined)}>Refresh</button>
          </div>
          <div className="mt-4 space-y-2">
            {meters.length === 0 && <div className="text-sm text-gray-600">No meters found</div>}
            {meters.map(m => (
              <div key={m.id} className="p-2 border rounded bg-white dark:bg-slate-800/5 flex justify-between items-center">
                <div>
                  <div className="font-medium">{m.serial_number} — {m.meter_type}</div>
                  <div className="text-sm text-gray-400">Unit: {m.unit_id ?? '—'} · {m.manufacturer} {m.model} {m.unit_price ? `· Price: $${m.unit_price}` : ''}</div>
                </div>
                <div className="text-sm text-gray-300">{m.last_reading_at ? new Date(m.last_reading_at).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        {isAdmin && (
          <div className="p-4 border rounded shadow-sm bg-white dark:bg-slate-800">
            <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Record Reading</h2>
            <p className="text-sm text-gray-500 mb-4">Record a meter reading (accepts optional photo)</p>
            <form onSubmit={handleCreateReading} className="space-y-3">
              <select required value={readingForm.meter_id} onChange={e => setReadingForm({ ...readingForm, meter_id: e.target.value })} className="w-full p-2 border rounded">
                <option value="">Select meter</option>
                {meters.map(m => <option key={m.id} value={String(m.id)}>{m.serial_number} (unit {m.unit_id})</option>)}
              </select>
              <input required value={readingForm.reading_value} onChange={e => setReadingForm({ ...readingForm, reading_value: e.target.value })} placeholder="Value" className="w-full p-2 border rounded" />
              <input value={readingForm.recorded_at} onChange={e => setReadingForm({ ...readingForm, recorded_at: e.target.value })} type="datetime-local" className="w-full p-2 border rounded" />
              <input value={readingForm.notes} onChange={e => setReadingForm({ ...readingForm, notes: e.target.value })} placeholder="Notes" className="w-full p-2 border rounded" />
              <div>
                <label className="block text-sm text-gray-600 mb-1">Photo (optional)</label>
                <input type="file" accept="image/*" onChange={e => setReadingPhoto(e.target.files ? e.target.files[0] : null)} className="text-sm" />
              </div>
              <div>
                <button className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors font-medium" type="submit">Record Reading</button>
              </div>
            </form>
          </div>
        )}

        <div className={`p-4 border rounded shadow-sm bg-white dark:bg-slate-800 ${!isAdmin ? 'col-span-2' : ''}`}>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Reading History</h2>
          <p className="text-sm text-gray-500 mb-4">View historical meter readings</p>
          <div className="mt-3 flex items-center gap-2">
            <select value={meterFilter} onChange={e => setMeterFilter(e.target.value)} className="input">
              <option value="">(all meters)</option>
              {meters.map(m => (
                <option key={m.id} value={String(m.id)}>{m.serial_number || m.id} {m.unit_id ? `· unit ${m.unit_id}` : ''}</option>
              ))}
            </select>
            <button className="btn" onClick={() => loadReadings(meterFilter ? { meter_id: meterFilter } : undefined)}>Refresh</button>
          </div>
          <div className="mt-4 space-y-2">
            {readings.length === 0 && <div className="text-sm text-gray-600">No readings found</div>}
            {readings.map(r => {
              const m = meterMap[String(r.meter_id)]
              const meterLabel = m ? `${m.serial_number || m.serial_no || m.id} ${m.unit_id ? `· unit ${m.unit_id}` : ''}` : `Meter ${r.meter_id}`
              return (
                <div key={r.id} className="p-3 border rounded bg-white dark:bg-slate-800/50 flex items-center gap-4">
                  <div className="flex-none text-2xl font-semibold">{r.reading_value ?? '—'}</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">{r.reading_unit ? `${r.reading_unit} · ${r.reading_type || ''}` : (r.reading_type || '')}</div>
                    <div className="text-sm text-gray-500 mt-1">{meterLabel} · {fmtDate(r.recorded_at)}</div>
                    {r.notes && <div className="text-sm text-gray-600 mt-1">{r.notes}</div>}
                  </div>
                  {r.photo_url && (
                    <div className="w-20 h-14 flex-none">
                      <img src={r.photo_url} alt="reading" className="object-cover w-full h-full rounded" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
