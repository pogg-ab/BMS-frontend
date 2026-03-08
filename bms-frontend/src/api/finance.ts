import api from './axios'

// --- Bank Accounts ---
export async function createBankAccount(dto: { bank_name: string; account_number: string; branch: string }) {
  const res = await api.post('/finance/bank-accounts', dto)
  return res.data
}

export async function getBankAccounts() {
  const res = await api.get('/finance/bank-accounts')
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
}) {
  const res = await api.post('/finance/invoices', dto)
  return res.data
}

export async function voidInvoice(id: string) {
  const res = await api.delete(`/finance/invoices/${id}`)
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
}) {
  const res = await api.post('/finance/payments', dto)
  return res.data
}

// Backend now extracts verified_by from req.user (JWT), only status is needed in body
export async function verifyPayment(id: string, dto: { status: 'confirmed' | 'rejected' }) {
  const res = await api.patch(`/finance/payments/${id}/verify`, dto)
  return res.data
}

// --- Deposit Advice ---
export async function createDepositAdvice(dto: {
  bank_account_id: string
  amount: number
  deposit_date: string
  reference_no: string
}) {
  const res = await api.post('/finance/deposit-advice', dto)
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
