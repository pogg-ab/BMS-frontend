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
  logo?: File
}) {
  const formData = new FormData()
  if (data.company_name) formData.append('company_name', data.company_name)
  if (data.tin_number) formData.append('tin_number', data.tin_number)
  if (data.vat_number) formData.append('vat_number', data.vat_number)
  if (data.vat_rate !== undefined) formData.append('vat_rate', String(data.vat_rate))
  if (data.withholding_rate !== undefined) formData.append('withholding_rate', String(data.withholding_rate))
  if (data.logo) formData.append('logo', data.logo)
  const res = await api.patch('/settings', formData)
  return res.data
}
