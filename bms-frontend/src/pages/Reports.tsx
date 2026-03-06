import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { getDashboard, getFinancial, getOccupancy } from '../api/reports'

function Money({ value }: { value: number }) {
  return <span>₦{Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

export default function Reports() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<any>(null)
  const [financial, setFinancial] = useState<any[]>([])
  const [occupancy, setOccupancy] = useState<any>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [dash, fin, occ] = await Promise.all([getDashboard(), getFinancial(), getOccupancy()])
      setDashboard(dash)
      setFinancial(Array.isArray(fin) ? fin : [])
      setOccupancy(occ)
    } catch (e:any) {
      console.error('load reports', e)
      toast.addToast('Failed to load reports', 'error')
    } finally { setLoading(false) }
  }

  return (
    <PageLayout title="Reports" subtitle="Occupancy, financials and dashboard KPIs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-3">Dashboard KPIs</h3>
          {loading && !dashboard ? <div>Loading...</div> : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm text-gray-500">Occupancy Rate</div>
                <div className="text-xl font-bold">{dashboard ? `${dashboard.occupancy_rate ?? '-'}%` : '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-gray-500">Total Units</div>
                <div className="text-xl font-bold">{dashboard?.total_units ?? '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-gray-500">Occupied Leases</div>
                <div className="text-xl font-bold">{dashboard?.occupied_leases ?? '-'}</div>
              </div>
              <div className="p-3 border rounded">
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-xl font-bold"><Money value={dashboard?.total_revenue ?? 0} /></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow p-6 lg:col-span-2">
          <h3 className="font-semibold mb-3">Financial (last 12 months)</h3>
          {loading && financial.length === 0 ? <div>Loading...</div> : (
            <div className="space-y-2">
              {financial.map((m:any) => (
                <div key={m.month} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-600">{m.month}</div>
                  <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                    <div style={{ width: `${Math.min(100, (m.total || 0) / (financial[0]?.total || 1) * 100)}%` }} className="h-6 bg-blue-600" />
                  </div>
                  <div className="w-32 text-right"><Money value={m.total || 0} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-1">
          <h3 className="font-semibold mb-4">Occupancy</h3>
          {loading && !occupancy ? <div>Loading...</div> : (
            Array.isArray(occupancy) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Active leases</div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{occupancy.length}</div>
                </div>
                <div className="divide-y rounded border overflow-hidden">
                  {occupancy.map((l:any) => (
                    <div key={l.id} className="p-4 flex gap-4 items-start hover:bg-gray-50">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-600 font-semibold">{String(l.unit?.unit_number || '').slice(0,2) || 'U'}</div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <div className="text-sm font-semibold">Unit {l.unit?.unit_number} <span className="text-xs text-gray-500">· {l.unit?.type}</span></div>
                            <div className="text-xs text-gray-500 mt-1">Floor {l.unit?.floor ?? '-'} · {l.unit?.size_sqm ?? '-'} sqm · Rent: <span className="font-medium">₦{Number(l.unit?.rent_price || 0).toLocaleString()}</span></div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{l.tenant?.first_name || '-'} {l.tenant?.last_name || ''}</div>
                            <div className="text-xs text-gray-500">{l.tenant?.phone ?? ''}</div>
                            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${l.status === 'current' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{l.status}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">{l.start_date}{l.end_date ? ` → ${l.end_date}` : ''}</div>
                          <details className="text-xs text-indigo-600">
                            <summary className="cursor-pointer">View JSON</summary>
                            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">{JSON.stringify(l, null, 2)}</pre>
                          </details>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-500">Vacant Units</div>
                  <div className="text-2xl font-bold">{occupancy?.vacant_units ?? '-'}</div>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-500">Leases Expiring Soon</div>
                  <div className="text-2xl font-bold">{occupancy?.expiring_soon ?? '-'}</div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </PageLayout>
  )
}

