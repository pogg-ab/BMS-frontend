import React, { useEffect, useState } from 'react'
import { listSites, createSite, deleteSite } from '../api/sites'

export default function Sites() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('')
  const [currency, setCurrency] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await listSites({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setItems(list)
    } catch (e:any) {
      console.error('load sites', e, e?.response?.data)
      const msg = e?.response?.data || e?.message || 'Failed to load sites'
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e:React.FormEvent) {
    e.preventDefault()
    try {
      await createSite({ name, code, address, timezone, currency, contact_email: contactEmail, notes })
      setName('')
      setCode('')
      setAddress('')
      setTimezone('')
      setCurrency('')
      setContactEmail('')
      setNotes('')
      load()
      alert('Site created')
    } catch (err:any) {
      console.error('create site', err)
      const msg = err?.response?.data?.message
      alert(Array.isArray(msg) ? msg.join(',') : (msg || 'Failed to create site'))
    }
  }

  async function handleDelete(id:any) {
    if (!confirm('Delete site?')) return
    try {
      await deleteSite(id)
      alert('Site deleted')
      load()
    } catch (e:any) {
      console.error('delete site', e)
      alert(e?.response?.data?.message || 'Failed to delete site')
    }
  }

  return (
    <div className="container">
      <div className="header flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sites</h1>
      </div>

      <div className="card my-4">
        <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Code</label>
            <input value={code} onChange={e=>setCode(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <input value={timezone} onChange={e=>setTimezone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <input value={currency} onChange={e=>setCurrency(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div className="col-span-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <button className="button ml-auto" type="submit">Create</button>
          </div>
        </form>
      </div>

      <div className="card">
        {loading && <div>Loading...</div>}
        {!loading && items.length === 0 && <div className="muted">No sites found</div>}
        {!loading && items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">City</th>
                <th className="py-2">Subcity</th>
                <th className="py-2">Location</th>
                <th className="py-2">Buildings</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s=> (
                <tr key={s.id} className="border-b hover:bg-slate-50">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.city || '-'}</td>
                  <td className="py-2">{s.subcity || '-'}</td>
                  <td className="py-2">{(s.location_lat_long || s.location || '').toString().trim() || '-'}</td>
                  <td className="py-2">
                    {Array.isArray(s.buildings) && s.buildings.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {s.buildings.map((b:any) => (
                          <li key={b.id}>{b.name}{b.code ? ` — ${b.code}` : ''}{b.type ? ` (${b.type})` : ''}</li>
                        ))}
                      </ul>
                    ) : ('-')}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <button className="text-red-700" onClick={()=>handleDelete(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
