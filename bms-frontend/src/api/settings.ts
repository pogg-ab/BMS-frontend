import api from './axios'

export async function getSettings() {
  const res = await api.get('/settings')
  return res.data
}

export async function updateSettings(data: {
  company_name?: string
  tin_number?: string
  vat_number?: string
  vat_rate?: number
  withholding_rate?: number
  late_fee_percentage?: number
  late_fee_type?: 'PERCENTAGE' | 'FLAT'
  late_fee_flat_amount?: number
  late_fee_grace_period_days?: number
  early_termination_penalty_pct?: number
  rent_escalation_pct?: number
  default_lease_duration_months?: number
  logo?: File
}) {
  const formData = new FormData()
  if (data.company_name) formData.append('company_name', data.company_name)
  if (data.tin_number) formData.append('tin_number', data.tin_number)
  if (data.vat_number) formData.append('vat_number', data.vat_number)
  if (data.vat_rate !== undefined) formData.append('vat_rate', String(data.vat_rate))
  if (data.withholding_rate !== undefined) formData.append('withholding_rate', String(data.withholding_rate))
  if (data.late_fee_percentage !== undefined) formData.append('late_fee_percentage', String(data.late_fee_percentage))
  if (data.late_fee_type !== undefined) formData.append('late_fee_type', data.late_fee_type)
  if (data.late_fee_flat_amount !== undefined) formData.append('late_fee_flat_amount', String(data.late_fee_flat_amount))
  if (data.late_fee_grace_period_days !== undefined) formData.append('late_fee_grace_period_days', String(data.late_fee_grace_period_days))
  if (data.early_termination_penalty_pct !== undefined) formData.append('early_termination_penalty_pct', String(data.early_termination_penalty_pct))
  if (data.rent_escalation_pct !== undefined) formData.append('rent_escalation_pct', String(data.rent_escalation_pct))
  if (data.default_lease_duration_months !== undefined) formData.append('default_lease_duration_months', String(data.default_lease_duration_months))
  if (data.logo) formData.append('logo', data.logo)
  const res = await api.patch('/settings', formData)
  return res.data
}
