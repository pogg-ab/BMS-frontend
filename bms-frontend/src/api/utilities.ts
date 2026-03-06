import axios from './axios'

export function createMeter(dto: any) {
  return axios.post('/utilities/meters', dto).then(r => r.data)
}

export function listMeters(params?: any) {
  return axios.get('/utilities/meters', { params }).then(r => r.data)
}

export function createReading(payload: any) {
  // payload may be FormData (photo) or JSON
  if (payload instanceof FormData) return axios.post('/utilities/readings', payload).then(r => r.data)
  return axios.post('/utilities/readings', payload).then(r => r.data)
}

export function listReadings(params?: any) {
  return axios.get('/utilities/readings', { params }).then(r => r.data)
}

export default { createMeter, listMeters, createReading, listReadings }
