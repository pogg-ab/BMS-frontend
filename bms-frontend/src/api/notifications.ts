import api from './axios'

export async function getNotifications(userId: string) {
  const res = await api.get('/notifications', { params: { user_id: userId } })
  return res.data
}

export async function markAllAsRead(userId: string) {
  const res = await api.patch('/notifications/read-all', null, { params: { user_id: userId } })
  return res.data
}

export async function deleteNotification(id: string, userId: string) {
  const res = await api.delete(`/notifications/${id}`, { params: { user_id: userId } })
  return res.data
}

export async function sendAnnouncement(dto: {
  title: string
  message: string
  targetUserIds?: string[]
}, superAdminId: string) {
  const res = await api.post('/notifications/announce', dto, { params: { super_admin_id: superAdminId } })
  return res.data
}
