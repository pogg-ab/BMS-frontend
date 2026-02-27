import api from './axios'

export async function listRoles() {
  const res = await api.get('/roles')
  return res.data
}

export async function createRole(dto: any) {
  const res = await api.post('/roles', dto)
  return res.data
}

export async function getRole(id: string | number) {
  const res = await api.get(`/roles/${id}`)
  return res.data
}

export async function updateRole(id: string | number, dto: any) {
  const res = await api.put(`/roles/${id}`, dto)
  return res.data
}

export async function deleteRole(id: string | number) {
  const res = await api.delete(`/roles/${id}`)
  return res.data
}

export async function assignPermissions(roleId: string | number, payload: any) {
  const res = await api.post(`/roles/${roleId}/permissions`, payload)
  return res.data
}

export async function listPermissions() {
  const res = await api.get('/permissions')
  return res.data
}

export async function createPermission(dto: any) {
  const res = await api.post('/permissions', dto)
  return res.data
}

export async function deletePermission(id: string | number) {
  const res = await api.delete(`/permissions/${id}`)
  return res.data
}
