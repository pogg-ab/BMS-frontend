import api from './axios'

export async function runJob(jobName: string) {
  const res = await api.post(`/automations/run/${jobName}`)
  return res.data
}

export async function getJobStatuses() {
  const res = await api.get('/automations/status')
  return res.data
}

export async function enableJob(jobName: string) {
  const res = await api.patch(`/automations/${jobName}/enable`)
  return res.data
}

export async function disableJob(jobName: string) {
  const res = await api.patch(`/automations/${jobName}/disable`)
  return res.data
}

export async function getLogs() {
  const res = await api.get('/automations/logs')
  return res.data
}
