import api from './axios'

const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:2546'

export async function generateQr(unitId: string) {
  const res = await api.post(`/qr/generate/${unitId}`)
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
  const params = ids?.length ? `?ids=${ids.join(',')}` : ''
  return `${BASE}/qr/export/pdf${params}`
}
