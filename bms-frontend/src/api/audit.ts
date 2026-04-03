import axios from './axios'

export function getAuditLogs() {
  return axios.get('/audit').then(r => r.data)
}

export default {
  getAuditLogs
}
