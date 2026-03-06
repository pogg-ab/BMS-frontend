import axios from './axios'

export function createVisitor(dto: any) {
  return axios.post('/visitors', dto).then(r => r.data)
}

export function listVisitors(params?: any) {
  return axios.get('/visitors', { params }).then(r => r.data)
}

export function getVisitor(id: string | number) {
  return axios.get(`/visitors/${id}`).then(r => r.data)
}

export function updateVisitor(id: string | number, dto: any) {
  return axios.patch(`/visitors/${id}`, dto).then(r => r.data)
}

export function deleteVisitor(id: string | number) {
  return axios.delete(`/visitors/${id}`).then(r => r.data)
}

export function checkoutVisitor(id: string | number) {
  return axios.patch(`/visitors/${id}/checkout`).then(r => r.data)
}

export default {
  createVisitor,
  listVisitors,
  getVisitor,
  updateVisitor,
  deleteVisitor,
  checkoutVisitor,
}
