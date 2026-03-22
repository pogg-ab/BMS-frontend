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
}) {
  const query = dto.assigned_by ? `?assigned_by=${dto.assigned_by}` : ''
  const res = await api.post(`/maintenance/work-orders${query}`, {
    request_id: dto.request_id,
    contractor_id: dto.contractor_id,
    scheduled_date: dto.scheduled_date,
    cost_estimate: dto.cost_estimate,
  })
  return res.data
}

export async function updateWorkOrderStatus(id: string, status: string, actual_cost?: number, proof?: File) {
  const upperStatus = status.toUpperCase()
  const formData = new FormData()
  formData.append('status', upperStatus)
  if (actual_cost !== undefined) {
    formData.append('actual_cost', String(actual_cost))
  }
  
  if (proof) {
    formData.append('proof', proof)
    const res = await api.patch(`/maintenance/work-orders/${id}`, formData)
    return res.data
  }

  // If no proof, we still use PATCH but check if backend prefers JSON for non-file updates
  // Assuming the backend handles multipart/form-data for both cases since @UseInterceptors(FileInterceptor) is likely present
  const res = await api.patch(`/maintenance/work-orders/${id}`, formData)
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
