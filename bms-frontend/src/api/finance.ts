import api from './axios'

// --- Bank Accounts ---
export async function createBankAccount(dto: { 
  bank_name: string; 
  account_number: string; 
  branch: string;
  opening_balance: number;
}) {
  const res = await api.post('/finance/bank-accounts', dto)
  return res.data
}

export async function getBankAccounts() {
  const res = await api.get('/finance/bank-accounts')
  return res.data
}

export async function updateBankAccount(id: string, dto: { bank_name?: string; account_number?: string; branch?: string }) {
  const res = await api.patch(`/finance/bank-accounts/${id}`, dto)
  return res.data
}

export async function deleteBankAccount(id: string) {
  const res = await api.delete(`/finance/bank-accounts/${id}`)
  return res.data
}

// --- Invoices ---
export async function getInvoices(params?: { building_id?: string; status?: string }) {
  const res = await api.get('/finance/invoices', { params })
  return res.data
}

export async function getAllInvoices() {
  const res = await api.get('/finance/invoices/all')
  return res.data
}

export async function createInvoice(dto: {
  lease_id: string
  tenant_id: string
  unit_id: string
  due_date: string
  items: { type: string; amount: number; description?: string }[]
  status?: string
}) {
  const res = await api.post('/finance/invoices', dto)
  return res.data
}

export async function updateDraftInvoice(id: string, dto: {
  due_date: string
  items: { type: string; amount: number; description?: string }[]
}) {
  const res = await api.patch(`/finance/invoices/${id}/draft`, dto)
  return res.data
}

export async function voidInvoice(id: string) {
  const res = await api.delete(`/finance/invoices/${id}`)
  return res.data
}

export async function confirmInvoice(id: string) {
  const res = await api.patch(`/finance/invoices/${id}/confirm`)
  return res.data
}

export async function bulkConfirmInvoices(ids: string[]) {
  const res = await api.post('/finance/invoices/bulk-confirm', { ids })
  return res.data
}

export async function generateInvoices(dto: { site_id?: string; building_id?: string }) {
  const res = await api.post('/finance/invoices/generate', dto)
  return res.data
}

// --- Payments ---
export async function createPayment(dto: {
  invoice_id: string
  amount: number
  reference_no: string
  proof_url?: string
  bank_account_id?: string
}) {
  const res = await api.post('/finance/payments', dto)
  return res.data
}

// Backend now extracts verified_by from req.user (JWT), status and optional reason are needed in body
export async function verifyPayment(id: string, dto: { status: 'confirmed' | 'rejected'; reason?: string }) {
  const res = await api.patch(`/finance/payments/${id}/verify`, dto)
  return res.data
}

export async function getAnalytics() {
  const res = await api.get('/finance/analytics')
  return res.data
}

export async function resendInvoice(id: string) {
  const res = await api.post(`/finance/invoices/${id}/resend`)
  return res.data
}

export async function getTenantLedger(tenantId: string) {
  const res = await api.get(`/finance/ledger/tenant/${tenantId}`)
  return res.data
}

export async function getMySummary() {
  const res = await api.get('/finance/my-summary')
  return res.data
}

export function getTenantLedgerPdfUrl(tenantId: string) {
  const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
  return `${baseUrl}/finance/ledger/tenant/${tenantId}/pdf`
}

export async function downloadTenantLedgerPdf(tenantId: string) {
  const res = await api.get(`/finance/ledger/tenant/${tenantId}/pdf`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `ledger-${tenantId}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function getPaymentReceiptPdfUrl(paymentId: string) {
  const baseUrl = (api.defaults.baseURL || '').replace(/\/$/, '')
  return `${baseUrl}/finance/payments/${paymentId}/receipt`
}

export async function downloadPaymentReceiptPdf(paymentId: string) {
  const res = await api.get(`/finance/payments/${paymentId}/receipt`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `receipt-${paymentId}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// --- Deposit Advice ---
export async function createDepositAdvice(dto: {
  bank_account_id: string
  amount: number
  deposit_date: string
  reference_no: string
  proof_url?: string
}) {
  const res = await api.post('/finance/deposit-advice', dto)
  return res.data
}

export async function verifyDepositAdvice(id: string, dto: { status: 'confirmed' | 'rejected' }) {
  const res = await api.patch(`/finance/deposit-advice/${id}/verify`, dto)
  return res.data
}

export async function getDepositAdvices() {
  const res = await api.get('/finance/deposit-advice')
  return res.data
}

// --- Tax Rules ---
export async function updateTaxRules(dto: any) {
  const res = await api.post('/finance/tax-rules', dto)
  return res.data
}

export async function patchTaxRules(dto: { vat_rate: number; withholding_rate: number }) {
  const res = await api.patch('/finance/tax-rules', dto)
  return res.data
}

// --- Reports ---
export async function getRevenueReport(params?: { building_id?: string; month?: string }) {
  const res = await api.get('/finance/reports/revenue', { params })
  return res.data
}

export async function getTaxReport(params?: { month?: string }) {
  const res = await api.get('/finance/reports/tax', { params })
  return res.data
}

// --- Expenses ---
export async function getExpenses(params?: {
  building_id?: string
  category?: string
  start_date?: string
  end_date?: string
}) {
  const res = await api.get('/finance/expenses', { params })
  return res.data
}

export async function createExpense(dto: {
  amount: number
  date: string
  category: string
  description?: string
  building_id?: string
  bank_account_id?: string
  receipt_url?: string
}) {
  const res = await api.post('/finance/expenses', dto)
  return res.data
}

// --- Profit & Loss ---
export async function getPandLReport(params?: {
  building_id?: string
  year?: number
  month?: number
}) {
  const res = await api.get('/finance/reports/p-and-l', { params })
  return res.data
}

// --- Upload ---
export async function uploadTransactionProof(file: File, type: 'documents' | 'misc' | 'finance' = 'finance') {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/upload/${file.type.startsWith('image/') ? 'image' : 'document'}`, formData, {
    params: { type },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data // Expected { path: string }
}
