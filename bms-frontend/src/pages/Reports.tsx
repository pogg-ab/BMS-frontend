import React, { useEffect, useState, useRef } from 'react'
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
import { toPng } from 'html-to-image'
import { 
  LayoutDashboard, DollarSign, ShieldCheck, ClipboardList, Search,
  TrendingUp, Users, Home, 
  ArrowUpRight, Calendar, PieChart as PieIcon, 
  Download, Activity, ShieldAlert, 
  UserCheck, Briefcase, FileText,
  RefreshCw, FileImage, FileSpreadsheet, ChevronRight,
  Filter, MoreVertical, Maximize2
} from 'lucide-react'

// --- Utility: Smart Export ---
const exportToCSV = (data: any[], baseName: string, filters: any) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Smart Naming
  const filterSuffix = [
    filters.buildingId ? `Bldg-${filters.buildingId}` : '',
    filters.startDate ? `From-${filters.startDate}` : '',
    filters.endDate ? `To-${filters.endDate}` : ''
  ].filter(Boolean).join('_');
  
  const fileName = `${baseName}${filterSuffix ? '_' + filterSuffix : ''}.csv`;
  
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToImage = async (ref: any, baseName: string, filters: any) => {
  if (!ref.current) return;
  try {
    const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', quality: 1, pixelRatio: 2 });
    const link = document.createElement('a');
    
    const filterSuffix = [
      filters.buildingId ? `Bldg-${filters.buildingId}` : '',
      filters.startDate ? `From-${filters.startDate}` : ''
    ].filter(Boolean).join('_');

    link.download = `${baseName}${filterSuffix ? '_' + filterSuffix : ''}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Export image failed', err);
  }
};
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

const ReportContainer = ({ title, children, chartRef, data, filters, baseName, listComponent, defaultView = 'chart', hideToggle = false }: any) => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>(defaultView);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-500 overflow-hidden group relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {viewMode === 'chart' ? 'Visual Analytics' : 'Detailed Data Ledger'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hideToggle && (
            <button 
              onClick={() => setViewMode(viewMode === 'chart' ? 'list' : 'chart')}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
              title="Toggle List/Chart"
            >
              <RefreshCw size={16} className={`transition-transform duration-500 ${viewMode === 'list' ? 'rotate-180' : ''}`} />
            </button>
          )}
          
          <button 
            onClick={() => viewMode === 'chart' ? exportToImage(chartRef, baseName, filters) : exportToCSV(data, baseName, filters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-xs font-black transition-all hover:bg-indigo-100 active:scale-95 shadow-sm"
          >
            {viewMode === 'chart' ? <FileImage size={14} /> : <FileSpreadsheet size={14} />}
            Export {viewMode === 'chart' ? 'PNG' : 'CSV'}
          </button>
        </div>
      </div>

      <div className={`relative ${hideToggle && viewMode === 'list' ? '' : 'min-h-[350px]'}`}>
        <div className={`transition-all duration-700 ${viewMode === 'chart' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute inset-0'}`} ref={chartRef}>
          {children}
        </div>
        <div className={`transition-all duration-700 ${viewMode === 'list' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none absolute inset-0'}`}>
          {viewMode === 'list' && (listComponent || <div className="text-center py-20 text-slate-400 font-bold text-xs italic">Raw data ledger for this report is being prepared...</div>)}
        </div>
      </div>
    </div>
  );
};

const ReportTable = ({ data, columns }: { data: any[], columns: { header: string, key: string, format?: (val: any) => any }[] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <ClipboardList size={40} className="mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest">No matching records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {columns.map(col => (
              <th key={col.header} className="px-4 pb-4">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, idx) => (
            <tr key={idx} className="group/row bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 first:rounded-l-2xl last:rounded-r-2xl">
                  {col.format ? col.format(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Showing first 10 of {data.length} records</p>
          <p className="text-[9px] text-indigo-500 font-bold mt-1">Export to CSV to see all records</p>
        </div>
      )}
    </div>
  );
};

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
    { id: 'overdue', name: 'Overdue Report', icon: ShieldAlert },
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
                   const matchesSite = !filters.siteId || 
                     p.siteId === filters.siteId || 
                     p.site_id === filters.siteId || 
                     p.site?.id === filters.siteId;
                   const matchesOwner = !filters.ownerId || 
                     p.ownerId === filters.ownerId || 
                     p.owner_id === filters.ownerId || 
                     p.owner?.id === filters.ownerId;
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
            {activeTab === 'overview' && <OverviewTab dashboard={dashboard} financial={financial} occupancy={occupancy} filters={filters} detailedFin={detailedFin} />}
            {activeTab === 'finance' && <FinanceTab financial={financial} detailedFin={detailedFin} analytics={finAnalytics} invoiceStatus={invoiceStatus} collectionTrend={collectionTrend} tenantHistory={tenantHistory} filters={filters} overdue={overdue} />}
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

function OverviewTab({ dashboard, financial, occupancy, filters, detailedFin }: any) {
  const revMomentumRef = useRef(null);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Occupancy Rate" value={`${dashboard?.occupancy_rate?.toFixed(1) ?? '0'}%`} icon={TrendingUp} color="indigo" trend="+2.4%" />
        <StatCard 
          title="Total Revenue" 
          value={`ETB ${(dashboard?.total_revenue || 0).toLocaleString()}`} 
          icon={DollarSign} 
          color="emerald" 
          trend="+12%" 
        />
        <StatCard title="Total Units" value={dashboard?.total_units ?? '0'} icon={Home} color="amber" />
        <StatCard title="Active Leases" value={dashboard?.occupied_leases ?? '0'} icon={Users} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <ReportContainer 
              title="Revenue Momentum" 
              chartRef={revMomentumRef}
              data={detailedFin?.invoices || []}
              filters={filters}
              baseName="Revenue_Momentum_Ledger"
              listComponent={
                <ReportTable 
                  data={detailedFin?.invoices || []} 
                  columns={[
                    { header: 'Date', key: 'due_date', format: (v) => new Date(v).toLocaleDateString() },
                    { header: 'Tenant', key: 'tenant_name' },
                    { header: 'Building', key: 'building' },
                    { header: 'Total', key: 'total_amount', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Status', key: 'status' }
                  ]} 
                />
              }
            >
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
            </ReportContainer>
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
                  {/* Vacant and Expiring insights removed as requested */}
               </div>
            </div>
        </div>
      </div>
    </div>
  )
}

function FinanceTab({ financial, detailedFin, analytics: finAnalytics, invoiceStatus, collectionTrend, tenantHistory, filters, overdue }: any) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  
  // Sub-Sub-Tab States
  const [revenueSubTab, setRevenueSubTab] = useState('building');
  const [collectionsSubTab, setCollectionsSubTab] = useState('rate');

  const revTrendRef = useRef(null);
  const bldgRevRef = useRef(null);
  const revMixRef = useRef(null);
  const collRateRef = useRef(null);
  const statusPieRef = useRef(null);
  const agingBarRef = useRef(null);
  const dailyActivityRef = useRef(null);

  const SubSubNav = ({ tabs, active, onChange }: any) => (
    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl w-fit mb-8">
      {tabs.map((tab: any) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            active === tab.id 
              ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue Drilldown', icon: DollarSign },
    { id: 'collections', label: 'Collections & Aging', icon: ShieldCheck },
    { id: 'history', label: 'Transaction Ledger', icon: ClipboardList },
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Sub-tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-black transition-all ${
              activeSubTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-y-[-2px]' 
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <TrendingUp size={80} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Invoiced</p>
              <h4 className="text-3xl font-black mt-2">ETB {(financial?.reduce((acc: number, c: any) => acc + (c.invoiced || 0), 0) || 0).toLocaleString()}</h4>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                <ArrowUpRight size={12} /> +12.5% vs last period
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Collected Revenue</p>
              <h4 className="text-3xl font-black mt-2 text-emerald-500">ETB {(financial?.reduce((acc: number, c: any) => acc + (c.paid || 0), 0) || 0).toLocaleString()}</h4>
              <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-6 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                  style={{width: `${Math.min(((financial?.reduce((acc: number, c: any) => acc + (c.paid || 0), 0) || 0) / (financial?.reduce((acc: number, c: any) => acc + (c.invoiced || 0), 0) || 1)) * 100, 100)}%`}}
                />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Outstanding</p>
              <h4 className="text-3xl font-black mt-2 text-rose-500">ETB {(financial?.reduce((acc: number, c: any) => acc + (c.outstanding || 0), 0) || 0).toLocaleString()}</h4>
            </div>
          </div>

          <ReportContainer 
            title="Monthly Revenue Trend" 
            chartRef={revTrendRef}
            data={collectionTrend}
            filters={filters}
            baseName="Monthly_Revenue_Audit"
            listComponent={
              <ReportTable 
                data={collectionTrend} 
                columns={[
                  { header: 'Month', key: 'month' },
                  { header: 'Target Invoiced', key: 'invoiced', format: (v) => `ETB ${v?.toLocaleString()}` },
                  { header: 'Actual Collected', key: 'collected', format: (v) => `ETB ${v?.toLocaleString()}` },
                  { header: 'Growth %', key: 'growth', format: (v) => `${v > 0 ? '+' : ''}${v}%` },
                  { header: 'Gap', key: 'outstanding', format: (v) => `ETB ${v?.toLocaleString()}` }
                ]} 
              />
            }
          >
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ReportContainer>
        </div>
      )}

      {activeSubTab === 'revenue' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <SubSubNav 
            tabs={[
              { id: 'building', label: 'Building Revenue Report' },
              { id: 'mix', label: 'Revenue Mix Report' }
            ]} 
            active={revenueSubTab} 
            onChange={setRevenueSubTab} 
          />

              {revenueSubTab === 'building' && (
                <ReportContainer 
                  title="Building Revenue Report" 
                  chartRef={bldgRevRef}
                  data={finAnalytics?.revenueByBuilding || []}
                  filters={filters}
                  baseName="Building_Revenue"
                  listComponent={
                    <ReportTable 
                    data={finAnalytics?.revenueByBuilding || []} 
                    columns={[
                      { header: 'Building', key: 'name' },
                      { header: 'Units', key: 'total_units' },
                      { header: 'Total Invoiced', key: 'value', format: (v) => `ETB ${v?.toLocaleString()}` },
                      { header: 'Paid', key: 'paid', format: (v) => `ETB ${v?.toLocaleString()}` },
                      { header: 'Outstanding', key: 'outstanding', format: (v) => `ETB ${v?.toLocaleString()}` },
                      { header: 'Collection Efficiency', key: 'efficiency', format: (v) => `${v}%` }
                    ]} 
                  />
                  }
                >
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={finAnalytics?.revenueByBuilding || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10, fontWeight:'bold'}} angle={-45} textAnchor="end" height={60} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                        <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="value" name="Revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ReportContainer>
              )}

          {revenueSubTab === 'mix' && (
            <ReportContainer 
              title="Revenue Mix Report" 
              chartRef={revMixRef}
              data={finAnalytics?.categoryRevenue || []}
              filters={filters}
              baseName="Revenue_Mix_Analysis"
              listComponent={
                <ReportTable 
                  data={finAnalytics?.categoryRevenue || []} 
                  columns={[
                    { header: 'Category Type', key: 'name' },
                    { header: 'Revenue Volume', key: 'value', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Share of Portfolio', key: 'percentage', format: (v) => `${v}%` },
                    { header: 'Invoice Count', key: 'count' }
                  ]} 
                />
              }
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finAnalytics?.categoryRevenue || []}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(finAnalytics?.categoryRevenue || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ReportContainer>
          )}
        </div>
      )}

      {activeSubTab === 'collections' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <SubSubNav 
            tabs={[
              { id: 'rate', label: 'Collection Rate Report' },
              { id: 'status', label: 'Paid vs Unpaid Report' },
              { id: 'overdue', label: 'Overdue Report' }
            ]} 
            active={collectionsSubTab} 
            onChange={setCollectionsSubTab} 
          />

          {collectionsSubTab === 'rate' && (
            <ReportContainer 
              title="Collection Rate Report" 
              chartRef={collRateRef}
              data={collectionTrend}
              filters={filters}
              baseName="Collection_Rate"
              listComponent={
                <ReportTable 
                  data={collectionTrend || []} 
                  columns={[
                    { header: 'Month', key: 'month' },
                    { header: 'Total Invoiced', key: 'invoiced', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Total Collected', key: 'collected', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Outstanding', key: 'outstanding', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Collection Rate', key: 'rate', format: (v) => `${v}%` }
                  ]} 
                />
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Collection Rate</p>
                  <p className="text-xl font-black text-indigo-600 mt-1">
                    {Math.round(collectionTrend.reduce((acc: number, c: any) => acc + (c.rate || 0), 0) / (collectionTrend.length || 1))}%
                  </p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={collectionTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} unit="%" />
                    <Tooltip contentStyle={{borderRadius:'16px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="rate" name="Rate %" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ReportContainer>
          )}

          {collectionsSubTab === 'status' && (
            <ReportContainer 
              title="Paid vs Unpaid Report" 
              chartRef={statusPieRef}
              data={detailedFin?.invoices || []}
              filters={filters}
              baseName="Payment_Status"
              listComponent={
                <ReportTable 
                  data={detailedFin?.invoices || []} 
                  columns={[
                    { header: 'Tenant', key: 'tenant_name' },
                    { header: 'Invoice #', key: 'invoice_no' },
                    { header: 'Amount', key: 'total_amount', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Paid', key: 'amount_paid', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Balance', key: 'balance', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Status', key: 'status', format: (v) => v?.toLowerCase() }
                  ]} 
                />
              }
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={invoiceStatus} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                      {invoiceStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ReportContainer>
          )}

          {collectionsSubTab === 'overdue' && (
            <ReportContainer 
              title="Overdue Report" 
              chartRef={agingBarRef}
            data={overdue || []}
            filters={filters}
            baseName="Overdue_Aging_Ledger"
            listComponent={
              <ReportTable 
                data={overdue || []} 
                columns={[
                  { header: 'Tenant', key: 'tenant_name' },
                  { header: 'Unit', key: 'unit_name' },
                  { header: 'Days Overdue', key: 'days_overdue', format: (v) => `${v} Days` },
                  { header: 'Late Fee', key: 'late_fee_amount', format: (v) => `ETB ${v?.toLocaleString()}` },
                  { header: 'Balance', key: 'balance', format: (v) => `ETB ${v?.toLocaleString()}` }
                ]} 
              />
            }
            >
              {(!finAnalytics?.overdueAging || finAnalytics.overdueAging.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-80 text-slate-400">
                  <ShieldCheck size={40} className="mb-2 opacity-20 text-emerald-500" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Overdue Invoices</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finAnalytics?.overdueAging || []}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a3b8', fontSize:10}} />
                      <Tooltip />
                      <Bar dataKey="amount" name="Outstanding" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ReportContainer>
          )}
        </div>
      )}

      {/* 4. TRANSACTION LEDGER */}
      {activeSubTab === 'history' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <ReportContainer 
            title="Tenant Payment History" 
            chartRef={dailyActivityRef}
            data={tenantHistory}
            filters={filters}
            baseName="Tenant_Payment_Ledger"
            defaultView="list"
            hideToggle={true}
            listComponent={
                <ReportTable 
                  data={tenantHistory} 
                  columns={[
                    { header: 'Tenant', key: 'tenant_name' },
                    { header: 'Invoice #', key: 'invoice_no' },
                    { header: 'Building', key: 'building_name' },
                    { header: 'Payment Date', key: 'last_payment_date', format: (v) => v ? new Date(v).toLocaleDateString() : 'No Payment' },
                    { header: 'Amount', key: 'amount', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Paid', key: 'paid_amount', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Balance', key: 'balance', format: (v) => `ETB ${v?.toLocaleString()}` },
                    { header: 'Status', key: 'status' }
                  ]} 
                />
            }
          >
            <div className="h-80 flex flex-col items-center justify-center text-slate-400">
              <Activity size={40} className="mb-4 opacity-20 text-indigo-500" />
              <h3 className="text-lg font-black tracking-tight">Daily Payment Activity</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Timeline visualization for the selected period</p>
            </div>
          </ReportContainer>
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
