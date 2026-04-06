import api from './axios'

export async function getNotifications() {
  const res = await api.get('/notifications')
  return res.data
}

export async function markAllAsRead() {
  const res = await api.patch('/notifications/read-all')
  return res.data
}

export async function markAsRead(id: string) {
  const res = await api.patch(`/notifications/${id}/read`)
  return res.data
}

export async function deleteNotification(id: string) {
  const res = await api.delete(`/notifications/${id}`)
  return res.data
}

export async function registerDevice(fcm_token: string, device_type: string = 'web') {
  const res = await api.post('/notifications/devices', { fcm_token, device_type })
  return res.data
}

export async function unregisterDevice(token: string) {
  const res = await api.delete(`/notifications/devices/${token}`)
  return res.data
}

export async function sendAnnouncement(dto: {
  title: string
  message: string
  targetUserIds?: string[]
  buildingId?: string
  siteId?: string
}) {
  const res = await api.post('/notifications/announce', dto)
  return res.data
}
