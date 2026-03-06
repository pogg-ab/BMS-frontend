import React, { useEffect, useState } from 'react'
import { useToast } from '../components/ToastProvider'
import * as utilitiesApi from '../api/utilities'

export default function Utilities() {
  const toast = useToast()
  const [meters, setMeters] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])

  const [meterForm, setMeterForm] = useState({
    serial_number: '',
    meter_type: 'electric',
    manufacturer: '',
    model: '',
    unit_id: '' as any,
    installation_date: '',
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

  useEffect(() => {
    loadMeters()
    loadReadings()
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
      const payload = {
        serial_number: meterForm.serial_number,
        meter_type: meterForm.meter_type,
        manufacturer: meterForm.manufacturer,
        model: meterForm.model,
        unit_id: parseInt(meterForm.unit_id) || undefined,
        installation_date: meterForm.installation_date || undefined,
      }
      const created = await utilitiesApi.createMeter(payload)
      toast.addToast('Meter created', 'success')
      setMeterForm({ serial_number: '', meter_type: 'electric', manufacturer: '', model: '', unit_id: '', installation_date: '' })
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
      fd.append('reading_unit', readingForm.reading_unit)
      fd.append('reading_type', readingForm.reading_type)
      if (readingForm.recorded_at) fd.append('recorded_at', readingForm.recorded_at)
      if (readingForm.notes) fd.append('notes', readingForm.notes)
      if (readingPhoto) fd.append('photo', readingPhoto)

      const created = await utilitiesApi.createReading(fd)
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
        <div className="p-4 border rounded">
          <h2 className="font-medium">POST /utilities/meters</h2>
          <p className="text-sm text-gray-500">Link a physical meter to a unit</p>
          <form onSubmit={handleCreateMeter} className="mt-4 space-y-3">
            <input required value={meterForm.serial_number} onChange={e => setMeterForm({ ...meterForm, serial_number: e.target.value })} placeholder="Serial number" className="input" />
            <select value={meterForm.meter_type} onChange={e => setMeterForm({ ...meterForm, meter_type: e.target.value })} className="input">
              <option value="electric">electric</option>
              <option value="water">water</option>
              <option value="gas">gas</option>
            </select>
            <input value={meterForm.manufacturer} onChange={e => setMeterForm({ ...meterForm, manufacturer: e.target.value })} placeholder="Manufacturer" className="input" />
            <input value={meterForm.model} onChange={e => setMeterForm({ ...meterForm, model: e.target.value })} placeholder="Model" className="input" />
            <input value={meterForm.unit_id} onChange={e => setMeterForm({ ...meterForm, unit_id: e.target.value })} placeholder="unit_id" className="input" />
            <input type="date" value={meterForm.installation_date} onChange={e => setMeterForm({ ...meterForm, installation_date: e.target.value })} className="input" />
            <div>
              <button className="btn btn-primary" type="submit">Create Meter</button>
            </div>
          </form>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-medium">GET /utilities/meters</h2>
          <p className="text-sm text-gray-500">List meters (optional unit_id query)</p>
            <div className="mt-3 flex items-center gap-2">
              <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)} className="input">
                <option value="">(all units)</option>
                {Array.from(new Set(meters.map(m => String(m.unit_id || '')))).filter(Boolean).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button className="btn" onClick={() => loadMeters(unitFilter ? { unit_id: unitFilter } : undefined)}>Refresh</button>
            </div>
          <div className="mt-4 space-y-2">
            {meters.length === 0 && <div className="text-sm text-gray-600">No meters found</div>}
            {meters.map(m => (
              <div key={m.id} className="p-2 border rounded bg-white/5 flex justify-between items-center">
                <div>
                  <div className="font-medium">{m.serial_number} — {m.meter_type}</div>
                  <div className="text-sm text-gray-400">Unit: {m.unit_id ?? '—'} · {m.manufacturer} {m.model}</div>
                </div>
                <div className="text-sm text-gray-300">{m.last_reading_at ? new Date(m.last_reading_at).toLocaleString() : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h2 className="font-medium">POST /utilities/readings</h2>
          <p className="text-sm text-gray-500">Record a meter reading (accepts optional photo multipart)</p>
          <form onSubmit={handleCreateReading} className="mt-4 space-y-3">
            <select required value={readingForm.meter_id} onChange={e => setReadingForm({ ...readingForm, meter_id: e.target.value })} className="input">
              <option value="">Select meter</option>
              {meters.map(m => <option key={m.id} value={String(m.id)}>{m.serial_number} (unit {m.unit_id})</option>)}
            </select>
            <input required value={readingForm.reading_value} onChange={e => setReadingForm({ ...readingForm, reading_value: e.target.value })} placeholder="Value" className="input" />
            <input value={readingForm.recorded_at} onChange={e => setReadingForm({ ...readingForm, recorded_at: e.target.value })} type="datetime-local" className="input" />
            <input value={readingForm.notes} onChange={e => setReadingForm({ ...readingForm, notes: e.target.value })} placeholder="Notes" className="input" />
            <div>
              <label className="block text-sm">Photo (optional)</label>
              <input type="file" accept="image/*" onChange={e => setReadingPhoto(e.target.files ? e.target.files[0] : null)} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit">Record Reading</button>
            </div>
          </form>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-medium">GET /utilities/readings</h2>
          <p className="text-sm text-gray-500">List readings (optional meter_id query)</p>
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
                <div key={r.id} className="p-3 border rounded bg-white/50 flex items-center gap-4">
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
