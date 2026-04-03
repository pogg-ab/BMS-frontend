import api from './axios'

export async function listAssets(params?: any) {
  const res = await api.get('/assets', { params })
  return res.data
}

export async function createAsset(dto: any) {
  const res = await api.post('/assets', dto)
  return res.data
}

export async function updateAsset(id: string | number, dto: any) {
  const res = await api.patch(`/assets/${id}`, dto)
  return res.data
}

export async function deleteAsset(id: string | number) {
  const res = await api.delete(`/assets/${id}`)
  return res.data
}

export async function getAsset(id: string | number) {
  const res = await api.get(`/assets/${id}`)
  return res.data
}
