import axios from './axios'

export interface TenantRegisterDTO {
  name: string
  email: string
  password: string
  phone?: string
  preferred_unit_id?: number | string
}

export function listTenants(params?: any) {
  return axios.get('/tenants', { params }).then(r => (r.data && r.data.data ? r.data.data : r.data))
}

export function registerTenant(dto: TenantRegisterDTO) {
  return axios.post('/tenants/register', dto).then(r => r.data)
}

export function createApplication(dto: any) {
  return axios.post('/applications', dto).then(r => r.data)
}

export function listPendingApplications(params?: any) {
  return axios.get('/applications/pending', { params }).then(r => (r.data && r.data.data ? r.data.data : r.data))
}

export async function getTenant(id: string | number) {
  try {
    const res = await axios.get(`/tenants/${id}`)
    return res.data
  } catch (err: any) {
    // If the server doesn't expose GET /tenants/:id, try a safe fallback
    // by querying the tenants list with an id filter. This handles
    // backends that only support filtered list endpoints.
    if (err?.response?.status === 404) {
      try {
        const list = await axios.get('/tenants', { params: { id } }).then(r => (r.data && r.data.data ? r.data.data : r.data))
        if (Array.isArray(list)) return list[0] || null
        return list || null
      } catch (e) {
        // swallow and rethrow original error below
      }
    }
    throw err
  }
}

export function updateTenant(id: string | number, dto: any) {
  return axios.patch(`/tenants/${id}`, dto).then(r => r.data)
}

export function createDocument(dto: any) {
  // expects multipart/form-data
  // When sending FormData, do NOT set Content-Type manually so the browser
  // can append the correct multipart boundary header.
  if (dto instanceof FormData) {
    return axios.post('/documents', dto).then(r => r.data)
  }
  return axios.post('/documents', dto).then(r => r.data)
}

export function listDocuments(params?: any) {
  return axios.get('/documents', { params }).then(r => (r.data && r.data.data ? r.data.data : r.data))
}

export function verifyDocument(id: string | number, dto: any) {
  return axios.patch(`/documents/${id}/verify`, dto).then(r => r.data)
}

export function createAnnouncement(dto: any) {
  return axios.post('/announcements', dto).then(r => r.data)
}

export function listAnnouncements(params?: any) {
  return axios.get('/announcements', { params }).then(r => (r.data && r.data.data ? r.data.data : r.data))
}

export function sendMessage(dto: any) {
  return axios.post('/messages', dto).then(r => r.data)
}

export function getMessages(tenantId: string | number) {
  return axios.get(`/messages/${tenantId}`).then(r => r.data)
}

export default {
  listTenants,
  registerTenant,
  createApplication,
  listPendingApplications,
  createDocument,
  listDocuments,
  verifyDocument,
  createAnnouncement,
  listAnnouncements,
  sendMessage,
  getMessages,
}
