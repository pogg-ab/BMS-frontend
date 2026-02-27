import api from './axios'

export async function listUsers({ page = 1, per_page = 25, search = '' } = {}) {
  const res = await api.get('/users', { params: { page, per_page, search } })
  return res.data
}

export async function createUser(dto: any) {
  const res = await api.post('/users', dto)
  return res.data
}

export async function getUser(id: string | number) {
  const res = await api.get(`/users/${id}`)
  return res.data
}

export async function updateUser(id: string | number, dto: any) {
  const res = await api.patch(`/users/${id}`, dto)
  return res.data
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(`/users/${id}`)
  return res.data
}

export async function activateUser(id: string | number) {
  const res = await api.patch(`/users/${id}/activate`)
  return res.data
}

export async function assignRole(payload: { user_id: number | string; role_id: number }) {
  const res = await api.post('/users/assign-role', payload)
  return res.data
}
