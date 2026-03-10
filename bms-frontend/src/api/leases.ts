import axios from './axios'

export interface LeaseDraftDTO {
  unit_id: number | string
  tenant_id: number | string
  building_id: number | string
  start_date: string
  end_date: string
  rent: number
  deposit?: number
  payment_schedule?: string
  billing_cycle?: string
  terms?: string
}

export function createLease(dto: LeaseDraftDTO) {
  const payload = { ...dto }
  if (payload.payment_schedule) {
    payload.billing_cycle = payload.payment_schedule.toUpperCase()
    delete payload.payment_schedule
  }
  return axios.post('/leases', payload).then(r => r.data)
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
  const payload = { ...dto }
  // Map frontend fields (new_start_date, rent) to backend DTO fields (start_date, rent_amount)
  if (payload.new_start_date) {
    payload.start_date = payload.new_start_date
    delete payload.new_start_date
  }
  if (payload.new_end_date) {
    payload.end_date = payload.new_end_date
    delete payload.new_end_date
  }
  if (payload.rent !== undefined) {
    payload.rent_amount = payload.rent
    delete payload.rent
  }
  if (payload.billing_cycle) {
    payload.billing_cycle = payload.billing_cycle.toUpperCase()
  }
  return axios.post(`/leases/${id}/renew`, payload).then(r => r.data)
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
