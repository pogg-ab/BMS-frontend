import api from './axios'

export async function listUnits(params: any = {}) {
  const res = await api.get('/units', { params })
  return res.data
}

export async function createUnit(dto: any) {
  const res = await api.post('/units', dto)
  return res.data
}

export async function bulkUploadUnits(formData: FormData) {
  const res = await api.post('/units/bulk-upload', formData)
  return res.data
}

export async function getUnit(id: string | number) {
  const res = await api.get(`/units/${id}`)
  return res.data
}

export async function updateUnit(id: string | number, dto: any) {
  const res = await api.put(`/units/${id}`, dto)
  return res.data
}

export async function deleteUnit(id: string | number) {
  const res = await api.delete(`/units/${id}`)
  return res.data
}

export async function listUnitAmenities(id: string | number) {
  const res = await api.get(`/units/${id}/amenities`)
  return res.data
}

export async function linkAmenityToUnit(id: string | number, dto: any) {
  const res = await api.post(`/units/${id}/amenities`, dto)
  return res.data
}

export async function removeAmenityFromUnit(id: string | number, a_id: string | number) {
  const res = await api.delete(`/units/${id}/amenities/${a_id}`)
  return res.data
}
