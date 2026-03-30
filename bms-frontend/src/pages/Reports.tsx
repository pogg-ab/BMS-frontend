import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { getDashboard, getFinancial, getOccupancy } from '../api/reports'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, DollarSign, Home, ArrowUpRight, ArrowDownRight, Calendar, PieChart, Download, Filter } from 'lucide-react'

function Money({ value }: { value: number }) {
  return <span className="font-bold">ETB {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      toast.addToast('Failed to load analytical reports', 'error')
    } finally { setLoading(false) }
  }

  return (
    <PageLayout 
      title="Intelligence Reports" 
      subtitle="Comprehensive overview of portfolio performance, financial health, and occupancy trends."
      actions={
        <div className="flex items-center gap-3">
          <button className="button-secondary text-xs font-bold gap-2">
            <Download size={14} /> Export XLS
          </button>
          <Link 
            to="/analytics" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <PieChart size={18} />
            Advanced Analytics
          </Link>
        </div>
      }
    >
      <div className="space-y-8 pb-20">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+2.4%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy Rate</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : (dashboard?.occupancy_rate ?? '0')}%
            </h4>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : <Money value={dashboard?.total_revenue ?? 0} />}
            </h4>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Home size={20} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Units</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : (dashboard?.total_units ?? '0')}
            </h4>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Users size={20} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Leases</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : (dashboard?.occupied_leases ?? '0')}
            </h4>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Financials Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Momentum</h3>
                  <p className="text-sm text-slate-500 font-medium">Monthly collection trends across the last 12-month cycle.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Target met</span>
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><div className="w-6 h-6 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /></div>
              ) : financial.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">No financial history available yet.</div>
              ) : (
                <div className="space-y-5">
                  {financial.map((m:any) => {
                    const max = financial[0]?.total || 1
                    const pct = Math.min(100, (m.total || 0) / max * 100)
                    return (
                      <div key={m.month} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{m.month}</span>
                           <span className="text-xs font-black text-slate-900 dark:text-white"><Money value={m.total || 0} /></span>
                        </div>
                        <div className="h-2 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }} 
                            className="h-full bg-indigo-500 rounded-full group-hover:bg-indigo-400 transition-all duration-700" 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Occupancy Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Occupancy Insights</h3>
               {loading && !occupancy ? (
                 <div className="py-10 flex justify-center"><div className="w-6 h-6 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /></div>
               ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vacant Units</p>
                         <h5 className="text-xl font-black text-rose-500">{occupancy?.vacant_units ?? '0'}</h5>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expiring Soon</p>
                         <h5 className="text-xl font-black text-amber-500">{occupancy?.expiring_soon ?? '0'}</h5>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active Tenure Distribution</h4>
                       {/* Mock distribution */}
                       <div className="space-y-4">
                         <div className="flex items-center justify-between text-xs font-medium">
                           <span className="text-slate-500">Long-term (1YR+)</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300">62%</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[62%]" />
                         </div>
                         <div className="flex items-center justify-between text-xs font-medium">
                           <span className="text-slate-500">Standard (6-12M)</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300">28%</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[28%]" />
                         </div>
                         <div className="flex items-center justify-between text-xs font-medium">
                           <span className="text-slate-500">Short-term/Rolling</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300">10%</span>
                         </div>
                         <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[10%]" />
                         </div>
                       </div>
                    </div>
                  </div>
               )}
            </div>

            <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><PieChart size={120} /></div>
               <div className="relative z-10">
                 <h4 className="text-xl font-black leading-tight mb-2">Portfolio Analytics<br />at your fingertips</h4>
                 <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Unlock deeper insights into tenant behavior and regional growth trends.</p>
                 <Link to="/analytics" className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-black/10 hover:scale-105 transition-all">
                   UPGRADE VIEW <ArrowUpRight size={14} />
                 </Link>
               </div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}
