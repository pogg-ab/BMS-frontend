import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import {
  createVisitor,
  listVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
  checkoutVisitor,
} from '../api/visitors'

export default function Visitors() {
  const toast = useToast()
  const [visitors, setVisitors] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Create form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [purpose, setPurpose] = useState('')
  const [hostUserId, setHostUserId] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [siteId, setSiteId] = useState('')
  const [notes, setNotes] = useState('')

  // Get / Update / Delete / Checkout
  const [querySiteId, setQuerySiteId] = useState('')
  const [selectedId, setSelectedId] = useState<string | number>('')
  const [single, setSingle] = useState<any>(null)

  useEffect(() => { loadVisitors() }, [])

  async function loadVisitors() {
    setLoading(true)
    try {
      const params: any = {}
      if (querySiteId) params.site_id = querySiteId
      const list: any = await listVisitors(Object.keys(params).length ? params : undefined)
      setVisitors(Array.isArray(list) ? list : (list?.data || []))
    } catch (e:any) { console.error(e); toast.addToast('Failed to load visitors', 'error') }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { name, phone, id_number: idNumber, purpose, host_user_id: hostUserId || undefined, vehicle_number: vehicleNumber || undefined, site_id: siteId || undefined, notes }
      const res = await createVisitor(payload)
      toast.addToast('Visitor checked in', 'success')
      // reset small form
      setName(''); setPhone(''); setIdNumber(''); setPurpose(''); setHostUserId(''); setVehicleNumber(''); setSiteId(''); setNotes('')
      loadVisitors()
      return res
    } catch (e:any) { console.error(e); toast.addToast('Create failed', 'error') }
  }

  async function handleGet(e?: React.FormEvent) {
    e?.preventDefault()
    if (!selectedId) { toast.addToast('Provide visitor id', 'error'); return }
    try {
      const v = await getVisitor(selectedId)
      setSingle(v)
    } catch (e:any) { console.error(e); toast.addToast('Get visitor failed', 'error') }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) { toast.addToast('Provide id to update', 'error'); return }
    try {
      const payload: any = {}
      if (name) payload.name = name
      if (phone) payload.phone = phone
      if (idNumber) payload.id_number = idNumber
      if (purpose) payload.purpose = purpose
      if (hostUserId) payload.host_user_id = hostUserId
      if (vehicleNumber) payload.vehicle_number = vehicleNumber
      if (siteId) payload.site_id = siteId
      if (notes) payload.notes = notes
      await updateVisitor(selectedId, payload)
      toast.addToast('Visitor updated', 'success')
      loadVisitors()
    } catch (e:any) { console.error(e); toast.addToast('Update failed', 'error') }
  }

  async function handleDelete(id?: string | number) {
    const target = id || selectedId
    if (!target) { toast.addToast('Select id to delete', 'error'); return }
    try {
      await deleteVisitor(target)
      toast.addToast('Visitor deleted', 'success')
      setSingle(null)
      loadVisitors()
    } catch (e:any) { console.error(e); toast.addToast('Delete failed', 'error') }
  }

  async function handleCheckout(id?: string | number) {
    const target = id || selectedId
    if (!target) { toast.addToast('Select id to checkout', 'error'); return }
    try {
      await checkoutVisitor(target)
      toast.addToast('Visitor checked out', 'success')
      loadVisitors()
    } catch (e:any) { console.error(e); toast.addToast('Checkout failed', 'error') }
  }

  return (
    <PageLayout title="Visitors" subtitle="Visitor check-in, listing and management">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-3">POST /visitors — Check-in</h3>
          <form onSubmit={handleCreate} className="space-y-2">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 border rounded" />
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" className="w-full p-2 border rounded" />
            <input value={idNumber} onChange={e=>setIdNumber(e.target.value)} placeholder="ID number" className="w-full p-2 border rounded" />
            <input value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Purpose" className="w-full p-2 border rounded" />
            <input value={hostUserId} onChange={e=>setHostUserId(e.target.value)} placeholder="Host user id" className="w-full p-2 border rounded" />
            <input value={vehicleNumber} onChange={e=>setVehicleNumber(e.target.value)} placeholder="Vehicle number" className="w-full p-2 border rounded" />
            <input value={siteId} onChange={e=>setSiteId(e.target.value)} placeholder="Site id" className="w-full p-2 border rounded" />
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" className="w-full p-2 border rounded" />
            <div className="flex justify-end"><button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit">Check-in</button></div>
          </form>
        </div>

        <div className="bg-white rounded shadow p-6 lg:col-span-2">
          <h3 className="font-semibold mb-3">GET /visitors — List</h3>
          <div className="flex gap-2 mb-3">
            <input value={querySiteId} onChange={e=>setQuerySiteId(e.target.value)} placeholder="site_id (optional)" className="p-2 border rounded" />
            <button onClick={loadVisitors} className="px-3 py-2 bg-gray-700 text-white rounded">Reload</button>
          </div>
          {loading ? <div>Loading...</div> : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="text-left border-b"><th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Phone</th><th className="p-2">Site</th><th className="p-2">Checked In</th><th className="p-2">Actions</th></tr>
              </thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{v.id}</td>
                    <td className="p-2">{v.name}</td>
                    <td className="p-2">{v.phone}</td>
                    <td className="p-2">{v.site_id}</td>
                    <td className="p-2">{v.checked_in_at ? new Date(v.checked_in_at).toLocaleString() : '-'}</td>
                    <td className="p-2">
                      <button onClick={() => { setSelectedId(v.id); setSingle(v) }} className="text-indigo-600 mr-2">View</button>
                      <button onClick={() => { setSelectedId(v.id); setName(v.name||''); setPhone(v.phone||''); setIdNumber(v.id_number||''); setPurpose(v.purpose||''); setHostUserId(String(v.host_user_id||'')); setVehicleNumber(v.vehicle_number||''); setSiteId(String(v.site_id||'')); setNotes(v.notes||'') }} className="text-green-600 mr-2">Edit</button>
                      <button onClick={() => handleCheckout(v.id)} className="text-blue-600 mr-2">Checkout</button>
                      <button onClick={() => handleDelete(v.id)} className="text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded shadow p-6 lg:col-span-3">
          <h3 className="font-semibold mb-3">GET /visitors/{'{id}'} — &nbsp; PATCH /visitors/{'{id}'} — &nbsp; DELETE /visitors/{'{id}'} — &nbsp; PATCH /visitors/{'{id}'}/checkout</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Visitor id</div>
              <input value={String(selectedId)} onChange={e=>setSelectedId(e.target.value)} className="w-full p-2 border rounded" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleGet} className="px-3 py-2 bg-indigo-600 text-white rounded">Get</button>
                <button onClick={handleUpdate} className="px-3 py-2 bg-green-600 text-white rounded">Update</button>
                <button onClick={() => handleDelete()} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
                <button onClick={() => handleCheckout()} className="px-3 py-2 bg-blue-600 text-white rounded">Checkout</button>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-gray-600 mb-1">Selected visitor</div>
              {single ? (
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(single, null, 2)}</pre>
              ) : <div className="text-sm text-gray-500">No visitor selected. Click View from list or use Get by id.</div>}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
