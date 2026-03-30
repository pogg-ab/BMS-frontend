import api from './axios'

// --- Requests ---
export async function getRequests() {
  const res = await api.get('/maintenance/requests')
  return res.data
}

export async function submitRequest(dto: {
  tenant_id?: string
  unit_id: string
  category: string
  priority: string
  description: string
}) {
  const res = await api.post('/maintenance/requests', {
    tenant_id: dto.tenant_id,
    unit_id: dto.unit_id,
    category: dto.category.toUpperCase(),
    priority: dto.priority.toUpperCase(),
    description: dto.description,
  })
  return res.data
}

export async function updateRequest(id: string, dto: any) {
  const payload = { ...dto }
  if (payload.status) payload.status = payload.status.toUpperCase()
  const res = await api.patch(`/maintenance/requests/${id}`, payload)
  return res.data
}

// --- Contractors ---
export async function getContractors() {
  const res = await api.get('/maintenance/contractors')
  return res.data
}

export async function createContractor(dto: {
  name: string
  phone: string
  specialization: string
}) {
  const res = await api.post('/maintenance/contractors', dto)
  return res.data
}

export async function updateContractor(id: string, dto: any) {
  const res = await api.patch(`/maintenance/contractors/${id}`, dto)
  return res.data
}

// --- Work Orders ---
export async function getWorkOrders() {
  const res = await api.get('/maintenance/work-orders')
  return res.data
}

export async function convertToWorkOrder(dto: {
  request_id: string
  contractor_id: string
  scheduled_date: string
  assigned_by?: string
  cost_estimate?: number
  photo_reported?: File
}) {
  const query = dto.assigned_by ? `?assigned_by=${dto.assigned_by}` : ''
  const formData = new FormData()
  formData.append('request_id', dto.request_id)
  formData.append('contractor_id', dto.contractor_id)
  formData.append('scheduled_date', dto.scheduled_date)
  if (dto.cost_estimate !== undefined) {
    formData.append('cost_estimate', String(dto.cost_estimate))
  }
  if (dto.photo_reported) {
    formData.append('photo_reported', dto.photo_reported)
  }

  const res = await api.post(`/maintenance/work-orders${query}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function updateWorkOrderStatus(id: string, status: string, actual_cost?: number, photo?: File) {
  const formData = new FormData()
  formData.append('status', status.toLowerCase())
  if (actual_cost !== undefined) {
    formData.append('actual_cost', String(actual_cost))
  }
  if (photo) {
    formData.append('photo', photo)
  }

  const res = await api.patch(`/maintenance/work-orders/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// --- Feedback ---
export async function submitMaintenanceFeedback(dto: {
  work_order_id: string
  rating: number
  comment?: string
}) {
  const res = await api.post('/maintenance/feedback', dto)
  return res.data
}

// --- Maintenance Schedules ---
export async function getSchedules(building_id?: string) {
  const res = await api.get('/maintenance/schedules', { params: { building_id } })
  return res.data
}

export async function createSchedule(dto: {
  name: string
  category: string
  priority: string
  frequency_days: number
  next_due_date: string
  description?: string
  building_id?: string
}) {
  const res = await api.post('/maintenance/schedules', dto)
  return res.data
}

export async function updateSchedule(id: string, dto: any) {
  const res = await api.patch(`/maintenance/schedules/${id}`, dto)
  return res.data
}

export async function deleteSchedule(id: string) {
  const res = await api.delete(`/maintenance/schedules/${id}`)
  return res.data
}

export async function runMaintenanceCron() {
  const res = await api.post('/maintenance/schedules/run-cron')
  return res.data
}

export async function runSlaCheck() {
  const res = await api.post('/maintenance/sla/check')
  return res.data
}

// --- Reports ---
export async function getReport() {
  const res = await api.get('/maintenance/reports')
  return res.data
}
