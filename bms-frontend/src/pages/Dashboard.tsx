import React, { useEffect, useState } from 'react'
import { logout } from '../auth/auth'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { getDashboard } from '../api/reports'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Building2, Wallet, Wrench, ArrowUpRight, TrendingUp } from 'lucide-react'

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
    return <span>ETB {Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  }

  // Data mapping for charts
  const occupancyData = data ? [
    { name: 'Occupied', value: data.occupied_leases ?? 0, color: '#4f46e5' }, // indigo-600
    { name: 'Vacant', value: (data.total_units ?? 0) - (data.occupied_leases ?? 0), color: '#e2e8f0' } // slate-200
  ] : []

  const contractorData = data?.maintenance?.contractorStats?.map((c: any) => ({
    name: c.name || c.contractor_id || 'Unknown',
    completed: c.completedOrders ?? c.completedJobs ?? 0,
    avgCost: parseFloat(c.avgCost ?? c.avg_cost ?? 0)
  })) || []

  // Custom tooltips
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700">
          <p className="font-semibold">{`${payload[0].name}: ${payload[0].value} Units`}</p>
        </div>
      );
    }
    return null;
  }

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-200 dark:border-slate-700/60">
          <p className="font-bold text-sm mb-1">{label}</p>
          <p className="text-indigo-600 font-medium">{`Jobs Completed: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <PageLayout
      title="Dashboard Overview"
      subtitle="Real-time insights and portfolio performance"
    >
      <div className="space-y-6">

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex items-start justify-between group hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Occupancy Rate</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {loading ? '—' : `${data?.occupancy_rate ?? 0}%`}
              </h3>
              <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <ArrowUpRight size={14} />
                {loading ? '' : `${data?.occupied_leases ?? 0} of ${data?.total_units ?? 0} Units`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <Building2 size={24} />
            </div>
          </div>

          {/* Box 2 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex items-start justify-between group hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {loading ? '—' : <Money v={data?.total_revenue} />}
              </h3>
              <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> MTD Analytics
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <Wallet size={24} />
            </div>
          </div>

          {/* Box 3 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex items-start justify-between group hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Avg Resolution Time</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {loading ? '—' : `${data?.maintenance?.avgResolutionTime ?? 0} hrs`}
              </h3>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Active Contractors: {loading ? '—' : (data?.maintenance?.contractorStats?.length ?? 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <Wrench size={24} />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Occupancy Donut Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Portfolio Occupancy</h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">Loading charts...</div>
            ) : (
              <div className="flex-1 min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{data?.occupancy_rate ?? 0}%</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Filled</span>
                </div>
              </div>
            )}
          </div>

          {/* Contractor Performance Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Contractors by Jobs Completed</h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">Loading charts...</div>
            ) : (
              <div className="flex-1 min-h-[250px]">
                {contractorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contractorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">No contractor data available.</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
