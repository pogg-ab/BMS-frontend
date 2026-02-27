import axios from './axios'

export interface AmenityCreateDTO {
  name: string
  description?: string
  category?: string
}

export function listAmenities(params?: any) {
  return axios.get('/amenities', { params }).then(r => r.data)
}

export function getAmenity(id: string | number) {
  return axios.get(`/amenities/${id}`).then(r => r.data)
}

export function createAmenity(dto: AmenityCreateDTO) {
  return axios.post('/amenities', dto).then(r => r.data)
}

export function updateAmenity(id: string | number, dto: Partial<AmenityCreateDTO>) {
  return axios.put(`/amenities/${id}`, dto).then(r => r.data)
}

export function deleteAmenity(id: string | number) {
  return axios.delete(`/amenities/${id}`).then(r => r.data)
}

export function linkAmenityToBuilding(buildingId: string | number, amenityId: string | number) {
  return axios.post(`/amenities/buildings/${buildingId}/amenities/${amenityId}`).then(r => r.data)
}

export function removeAmenityFromBuilding(buildingId: string | number, amenityId: string | number) {
  return axios.delete(`/amenities/buildings/${buildingId}/amenities/${amenityId}`).then(r => r.data)
}

export function linkAmenityToUnitByIds(unitId: string | number, amenityId: string | number) {
  return axios.post(`/amenities/units/${unitId}/amenities/${amenityId}`).then(r => r.data)
}

export function removeAmenityFromUnitByIds(unitId: string | number, amenityId: string | number) {
  return axios.delete(`/amenities/units/${unitId}/amenities/${amenityId}`).then(r => r.data)
}

export default {
  listAmenities,
  getAmenity,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  linkAmenityToBuilding,
  removeAmenityFromBuilding,
  linkAmenityToUnitByIds,
  removeAmenityFromUnitByIds,
}
