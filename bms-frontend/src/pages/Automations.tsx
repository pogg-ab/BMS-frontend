import React, { useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as automationsApi from '../api/automations'
import { Play, CheckCircle, XCircle, Clock, Calendar, Zap, Bell, CreditCard, ChevronRight, Activity, Terminal } from 'lucide-react'

const JOBS = [
  { 
    name: 'lease-expiry', 
    label: 'Lease Expiry Scanner', 
    description: 'Notifies tenants whose leases are expiring in 30, 14, or 7 days.', 
    icon: Bell,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    schedule: 'Daily @ 1:00 AM'
  },
  { 
    name: 'payment-deadline', 
    label: 'Payment Deadline Scanner', 
    description: 'Sends reminders for invoices due in 5 days and marks overdue invoices.', 
    icon: CreditCard,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    schedule: 'Daily @ 1:00 AM'
  },
  { 
    name: 'utility-sync', 
    label: 'Monthly Utility Sync', 
    description: 'Processes unbilled meter readings and prepares them for invoicing.', 
    icon: Zap,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    schedule: 'Monthly @ Day 25'
  },
]

export default function Automations() {
  const toast = useToast()
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})

  async function handleRunJob(jobName: string) {
    setRunning(jobName)
    try {
      const data = await automationsApi.runJob(jobName)
      setResults(prev => ({ 
        ...prev, 
        [jobName]: { success: true, data, time: new Date().toLocaleTimeString() } 
      }))
      toast.addToast(`Job "${jobName}" completed successfully`, 'success')
    } catch (e: any) {
      setResults(prev => ({ 
        ...prev, 
        [jobName]: { success: false, error: e?.response?.data?.message || e.message, time: new Date().toLocaleTimeString() } 
      }))
      toast.addToast(e?.response?.data?.message || `Job "${jobName}" failed`, 'error')
    } finally { setRunning(null) }
  }

  return (
    <PageLayout 
      title="System Automations" 
      subtitle="Monitor and manage background tasks, scanners, and scheduled operations."
    >
      <div className="space-y-8 pb-10">
        
        {/* Active Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-indigo-500" /> Operational Jobs
            </h3>
            {JOBS.map(job => {
              const Icon = job.icon
              const result = results[job.name]
              const isRunning = running === job.name

              return (
                <div key={job.name} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${job.bgColor} flex items-center justify-center ${job.color} shadow-sm border border-black/5`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{job.label}</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{job.description}</p>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={12} /> {job.schedule}
                          </div>
                          {result && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${result.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {result.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {result.success ? 'Last Success' : 'Last Error'} @ {result.time}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRunJob(job.name)}
                      disabled={isRunning}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${
                        isRunning 
                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-400' 
                        : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:scale-105 active:scale-95 shadow-lg'
                      }`}
                    >
                      {isRunning ? (
                        <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <Play size={14} fill="currentColor" />
                      )}
                      {isRunning ? 'Running' : 'Trigger'}
                    </button>
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
            <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl h-[480px] flex flex-col border border-white/5">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Job Output Log</span>
                </div>
                <button 
                  onClick={() => setResults({})}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                >
                  CLEAR LOG
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 font-mono text-xs">
                {Object.keys(results).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                    <Terminal size={48} className="mb-4" />
                    <p>SYSTEM READY.</p>
                    <p className="mt-1 font-sans font-bold uppercase tracking-widest">Awaiting execution...</p>
                  </div>
                ) : (
                  Object.entries(results).map(([job, res], idx) => (
                    <div key={idx} className="space-y-2 border-l-2 border-white/5 pl-4 py-1">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-bold">[{res.time}] EXECUTE: {job}</span>
                        <span className={res.success ? 'text-emerald-400' : 'text-rose-400'}>
                          {res.success ? 'EXIT CODE 0' : 'EXIT CODE 1'}
                        </span>
                      </div>
                      <div className="text-slate-400 bg-white/5 p-3 rounded-lg overflow-x-auto whitespace-pre">
                        {res.success 
                          ? JSON.stringify(res.data, null, 2) 
                          : `Error: ${res.error}`
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Summary Section */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Job Scheduler</h3>
               <p className="text-sm text-slate-500 font-medium">Automatic cron schedule configured for this environment.</p>
             </div>
             <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2">
               <Calendar size={14} className="text-indigo-500" />
               <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">UTC Timezone</span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">01:00 AM UTC</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">Lease Scanning & Reminders</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">
                 <CheckCircle size={10} /> NEXT RUN IN ~12H
               </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">03:00 AM UTC</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">Daily Payment Recon</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit">
                 <CheckCircle size={10} /> NEXT RUN IN ~14H
               </div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">25th @ Monthly</h4>
               <p className="text-sm font-bold text-slate-800 dark:text-white">Utilities Invoicing Cycle</p>
               <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full w-fit">
                 <Clock size={10} /> WAITING FOR CYCLE
               </div>
             </div>
           </div>
        </div>

      </div>
    </PageLayout>
  )
}
