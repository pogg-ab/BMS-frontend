import api from './axios'

export async function listBuildings({ page = 1, per_page = 25 } = {}) {
  const res = await api.get('/buildings', { params: { page, per_page } })
  return res.data
}

export async function createBuilding(dto: any) {
  const res = await api.post('/buildings', dto)
  return res.data
}

export async function getBuilding(id: string | number) {
  const res = await api.get(`/buildings/${id}`)
  return res.data
}

export async function updateBuilding(id: string | number, dto: any) {
  const res = await api.put(`/buildings/${id}`, dto)
  return res.data
}

export async function deleteBuilding(id: string | number) {
  const res = await api.delete(`/buildings/${id}`)
  return res.data
}

export async function listAmenities(buildingId: string | number) {
  const res = await api.get(`/buildings/${buildingId}/amenities`)
  return res.data
}

export async function assignAdmin(buildingId: string | number, userId: string | number) {
  const res = await api.post(`/buildings/${buildingId}/assign-admin/${userId}`)
  return res.data
}

export async function listAdmins(buildingId: string | number) {
  const res = await api.get(`/buildings/${buildingId}/admins`)
  return res.data
}

export async function revokeAdmin(buildingId: string | number, userId: string | number) {
  const res = await api.delete(`/buildings/${buildingId}/admins/${userId}`)
  return res.data
}
