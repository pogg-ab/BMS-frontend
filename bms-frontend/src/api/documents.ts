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
