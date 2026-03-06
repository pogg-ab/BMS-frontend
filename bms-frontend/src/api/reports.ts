import axios from './axios'

export function getDashboard() {
  return axios.get('/reports/dashboard').then(r => r.data)
}

export function getFinancial() {
  return axios.get('/reports/financial').then(r => r.data)
}

export function getOccupancy() {
  return axios.get('/reports/occupancy').then(r => r.data)
}

export default {
  getDashboard,
  getFinancial,
  getOccupancy,
}
