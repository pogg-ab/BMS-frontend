import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as qrApi from '../api/qr'
import { listUnits } from '../api/units'
import { listBuildings } from '../api/buildings'
import { QrCode, TrendingUp, Settings2, Download, Trash2, CheckCircle2, XCircle, Search, Home, Building2, ExternalLink, Activity, Info, BarChart3, Plus, Building } from 'lucide-react'

type Tab = 'manage' | 'analytics'

export default function QR() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('manage')

  // Lookups
  const [units, setUnits] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [issueMode, setIssueMode] = useState<'unit' | 'building'>('unit')

  // Generate
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<any>(null)

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dynamicStats, setDynamicStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])

  // Selected for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUnits()
    loadBuildings()
    loadAnalytics()
  }, [])

  async function loadUnits() {
    try {
      const u: any = await listUnits({ page: 1, per_page: 500 })
      const ul = Array.isArray(u) ? u : (u?.data || [])
      setUnits(ul)
    } catch (e: any) { console.error('load units', e) }
  }

  async function loadBuildings() {
    try {
      const b: any = await listBuildings({ page: 1, per_page: 500 })
      const bl = Array.isArray(b) ? b : (b?.data || [])
      setBuildings(bl)
    } catch (e: any) { console.error('load buildings', e) }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const [data, s, l] = await Promise.all([
        qrApi.getAnalytics(100),
        qrApi.getStats(),
        qrApi.getLogs(10)
      ])
      setAnalyticsData(Array.isArray(data) ? data : [])
      setDynamicStats(s)
      setLogs(l)
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load QR deployment data', 'error')
    } finally { setAnalyticsLoading(false) }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (issueMode === 'unit' && !selectedUnitId) { toast.addToast('Please select a target unit', 'error'); return }
    if (issueMode === 'building' && !selectedBuildingId) { toast.addToast('Please select a target building', 'error'); return }
    
    setGenerating(true)
    try {
      const data = issueMode === 'unit' 
        ? await qrApi.generateQr(selectedUnitId)
        : await qrApi.generateBuildingQr(selectedBuildingId)
      
      setLastGenerated(data)
      toast.addToast(`${issueMode === 'unit' ? 'Unit' : 'Building'} QR generated`, 'success')
      loadAnalytics()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Generation failed', 'error')
    } finally { setGenerating(false) }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this QR code? Access will be revoked.')) return
    try {
      await qrApi.deactivateQr(id)
      toast.addToast('QR access revoked', 'success')
      loadAnalytics()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Revocation failed', 'error')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleExportPdf() {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined
    const url = qrApi.getExportPdfUrl(ids)
    window.open(url, '_blank')
  }

  const filteredData = analyticsData.filter(qr => 
    !searchQuery || 
    qr.token?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qr.unit_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qr.building?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const summary = {
    total: analyticsData.length,
    active: analyticsData.filter(q => q.status === 'active').length,
    scans: analyticsData.reduce((s, q) => s + (q.scan_count || 0), 0)
  }

  return (
    <PageLayout 
      title="QR Deployment" 
      subtitle="Issue and track high-security digital twin QR codes for physical unit access and reporting."
      actions={
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setTab('manage')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'manage' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Management
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'analytics' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Analytics
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10">
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued Tokens</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{dynamicStats ? dynamicStats.totalScans : analyticsData.length}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Links</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{summary.active}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Scanning Traffic</p>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{dynamicStats ? dynamicStats.totalScans : summary.scans}</h4>
            </div>
          </div>
        </div>

        {tab === 'manage' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Issuance Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" /> Token Issuance
                </h3>
                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => setIssueMode('unit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${issueMode === 'unit' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Home size={12} /> Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueMode('building')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${issueMode === 'building' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Building size={12} /> Building
                  </button>
                </div>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Target {issueMode === 'unit' ? 'Unit' : 'Building'}
                    </label>
                    <div className="relative">
                      {issueMode === 'unit' ? (
                        <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      ) : (
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      )}
                      <select
                        value={issueMode === 'unit' ? selectedUnitId : selectedBuildingId}
                        onChange={e => issueMode === 'unit' ? setSelectedUnitId(e.target.value) : setSelectedBuildingId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select a {issueMode === 'unit' ? 'unit' : 'building'}...</option>
                        {issueMode === 'unit' ? (
                          units.map((u: any) => (
                            <option key={u.id} value={String(u.id)}>Unit {u.unit_number || u.id}</option>
                          ))
                        ) : (
                          buildings.map((b: any) => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full button shadow-lg shadow-indigo-600/20 py-3"
                  >
                    {generating ? 'Generating Link...' : 'Issue Access Code'}
                  </button>
                </form>
              </div>

              {/* Preview Section */}
              <div className={`bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm transition-all duration-500 ${lastGenerated ? 'opacity-100 scale-100' : 'opacity-50'}`}>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <QrCode size={18} className="text-indigo-600" /> Issuance Receipt
                </h3>
                <div className="flex flex-col items-center">
                  <div className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center p-6 mb-6">
                    {lastGenerated?.token ? (
                      <img
                        src={qrApi.getQrPngUrl(lastGenerated.token)}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-300">
                        <QrCode size={64} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Command</p>
                      </div>
                    )}
                  </div>
                  {lastGenerated && (
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token ID</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{lastGenerated.token}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deployed Fleet</h3>
                    <p className="text-sm text-slate-500 font-medium">Overview of all active and historical access tokens.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Filter tokens..." 
                        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm w-48 focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                    </div>
                    <button
                      onClick={handleExportPdf}
                      className="button-secondary text-xs font-bold gap-2 py-2"
                    >
                      <Download size={14} /> Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
                    </button>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="py-20 flex justify-center"><div className="w-6 h-6 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /></div>
                ) : filteredData.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 italic text-sm">No tokens matched your search.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredData.map((qr) => (
                      <div key={qr.id} className="group flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                           <input 
                            type="checkbox" 
                            checked={selectedIds.has(qr.id)} 
                            onChange={() => toggleSelect(qr.id)}
                            className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                           />
                           <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700">
                             <QrCode size={20} />
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{qr.token}</span>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                 qr.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                               }`}>
                                 {qr.status}
                               </span>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                                 qr.unit_id ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                               }`}>
                                 {qr.unit_id ? 'UNIT' : 'BLDG'}
                               </span>
                             </div>
                             <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                               <div className="flex items-center gap-1"><Home size={10} /> {qr.unit_number || '-'}</div>
                               <div className="flex items-center gap-1"><Building2 size={10} /> {qr.building || '-'}</div>
                             </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{qr.scan_count || 0}</div>
                             <div className="text-[10px] font-bold text-slate-400">SCANS</div>
                           </div>
                           {qr.status === 'active' && (
                             <button onClick={() => handleDeactivate(qr.id)} className="p-2 text-slate-300 hover:text-rose-500 bg-white hover:bg-rose-50 rounded-xl shadow-sm transition-all">
                               <Trash2 size={16} />
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Trail Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" /> Recent Activity Audit
                </h3>
                <div className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 italic text-sm">No recent scanning activity recorded.</div>
                  ) : (
                    logs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-4">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                             <CheckCircle2 size={16} />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                               Scan detected for <span className="text-indigo-600 font-mono">{log.qr?.token || 'Unknown'}</span>
                             </p>
                             <p className="text-[10px] text-slate-400 font-medium">
                               {log.device_type} • {log.ip_address}
                             </p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             {new Date(log.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                           <p className="text-[9px] text-slate-300">
                             {new Date(log.scanned_at).toLocaleDateString()}
                           </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Scan Velocity Chart Placeholder */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 size={20} className="text-indigo-500" /> Scanning Velocity
                    </h3>
                    <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">LAST 30 DAYS</div>
                 </div>
                 <div className="h-64 flex items-end gap-1.5 pt-4">
                    {(dynamicStats?.timeSeries || [34, 45, 23, 56, 78, 45, 34, 23, 67, 89, 45, 34, 56, 23, 45, 67, 89, 34, 23, 56]).map((day: any, i: number) => {
                      const count = day.count ?? day
                      const max = dynamicStats?.timeSeries ? Math.max(...dynamicStats.timeSeries.map((d: any) => d.count), 1) : 100
                      const h = (count / max) * 100
                      return (
                        <div 
                          key={i} 
                          className="flex-1 bg-indigo-500/10 rounded-t-sm relative group"
                          style={{ height: `${h}%` }}
                        >
                          <div className="absolute inset-0 bg-indigo-500 opacity-20 group-hover:opacity-100 transition-all rounded-t-sm" />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {day.day || `Day ${i}`}: {count}
                          </div>
                        </div>
                      )
                    })}
                 </div>
                 <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>30 Days Ago</span>
                   <span>Today (LIVE)</span>
                 </div>
               </div>

               {/* Top Performers */}
               <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                   <TrendingUp size={20} className="text-amber-500" /> Viral Access Points
                 </h3>
                 <div className="space-y-4">
                    {[...analyticsData]
                      .sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0))
                      .slice(0, 5)
                      .map((qr, i) => (
                        <div key={qr.id} className="flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4 flex-1">
                             <div className="text-lg font-black text-slate-200 w-6">#{i + 1}</div>
                             <div className="bg-slate-50 dark:bg-slate-900 w-full rounded-2xl p-3 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                               <div>
                                 <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit {qr.unit_number || 'N/A'}</div>
                                 <div className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{qr.building || 'General Portfolio'}</div>
                               </div>
                               <div className="text-xs font-black text-indigo-600">{qr.scan_count || 0} SQ.</div>
                             </div>
                           </div>
                           <ExternalLink size={14} className="text-slate-300" />
                        </div>
                      ))}
                 </div>
               </div>
            </div>

            {/* Geographic Distribution Mockup */}
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200')] bg-cover bg-center" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                 <div className="md:w-1/3 text-center md:text-left">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-6 mx-auto md:mx-0 shadow-lg">
                     <BarChart3 size={24} />
                   </div>
                   <h3 className="text-2xl font-black text-white leading-tight mb-4 uppercase tracking-tighter">Strategic<br />Pulse Map</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">Geographic heatmaps of scanning activity allow security teams to monitor physical presence across diverse sites in real-time.</p>
                 </div>
                 <div className="flex-1 w-full grid grid-cols-2 gap-4">
                       <div className="backdrop-blur-md rounded-2xl p-6 border border-white/5 bg-indigo-500/10">
                          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Unique Scans</h4>
                          <p className="text-lg font-bold text-white">{dynamicStats?.uniqueScans || 0}</p>
                          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(dynamicStats?.uniqueScans / (dynamicStats?.totalScans || 1)) * 100}%` }} />
                          </div>
                       </div>
                       <div className="backdrop-blur-md rounded-2xl p-6 border border-white/5 bg-rose-500/10">
                          <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Total Audit Trail</h4>
                          <p className="text-lg font-bold text-white">{dynamicStats?.totalScans || 0} events</p>
                       </div>
                       <div className="backdrop-blur-md rounded-2xl p-6 border border-white/5 bg-emerald-500/10">
                          <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Mobile Traffic</h4>
                          <p className="text-lg font-bold text-white">
                            {dynamicStats?.devices?.find((d: any) => d.label === 'Mobile')?.value || 0}
                          </p>
                       </div>
                       <div className="backdrop-blur-md rounded-2xl p-6 border border-white/5 bg-amber-500/10">
                          <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Conversion</h4>
                          <p className="text-lg font-bold text-white">High</p>
                       </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
