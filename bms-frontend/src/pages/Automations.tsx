import React, { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as automationsApi from '../api/automations'
import { 
  Play, CheckCircle, XCircle, Clock, Calendar, Zap, Bell, 
  CreditCard, ChevronRight, Activity, Terminal, Power,
  RefreshCw, History, ShieldAlert
} from 'lucide-react'

// Icon Mapping for dynamic jobs
const JOB_META: Record<string, any> = {
  'lease-expiry': { 
    icon: Bell, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-50', 
    darkBg: 'dark:bg-amber-900/20' 
  },
  'payment-deadline': { 
    icon: CreditCard, 
    color: 'text-indigo-500', 
    bgColor: 'bg-indigo-50', 
    darkBg: 'dark:bg-indigo-900/20' 
  },
  'utility-sync': { 
    icon: Zap, 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-50', 
    darkBg: 'dark:bg-emerald-900/20' 
  }
}

const DEFAULT_META = { 
  icon: Activity, 
  color: 'text-slate-500', 
  bgColor: 'bg-slate-50', 
  darkBg: 'dark:bg-slate-900/20' 
}

export default function Automations() {
  const toast = useToast()
  const [jobs, setJobs] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [jobsData, logsData] = await Promise.all([
        automationsApi.getJobStatuses(),
        automationsApi.getLogs()
      ])
      setJobs(jobsData)
      setLogs(logsData)
    } catch (e: any) {
      toast.addToast('Failed to fetch automation data', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRunJob(jobName: string) {
    setRunning(jobName)
    try {
      const data = await automationsApi.runJob(jobName)
      toast.addToast(`Job "${jobName}" triggered successfully`, 'success')
      // Refresh logs after a short delay to see the result
      setTimeout(fetchData, 1000)
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || `Job "${jobName}" failed to start`, 'error')
    } finally {
      setRunning(null)
    }
  }

  async function handleToggleJob(jobName: string, currentEnabled: boolean) {
    setToggling(jobName)
    try {
      if (currentEnabled) {
        await automationsApi.disableJob(jobName)
        toast.addToast(`Job "${jobName}" disabled`, 'warning')
      } else {
        await automationsApi.enableJob(jobName)
        toast.addToast(`Job "${jobName}" enabled`, 'success')
      }
      await fetchData()
    } catch (e) {
      toast.addToast('Failed to update job status', 'error')
    } finally {
      setToggling(null)
    }
  }

  return (
    <PageLayout 
      title="System Automations" 
      subtitle="Monitor and manage background tasks, scanners, and scheduled operations."
    >
      <div className="space-y-8 pb-10">
        
        {/* Header Actions */}
        <div className="flex justify-end">
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Status
          </button>
        </div>

        {/* Active Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" /> Operational Jobs
            </h3>
            
            {loading && jobs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Job Configurations...</p>
              </div>
            ) : jobs.map(job => {
              const meta = JOB_META[job.name] || DEFAULT_META
              const Icon = meta.icon
              const isRunning = running === job.name
              const isToggling = toggling === job.name

              return (
                <div key={job.name} className={`bg-white dark:bg-slate-800 rounded-3xl border ${job.is_enabled ? 'border-slate-100 dark:border-slate-700' : 'border-rose-100 dark:border-rose-900/30'} p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
                  {!job.is_enabled && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-[8px] font-black text-white uppercase tracking-[0.2em] rounded-bl-xl shadow-lg flex items-center gap-1">
                      <ShieldAlert size={10} /> Paused
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${job.is_enabled ? meta.bgColor + ' ' + meta.darkBg : 'bg-slate-100 dark:bg-slate-900'} flex items-center justify-center ${job.is_enabled ? meta.color : 'text-slate-400'} shadow-sm border border-black/5`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${job.is_enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'} text-lg`}>{job.label}</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{job.description}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={12} /> {job.schedule}
                          </div>
                          {job.last_run_at && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <History size={12} /> Last Run: {new Date(job.last_run_at).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       {/* Toggle Switch */}
                       <button
                         onClick={() => handleToggleJob(job.name, job.is_enabled)}
                         disabled={isToggling}
                         className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${
                           job.is_enabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
                         } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                       >
                         <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-all ${
                           job.is_enabled ? 'translate-x-6' : 'translate-x-0'
                         } flex items-center justify-center`}>
                           {isToggling && <div className="w-2 h-2 border border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />}
                         </div>
                       </button>

                       {/* Trigger Button */}
                       <button
                         onClick={() => handleRunJob(job.name)}
                         disabled={isRunning || !job.is_enabled}
                         className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                           isRunning || !job.is_enabled
                           ? 'bg-slate-100 dark:bg-slate-800 text-slate-300' 
                           : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:scale-105 active:scale-95 shadow-lg'
                         }`}
                         title="Run Now"
                       >
                         {isRunning ? (
                           <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                         ) : (
                           <Play size={14} fill="currentColor" />
                         )}
                       </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Console / History Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={16} className="text-emerald-500" /> Automation Console
            </h3>
            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl h-[520px] flex flex-col border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Execution History (3 Months)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest animate-pulse">Live Feed</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[11px] custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <Terminal size={48} className="mb-4" />
                    <p>SYSTEM READY.</p>
                    <p className="mt-1 font-sans font-bold uppercase tracking-widest">No logs found in history.</p>
                  </div>
                ) : (
                  logs.map((log, idx) => {
                    const isSuccess = log.status === 'SUCCESS'
                    return (
                      <div key={log.id} className="space-y-2 border-l-2 border-white/5 pl-4 py-1">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-400 font-bold text-[10px]">
                            [{new Date(log.executed_at).toLocaleString()}] {log.job_name.toUpperCase()}
                          </span>
                          <span className={isSuccess ? 'text-emerald-400' : 'text-rose-400'}>
                            {isSuccess ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="text-slate-400 bg-white/5 p-3 rounded-lg overflow-x-auto whitespace-pre font-mono leading-relaxed border border-white/5">
                          {isSuccess 
                            ? JSON.stringify(log.result, null, 2) 
                            : `Error-Stack: ${log.error}`
                          }
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Summary Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Log Retention Policy</h3>
                <p className="text-sm text-slate-500 font-medium">Automatic data management for system observability.</p>
             </div>
             <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Retention: 3 Months</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Daily Backup</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">In-database log storage</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">
                 <CheckCircle size={10} /> SYSTEM NOMINAL
               </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cleanup Job</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">Runs Daily @ 2:00 AM</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full w-fit">
                 <Power size={10} /> ACTIVE
               </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Purge Strategy</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">Rolling 90-day window</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full w-fit">
                 <History size={10} /> DATA SAFE
               </div>
             </div>
           </div>
        </div>

      </div>
    </PageLayout>
  )
}
