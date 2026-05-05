import React, { useEffect, useState } from 'react'
import { getLoginHistory } from '../auth/auth'
import PageLayout from '../components/PageLayout'
import { Clock, Shield, Globe, Monitor, CheckCircle2, XCircle } from 'lucide-react'

export default function LoginHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getLoginHistory()
      .then((h) => { if (mounted) setHistory(Array.isArray(h) ? h : []) })
      .catch((e: any) => { if (mounted) setError(e?.response?.data?.message || 'Failed to load login history') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <PageLayout 
      title="Login History" 
      subtitle="Track recent account access and security activity."
    >
      <div className="space-y-6 pb-10">
        {error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-6 rounded-2xl text-rose-600 dark:text-rose-400 text-center">
            {error}
          </div>
        ) : loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
        ) : history.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Shield size={48} className="mb-4 opacity-50" />
            <p className="font-bold text-lg">No history found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">When</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Device / Browser</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {history.map((h, idx) => {
                    const dateStr = h.login_time || h.loginTime || h.createdAt || h.when || h.timestamp || null
                    const date = dateStr ? new Date(dateStr) : null
                    const when = date && !isNaN(date.getTime()) ? date.toLocaleString() : (dateStr || '-')
                    const ip = h.ip_address || h.ipAddress || h.ip || '-'
                    const device = h.userAgent || h.device || '-' 
                    const success = (typeof h.success !== 'undefined') ? !!h.success : (typeof h.successful !== 'undefined' ? !!h.successful : true)
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Clock size={14} className="text-slate-400" />
                            {when}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Globe size={14} className="text-slate-400" />
                            {ip}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500 max-w-xs truncate">
                            <Monitor size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate" title={device}>{device}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {success ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                              <XCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">{h.id || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
