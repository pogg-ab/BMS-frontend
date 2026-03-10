import api from './axios'

// --- Requests ---
export async function getRequests() {
  const res = await api.get('/maintenance/requests')
  return res.data
}

export async function submitRequest(dto: {
  tenant_id: string
  unit_id: string
  category: string
  priority: string
  description: string
}) {
  const res = await api.post('/maintenance/requests', {
    unit_id: dto.unit_id,
    category: dto.category.toUpperCase(),
    priority: dto.priority.toUpperCase(),
    description: dto.description,
  }, { params: { tenant_id: dto.tenant_id } })
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

// --- Work Orders ---
export async function getWorkOrders() {
  const res = await api.get('/maintenance/work-orders')
  return res.data
}

export async function convertToWorkOrder(dto: {
  request_id: string
  contractor_id: string
  scheduled_date: string
  assigned_by: string
}) {
  const res = await api.post('/maintenance/work-orders', {
    request_id: dto.request_id,
    contractor_id: dto.contractor_id,
    scheduled_date: dto.scheduled_date,
  }, { params: { assigned_by: dto.assigned_by } })
  return res.data
}

export async function updateWorkOrderStatus(id: string, status: string, proof?: File) {
  const upperStatus = status.toUpperCase()
  if (proof) {
    const formData = new FormData()
    formData.append('status', upperStatus)
    formData.append('proof', proof)
    const res = await api.patch(`/maintenance/work-orders/${id}`, formData)
    return res.data
  }
  const res = await api.patch(`/maintenance/work-orders/${id}`, { status: upperStatus })
  return res.data
}

// --- Feedback ---
export async function submitFeedback(dto: {
  work_order_id: string
  tenant_id: string
  rating: number
  comment?: string
}) {
  const res = await api.post('/maintenance/feedback', dto)
  return res.data
}

// --- Reports ---
export async function getReport() {
  const res = await api.get('/maintenance/reports')
  return res.data
}
