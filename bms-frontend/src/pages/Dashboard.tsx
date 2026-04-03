import React, { useEffect, useState } from 'react'
import { getDashboard, getFinancialTrend } from '../api/reports'
import { getAuditLogs } from '../api/audit'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { getRoles } from '../utils/jwt'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { FileSignature, Wrench, UserCheck, ChevronRight, HelpCircle, Activity, ShieldAlert, ArrowUpRight, ArrowDownRight, Droplets } from 'lucide-react'



export default function Dashboard() {
  const toast = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [revenueTrend, setRevenueTrend] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [dashboardData, trendData, auditLogs] = await Promise.all([
          getDashboard(),
          getFinancialTrend(),
          getAuditLogs()
        ])
        
        setData(dashboardData)
        setRevenueTrend(trendData || [])
        
        // Map audit logs to activity feed format
        const mappedActivities = (auditLogs || []).slice(0, 10).map((log: any) => {
          const isCritical = log.action === 'DELETE' || log.action?.includes('CRITICAL');
          const timeLabel = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return {
            id: log.id,
            type: log.module?.toLowerCase() || 'system',
            title: `${log.action} ${log.module || 'System'}`,
            time: timeLabel,
            subtitle: log.user?.name || 'Admin',
            isCritical
          }
        })
        setActivities(mappedActivities)

      } catch (e) {
        console.error('dashboard-fetch', e)
        toast.addToast('Failed to load real-time intelligence', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Data mapping for charts
  const occupancyRate = loading ? 0 : Number(data?.occupancy_rate || 0).toFixed(1)
  const occupancyData = [
    { name: 'Occupied Units', value: data?.occupied_leases || 0, color: '#4f46e5' },
    { name: 'Vacant Units', value: Math.max(0, (data?.total_units || 0) - (data?.occupied_leases || 0)), color: '#e2e8f0' }
  ]

  // Dynamic revenue chart data from backend
  const revenueData = loading ? [] : revenueTrend.map((t: any) => ({
    month: t.month.split('-')[1] || t.month, // Convert YYYY-MM to MM or keep as is
    value: t.total
  }))

  const finalRevenueData = revenueData.length > 0 ? revenueData : [
    { month: 'N/A', value: 0 }
  ]

  const formatMoney = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M ETB`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k ETB`
    return `${val} ETB`
  }

  return (
    <PageLayout
      title="Portfolio Intelligence"
      subtitle="Real-time telemetry for the North-East Commercial District."
      actions={
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
            <FileSignature size={16} className="text-indigo-600" /> Lease
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Wrench size={16} className="text-amber-600" /> Request
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-semibold text-slate-700 dark:text-slate-200">
            <UserCheck size={16} className="text-emerald-600" /> Check-in
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Content Area (Left 3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Occupancy Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Occupancy Rate</span>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <h3 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{occupancyRate}</h3>
                <span className="text-2xl font-bold text-slate-500">%</span>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <ArrowUpRight size={16} />
                <span>+2.1% <span className="text-slate-400 font-medium">vs last month</span></span>
              </div>
            </div>

            {/* Revenue Highlights Card - Gradient */}
            <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg relative overflow-hidden group hover:shadow-indigo-600/30 transition-all text-white">
              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-bold tracking-widest text-white/70 uppercase">Revenue (ETB)</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-4xl font-extrabold tracking-tight leading-none">
                    {loading ? '...' : (
                      data?.total_revenue >= 1000000 
                        ? (data.total_revenue / 1000000).toFixed(2) + 'M' 
                        : (data?.total_revenue >= 1000 
                          ? (data.total_revenue / 1000).toFixed(1) + 'K' 
                          : data?.total_revenue || 0)
                    )}
                  </h3>
                  <span className="text-lg font-bold text-white/70 tracking-wider">ETB</span>
                </div>
                <div className="mt-6 flex items-center justify-between text-[11px] font-bold tracking-widest text-white/80 uppercase">
                  <span>Projected Monthly Target</span>
                </div>
              </div>
            </div>

            {/* Vertical Stack (Active Leases & Pending Maint) */}
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between flex-1 group hover:shadow-md transition-all">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1">Active Leases</span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                    {loading ? '-' : (data?.occupied_leases ?? 0)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between flex-1 group hover:shadow-md transition-all">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-1">Pending Maint.</span>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none text-rose-600">
                    {loading ? '-' : (data?.pending_maintenance_count || 0)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wrench className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue Dynamics Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Revenue<br/>Dynamics</h3>
                <button className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  Last 6 Months <ChevronRight size={14} />
                </button>
              </div>
              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalRevenueData} barSize={32}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                      dy={10} 
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 6, 6]}
                    >
                      {finalRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === finalRevenueData.length -1 ? '#4f46e5' : '#e0e7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Allocation Donut */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-4">Asset Allocation</h3>
              <div className="flex-1 min-h-[160px] relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{occupancyRate}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Filled</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Occupied Units</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Vacant Units</span>
                </div>
              </div>
            </div>

          </div>

          {/* Hardware/Telemetry Visual Preview Map placeholder */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden relative h-48 border border-slate-800 shadow-inner group">
            {/* A subtle image background to simulate remote camera or interactive map */}
            <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            
            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
              <div className="flex justify-between items-start">
                <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live System Camera</span>
                </div>
                <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <HelpCircle size={14} className="text-white" />
                </button>
              </div>

              {/* Fake overlays (HVAC point) */}
              <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 cursor-pointer group/pin">
                <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg shadow-indigo-600/50 opacity-0 group-hover/pin:opacity-100 transition-opacity duration-300 whitespace-nowrap -translate-y-2 group-hover/pin:-translate-y-4">
                  HVAC Primary Node
                </div>
                <div className="w-8 h-8 bg-indigo-600/20 backdrop-blur-sm border-2 border-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center gap-2 cursor-pointer group/pin">
                <div className="w-8 h-8 bg-amber-500/20 backdrop-blur-sm border-2 border-amber-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg shadow-amber-500/50 opacity-0 group-hover/pin:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Elevator Bank B
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Activity Pulse */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Activity<br/>Pulse</h3>
            <button 
              onClick={() => window.location.href = '/login-history'}
              className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          <div className="flex-1 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-2.5 top-2 bottom-0 w-px bg-slate-100 dark:bg-slate-700 line"></div>

            <div className="space-y-6 relative">
              {activities.length > 0 ? activities.map((act) => (
                <div key={act.id} className="relative flex gap-4 pr-2">
                  {/* Timeline Node */}
                  <div className={`w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-800 flex-shrink-0 z-10 ${act.isCritical ? 'bg-rose-500' : 'bg-indigo-600'}`}></div>
                  
                  {/* Content */}
                  <div className="-mt-1 flex-1">
                    <h4 className={`text-sm font-bold ${act.isCritical ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {act.title}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{act.time} • {act.subtitle}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Settings Card at bottom of sidebar */}
          <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-slate-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=Admin+Manager&background=random`} alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Admin Manager</h4>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Property Admin</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-slate-500 gap-2">
              <ShieldAlert size={14} className="text-slate-400" /> Settings
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  )
}
