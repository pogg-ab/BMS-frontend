import axios from './axios'

export interface SiteCreateDTO {
  name: string
  code?: string
  address?: string
  timezone?: string
  currency?: string
  contact_email?: string
  notes?: string
}

export function createSite(dto: SiteCreateDTO) {
  return axios.post('/sites', dto).then(r => r.data)
}

export function listSites(params?: any) {
  return axios.get('/sites', { params }).then(r => (r.data && r.data.data ? r.data.data : r.data))
}

export function getSite(id: string | number) {
  return axios.get(`/sites/${id}`).then(r => r.data)
}

export function updateSite(id: string | number, dto: Partial<SiteCreateDTO>) {
  return axios.patch(`/sites/${id}`, dto).then(r => r.data)
}

export function deleteSite(id: string | number) {
  return axios.delete(`/sites/${id}`).then(r => r.data)
}

export default { createSite, listSites, getSite, updateSite, deleteSite }
