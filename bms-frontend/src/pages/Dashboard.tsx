import React, { useEffect, useState } from 'react'
import { logout } from '../auth/auth'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { getDashboard } from '../api/reports'

export default function Dashboard() {
  const toast = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboard()
      .then(d => setData(d))
      .catch((e) => { console.error('dashboard', e); toast.addToast('Failed to load dashboard', 'error') })
      .finally(() => setLoading(false))
  }, [])

  function Money({ v }: { v?: number }) {
    return <span>₦{Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  }

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview and reports"
      actions={<button className="px-3 py-2 bg-white text-blue-600 rounded-md" onClick={() => { logout(); window.location.href = '/login' }}>Logout</button>}
    >
      <div className="-mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Occupancy Rate</div>
            <div className="text-3xl font-bold mt-2">{loading ? '—' : `${data?.occupancy_rate ?? 0}%`}</div>
            <div className="text-sm text-gray-500 mt-1">{loading ? '' : `${data?.occupied_leases ?? 0} of ${data?.total_units ?? 0} units occupied`}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-3xl font-bold mt-2"><Money v={loading ? 0 : data?.total_revenue} /></div>
            <div className="text-sm text-gray-500 mt-1">Month-to-date and historical trends</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">Maintenance Avg Resolution</div>
            <div className="text-2xl font-bold mt-2">{loading ? '—' : `${data?.maintenance?.avgResolutionTime ?? 0} hrs`}</div>
            <div className="text-sm text-gray-500 mt-1">Contractors: {loading ? '—' : (data?.maintenance?.contractorStats?.length ?? 0)}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">Total Revenue</h3>
            {loading ? <div>Loading...</div> : (
              <div>
                <div className="text-3xl font-bold"><Money v={data?.total_revenue ?? 0} /></div>
                <div className="text-sm text-gray-500 mt-2">Reported total revenue from the dashboard endpoint.</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-3">Top Contractors</h3>
            {loading ? <div>Loading...</div> : (
              <div className="space-y-2">
                {(data?.maintenance?.contractorStats || []).map((c:any) => (
                  <div key={c.contractor_id || c.contractorId || c.contractorId} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{c.name || c.contractor_id || c.contractorId}</div>
                      <div className="text-xs text-gray-500">Completed: {c.completedOrders ?? c.completedJobs ?? c.completedJobs ?? 0}</div>
                    </div>
                    <div className="text-sm text-indigo-600">avg: {c.avgCost ?? c.avg_cost ?? 0}</div>
                  </div>
                ))}
                {(!(data?.maintenance?.contractorStats) || (data.maintenance.contractorStats && data.maintenance.contractorStats.length === 0)) && <div className="text-sm text-gray-500">No contractor data</div>}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Raw response (from /reports/dashboard)</h3>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto" style={{ maxHeight: 360 }}>
            <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(data || { message: 'No data yet' }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
