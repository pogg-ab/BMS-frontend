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
import { listBuildings } from '../api/buildings'

export default function Leases() {
  const toast = useToast()
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000'
  const [leases, setLeases] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function tenantLabel(t: any) {
    if (!t) return ''
    if (typeof t === 'string' || typeof t === 'number') return String(t)
    return t.name || t.full_name || ((t.first_name || t.last_name) ? `${t.first_name || ''} ${t.last_name || ''}`.trim() : String(t.id))
  }

  function unitLabel(u: any) {
    if (!u) return ''
    return u.unit_number || u.name || String(u.id)
  }

  function leaseTenantLabel(l: any) {
    if (!l) return ''
    if (l.tenant) return tenantLabel(l.tenant)
    return l.tenant_name || l.tenant_id || ''
  }

  // Create form
  const [unitId, setUnitId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [leaseBuildingId, setLeaseBuildingId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rent, setRent] = useState('')
  const [serviceCharge, setServiceCharge] = useState('')
  const [billingCycle, setBillingCycle] = useState('MONTHLY')

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
  const [renewOnlyBillingCycle, setRenewOnlyBillingCycle] = useState('MONTHLY')
  const [uploadOnlyLeaseId, setUploadOnlyLeaseId] = useState<string | number>('')
  const [uploadOnlyFile, setUploadOnlyFile] = useState<File | null>(null)


  useEffect(() => { loadLeases(); loadLookups() }, [])

  async function loadLookups() {
    try {
      const t: any = await listTenants({ page: 1, per_page: 200 })
      const tenantsList = Array.isArray(t) ? t : (t?.data || t || [])
      setTenants(tenantsList)
    } catch (e: any) { console.error('load tenants', e) }
    try {
      const u: any = await listUnits({ page: 1, per_page: 500 })
      const unitsList = Array.isArray(u) ? u : (u?.data || u || [])
      setUnits(unitsList)
    } catch (e: any) { console.error('load units', e) }
    try {
      const b: any = await listBuildings({ page: 1, per_page: 200 })
      const bList = Array.isArray(b) ? b : (b?.data || b || [])
      setAllBuildings(bList)
    } catch (e: any) { console.error('load buildings', e) }
  }

  async function loadLeases() {
    setLoading(true)
    try {
      const list: any = await listLeases({ page: 1, per_page: 50 })
      setLeases(Array.isArray(list) ? list : [])
    } catch (e: any) { console.error(e); toast.addToast('Failed to fetch leases. Please try again later.', 'error') }
    finally { setLoading(false) }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = {
        unit_id: unitId,
        tenant_id: tenantId,
        building_id: leaseBuildingId,
        start_date: startDate,
        end_date: endDate,
        rent_amount: Number(rent),
      }
      if (serviceCharge) payload.service_charge = Number(serviceCharge)
      if (billingCycle) payload.billing_cycle = billingCycle
      const res = await createLease(payload)
      toast.addToast('Lease draft created', 'success')
      loadLeases()
      return res
    } catch (e: any) {
      console.error('Create lease error', e)
      const server = e?.response?.data
      let msg = e?.message || 'Create lease failed'
      try { if (server) msg = Array.isArray(server?.message) ? server.message.join('; ') : (server?.message || JSON.stringify(server)) } catch { }
      toast.addToast(msg, 'error')
    }
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      // API expects activation by path id; no request body required per docs
      await activateLease(selectedLeaseId, {})
      toast.addToast('Lease activated', 'success')
      loadLeases()
    } catch (e: any) { console.error(e); toast.addToast('Activate failed', 'error') }
  }

  async function handleActivateOnly(e?: React.FormEvent) {
    e?.preventDefault()
    if (!activateOnlyLeaseId) { toast.addToast('Select lease to activate', 'error'); return }
    try {
      await activateLease(activateOnlyLeaseId, {})
      toast.addToast('Lease activated', 'success')
      setActivateOnlyLeaseId('')
      loadLeases()
    } catch (e: any) { console.error(e); toast.addToast('Activate failed', 'error') }
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
    } catch (e: any) { console.error(e); toast.addToast('Terminate failed', 'error') }
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
      await renewLease(renewOnlyLeaseId, payload)
      toast.addToast('Renewal created', 'success')
      setRenewOnlyLeaseId('')
      setRenewOnlyStart('')
      setRenewOnlyEnd('')
      setRenewOnlyRent('')
      setRenewOnlyBillingCycle('MONTHLY')
      loadLeases()
    } catch (e: any) { console.error(e); toast.addToast('Renew failed', 'error') }
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
    } catch (e: any) { console.error(e); toast.addToast('Upload failed', 'error') }
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
    } catch (e: any) { console.error(e); toast.addToast('Terminate failed', 'error') }
  }

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLeaseId) { toast.addToast('Select lease id', 'error'); return }
    try {
      await renewLease(selectedLeaseId, { new_start_date: startDate, new_end_date: endDate, rent: Number(rent), created_by: Number(actorId) || undefined })
      toast.addToast('Renewal created', 'success')
      loadLeases()
    } catch (e: any) { console.error(e); toast.addToast('Renew failed', 'error') }
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
    } catch (e: any) { console.error(e); toast.addToast('Upload failed', 'error') }
  }

  async function handleDownload(id: string | number, mode: 'view' | 'download' = 'download') {
    if (!id) { toast.addToast('Select lease id', 'error'); return }
    try {
      const res = await downloadLease(id)
      const contentType = (res.headers && (res.headers['content-type'] || res.headers['Content-Type'])) || ''

      // 1. Check if the response is actually a JSON error hidden in the binary data
      if (contentType.includes('application/json') || res.data instanceof ArrayBuffer || res.data instanceof Blob) {
        let textContent = ''
        if (res.data instanceof ArrayBuffer) {
          textContent = new TextDecoder().decode(res.data)
        } else if (res.data instanceof Blob) {
          textContent = await res.data.text()
        }

        if (textContent.trim().startsWith('{')) {
          try {
            const json = JSON.parse(textContent)
            if (json.statusCode >= 400 || json.message) {
              toast.addToast(`Error: ${json.message || 'Server error'}`, 'error')
              return
            }
          } catch (e) { /* Not JSON, continue */ }
        }
      }

      // 2. Prepare the Blob
      let blob: Blob
      if (res.data instanceof Blob) {
        blob = res.data
      } else {
        blob = new Blob([res.data], { type: contentType || 'application/pdf' })
      }

      const url = URL.createObjectURL(blob)

      if (mode === 'view') {
        window.open(url, '_blank')
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = `Lease_${id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err: any) {
      console.error('handleDownload error', err)
      toast.addToast('Failed to process document', 'error')
    }
  }

  return (
    <PageLayout title="Leases" subtitle="Manage leasing lifecycles, payments, and associated documents">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">Create Lease Draft</h3>
            <form onSubmit={handleCreate} className="space-y-2">
              <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select tenant</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={String(t.id)}>{tenantLabel(t)}{t.id ? ` (${t.id})` : ''}</option>
                ))}
              </select>
              <select value={leaseBuildingId} onChange={e => setLeaseBuildingId(e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select building</option>
                {allBuildings.map((b: any) => (
                  <option key={b.id} value={String(b.id)}>{b.name || b.code || b.id}</option>
                ))}
              </select>
              <select value={unitId} onChange={e => setUnitId(e.target.value)} className="w-full p-2 border rounded" required>
                <option value="">Select unit</option>
                {units.map((u: any) => (
                  <option key={u.id} value={String(u.id)}>{unitLabel(u)}{u.unit_number ? ` (${u.id})` : ''}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 p-2 border rounded" required />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 p-2 border rounded" required />
              </div>
              <div className="flex gap-2">
                <input placeholder="Rent Amount (ETB)" value={rent} onChange={e => setRent(e.target.value)} className="flex-1 p-2 border rounded" required />
                <input placeholder="Service Charge (optional)" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} className="flex-1 p-2 border rounded" />
              </div>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="w-full p-2 border rounded">
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <div className="flex justify-end pt-2">
                <button type="submit" className="button">Create Draft</button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">Quick Actions</h3>
            <form onSubmit={handleActivateOnly} className="mb-3">
              <label className="block text-sm font-medium mb-1">Quick Activate (lease only)</label>
              <div className="flex gap-2">
                <select value={String(activateOnlyLeaseId)} onChange={e => setActivateOnlyLeaseId(e.target.value)} className="flex-1 p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.filter((l: any) => l.status === 'DRAFT').map((l: any) => (
                    <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                  ))}
                </select>
                <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Activate</button>
              </div>
            </form>
            <form onSubmit={handleTerminateOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Terminate</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lease</label>
                  <select value={String(terminateOnlyLeaseId)} onChange={e => setTerminateOnlyLeaseId(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">Select lease</option>
                    {leases.filter((l: any) => ['ACTIVE', 'RENEWED'].includes(l.status)).map((l: any) => (
                      <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Termination Date</label>
                  <input type="date" value={terminateOnlyDate} onChange={e => setTerminateOnlyDate(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                  <input placeholder="Termination Reason" value={terminateOnlyReason} onChange={e => setTerminateOnlyReason(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded">Terminate</button>
              </div>
            </form>
            <form onSubmit={handleRenewOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Renew</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Lease</label>
                  <select value={String(renewOnlyLeaseId)} onChange={e => setRenewOnlyLeaseId(e.target.value)} className="w-full p-2 border rounded">
                    <option value="">Select lease</option>
                    {leases.filter((l: any) => ['ACTIVE', 'EXPIRED'].includes(l.status)).map((l: any) => (
                      <option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={renewOnlyStart} onChange={e => setRenewOnlyStart(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                  <input type="date" value={renewOnlyEnd} onChange={e => setRenewOnlyEnd(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rent Amount</label>
                  <input placeholder="Rent Amount" value={renewOnlyRent} onChange={e => setRenewOnlyRent(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Billing Cycle</label>
                  <select value={renewOnlyBillingCycle} onChange={e => setRenewOnlyBillingCycle(e.target.value)} className="w-full p-2 border rounded">
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
                <div className="flex items-end justify-end">
                  <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Renew</button>
                </div>
              </div>
            </form>
            <form onSubmit={handleUploadOnly} className="mb-4">
              <label className="block text-sm font-medium mb-1">Quick Upload (file)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <select value={String(uploadOnlyLeaseId)} onChange={e => setUploadOnlyLeaseId(e.target.value)} className="p-2 border rounded">
                  <option value="">Select lease</option>
                  {leases.map((l: any) => (<option key={l.id} value={String(l.id)}>{`${l.lease_number || 'L-Draft'} — ${l.unit?.unit_number || l.unit_number || l.unit_id} — ${leaseTenantLabel(l)}`}</option>))}
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

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md mt-6">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">Active & Historical Leases</h3>
          {loading ? <div className="py-12 flex justify-center text-slate-500">Loading leases...</div> : (
            <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Lease Number</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Unit</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Tenant</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Building</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Dates</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Rent</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {leases.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{l.lease_number || 'L-Draft'}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{l.unit?.unit_number || l.unit_number || l.unit_id}</td>
                      <td className="px-6 py-4 text-slate-600">{tenantLabel(l.tenant)}</td>
                      <td className="px-6 py-4 text-slate-600">{l.building?.name || l.building?.code || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {l.start_date ? new Date(l.start_date).toLocaleDateString() : ''} → {l.end_date ? new Date(l.end_date).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{l.rent_amount || l.rent || l.rent_price || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${l.status === 'ACTIVE' || l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            l.status === 'DRAFT' || l.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              l.status === 'TERMINATED' || l.status === 'terminated' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-50 dark:bg-slate-900 text-slate-700 border-slate-200 dark:border-slate-700'
                          }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDownload(l.id, 'view')} className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2">View</button>
                        <button onClick={() => handleDownload(l.id, 'download')} className="text-emerald-600 hover:text-emerald-900 font-medium text-xs pl-2 border-l border-slate-200 dark:border-slate-700 ml-2">Download</button>
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

