import api from './axios'

const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'https://bms.skylinkict.com'

export async function generateQr(unitId: string) {
  const res = await api.post(`/qr/generate/${unitId}`)
  return res.data
}

export async function generateBuildingQr(buildingId: string) {
  const res = await api.post(`/qr/generate-building/${buildingId}`)
  return res.data
}

export function getQrPngUrl(token: string) {
  return `${BASE}/qr/${token}/png`
}

export async function getAnalytics(limit?: number) {
  const res = await api.get('/qr/analytics', { params: limit ? { limit } : {} })
  return res.data
}

export async function deactivateQr(id: string) {
  const res = await api.patch(`/qr/${id}/deactivate`)
  return res.data
}

export function getExportPdfUrl(ids?: string[]) {
  const q = ids ? `?ids=${ids.join(',')}` : ''
  return `${api.defaults.baseURL}/qr/export/pdf${q}`
}

export async function getStats() {
  const res = await api.get('/qr/analytics/stats')
  return res.data
}

export async function getLogs(limit = 100) {
  const res = await api.get(`/qr/analytics/logs?limit=${limit}`)
  return res.data
}

export async function exportPdf(ids?: string[]) {
  const url = getExportPdfUrl(ids)
  const res = await api.get(url, { responseType: 'blob' })
  return res.data
}

export async function downloadQrPng(token: string) {
  const url = getQrPngUrl(token)
  const res = await api.get(url, { responseType: 'blob' })
  return res.data
}
