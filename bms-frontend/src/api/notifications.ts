import api from './axios'

export async function getNotifications() {
  const res = await api.get('/notifications')
  return res.data
}

export async function markAllAsRead() {
  const res = await api.patch('/notifications/read-all')
  return res.data
}

export async function deleteNotification(id: string) {
  const res = await api.delete(`/notifications/${id}`)
  return res.data
}

export async function sendAnnouncement(dto: {
  title: string
  message: string
  targetUserIds?: string[]
}) {
  const res = await api.post('/notifications/announce', dto)
  return res.data
}
