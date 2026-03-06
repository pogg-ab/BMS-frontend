import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import {
  createLease,
  listLeases,
  activateLease,
  terminateLease,
  renewLease,
  uploadLeaseDocument,
  downloadLease,
} from '../api/leases'
import { listTenants } from '../api/tenants'
import { listUnits } from '../api/units'

export default function Leases() {
  const toast = useToast()
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2546'
  const [leases, setLeases] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function tenantLabel(t:any) {
    if (!t) return ''
    if (typeof t === 'string' || typeof t === 'number') return String(t)
    return t.name || t.full_name || ((t.first_name || t.last_name) ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : String(t.id))
  }

  function unitLabel(u:any) {
    if (!u) return ''
    return u.unit_number || u.name || String(u.id)
  }

  function leaseTenantLabel(l:any) {
    if (!l) return ''
    if (l.tenant) return tenantLabel(l.tenant)
    return l.tenant_name || l.tenant_id || ''
  }

  // Create form
  const [unitId, setUnitId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rent, setRent] = useState('')
  const [deposit, setDeposit] = useState('')
  const [paymentSchedule, setPaymentSchedule] = useState('monthly')
  const [terms, setTerms] = useState('')

  // Activation / termination / renew
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | number>('')
  const [actorId, setActorId] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [terminationReason, setTerminationReason] = useState('')

  // Upload
  const [leaseFile, setLeaseFile] = useState<File | null>(null)
  
  const [activateOnlyLeaseId, setActivateOnlyLeaseId] = useState<string | number>('')
  const [terminateOnlyLeaseId, setTerminateOnlyLeaseId] = useState<string | number>('')
  const [terminateOnlyDate, setTerminateOnlyDate] = useState('')
  const [terminateOnlyReason, setTerminateOnlyReason] = useState('')
  const [renewOnlyLeaseId, setRenewOnlyLeaseId] = useState<string | number>('')
  const [renewOnlyStart, setRenewOnlyStart] = useState('')
  const [renewOnlyEnd, setRenewOnlyEnd] = useState('')
  const [renewOnlyRent, setRenewOnlyRent] = useState('')
  const [renewOnlyBillingCycle, setRenewOnlyBillingCycle] = useState('monthly')
  const [uploadOnlyLeaseId, setUploadOnlyLeaseId] = useState<string | number>('')
  const [uploadOnlyFile, setUploadOnlyFile] = useState<File | null>(null)
  

  useEffect(() => { loadLeases(); loadLookups() }, [])

  async function loadLookups() {
    try {
      const t: any = await listTenants({ page: 1, per_page: 200 })
      const tenantsList = Array.isArray(t) ? t : (t?.data || t || [])
      setTenants(tenantsList)
    } catch (e:any) { console.error('load tenants', e) }
    try {
      const u: any = await listUnits({ page: 1, per_page: 500 })
      const unitsList = Array.isArray(u) ? u : (u?.data || u || [])
      setUnits(unitsList)
    } catch (e:any) { console.error('load units', e) }
  }

  async function loadLeases() {
    setLoading(true)
    try {
      const list: any = await listLeases({ page: 1, per_page: 50 })
      setLeases(Array.isArray(list) ? list : [])
    } catch (e:any) { console.error(e); toast.addToast('Failed to load leases', 'error') }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = {
        unit_id: Number(unitId),
        tenant_id: Number(tenantId),
        start_date: startDate,
        end_date: endDate,
        rent: Number(rent),
      }
      if (deposit) payload.deposit = Number(deposit)
      if (paymentSchedule) payload.payment_schedule = paymentSchedule
      if (terms) payload.terms = terms
      const res = await createLease(payload)
      toast.addToast('Lease draft created', 'success')
      loadLeases()
      return res
    } catch (e:any) {
      console.error('Create lease error', e)
      const server = e?.response?.data
      let msg = e?.message || 'Create lease failed'
      try { if (server) msg = Array.isArray(server?.message) ? server.message.join('; ') : (server?.message || JSON.stringify(server)) } catch {}
      toast.addToast(msg, 'error')
    }
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      // API expects activation by path id; no request body required per docs
      await activateLease(selectedLeaseId)
      toast.addToast('Lease activated', 'success')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Activate failed', 'error') }
  }

  async function handleActivateOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!activateOnlyLeaseId) { toast.addToast('Select lease to activate', 'error'); return }
    try {
      await activateLease(activateOnlyLeaseId)
      toast.addToast('Lease activated', 'success')
      setActivateOnlyLeaseId('')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Activate failed', 'error') }
  }

  async function handleTerminateOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!terminateOnlyLeaseId) { toast.addToast('Select lease to terminate', 'error'); return }
    try {
      const payload: any = { termination_date: terminateOnlyDate || undefined, reason: terminateOnlyReason || undefined }
      await terminateLease(terminateOnlyLeaseId, payload)
      toast.addToast('Lease terminated', 'success')
      setTerminateOnlyLeaseId('')
      setTerminateOnlyDate('')
      setTerminateOnlyReason('')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Terminate failed', 'error') }
  }

  async function handleRenewOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!renewOnlyLeaseId) { toast.addToast('Select lease to renew', 'error'); return }
    try {
      const payload: any = {
        start_date: renewOnlyStart || undefined,
        end_date: renewOnlyEnd || undefined,
        rent_amount: renewOnlyRent ? Number(renewOnlyRent) : undefined,
        billing_cycle: renewOnlyBillingCycle || undefined,
      }
      if (renewOnlyRent) payload.rent = Number(renewOnlyRent)
      await renewLease(renewOnlyLeaseId, payload)
      toast.addToast('Renewal created', 'success')
      setRenewOnlyLeaseId('')
      setRenewOnlyStart('')
      setRenewOnlyEnd('')
      setRenewOnlyRent('')
      setRenewOnlyBillingCycle('monthly')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Renew failed', 'error') }
  }

  async function handleUploadOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!uploadOnlyLeaseId) { toast.addToast('Select lease to attach document', 'error'); return }
    try {
      if (uploadOnlyFile) {
        const fd = new FormData(); fd.append('file', uploadOnlyFile)
        await uploadLeaseDocument(uploadOnlyLeaseId, fd)
        toast.addToast('File uploaded', 'success')
      } else {
        toast.addToast('Choose a file to upload', 'error')
        return
      }
      setUploadOnlyLeaseId('')
      setUploadOnlyFile(null)
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Upload failed', 'error') }
  }

  async function handleTerminate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      // Send termination_date and reason as request body per API
      const payload: any = { termination_date: actionDate || undefined, reason: terminationReason || undefined }
      await terminateLease(selectedLeaseId, payload)
      toast.addToast('Lease terminated', 'success')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Terminate failed', 'error') }
  }

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      await renewLease(selectedLeaseId, { new_start_date: startDate, new_end_date: endDate, rent: Number(rent), created_by: Number(actorId) || undefined })
      toast.addToast('Renewal created', 'success')
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Renew failed', 'error') }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      if (leaseFile) {
        const fd = new FormData(); fd.append('file', leaseFile)
        await uploadLeaseDocument(selectedLeaseId, fd)
        toast.addToast('File uploaded', 'success')
      } else {
        toast.addToast('Choose a file to upload', 'error')
      }
      loadLeases()
    } catch (e:any) { console.error(e); toast.addToast('Upload failed', 'error') }
  }

  async function handleDownload(id: string | number) {
    if (!id) { toast.addToast('Select lease id to download', 'error'); return }
    try {
      const res = await downloadLease(id)
      // Try to parse JSON response for download_url
      const contentType = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || ''
      // If server returned JSON (e.g. { download_url }), handle that first
      if (contentType.includes('application/json')) {
        const text = new TextDecoder().decode(res.data)
        try {
          const json = JSON.parse(text)
          if (json.download_url) {
            window.open(json.download_url, '_blank')
            return
          }
          toast.addToast(json.message || 'No download URL returned', 'error')
          return
        } catch (err) {
          // fallthrough to binary handling
        }
      }

      // At this point treat response as binary. res.data may be ArrayBuffer or Blob
      let blob: Blob
      if (res.data instanceof ArrayBuffer) {
        const mime = contentType || 'application/pdf'
        blob = new Blob([res.data], { type: mime })
      } else if (res.data instanceof Blob) {
        // ensure blob has a type; if not, set from header
        if (!res.data.type && contentType) blob = new Blob([res.data], { type: contentType })
        else blob = res.data
      } else {
        // fallback: try to convert to ArrayBuffer then blob
        try {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
          const ab = new TextEncoder().encode(text).buffer
          blob = new Blob([ab], { type: contentType || 'application/octet-stream' })
        } catch (e) {
          toast.addToast('Download failed: unknown response type', 'error')
          return
        }
      }

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (err:any) {
      console.error('handleDownload error', err)
      const resp = err?.response
      if (resp) {
        // attempt to decode response body (may be arraybuffer)
        try {
          let text = ''
          const data = resp.data
          if (data instanceof ArrayBuffer) text = new TextDecoder().decode(data)
          else if (typeof data === 'string') text = data
          else if (data && typeof data === 'object') text = JSON.stringify(data)
          // try json
          try {
            const json = JSON.parse(text)
            const msg = json.message || json.error || JSON.stringify(json)
            toast.addToast(`Download failed: ${msg}`, 'error')
          } catch (e) {
            // plain text or html
            const short = text.slice(0, 200)
            toast.addToast(`Download failed: ${short}`, 'error')
          }
        } catch (e) {
          toast.addToast('Download failed (unable to decode error)', 'error')
        }
      } else {
        toast.addToast('Download failed', 'error')
      }
    }
  }

  return (
    <PageLayout title="Leases" subtitle="Lease management (create, activate, terminate, renew, upload, download)">
      <div className="bg-white rounded shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-3">Create Lease Draft</h3>
            <form onSubmit={handleCreate} className="space-y-2">
              <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select unit</option>
                {units.map((u:any) => (
                  <option key={u.id} value={String(u.id)}>{unitLabel(u)}{u.unit_number ? ` (${u.id})` : ''}</option>
                ))}
              </select>
              <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select tenant</option>
                {tenants.map((t:any) => (
                  <option key={t.id} value={String(t.id)}>{tenantLabel(t)}{t.id ? ` (${t.id})` : ''}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 p-2 border rounded" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 p-2 border rounded" />
              </div>
              <div className="flex gap-2">
                <input placeholder="Rent" value={rent} onChange={e => setRent(e.target.value)} className="flex-1 p-2 border rounded" />
                <input placeholder="Deposit" value={deposit} onChange={e => setDeposit(e.target.value)} className="flex-1 p-2 border rounded" />
              </div>
              <select value={paymentSchedule} onChange={e => setPaymentSchedule(e.target.value)} className="w-full p-2 border rounded">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <textarea placeholder="Terms" value={terms} onChange={e => setTerms(e.target.value)} className="w-full p-2 border rounded" />
              <div className="flex justify-end">
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-3">Actions (Activate / Terminate / Renew / Attach / Download)</h3>
            <form onSubmit={handleActivateOnly} className="mb-3">
              <label className="block text-sm font-medium mb-1">Quick Activate (lease only)</label>
              <div className="flex gap-2">
                <select value={String(activateOnlyLeaseId)} onChange={e => setActivateOnlyLeaseId(e.target.value)} className="flex-1 p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.map((l:any) => (<option key={l.id} value={String(l.id)}>{`#${l.id} — ${l.unit_number || l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
                </select>
                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Activate</button>
              </div>
            </form>
            <form onSubmit={handleTerminateOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Terminate</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select value={String(terminateOnlyLeaseId)} onChange={e => setTerminateOnlyLeaseId(e.target.value)} className="col-span-1 md:col-span-1 p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.map((l:any) => (<option key={l.id} value={String(l.id)}>{`#${l.id} — ${l.unit_number || l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
                </select>
                <input type="date" value={terminateOnlyDate} onChange={e => setTerminateOnlyDate(e.target.value)} className="p-2 border rounded" />
                <input placeholder="Reason" value={terminateOnlyReason} onChange={e => setTerminateOnlyReason(e.target.value)} className="p-2 border rounded" />
              </div>
              <div className="flex justify-end mt-2">
                <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">Terminate</button>
              </div>
            </form>
            <form onSubmit={handleRenewOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Renew</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <select value={String(renewOnlyLeaseId)} onChange={e => setRenewOnlyLeaseId(e.target.value)} className="p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.map((l:any) => (<option key={l.id} value={String(l.id)}>{`#${l.id} — ${l.unit_number || l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
                </select>
                <input type="date" value={renewOnlyStart} onChange={e => setRenewOnlyStart(e.target.value)} className="p-2 border rounded" />
                <input type="date" value={renewOnlyEnd} onChange={e => setRenewOnlyEnd(e.target.value)} className="p-2 border rounded" />
                <input placeholder="Rent" value={renewOnlyRent} onChange={e => setRenewOnlyRent(e.target.value)} className="p-2 border rounded" />
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <select value={renewOnlyBillingCycle} onChange={e => setRenewOnlyBillingCycle(e.target.value)} className="p-2 border rounded">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
                <div className="flex-1" />
                <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Renew</button>
              </div>
            </form>
            <form onSubmit={handleUploadOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Upload (file)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <select value={String(uploadOnlyLeaseId)} onChange={e => setUploadOnlyLeaseId(e.target.value)} className="p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.map((l:any) => (<option key={l.id} value={String(l.id)}>{`#${l.id} — ${l.unit_number || l.unit?.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
                </select>
                <input type="file" onChange={e => setUploadOnlyFile(e.target.files?.[0] || null)} className="p-1" />
              </div>
              <div className="flex justify-end mt-2">
                <button type="submit" className="px-3 py-2 bg-gray-700 text-white rounded">Attach</button>
              </div>
            </form>
            
            {/* Download button removed per UX request; use row-level Download or View links */}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Leases</h3>
          {loading ? <div>Loading...</div> : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">ID</th>
                  <th className="p-2">Lease</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Building</th>
                  <th className="p-2">Dates</th>
                  <th className="p-2">Rent</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Document</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((l:any) => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{l.id}</td>
                    <td className="p-2">{l.lease_number || ''}</td>
                    <td className="p-2">{l.unit?.unit_number || l.unit_number || l.unit_id}</td>
                    <td className="p-2">{tenantLabel(l.tenant)}</td>
                    <td className="p-2">{l.building?.name || l.building?.code || ''}</td>
                    <td className="p-2">{l.start_date} → {l.end_date}</td>
                    <td className="p-2">{l.rent_amount || l.rent || l.rent_price || ''}</td>
                    <td className="p-2">{l.status}</td>
                    <td className="p-2">
                      {l.doc_path ? (
                        <a href={`${apiBase.replace(/\/$/, '')}${l.doc_path}`} target="_blank" rel="noreferrer" className="mr-2 text-indigo-600">View</a>
                      ) : null}
                      <button onClick={() => handleDownload(l.id)} className="mr-2 text-green-600">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
 
