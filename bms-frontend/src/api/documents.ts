import api from './axios'

export async function uploadDocument(formData: FormData) {
  const res = await api.post('/documents/upload', formData)
  return res.data
}

export async function searchDocuments(filters?: {
  module_type?: string
  module_id?: string
  file_name?: string
  date?: string
}) {
  const res = await api.get('/documents/search', { params: filters })
  return res.data
}

export async function getDocumentHistory(id: string) {
  const res = await api.get(`/documents/${id}/history`)
  return res.data
}

export async function deleteDocument(id: string) {
  const res = await api.delete(`/documents/${id}`)
  return res.data
}

export async function generateContract(data: { lease_id: string; template_id: string }) {
  const res = await api.post('/documents/generate-contract', data)
  return res.data
}

export async function promoteToTenantAndVerify(documentId: string, data: { tenant_id: string; type: string }) {
  const res = await api.post(`/documents/${documentId}/promote-to-tenant/verify`, data)
  return res.data
}
