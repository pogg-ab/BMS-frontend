import React, { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Filter, Download, TrendingUp, DollarSign, BarChart3, X, Calendar, FileText } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastProvider'
import * as financeApi from '../api/finance'
import { listLeases } from '../api/leases'
import { listBuildings } from '../api/buildings'
import { listSites } from '../api/sites'
import { getRoles, getPermissions } from '../utils/jwt'

type Tab = 'invoices' | 'payments' | 'bank-accounts' | 'deposit-advice' | 'reports' | 'expenses' | 'p-and-l'

const TABS: { key: Tab; label: string }[] = [
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'bank-accounts', label: 'Bank Accounts' },
  { key: 'deposit-advice', label: 'Deposit Advice' },
  { key: 'reports', label: 'Reports' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'p-and-l', label: 'Profit & Loss' },
]

const ITEM_TYPES = ['RENT', 'UTILITY', 'MAINTENANCE', 'PENALTY']

export default function Finance() {
  const toast = useToast()
  const getUploadUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2546'
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const normalizedPath = path.startsWith('/') ? path : '/' + path
    return `${normalizedBase}${normalizedPath}`
  }
  const [tab, setTab] = useState<Tab>('invoices')

  const categoryOptions = ['Security', 'Cleaning', 'Elevator Maintenance', 'Utilities', 'Repairs', 'Salaries', 'Taxes', 'Other']

  const userRoles = getRoles()
  const userPermissions = getPermissions()
  const isSuperAdmin = userRoles.includes('super_admin')
  const isTenant = userRoles.includes('tenant')

  // Filter tabs based on permissions
  const visibleTabs = TABS.filter(t => {
    if (isSuperAdmin) return true
    if (isTenant && ['invoices', 'payments'].includes(t.key)) return true
    if (['bank-accounts', 'reports'].includes(t.key)) {
      return !isTenant && (isSuperAdmin || userPermissions.includes('finance:manage') || userPermissions.includes('reports:view'))
    }
    return true
  })

  // ── Lookups ──────────────────────────────────────────────
  const [leases, setLeases] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])

  // ── Invoices ─────────────────────────────────────────────
  const [invoices, setInvoices] = useState<any[]>([])
  const [invLoading, setInvLoading] = useState(false)
  const [invFilterBuilding, setInvFilterBuilding] = useState('')
  const [invFilterStatus, setInvFilterStatus] = useState('')

  // create invoice form
  const [invLeaseId, setInvLeaseId] = useState('')
  const [invDueDate, setInvDueDate] = useState('')
  const [invItems, setInvItems] = useState<{ type: string; amount: string; description: string }[]>([
    { type: 'RENT', amount: '', description: '' },
  ])
  const [invLeaseSearch, setInvLeaseSearch] = useState('')

  // generate invoices
  const [genSiteId, setGenSiteId] = useState('')
  const [genBuildingId, setGenBuildingId] = useState('')

  // ── Helper: File Upload ──────────────────────────────────
  const [isUploading, setIsUploading] = useState(false)
  async function handleFileUpload(file: File, setter: (url: string) => void) {
    if (!file) return
    setIsUploading(true)
    try {
      const res = await financeApi.uploadTransactionProof(file)
      setter(res.path)
      toast.addToast('File uploaded successfully', 'success')
    } catch (err: any) {
      toast.addToast(err?.response?.data?.message || 'File upload failed', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // ── Payments ─────────────────────────────────────────────
  const [payInvoiceId, setPayInvoiceId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payRefNo, setPayRefNo] = useState('')
  const [payProofUrl, setPayProofUrl] = useState('')
  const [payBankId, setPayBankId] = useState('')

  // verify
  const [verifyPaymentId, setVerifyPaymentId] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<'confirmed' | 'rejected'>('confirmed')

  // ── Bank Accounts ────────────────────────────────────────
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [baBankName, setBaBankName] = useState('')
  const [baAcctNo, setBaAcctNo] = useState('')
  const [baBranch, setBaBranch] = useState('')
  const [baOpeningBal, setBaOpeningBal] = useState('')
  const [editBankAccount, setEditBankAccount] = useState<any>(null)
  const [editBaName, setEditBaName] = useState('')
  const [editBaAcctNo, setEditBaAcctNo] = useState('')
  const [editBaBranch, setEditBaBranch] = useState('')

  // ── Deposit Advice ───────────────────────────────────────
  const [depositAdvices, setDepositAdvices] = useState<any[]>([])
  const [daBankAccountId, setDaBankAccountId] = useState('')
  const [daAmount, setDaAmount] = useState('')
  const [daDate, setDaDate] = useState('')
  const [daRefNo, setDaRefNo] = useState('')
  const [daProofUrl, setDaProofUrl] = useState('')
  const [daLoading, setDaLoading] = useState(false)

  // -- Tax Rules (Now managed in Settings) --

  // ── Reports ──────────────────────────────────────────────
  const [revBuildingId, setRevBuildingId] = useState('')
  const [revMonth, setRevMonth] = useState('')
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [taxMonth, setTaxMonth] = useState('')
  const [taxData, setTaxData] = useState<any>(null)

  // -- Expenses --
  const [expenses, setExpenses] = useState<any[]>([])
  const [expAmount, setExpAmount] = useState('')
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0])
  const [expCategory, setExpCategory] = useState(categoryOptions[0])
  const [expCustomCategory, setExpCustomCategory] = useState('')
  const [expDescription, setExpDescription] = useState('')
  const [expBuildingId, setExpBuildingId] = useState('')
  const [expBankId, setExpBankId] = useState('')
  const [expReceiptUrl, setExpReceiptUrl] = useState('')
  const [expLoading, setExpLoading] = useState(false)

  // -- P&L --
  const [plBuildingId, setPlBuildingId] = useState('')
  const [plYear, setPlYear] = useState(new Date().getFullYear().toString())
  const [plMonth, setPlMonth] = useState((new Date().getMonth() + 1).toString())
  const [plData, setPlData] = useState<any>(null)
  const [plLoading, setPlLoading] = useState(false)

  // -- Tenant Summary --
  const [tenantSummary, setTenantSummary] = useState<any>(null)

  // -- Analytics --
  const [analytics, setAnalytics] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [paymentToReject, setPaymentToReject] = useState<any>(null)
  const [viewPayment, setViewPayment] = useState<any>(null)

  // ── Load helpers ─────────────────────────────────────────
  useEffect(() => {
    loadLookups()
    loadBankAccounts()
    loadAnalytics()
    loadDepositAdvices()
    if (isTenant) loadTenantSummary()
  }, [])

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const data = await financeApi.getAnalytics()
      setAnalytics(data)
    } catch { console.error('Failed to load analytics') }
    finally { setAnalyticsLoading(false) }
  }

  async function loadTenantSummary() {
    try {
      const data = await financeApi.getMySummary()
      setTenantSummary(data)
    } catch { console.error('Failed to load tenant summary') }
  }

  useEffect(() => {
    if (tab === 'invoices' || tab === 'payments') loadInvoices()
    if (tab === 'expenses') loadExpenses()
    if (tab === 'p-and-l') loadPandL()
    if (tab === 'deposit-advice') loadDepositAdvices()
  }, [tab, invFilterBuilding, invFilterStatus])

  async function loadLookups() {
    try {
      const l: any = await listLeases({ page: 1, per_page: 500 })
      setLeases(Array.isArray(l) ? l : [])
    } catch (e: any) { console.error('load leases', e) }
    try {
      const b: any = await listBuildings({ page: 1, per_page: 200 })
      const bl = Array.isArray(b) ? b : (b?.data || [])
      setBuildings(bl)
    } catch (e: any) { console.error('load buildings', e) }
    try {
      const s: any = await listSites({ page: 1, per_page: 200 })
      const sl = Array.isArray(s) ? s : (s?.data || [])
      setSites(sl)
    } catch (e: any) { console.error('load sites', e) }
  }

  async function loadBankAccounts() {
    try {
      const data = await financeApi.getBankAccounts()
      setBankAccounts(Array.isArray(data) ? data : [])
    } catch (e: any) { console.error('load bank accounts', e) }
  }

  async function loadInvoices() {
    setInvLoading(true)
    try {
      const params: any = {}
      if (invFilterBuilding) params.building_id = invFilterBuilding
      if (invFilterStatus) params.status = invFilterStatus
      const data = await financeApi.getInvoices(params)
      setInvoices(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load invoices', 'error')
    } finally { setInvLoading(false) }
  }

  async function loadExpenses() {
    setExpLoading(true)
    try {
      const data = await financeApi.getExpenses()
      setExpenses(Array.isArray(data) ? data : [])
    } catch { toast.addToast('Failed to load expenses', 'error') }
    finally { setExpLoading(false) }
  }

  async function loadPandL() {
    setPlLoading(true)
    try {
      const data = await financeApi.getPandLReport({
        building_id: plBuildingId || undefined,
        year: Number(plYear),
        month: Number(plMonth),
      })
      setPlData(data)
    } catch { toast.addToast('Failed to load P&L report', 'error') }
    finally { setPlLoading(false) }
  }

  async function loadDepositAdvices() {
    if (isTenant) return
    setDaLoading(true)
    try {
      const data = await financeApi.getDepositAdvices()
      setDepositAdvices(Array.isArray(data) ? data : [])
    } catch { console.error('load deposit advices') }
    finally { setDaLoading(false) }
  }

  // ── Selected lease derived data ──────────────────────────
  const selectedLease = useMemo(() => leases.find(l => String(l.id) === invLeaseId), [leases, invLeaseId])

  const filteredLeases = useMemo(() => {
    if (!invLeaseSearch) return leases
    const q = invLeaseSearch.toLowerCase()
    return leases.filter(l => {
      const label = leaseLabel(l).toLowerCase()
      return label.includes(q)
    })
  }, [leases, invLeaseSearch])

  // Derive pending payments from loaded invoices for the verify dropdown
  const pendingPayments = useMemo(() => {
    const all: any[] = []
    invoices.forEach(inv => {
      if (Array.isArray(inv.payments)) {
        inv.payments.forEach((p: any) => {
          if (p.status === 'pending' || !p.status) {
            all.push({ ...p, _invoice: inv })
          }
        })
      }
    })
    return all
  }, [invoices])

  // ── Labels ───────────────────────────────────────────────
  function leaseLabel(l: any) {
    if (!l) return ''
    const tenant = l.tenant
      ? (l.tenant.name || l.tenant.full_name || `${l.tenant.first_name || ''} ${l.tenant.last_name || ''}`.trim() || l.tenant.id)
      : l.tenant_name || l.tenant_id || ''
    const unit = l.unit?.unit_number || l.unit_number || l.unit_id || ''
    return `#${l.id} — ${unit} — ${tenant}`
  }

  function invoiceLabel(inv: any) {
    if (!inv) return ''
    return `${inv.invoice_no || inv.id} — ${inv.tenant?.first_name || inv.tenant?.name || ''} — ETB ${Number(inv.total_amount || 0).toLocaleString()}`
  }

  function fmtMoney(v: any) {
    return `ETB ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // ── Invoice CRUD ─────────────────────────────────────────
  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!invLeaseId || !selectedLease) {
      toast.addToast('Select a lease first', 'error'); return
    }
    const items = invItems
      .filter(i => i.amount)
      .map(i => ({ type: i.type, amount: Number(i.amount), description: i.description || undefined }))
    if (items.length === 0) {
      toast.addToast('Add at least one line item', 'error'); return
    }
    try {
      await financeApi.createInvoice({
        lease_id: selectedLease.id,
        tenant_id: selectedLease.tenant?.id || selectedLease.tenant_id,
        unit_id: selectedLease.unit?.id || selectedLease.unit_id,
        due_date: invDueDate,
        items: items as any,
      })
      toast.addToast('Invoice created', 'success')
      setInvLeaseId(''); setInvDueDate('')
      setInvItems([{ type: 'RENT', amount: '', description: '' }])
      loadInvoices()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join('; ') : (msg || 'Create invoice failed'), 'error')
    }
  }

  async function handleVoidInvoice(id: string) {
    if (!confirm('Void this invoice? This cannot be undone.')) return
    try {
      await financeApi.voidInvoice(id)
      toast.addToast('Invoice voided', 'success')
      loadInvoices()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Void failed', 'error')
    }
  }

  async function handleGenerateInvoices(e: React.FormEvent) {
    e.preventDefault()
    try {
      await financeApi.generateInvoices({
        site_id: genSiteId || undefined,
        building_id: genBuildingId || undefined,
      })
      toast.addToast('Invoice generation triggered', 'success')
      loadInvoices()
    } catch (e: any) {
      toast.addToast('Generate invoices failed', 'error')
    }
  }

  // ── Payment CRUD ─────────────────────────────────────────
  async function handleCreatePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payInvoiceId) { toast.addToast('Select an invoice', 'error'); return }
    try {
      await financeApi.createPayment({
        invoice_id: payInvoiceId,
        amount: Number(payAmount),
        reference_no: payRefNo,
        proof_url: payProofUrl || undefined,
        bank_account_id: payBankId || undefined,
      })
      toast.addToast('Payment recorded', 'success')
      setPayInvoiceId(''); setPayAmount(''); setPayRefNo(''); setPayProofUrl('')
      loadInvoices()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Record payment failed', 'error')
    }
  }

  async function handleVerifyPayment(pId: string, status: 'confirmed' | 'rejected', reason?: string) {
    try {
      await financeApi.verifyPayment(pId, { status, reason })
      toast.addToast(`Payment ${status}`, 'success')
      setVerifyPaymentId('')
      setRejectionReason('')
      setShowRejectModal(false)
      loadInvoices()
      loadAnalytics() // Refresh trends
      loadBankAccounts() // Refresh bank balances
    } catch { toast.addToast('Verification failed', 'error') }
  }

  async function handleVerifyDeposit(id: string, status: 'confirmed' | 'rejected') {
    try {
      await financeApi.verifyDepositAdvice(id, { status })
      toast.addToast(`Deposit ${status}`, 'success')
      loadBankAccounts() // Refresh balances
    } catch { toast.addToast('Failed to verify deposit', 'error') }
  }

  async function handleResendInvoice(id: string) {
    try {
      await financeApi.resendInvoice(id)
      toast.addToast('Invoice reminder sent to tenant', 'success')
    } catch { toast.addToast('Failed to resend invoice', 'error') }
  }

  // ── Bank Account CRUD ────────────────────────────────────
  async function handleCreateBankAccount(e: React.FormEvent) {
    e.preventDefault()
    try {
      await financeApi.createBankAccount({
        bank_name: baBankName,
        account_number: baAcctNo,
        branch: baBranch,
        opening_balance: Number(baOpeningBal || 0),
      })
      toast.addToast('Bank account created', 'success')
      setBaBankName(''); setBaAcctNo(''); setBaBranch(''); setBaOpeningBal('')
      loadBankAccounts()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Create bank account failed', 'error')
    }
  }

  async function handleUpdateBankAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!editBankAccount) return
    try {
      await financeApi.updateBankAccount(editBankAccount.id, {
        bank_name: editBaName,
        account_number: editBaAcctNo,
        branch: editBaBranch,
      })
      toast.addToast('Bank account updated', 'success')
      setEditBankAccount(null)
      loadBankAccounts()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Update bank account failed', 'error')
    }
  }

  async function handleDeleteBankAccount(id: string) {
    if (!confirm('Delete this bank account? This cannot be undone.')) return
    try {
      await financeApi.deleteBankAccount(id)
      toast.addToast('Bank account deleted', 'success')
      loadBankAccounts()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Delete bank account failed', 'error')
    }
  }

  // ── Deposit Advice ───────────────────────────────────────
  async function handleCreateDepositAdvice(e: React.FormEvent) {
    e.preventDefault()
    if (!daBankAccountId) { toast.addToast('Select a bank account', 'error'); return }
    try {
      await financeApi.createDepositAdvice({
        bank_account_id: daBankAccountId,
        amount: Number(daAmount),
        deposit_date: daDate,
        reference_no: daRefNo,
        proof_url: daProofUrl || undefined,
      })
      toast.addToast('Deposit advice created', 'success')
      setDaBankAccountId(''); setDaAmount(''); setDaDate(''); setDaRefNo(''); setDaProofUrl('')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Create deposit advice failed', 'error')
    }
  }

  // -- Tax Rules (Managed in Settings) --

  // ── Reports ──────────────────────────────────────────────
  async function handleRevenueReport(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await financeApi.getRevenueReport({
        building_id: revBuildingId || undefined,
        month: revMonth || undefined,
      })
      setRevenueData(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.addToast('Failed to load revenue report', 'error')
    }
  }

  async function handleTaxReport(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await financeApi.getTaxReport({ month: taxMonth || undefined })
      setTaxData(data)
    } catch (e: any) {
      toast.addToast('Failed to load tax report', 'error')
    }
  }

  // -- Expense Handlers --
  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = expCategory === 'Other' ? expCustomCategory : expCategory
    if (!finalCategory) { toast.addToast('Please provide a category', 'error'); return }
    try {
      await financeApi.createExpense({
        amount: Number(expAmount),
        date: expDate,
        category: finalCategory,
        description: expDescription || undefined,
        building_id: expBuildingId || undefined,
        bank_account_id: expBankId || undefined,
        receipt_url: expReceiptUrl || undefined,
      })
      toast.addToast('Expense recorded', 'success')
      setExpAmount(''); setExpDescription(''); setExpCustomCategory(''); setExpReceiptUrl('')
      loadExpenses()
      loadBankAccounts() // Refresh balances
    } catch { toast.addToast('Failed to record expense', 'error') }
  }

  // ── Invoice item helpers ─────────────────────────────────
  function addItem() {
    setInvItems(prev => [...prev, { type: 'RENT', amount: '', description: '' }])
  }
  function removeItem(i: number) {
    setInvItems(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateItem(i: number, field: string, value: string) {
    setInvItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  // ── KPI Calculations ─────────────────────────────────────
  const financeKpis = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount || 0), 0)
    const totalOutstanding = invoices.filter(i => ['pending', 'overdue', 'partial'].includes(i.status)).reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.amount_paid || 0)), 0)
    const paidCount = invoices.filter(i => i.status === 'paid').length
    const collectionRate = invoices.length > 0 ? ((paidCount / invoices.length) * 100).toFixed(1) : '0'
    return { totalRevenue, totalOutstanding, collectionRate, paidCount, totalInvoices: invoices.length }
  }, [invoices])

  // ── Render ───────────────────────────────────────────────
  return (
    <PageLayout
      title="Finance & Invoicing"
      subtitle="Comprehensive financial management across your property portfolio."
      searchPlaceholder="Search invoices, tenants..."
      actions={
        <div className="flex items-center gap-3">
          {isTenant && (
            <button 
              onClick={() => financeApi.downloadTenantLedgerPdf(tenantSummary?.id || '')} 
              className="button-secondary"
            >
              <Download size={16} /> My Statement
            </button>
          )}
          {!isTenant && (
            <button onClick={() => { setGenSiteId(''); setGenBuildingId(''); handleGenerateInvoices({ preventDefault: () => {} } as any) }} className="button-secondary">
              <BarChart3 size={16} /> Bulk Generate
            </button>
          )}
          {!isTenant && (
            <button onClick={() => setTab('invoices')} className="button">
              <Plus size={16} /> Create Invoice
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">

      {/* KPI Cards */}
      {isTenant ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Balance Due"
            value={fmtMoney(tenantSummary?.totalBalanceDue || 0)}
            subtitle="Including any late fees"
            variant="purple"
            icon={<DollarSign size={18} />}
          />
          <KPICard
            title="Next Due Date"
            value={tenantSummary?.nextDueDate ? new Date(tenantSummary.nextDueDate).toLocaleDateString() : 'No pending payments'}
            variant="white"
            icon={<Calendar size={18} />}
          />
          <KPICard
            title="Pending Invoices"
            value={String(tenantSummary?.invoiceCount || 0)}
            variant="white"
            icon={<FileText size={18} />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard
            title="Total Revenue"
            value={fmtMoney(financeKpis.totalRevenue)}
            trend={analytics?.revenueTrend ? { 
              value: `${analytics.revenueTrend.percentage.toFixed(1)}%`, 
              direction: analytics.revenueTrend.direction 
            } : undefined}
            variant="white"
            icon={<TrendingUp size={18} />}
          />
          <KPICard
            title="Collection Efficiency"
            value={`${financeKpis.collectionRate}%`}
            subtitle={`${financeKpis.paidCount} of ${financeKpis.totalInvoices} invoices collected`}
            variant="purple"
            icon={<DollarSign size={18} />}
          />
          <KPICard
            title="Outstanding Balance"
            value={fmtMoney(financeKpis.totalOutstanding)}
            subtitle="Across all pending & overdue invoices"
            variant="white"
            icon={<BarChart3 size={18} />}
          />
        </div>
      )}

      {/* Analytics Chart Section (New) */}
      {!isTenant && analytics?.chartData && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Performance</h3>
              <p className="text-sm text-slate-500">Actual cash collected over the past 6 months.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg">
              <Calendar size={14} /> Last 6 Months
            </div>
          </div>
          <div className="h-48 flex items-end gap-3 pt-4">
            {analytics.chartData.map((d: any, i: number) => {
              const max = Math.max(...analytics.chartData.map((x: any) => x.total), 1)
              const height = (d.total / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative flex flex-col justify-end h-32">
                    <div 
                      className="w-full bg-indigo-500/10 group-hover:bg-indigo-500/20 rounded-t-xl transition-all duration-500 relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {fmtMoney(d.total)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${tab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* ────── INVOICES TAB ────── */}
      {tab === 'invoices' && (
        <div className="space-y-6">
          {!isTenant && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Invoice */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                <h3 className="font-semibold mb-4 text-lg">Create Invoice</h3>
              <form onSubmit={handleCreateInvoice} className="space-y-3">
                {/* Lease search + dropdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Lease Search</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        className="form-input pl-10" 
                        placeholder="Search by Tenant Name or ID..." 
                        value={invLeaseSearch} 
                        onChange={e => setInvLeaseSearch(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Select Lease</label>
                    <select 
                      className="form-select" 
                      value={invLeaseId} 
                      onChange={e => setInvLeaseId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Lease --</option>
                      {filteredLeases.map(l => (
                        <option key={l.id} value={String(l.id)}>{leaseLabel(l)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={invDueDate} 
                      onChange={e => setInvDueDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {/* Auto-filled tenant & unit */}
                {selectedLease && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded text-sm">
                      <span className="text-gray-500">Tenant:</span>{' '}
                      {selectedLease.tenant?.first_name || selectedLease.tenant?.name || selectedLease.tenant_id || '-'}
                      {selectedLease.tenant?.last_name ? ` ${selectedLease.tenant.last_name}` : ''}
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded text-sm">
                      <span className="text-gray-500">Unit:</span>{' '}
                      {selectedLease.unit?.unit_number || selectedLease.unit_id || '-'}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={e => setInvDueDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Line Items</label>
                    <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline">
                      + Add Item
                    </button>
                  </div>
                  {invItems.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <div className="w-32 shrink-0">
                        <select
                          value={item.type}
                          onChange={e => updateItem(i, 'type', e.target.value)}
                          className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm transition-all"
                        >
                          {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="w-32 shrink-0">
                        <input
                          placeholder="Amount"
                          value={item.amount}
                          onChange={e => updateItem(i, 'amount', e.target.value)}
                          className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm transition-all"
                          type="number"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          placeholder="Item description"
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                          className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm transition-all"
                        />
                      </div>
                      {invItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="button">
                    Create Invoice
                  </button>
                </div>
              </form>
            </div>

            {/* Generate & Filters */}
            <div className="space-y-4">
              {/* Generate Invoices */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                <h3 className="font-semibold mb-3">Generate Invoices (Bulk)</h3>
                <form onSubmit={handleGenerateInvoices} className="space-y-3">
                  <select value={genSiteId} onChange={e => setGenSiteId(e.target.value)} className="form-select">
                    <option value="">All Sites</option>
                    {sites.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name || s.id}</option>)}
                  </select>
                  <select value={genBuildingId} onChange={e => setGenBuildingId(e.target.value)} className="form-select">
                    <option value="">All Buildings</option>
                    {buildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code || b.id}</option>)}
                  </select>
                  <button type="submit" className="button w-full justify-center">
                    Trigger Generation
                  </button>
                </form>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
                <h3 className="font-semibold mb-3">Filter Invoices</h3>
                <div className="space-y-2">
                  <select value={invFilterBuilding} onChange={e => setInvFilterBuilding(e.target.value)} className="form-select">
                    <option value="">All Buildings</option>
                    {buildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code || b.id}</option>)}
                  </select>
                  <select value={invFilterStatus} onChange={e => setInvFilterStatus(e.target.value)} className="form-select">
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight">Invoices</h3>
            {invLoading ? <div className="py-12 flex justify-center text-slate-500">Loading invoices...</div> : invoices.length === 0 ? (
              <div className="py-12 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No invoices found</div>
            ) : (
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Invoice #</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Tenant</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Unit</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Due Date</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Subtotal</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Tax</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Late Fee</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Total</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 font-medium text-slate-500">#{inv.invoice_no || inv.id}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{inv.tenant?.first_name || inv.tenant?.name || '-'}{inv.tenant?.last_name ? ` ${inv.tenant.last_name}` : ''}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{inv.unit?.unit_number || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-600">{fmtMoney(inv.subtotal)}</td>
                        <td className="px-6 py-4 text-slate-600">{fmtMoney(inv.tax_amount)}</td>
                        <td className="px-6 py-4 text-amber-600 font-medium">
                          {Number(inv.late_fee_amount || 0) > 0 ? fmtMoney(inv.late_fee_amount) : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {fmtMoney(Number(inv.total_amount) + Number(inv.late_fee_amount || 0))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={inv.status || 'pending'} />
                          {inv.amount_paid > 0 && inv.status !== 'paid' && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Paid: {fmtMoney(inv.amount_paid)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 items-center">
                            {inv.status === 'paid' && inv.payments?.length > 0 && (
                               <button 
                                 onClick={() => financeApi.downloadPaymentReceiptPdf(inv.payments[0].id)}
                                 className="text-emerald-600 hover:text-emerald-900 text-xs font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                                 title="Download Receipt"
                               >
                                 <Download size={14} /> Receipt
                               </button>
                            )}
                            {!isTenant && (
                              <button 
                                onClick={() => financeApi.downloadTenantLedgerPdf(inv.tenant?.id || inv.tenant_id)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs font-bold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                                title="Download Statement"
                              >
                                <Download size={14} /> Statement
                              </button>
                            )}
                            {!isTenant && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'voided' && (
                              <button onClick={() => financeApi.downloadTenantLedgerPdf(inv.tenant?.id || inv.tenant_id)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Download Statement">
                                <Download size={16} />
                              </button>
                            )}
                            {!isTenant && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'voided' && (
                              <button onClick={() => handleResendInvoice(inv.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Resend Notification">
                                <Plus size={16} className="rotate-45" />
                              </button>
                            )}
                            {!isTenant && inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'voided' && (
                              <button onClick={() => handleVoidInvoice(inv.id)} className="text-rose-600 hover:text-rose-900 text-xs font-medium">
                                Void
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── PAYMENTS TAB ────── */}
      {tab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-semibold mb-4 text-lg">Record Payment</h3>
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="form-label">Invoice</label>
                <select
                  value={payInvoiceId}
                  onChange={e => setPayInvoiceId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select invoice</option>
                  {(isTenant ? invoices.filter(i => i.status !== 'processing') : invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'processing')).map((inv: any) => (
                    <option key={inv.id} value={String(inv.id)}>{invoiceLabel(inv)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Amount</label>
                {payInvoiceId && (
                  <div className="text-xs text-slate-500 mb-1">
                    Outstanding: {fmtMoney(Number(invoices.find(i => String(i.id) === payInvoiceId)?.total_amount || 0) + Number(invoices.find(i => String(i.id) === payInvoiceId)?.late_fee_amount || 0) - Number(invoices.find(i => String(i.id) === payInvoiceId)?.amount_paid || 0))}
                  </div>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Payment amount"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Reference No</label>
                <input
                  placeholder="Transaction/receipt ref"
                  value={payRefNo}
                  onChange={e => setPayRefNo(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label text-slate-700 dark:text-slate-300">Recipient Bank Account</label>
                  <select
                    value={payBankId}
                    onChange={e => setPayBankId(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {bankAccounts.map((ba: any) => (
                      <option key={ba.id} value={ba.id}>{ba.bank_name} ({ba.account_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label text-slate-700 dark:text-slate-300">Proof of Payment</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], setPayProofUrl)}
                      className="hidden"
                      id="pay-proof-upload"
                      accept="image/*,application/pdf"
                    />
                    <label 
                      htmlFor="pay-proof-upload" 
                      className={`flex-1 p-2 border-2 border-dashed rounded-xl text-center cursor-pointer text-xs transition-all ${payProofUrl ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'}`}
                    >
                      {isUploading ? 'Uploading...' : payProofUrl ? '✓ Receipt Attached' : 'Upload Screenshot/PDF'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="button">
                  Record Payment
                </button>
              </div>
            </form>
          </div>

          {/* Payments Awaiting Verification */}
          {!isTenant && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Payments Awaiting Verification</h3>
              {pendingPayments.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
                  <DollarSign size={40} className="opacity-20" />
                  <p>No pending payments to verify.</p>
                </div>
              ) : (
                <div className="table-container border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Tenant / Invoice</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Amount</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Reference</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Proof</th>
                        <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {pendingPayments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {p._invoice?.tenant?.first_name || p._invoice?.tenant?.name || '-'}{p._invoice?.tenant?.last_name ? ` ${p._invoice.tenant.last_name}` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Invoice #{p._invoice?.invoice_no || p._invoice?.id}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{fmtMoney(p.amount)}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{p.reference_no || '-'}</td>
                          <td className="px-6 py-4">
                            {p.proof_url ? (
                              <a
                                href={getUploadUrl(p.proof_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                <FileText size={12} /> View Proof
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No proof uploaded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setViewPayment(p)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'confirmed')}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => { setPaymentToReject(p); setShowRejectModal(true) }}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ────── BANK ACCOUNTS TAB ────── */}
      {tab === 'bank-accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-semibold mb-4 text-lg">Create Bank Account</h3>
            <form onSubmit={handleCreateBankAccount} className="space-y-3">
              <div>
                <label className="form-label">Bank Name</label>
                <input
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  value={baBankName}
                  onChange={e => setBaBankName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Account Number</label>
                <input
                  placeholder="Account number"
                  value={baAcctNo}
                  onChange={e => setBaAcctNo(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Branch</label>
                <input
                  placeholder="Branch name"
                  value={baBranch}
                  onChange={e => setBaBranch(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-slate-700 dark:text-slate-300">Initial Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={baOpeningBal}
                  onChange={e => setBaOpeningBal(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="button">
                  Create Account
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Bank Accounts</h3>
            {bankAccounts.length === 0 ? (
              <div className="py-8 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No bank accounts created yet. Created accounts will appear here.</div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((ba: any, i: number) => (
                  <div key={ba.id || i} className="p-4 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all group">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {ba.bank_name}
                          {ba.is_default && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Default</span>}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 font-mono">Acct: <span className="text-slate-700 dark:text-slate-300">{ba.account_number}</span> · Branch: <span className="text-slate-700 dark:text-slate-300">{ba.branch}</span></div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold text-slate-900 dark:text-white">{fmtMoney(ba.current_balance)}</div>
                         <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Available Balance</div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditBankAccount(ba); setEditBaName(ba.bank_name); setEditBaAcctNo(ba.account_number); setEditBaBranch(ba.branch) }}
                        className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBankAccount(ba.id)}
                        className="text-[10px] font-bold text-rose-600 uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── DEPOSIT ADVICE TAB ────── */}
      {tab === 'deposit-advice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-semibold mb-4 text-lg">Create Deposit Advice</h3>
            <form onSubmit={handleCreateDepositAdvice} className="space-y-3">
              <div>
                <label className="form-label">Bank Account</label>
                <select
                  value={daBankAccountId}
                  onChange={e => setDaBankAccountId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select bank account</option>
                  {bankAccounts.map((ba: any) => (
                    <option key={ba.id} value={String(ba.id)}>{ba.bank_name} — {ba.account_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Deposit amount"
                  value={daAmount}
                  onChange={e => setDaAmount(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Deposit Date</label>
                <input
                  type="date"
                  value={daDate}
                  onChange={e => setDaDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Reference No</label>
                <input
                  placeholder="Deposit reference"
                  value={daRefNo}
                  onChange={e => setDaRefNo(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Proof of Deposit (Screenshot/PDF)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], setDaProofUrl)}
                    className="hidden"
                    id="da-proof-upload"
                    accept="image/*,application/pdf"
                  />
                  <label 
                    htmlFor="da-proof-upload" 
                    className={`flex-1 p-2 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${daProofUrl ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'}`}
                  >
                    {isUploading ? 'Uploading...' : daProofUrl ? '✓ Proof Uploaded' : 'Click to upload proof'}
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="button">
                  Create Deposit Advice
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-semibold mb-4 text-lg">Historical Deposite Records</h3>
            {daLoading ? (
              <div className="py-8 text-center text-slate-500 italic">Fetching deposit records...</div>
            ) : depositAdvices.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
                <BarChart3 size={40} className="opacity-20" />
                <p>No deposit advice records found.</p>
              </div>
            ) : (
              <div className="table-container border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Bank / Ref</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Date</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px]">Amount</th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-center">Status</th>
                      {!isTenant && <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {depositAdvices.map((da: any) => (
                      <tr key={da.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{da.bank_account?.bank_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{da.reference_no}</div>
                          {da.proof_url && (
                             <a href={getUploadUrl(da.proof_url)} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline mt-1 block">View Proof</a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{da.deposit_date}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{fmtMoney(da.amount)}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={da.status} />
                        </td>
                        {!isTenant && (
                          <td className="px-6 py-4 text-right">
                            {da.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleVerifyDeposit(da.id, 'confirmed')}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleVerifyDeposit(da.id, 'rejected')}
                                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-widest bg-rose-500/10 px-2 py-1 rounded"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Tax Rules removed (Managed in Settings) --- */}

      {/* ────── REPORTS TAB ────── */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Report */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 transition-shadow hover:shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Revenue Report</h3>
            <form onSubmit={handleRevenueReport} className="space-y-3 mb-4">
              <select value={revBuildingId} onChange={e => setRevBuildingId(e.target.value)} className="form-select">
                <option value="">All Buildings</option>
                {buildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code || b.id}</option>)}
              </select>
              <input
                type="number"
                placeholder="Month (1-12)"
                value={revMonth}
                onChange={e => setRevMonth(e.target.value)}
                className="form-input"
                min="1"
                max="12"
              />
              <button type="submit" className="button w-full">
                Load Revenue
              </button>
            </form>

            {revenueData.length > 0 ? (
              <div className="table-container shadow-none ring-0 border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 font-medium tracking-wider">Building ID</th>
                      <th className="px-6 py-4 font-medium tracking-wider">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {revenueData.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors duration-150">
                        <td className="px-6 py-4 text-slate-700 font-medium">{r.building_id || '-'}</td>
                        <td className="px-6 py-4 text-emerald-600 font-semibold">{fmtMoney(r.total_revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 flex justify-center text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-300">No revenue data. Click "Load Revenue" to query.</div>
            )}
          </div>

          {/* Tax Report */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-semibold mb-4 text-lg">Tax Compliance Report</h3>
            <form onSubmit={handleTaxReport} className="space-y-3 mb-4">
              <input
                type="number"
                placeholder="Month (1-12)"
                value={taxMonth}
                onChange={e => setTaxMonth(e.target.value)}
                className="form-input"
                min="1"
                max="12"
              />
              <button type="submit" className="button w-full justify-center">
                Load Tax Report
              </button>
            </form>

            {taxData ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded bg-gray-50 dark:bg-slate-900 text-center">
                  <div className="text-sm text-gray-500 mb-1">Total VAT</div>
                  <div className="text-xl font-bold">{fmtMoney(taxData.total_vat)}</div>
                </div>
                <div className="p-4 border rounded bg-gray-50 dark:bg-slate-900 text-center">
                  <div className="text-sm text-gray-500 mb-1">Total Withholding</div>
                  <div className="text-xl font-bold">{fmtMoney(taxData.total_withholding)}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No tax data. Click "Load Tax Report" to query.</div>
            )}
          </div>
        </div>
      )}
      {/* ────── EXPENSES TAB ────── */}
      {tab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 p-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 tracking-tight text-lg">Record Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Building</label>
                  <select
                    value={expBuildingId}
                    onChange={e => setExpBuildingId(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                  >
                    <option value="">All Buildings</option>
                    {buildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source Account</label>
                  <select
                    value={expBankId}
                    onChange={e => setExpBankId(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map((ba: any) => (
                      <option key={ba.id} value={ba.id}>{ba.bank_name} ({ba.account_number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Receipt (Screenshot/PDF)</label>
                  <input
                    type="file"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], setExpReceiptUrl)}
                    className="hidden"
                    id="exp-receipt-upload"
                    accept="image/*,application/pdf"
                  />
                  <label 
                    htmlFor="exp-receipt-upload" 
                    className={`w-full block p-2 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${expReceiptUrl ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-indigo-400 text-slate-500'}`}
                  >
                    {isUploading ? 'Uploading...' : expReceiptUrl ? '✓ Receipt Uploaded' : 'Upload Receipt'}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                  required
                >
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {expCategory === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Category Name</label>
                  <input
                    placeholder="Enter category name"
                    value={expCustomCategory}
                    onChange={e => setExpCustomCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 h-24"
                />
              </div>
              <button type="submit" className="button w-full justify-center">Record Expense</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Expense History</h3>
            {expLoading ? <div className="py-8 text-center text-slate-500">Loading expenses...</div> : (
              <div className="table-container border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Building</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {expenses.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No expenses recorded yet.</td></tr>
                    ) : expenses.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4">{e.date}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium">{e.category}</span></td>
                        <td className="px-6 py-4">{e.building?.name || 'Global'}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{e.description || '-'}</div>
                          {e.receipt_url && (
                            <a href={getUploadUrl(e.receipt_url)} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline block mt-1">View Receipt</a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-rose-600">{fmtMoney(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── P&L TAB ────── */}
      {tab === 'p-and-l' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Building</label>
              <select value={plBuildingId} onChange={e => setPlBuildingId(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 min-w-[200px]">
                <option value="">All Buildings</option>
                {buildings.map((b: any) => <option key={b.id} value={String(b.id)}>{b.name || b.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <input type="number" value={plYear} onChange={e => setPlYear(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 w-24" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month (Optional)</label>
              <input type="number" value={plMonth} onChange={e => setPlMonth(e.target.value)} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 w-24" placeholder="All" />
            </div>
            <button onClick={loadPandL} className="button h-[42px]">Generate Report</button>
          </div>

          {plLoading ? <div className="py-12 text-center text-slate-500">Calculating...</div> : plData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                  <div className="text-emerald-500 text-sm font-medium mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{fmtMoney(plData.revenue)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/30">
                  <div className="text-rose-500 text-sm font-medium mb-1">Total Expenses</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{fmtMoney(plData.expenses)}</div>
                </div>
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${plData.net_profit >= 0 ? 'border-blue-100 dark:border-blue-900/30' : 'border-rose-100 dark:border-rose-900/30'}`}>
                  <div className={`${plData.net_profit >= 0 ? 'text-blue-500' : 'text-rose-500'} text-sm font-medium mb-1`}>Net Profit</div>
                  <div className={`text-3xl font-bold ${plData.net_profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>{fmtMoney(plData.net_profit)}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/60">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 tracking-tight text-lg">Expense Breakdown</h3>
                <div className="table-container border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/80">
                      <tr>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {plData.categories.map((c: any) => (
                        <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-medium">{c.name}</td>
                          <td className="px-6 py-4 text-rose-600 font-semibold">{fmtMoney(c.amount)}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {plData.expenses > 0 ? ((c.amount / plData.expenses) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 border border-white/20">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Reject Payment</h3>
            <p className="text-slate-500 text-sm mb-6">Please provide a reason for the tenant. They will receive a notification.</p>
            <textarea 
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Reference number mismatch, illegible receipt..."
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm h-32 mb-6 focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
              <button 
                onClick={() => handleVerifyPayment(paymentToReject.id, 'rejected', rejectionReason)} 
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg transition-all"
              >
                Reject Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setViewPayment(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Payment Details</h3>
                  <p className="text-indigo-200 text-sm mt-1">Invoice #{viewPayment._invoice?.invoice_no || viewPayment._invoice?.id}</p>
                </div>
                <button onClick={() => setViewPayment(null)} className="text-white/60 hover:text-white text-2xl leading-none transition-colors">&times;</button>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Tenant</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewPayment._invoice?.tenant?.first_name || viewPayment._invoice?.tenant?.name || '-'}{viewPayment._invoice?.tenant?.last_name ? ` ${viewPayment._invoice.tenant.last_name}` : ''}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Unit</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{viewPayment._invoice?.unit?.unit_number || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Amount Paid</div>
                  <div className="text-sm font-bold text-emerald-600">{fmtMoney(viewPayment.amount)}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Invoice Total</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{fmtMoney(Number(viewPayment._invoice?.total_amount || 0) + Number(viewPayment._invoice?.late_fee_amount || 0))}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Reference No</div>
                  <div className="text-sm font-mono text-slate-700 dark:text-slate-300">{viewPayment.reference_no || '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Date</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{viewPayment.created_at ? new Date(viewPayment.created_at).toLocaleString() : '-'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Bank Account</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {viewPayment.bank_account 
                      ? `${viewPayment.bank_account.bank_name} (${viewPayment.bank_account.account_number})` 
                      : viewPayment.bank_account_id || 'Default'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</div>
                  <StatusBadge status={viewPayment.status || 'pending'} />
                </div>
              </div>

              {/* Proof Section */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Proof of Payment</span>
                </div>
                <div className="p-4">
                  {viewPayment.proof_url ? (
                    <div className="space-y-3">
                      {/* If image, show preview */}
                      {/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(viewPayment.proof_url) ? (
                        <img
                          src={getUploadUrl(viewPayment.proof_url)}
                          alt="Payment proof"
                          className="w-full max-h-[300px] object-contain rounded-lg border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 text-center">
                          <FileText size={40} className="mx-auto text-indigo-400 mb-2" />
                          <p className="text-sm text-indigo-600 font-medium">PDF / Document Attached</p>
                        </div>
                      )}
                      <a
                        href={getUploadUrl(viewPayment.proof_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all w-full justify-center"
                      >
                        <Download size={14} /> Open Full Document
                      </a>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <FileText size={40} className="mx-auto opacity-20 mb-2" />
                      <p className="text-sm">No proof document was uploaded for this payment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button onClick={() => setViewPayment(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-2xl transition-all">Close</button>
              {(viewPayment.status === 'pending' || !viewPayment.status) && (
                <>
                  <button
                    onClick={() => { handleVerifyPayment(viewPayment.id, 'confirmed'); setViewPayment(null) }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                  >
                    Confirm Payment
                  </button>
                  <button
                    onClick={() => { setPaymentToReject(viewPayment); setShowRejectModal(true); setViewPayment(null) }}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit Bank Account Modal */}
      {editBankAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditBankAccount(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 border border-white/20" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Edit Bank Account</h3>
            <p className="text-slate-500 text-sm mb-6">Update the account details below. Note that the opening balance cannot be changed.</p>
            
            <form onSubmit={handleUpdateBankAccount} className="space-y-4">
              <div>
                <label className="form-label">Bank Name</label>
                <input
                  value={editBaName}
                  onChange={e => setEditBaName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Account Number</label>
                <input
                  value={editBaAcctNo}
                  onChange={e => setEditBaAcctNo(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Branch</label>
                <input
                  value={editBaBranch}
                  onChange={e => setEditBaBranch(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditBankAccount(null)} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </PageLayout>
  )
}
