import api from './axios'

export async function listOwners({ page = 1, per_page = 50 } = {}) {
  const res = await api.get('/owners', { params: { page, per_page } })
  return res.data
}

export async function createOwner(dto: any) {
  const res = await api.post('/owners', dto)
  return res.data
}

export async function getOwner(id: string | number) {
  const res = await api.get(`/owners/${id}`)
  return res.data
}

export async function updateOwner(id: string | number, dto: any) {
  const res = await api.put(`/owners/${id}`, dto)
  return res.data
}

export async function deleteOwner(id: string | number) {
  const res = await api.delete(`/owners/${id}`)
  return res.data
}
