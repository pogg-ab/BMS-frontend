import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import { 
  getDashboard, 
  getFinancial, 
  getOccupancy, 
  getPeopleReport, 
  getLeaseReport, 
  getPropertyReport, 
  getOverdueDetails, 
  getDetailedFinancials,
  getFinanceAnalytics,
  getPropertyAnalytics,
  getLeaseAnalytics,
  getPeopleAnalytics,
  getInvoiceStatusBreakdown,
  getCollectionRateTrend,
  getTenantPaymentHistory
} from '../api/reports'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, DollarSign, ShieldCheck, ClipboardList, Search,
  TrendingUp, Users, Home, 
  ArrowUpRight, Calendar, PieChart as PieIcon, 
  Download, Activity, ShieldAlert, 
  UserCheck, Briefcase, FileText
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, 
  Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { downloadReport } from '../utils/export'
import ScheduleReportModal from '../components/ScheduleReportModal'
import { getRoles } from '../utils/jwt'
import { listSites } from '../api/sites'
import { listOwners } from '../api/owners'

function Money({ value }: { value: number }) {
  return <span className="font-bold">ETB {Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
}

type TabType = 'overview' | 'finance' | 'property' | 'people' | 'leases' | 'overdue'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const toast = useToast()
  
  const userRoles = getRoles()
  const isFinanceOnly = userRoles.includes('finance') && !userRoles.includes('super_admin') && !userRoles.includes('admin')
  
  const [activeTab, setActiveTab] = useState<TabType>(isFinanceOnly ? 'finance' : 'overview')
  const [loading, setLoading] = useState(true)
  
  // Data States
  const [dashboard, setDashboard] = useState<any>(null)
  const [financial, setFinancial] = useState<any[]>([])
  const [occupancy, setOccupancy] = useState<any>(null)
  const [people, setPeople] = useState<any>(null)
  const [leases, setLeases] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [overdue, setOverdue] = useState<any[]>([])
  const [detailedFin, setDetailedFin] = useState<any>(null)
  
  // Analytics States
  const [finAnalytics, setFinAnalytics] = useState<any>(null)
  const [propAnalytics, setPropAnalytics] = useState<any>(null)
  const [peopleAnalytics, setPeopleAnalytics] = useState<any>(null)
  const [leaseAnalytics, setLeaseAnalytics] = useState<any>(null)
  const [invoiceStatus, setInvoiceStatus] = useState<any[]>([])
  const [collectionTrend, setCollectionTrend] = useState<any[]>([])
  const [tenantHistory, setTenantHistory] = useState<any[]>([])

  // Filter States
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    buildingId: '',
    ownerId: '',
    siteId: ''
  })
  const [allBuildings, setAllBuildings] = useState<any[]>([])
  const [allSites, setAllSites] = useState<any[]>([])
  const [allOwners, setAllOwners] = useState<any[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    try {
      let type = activeTab as string;
      if (type === 'overview') type = 'revenue';
      if (type === 'property') type = 'buildings';
      if (type === 'people') type = 'tenants';
      
      await downloadReport(type, format);
      toast.addToast(`${type} ${format.toUpperCase()} report exported successfully`, 'success');
    } catch (e) {
      toast.addToast('Failed to export report', 'error');
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const [buildings, sites, ownersRes] = await Promise.all([
          getPropertyReport({}), // Empty params to get all accessible buildings
          listSites(),
          listOwners()
        ])
        setAllBuildings(Array.isArray(buildings) ? buildings : [])
        setAllSites(Array.isArray(sites) ? sites : [])
        const ownersList = ownersRes?.data || ownersRes
        setAllOwners(Array.isArray(ownersList) ? ownersList : [])
      } catch (e) {
        console.error('Failed to load filter data', e)
      }
    }
    init()
  }, [])

  useEffect(() => { loadData() }, [activeTab, filters])

  async function loadData() {
    setLoading(true)
    try {
      if (activeTab === 'overview') {
        const [dash, fin, occ] = await Promise.all([getDashboard(filters), getFinancial(filters), getOccupancy(filters)])
        setDashboard(dash)
        setFinancial(Array.isArray(fin) ? fin : [])
        setOccupancy(occ)
      } else if (activeTab === 'finance') {
        const [fin, det, ana, invStatus, collRate, history] = await Promise.all([
          getFinancial(filters), getDetailedFinancials(filters), getFinanceAnalytics(filters),
          getInvoiceStatusBreakdown(filters), getCollectionRateTrend(filters), getTenantPaymentHistory(filters)
        ])
        setFinancial(Array.isArray(fin) ? fin : [])
        setDetailedFin(det)
        setFinAnalytics(ana)
        setInvoiceStatus(Array.isArray(invStatus) ? invStatus : [])
        setCollectionTrend(Array.isArray(collRate) ? collRate : [])
        setTenantHistory(Array.isArray(history) ? history : [])
      } else if (activeTab === 'property') {
        const [prop, occ, ana] = await Promise.all([getPropertyReport(filters), getOccupancy(filters), getPropertyAnalytics(filters)])
        setProperties(prop)
        setOccupancy(occ)
        setPropAnalytics(ana)
      } else if (activeTab === 'people') {
        const [p, ana] = await Promise.all([getPeopleReport(filters), getPeopleAnalytics(filters)])
        setPeople(p)
        setPeopleAnalytics(ana)
      } else if (activeTab === 'leases') {
        const [l, ana] = await Promise.all([getLeaseReport(filters), getLeaseAnalytics(filters)])
        setLeases(l)
        setLeaseAnalytics(ana)
      } else if (activeTab === 'overdue') {
        const o = await getOverdueDetails(filters)
        setOverdue(o)
      }
    } catch (e: any) {
      console.error(`load ${activeTab} reports`, e)
      toast.addToast(`Failed to load ${activeTab} report data`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const allTabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'finance', name: 'Finance Analytics', icon: DollarSign },
    { id: 'property', name: 'Property Mix', icon: Home },
    { id: 'people', name: 'Visitor/Tenant Insights', icon: Users },
    { id: 'leases', name: 'Lease Intelligence', icon: ClipboardList },
    { id: 'overdue', name: 'Delinquency & Eviction', icon: ShieldAlert },
  ]
  
  const tabs = isFinanceOnly ? allTabs.filter(t => t.id === 'finance') : allTabs

  return (
    <PageLayout 
      title="Intelligence Reports" 
      subtitle="Comprehensive data-driven insights into your portfolio performance."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={() => handleExport('pdf')}
            className="button-secondary text-xs font-bold gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border border-indigo-100 dark:border-indigo-900/30 px-3 sm:px-4 py-2"
          >
            <FileText size={14} /> <span className="hidden xs:inline">Export PDF</span>
            <span className="xs:hidden">PDF</span>
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="button-secondary text-xs font-bold gap-2 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2"
          >
            <Download size={14} /> <span className="hidden xs:inline">Export CSV</span>
            <span className="xs:hidden">CSV</span>
          </button>
          <button 
            className="button-primary text-xs font-bold gap-2 px-3 sm:px-4 py-2"
            onClick={() => setShowScheduleModal(true)}
          >
            <Calendar size={14} /> <span className="hidden xs:inline">Schedule</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-20">
        
        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2">
             <label className="text-[10px] font-black uppercase text-slate-400">From</label>
             <input 
               type="date" 
               className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 ring-indigo-500/20"
               value={filters.startDate}
               onChange={(e) => setFilters({...filters, startDate: e.target.value})}
             />
           </div>
           <div className="flex items-center gap-2">
             <label className="text-[10px] font-black uppercase text-slate-400">To</label>
             <input 
               type="date" 
               className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 ring-indigo-500/20"
               value={filters.endDate}
               onChange={(e) => setFilters({...filters, endDate: e.target.value})}
             />
           </div>
           <div className="flex items-center gap-2 min-w-[140px]">
             <label className="text-[10px] font-black uppercase text-slate-400">Site</label>
             <select 
               className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 ring-indigo-500/20 w-full"
               value={filters.siteId}
               onChange={(e) => setFilters({...filters, siteId: e.target.value})}
             >
               <option value="">All Sites</option>
               {allSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
           </div>
           <div className="flex items-center gap-2 min-w-[140px]">
             <label className="text-[10px] font-black uppercase text-slate-400">Owner</label>
             <select 
               className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 ring-indigo-500/20 w-full"
               value={filters.ownerId}
               onChange={(e) => setFilters({...filters, ownerId: e.target.value})}
             >
               <option value="">All Owners</option>
               {allOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
             </select>
           </div>
           <div className="flex items-center gap-2 min-w-[150px]">
             <label className="text-[10px] font-black uppercase text-slate-400">Building</label>
             <select 
               className="bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-xs font-bold px-3 py-2 focus:ring-2 ring-indigo-500/20 w-full"
               value={filters.buildingId}
               onChange={(e) => setFilters({...filters, buildingId: e.target.value})}
             >
               <option value="">All Buildings</option>
               {allBuildings
                 .filter(p => {
                   const matchesSite = !filters.siteId || p.siteId === filters.siteId || p.site?.id === filters.siteId;
                   const matchesOwner = !filters.ownerId || p.ownerId === filters.ownerId || p.owner?.id === filters.ownerId;
                   return matchesSite && matchesOwner;
                 })
                 .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
               }
             </select>
           </div>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={loadData}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
              >
                Apply Filters
              </button>
              <button 
                onClick={() => {
                  setFilters({ buildingId: '', startDate: '', endDate: '', siteId: '', ownerId: '' });
                }}
                className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Clear
              </button>
            </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Dynamic Content Rendering */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Compiling Analytics...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'overview' && <OverviewTab dashboard={dashboard} financial={financial} occupancy={occupancy} />}
            {activeTab === 'finance' && <FinanceTab financial={financial} detailedFin={detailedFin} analytics={finAnalytics} invoiceStatus={invoiceStatus} collectionTrend={collectionTrend} tenantHistory={tenantHistory} />}
            {activeTab === 'property' && <PropertyTab properties={properties} occupancy={occupancy} analytics={propAnalytics} />}
            {activeTab === 'people' && <PeopleTab people={people} analytics={peopleAnalytics} />}
            {activeTab === 'leases' && <LeaseTab leases={leases} analytics={leaseAnalytics} />}
            {activeTab === 'overdue' && <OverdueTab overdue={overdue} />}
          </div>
        )}

        {showScheduleModal && <ScheduleReportModal onClose={() => setShowScheduleModal(false)} />}
      </div>
    </PageLayout>
  )
}

function OverviewTab({ dashboard, financial, occupancy }: any) {
  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Occupancy Rate" value={`${dashboard?.occupancy_rate?.toFixed(1) ?? '0'}%`} icon={TrendingUp} color="indigo" trend="+2.4%" />
        <StatCard title="Total Revenue" value={<Money value={dashboard?.total_revenue ?? 0} />} icon={DollarSign} color="emerald" trend="+12%" />
        <StatCard title="Total Units" value={dashboard?.total_units ?? '0'} icon={Home} color="amber" />
        <StatCard title="Active Leases" value={dashboard?.occupied_leases ?? '0'} icon={Users} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm h-full">
              <h3 className="text-lg font-bold mb-6">Revenue Momentum</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financial} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                    <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm h-full">
               <h3 className="text-lg font-bold mb-6">Occupancy Insights</h3>
               <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Occupied', value: dashboard?.occupied_units || 0 },
                          { name: 'Vacant', value: (dashboard?.total_units || 0) - (dashboard?.occupied_units || 0) }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#4f46e5" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{dashboard?.occupancy_rate?.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Filled</span>
                  </div>
               </div>
               <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-500">Vacant Units</span>
                    <span className="text-sm font-black text-rose-500">{occupancy?.vacant_units || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-500">Expiring 30D</span>
                    <span className="text-sm font-black text-amber-500">{occupancy?.expiring_soon || 0}</span>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function FinanceTab({ financial, detailedFin, analytics, invoiceStatus, collectionTrend, tenantHistory }: any) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [historySearch, setHistorySearch] = useState('')
  
  const filteredHistory = tenantHistory?.filter((h: any) => 
    !historySearch || h.tenant_name?.toLowerCase().includes(historySearch.toLowerCase()) || h.invoice_no?.toLowerCase().includes(historySearch.toLowerCase())
  ) || []

  const globalRate = collectionTrend?.length > 0 
    ? Math.round(collectionTrend.reduce((s: number, r: any) => s + (r.collected || 0), 0) / Math.max(collectionTrend.reduce((s: number, r: any) => s + (r.invoiced || 0), 0), 1) * 100)
    : 0

  const totalInvoiced = financial?.reduce((acc: number, curr: any) => acc + (curr.invoiced || 0), 0) || 0;
  const totalPaid = financial?.reduce((acc: number, curr: any) => acc + (curr.paid || 0), 0) || 0;
  const totalOutstanding = totalInvoiced - totalPaid;

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue Drilldown', icon: DollarSign },
    { id: 'collections', label: 'Collections & Aging', icon: ShieldCheck },
    { id: 'history', label: 'Transaction Ledger', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800/50">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Billing" value={`ETB ${totalInvoiced.toLocaleString()}`} icon={DollarSign} color="indigo" trend="+12% vs last month" />
            <StatCard title="Total Collected" value={`ETB ${totalPaid.toLocaleString()}`} icon={ShieldCheck} color="emerald" trend={`${globalRate}% Rate`} />
            <StatCard title="Net Outstanding" value={`ETB ${totalOutstanding.toLocaleString()}`} icon={ShieldAlert} color="rose" trend="Action required" />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Monthly Revenue Report</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financial} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradInvoiced" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                  <Tooltip contentStyle={{borderRadius:'20px', border:'none', boxShadow:'0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Area type="monotone" dataKey="invoiced" name="Invoiced" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#gradInvoiced)" />
                  <Area type="monotone" dataKey="paid" name="Collected" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#gradPaid)" />
                  <Line type="monotone" dataKey="outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Building Revenue Report</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.revenueByBuilding || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11, fontWeight:'bold'}} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" name="Total" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={16} />
                  <Bar dataKey="paid" name="Paid" fill="#10b981" radius={[0, 8, 8, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {analytics?.revenueByBuilding?.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-bold">{b.name}</p>
                    <p className="text-[10px] text-slate-400">Total: ETB {b.value?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">ETB {b.paid?.toLocaleString()}</p>
                    <p className="text-[10px] text-rose-500 font-bold">Outstanding: ETB {b.outstanding?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Revenue Mix (Category)</h3>
            <div className="h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categoryRevenue || []}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics?.categoryRevenue?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</p>
                <p className="text-xl font-black">Revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'collections' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold">Collection Rate Report</h3>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-2xl">
                <span className="text-2xl font-black text-emerald-600">{globalRate}%</span>
                <span className="text-[10px] ml-1 font-bold text-emerald-500 uppercase">Avg</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={collectionTrend}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                  <Tooltip formatter={(val: any) => `${val}%`} />
                  <Line type="monotone" dataKey="rate" name="Rate" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold mb-8">Paid vs Unpaid Report</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatus}
                    innerRadius={0}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {invoiceStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? '#10b981' : entry.name === 'Partial' ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {invoiceStatus.map((s: any) => (
                <div key={s.name} className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{s.name}</p>
                  <p className="text-lg font-black">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold mb-8">Overdue Report</h3>
            {(!analytics?.overdueAging || analytics.overdueAging.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <ShieldCheck size={40} className="mb-2 opacity-20 text-emerald-500" />
                <p className="text-xs font-bold uppercase tracking-widest">No Overdue Invoices</p>
                <p className="text-[10px] mt-1 font-medium">All invoices for this period are fully paid.</p>
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.overdueAging || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11, fontWeight:'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                      <Tooltip formatter={(val: any) => `ETB ${val.toLocaleString()}`} />
                      <Bar dataKey="amount" name="Outstanding" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                  {analytics.overdueAging.map((a: any) => (
                    <div key={a.bucket} className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/20">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{a.bucket}</p>
                      <p className="text-xl font-black text-rose-600 mt-1">ETB {a.amount?.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{a.count} Invoices</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-lg font-bold">Tenant Payment History</h3>
              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search tenant or invoice..."
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold pl-10 pr-4 py-2.5 focus:ring-4 ring-indigo-500/10 w-72 transition-all"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-5">Tenant / Unit</th>
                    <th className="px-6 py-5">Invoice #</th>
                    <th className="px-6 py-5">Due Date</th>
                    <th className="px-6 py-5 text-right">Amount</th>
                    <th className="px-6 py-5 text-right">Paid</th>
                    <th className="px-6 py-5 text-right">Balance</th>
                    <th className="px-6 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredHistory.map((h: any, i: number) => (
                    <tr key={i} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold">{h.tenant_name}</p>
                        <p className="text-[10px] text-slate-400">{h.building_name} · {h.unit_number}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{h.invoice_no}</td>
                      <td className="px-6 py-4 text-xs font-medium">{new Date(h.due_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">ETB {h.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right text-emerald-600 font-bold">ETB {h.paid_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-black" style={{color: h.balance > 0 ? '#ef4444' : '#10b981'}}>
                        ETB {h.balance?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${
                          h.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          h.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{h.status?.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PropertyTab({ properties, analytics }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full">
              <h3 className="text-lg font-bold mb-6">Portfolio Mix (by Unit Type)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.unitMix || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11, fontWeight:'bold'}} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
        <div className="lg:col-span-1">
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col justify-center">
              <h3 className="text-lg font-bold mb-8 text-center">Unit Availability</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.unitMix || []}
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {analytics?.unitMix?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold">Building Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">Building Name</th>
                <th className="px-8 py-4">Total Units</th>
                <th className="px-8 py-4">Occupied</th>
                <th className="px-8 py-4">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {properties.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-8 py-5 text-sm font-bold">{p.name}</td>
                  <td className="px-8 py-5 text-sm">{p.total_units}</td>
                  <td className="px-8 py-5 text-sm text-emerald-600 font-bold">{p.occupied_units}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${p.occupancy_rate}%` }} />
                      </div>
                      <span className="text-xs font-black">{Math.round(p.occupancy_rate)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PeopleTab({ people, analytics }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visitor Traffic */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Visitor Traffic (by Day)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.visitorTraffic || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11, fontWeight:'bold'}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="visitors" fill="#10b981" radius={[8, 8, 8, 8]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenure Mix */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Tenant Tenure Profile</h3>
          <div className="h-64 relative">
            {(!analytics?.tenureMix || analytics.tenureMix.every((d: any) => d.value === 0)) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Users size={40} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No Tenancy Data Available</p>
                <p className="text-[10px] mt-1 font-medium">Add ACTIVE leases to see profile.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.tenureMix || []}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserCheck size={20} className="text-amber-600" /> Recent Visitors
          </h3>
          <div className="space-y-4">
            {people?.visitors?.slice(0, 5).map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold">{v.visitor_name}</p>
                  <p className="text-[10px] text-slate-500">Host ID: {v.host_user_id?.substring(0,8)}</p>
                </div>
                <span className="text-xs font-bold text-slate-400">{new Date(v.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600" /> Active Tenants
          </h3>
          <div className="space-y-4">
            {people?.tenants?.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold">{t.first_name} {t.last_name}</p>
                  <p className="text-[10px] text-slate-500">{t.email}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaseTab({ leases, analytics }: any) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Leasing Velocity (Starts/Mo)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.growthTrend || []} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                <Tooltip />
                <Line type="monotone" dataKey="leases" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expiration Forecast */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Upcoming Expirations (6-Month Forecast)</h3>
          <div className="flex flex-col items-center justify-center h-64 text-center">
             <div className="w-24 h-24 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-4 border border-rose-100 dark:border-rose-900/30">
               <ShieldAlert size={40} />
             </div>
             <h4 className="text-2xl font-black text-rose-600">{analytics?.upcomingExpirations?.length || 0}</h4>
             <p className="text-sm text-slate-500 font-medium">Critical lease expirations identified.</p>
             <div className="mt-6 flex gap-2">
                {analytics?.upcomingExpirations?.slice(0,3).map((e: any, i: number) => (
                  <div key={i} className="text-[9px] font-black bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg uppercase">{e.unit}</div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold">Lease Inventory Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">Tenant</th>
                <th className="px-8 py-4">Unit</th>
                <th className="px-8 py-4">End Date</th>
                <th className="px-8 py-4 text-right">Monthly Rent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {leases.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                  <td className="px-8 py-5 text-sm font-bold">{l.tenant?.first_name} {l.tenant?.last_name}</td>
                  <td className="px-8 py-5 text-sm">{l.unit?.unit_number}</td>
                  <td className="px-8 py-5 text-xs text-rose-500 font-bold">{new Date(l.end_date).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-right font-black italic text-slate-700 dark:text-slate-300">ETB {l.rent_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OverdueTab({ overdue }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shadow-sm">
           <ShieldAlert size={32} />
        </div>
        <div>
           <h4 className="text-lg font-black text-rose-600 uppercase tracking-tight">Delinquency Monitoring Active</h4>
           <p className="text-sm text-rose-500 font-medium">Currently tracking {overdue.length} tenants with overdue balances and active penalties.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-4">Tenant / Unit</th>
                <th className="px-8 py-4">Due Date</th>
                <th className="px-8 py-4">Days Overdue</th>
                <th className="px-8 py-4">Late Penalty</th>
                <th className="px-8 py-4 text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {overdue.map((o: any) => (
                <tr key={o.invoice_no} className="hover:bg-rose-50/20 dark:hover:bg-rose-900/10">
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold">{o.tenant_name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mt-1">{o.unit_name}</p>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600">{new Date(o.due_date).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-xs text-rose-600 font-black">{o.days_overdue} Days</td>
                  <td className="px-8 py-5 text-sm font-black text-amber-600">+ ETB {o.late_fee_amount?.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-black text-rose-600 text-lg">ETB {o.balance?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30',
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none">{value}</h4>
    </div>
  )
}
