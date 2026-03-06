import axios from './axios'

export interface LeaseDraftDTO {
  unit_id: number | string
  tenant_id: number | string
  start_date: string
  end_date: string
  rent: number
  deposit?: number
  payment_schedule?: string
  terms?: string
}

export function createLease(dto: LeaseDraftDTO) {
  return axios.post('/leases', dto).then(r => r.data)
}

export function listLeases(params?: any) {
  return axios.get('/leases', { params }).then(r => {
    // normalize responses: prefer `data.data` (paginated envelope) or `data` which may already be the array
    if (r?.data && Array.isArray(r.data.data)) return r.data.data
    if (r?.data && Array.isArray(r.data)) return r.data
    return []
  })
}

export function activateLease(id: string | number, dto: any) {
  return axios.patch(`/leases/${id}/activate`, dto).then(r => r.data)
}

export function terminateLease(id: string | number, dto: any) {
  return axios.patch(`/leases/${id}/terminate`, dto).then(r => r.data)
}

export function renewLease(id: string | number, dto: any) {
  return axios.post(`/leases/${id}/renew`, dto).then(r => r.data)
}

export function uploadLeaseDocument(id: string | number, payload: any) {
  // payload may be FormData (file) or JSON
  if (payload instanceof FormData) return axios.post(`/leases/${id}/upload`, payload).then(r => r.data)
  return axios.post(`/leases/${id}/upload`, payload).then(r => r.data)
}

export function downloadLease(id: string | number) {
  // Request as arraybuffer so callers can create a Blob with the correct mime type
  return axios.get(`/leases/${id}/download`, { responseType: 'arraybuffer' }).then(r => r)
}

export default {
  createLease,
  listLeases,
  activateLease,
  terminateLease,
  renewLease,
  uploadLeaseDocument,
  downloadLease,
}
