import api from './axios'

export async function runJob(jobName: string) {
  const res = await api.post(`/automations/run/${jobName}`)
  return res.data
}
