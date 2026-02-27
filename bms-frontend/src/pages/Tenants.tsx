import React, { useEffect, useState, useRef } from 'react'
import { 
  listTenants, 
  registerTenant, 
  listPendingApplications, 
  getTenant, 
  updateTenant, 
  createDocument, 
  listDocuments, 
  verifyDocument, 
  createAnnouncement, 
  sendMessage, 
  getMessages, 
  listAnnouncements 
} from '../api/tenants'
import { getProfile } from '../auth/auth'
import { useToast } from '../components/ToastProvider'
import {
  FiUsers,
  FiUserPlus,
  FiClock,
  FiSearch,
  FiFilter,
  FiDownload,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiUpload,
  FiMessageSquare,
  FiBell,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUser,
  FiCalendar,
  FiHome,
  FiBriefcase,
  FiHash,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSave,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi'

interface Tenant {
  id: number
  first_name?: string
  last_name?: string
  name?: string
  email: string
  phone?: string
  tin_number?: string
  vat_reg_number?: string
  status: string
  created_at?: string
  unit?: {
    unit_number: string
    building?: {
      id: number
      name: string
    }
  }
  building?: {
    id: number
    name: string
  }
}

interface Document {
  id: number
  type: string
  filename?: string
  file_name?: string
  name?: string
  status: string
}

interface Message {
  id: number
  subject?: string
  title?: string
  body?: string
  message?: string
  created_at?: string
}

interface Announcement {
  id: number
  title: string
  body: string
  created_at?: string
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const itemsPerPage = 10

  // Modals state
  const [showRegister, setShowRegister] = useState(false)
  const [showApplications, setShowApplications] = useState(false)
  const [showDetail, setShowDetail] = useState<boolean>(false)
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  
  const [applications, setApplications] = useState<any[]>([])
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)
  const [editing, setEditing] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'messages' | 'announcements'>('details')
  
  const toast = useToast()

  async function load() {
    setLoading(true)
    try {
      const res = await listTenants({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setTenants(list)
    } catch (e: any) {
      console.error('load tenants', e)
      toast.addToast('Failed to load tenants', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter(tenant => {
    const fullName = `${tenant.first_name || tenant.name || ''} ${tenant.last_name || ''}`.toLowerCase()
    const matchesSearch = searchTerm === '' || 
      fullName.includes(searchTerm.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone?.includes(searchTerm)
    
    const matchesStatus = selectedStatus === 'all' || tenant.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    try {
      await registerTenant({ name, email, password, phone })
      setShowRegister(false)
      setName(''); setEmail(''); setPassword(''); setPhone('')
      load()
      toast.addToast('Tenant registered successfully', 'success')
    } catch (err: any) {
      console.error('register', err)
      const msg = err?.response?.data?.message
      toast.addToast(Array.isArray(msg) ? msg.join(',') : (msg || 'Failed to register'), 'error')
    }
  }

  async function openApplications() {
    setShowApplications(true)
    try {
      const res = await listPendingApplications({ page: 1, per_page: 200 })
      const list = Array.isArray(res) ? res : (res?.data || res || [])
      setApplications(list)
    } catch (e: any) {
      console.error('load applications', e)
      toast.addToast('Failed to load applications', 'error')
    }
  }

  async function openDetail(id: any) {
    setShowDetail(true)
    setDetailTenant(null)
    setActiveTab('details')
    try {
      const d = await getTenant(id)
      setDetailTenant(d)
      
      // Load related data
      try {
        const docs = await listDocuments({ tenant_id: id })
        setDocuments(Array.isArray(docs) ? docs : (docs?.data || docs || []))
      } catch (e) {
        setDocuments([])
      }
      
      try {
        const msgs = await getMessages(id)
        setMessages(Array.isArray(msgs) ? msgs : (msgs?.data || msgs || []))
      } catch (e) {
        setMessages([])
      }
      
      try {
        const annParams: any = {}
        if (d.unit && d.unit.building && d.unit.building.id) annParams.building_id = d.unit.building.id
        else if (d.building && d.building.id) annParams.building_id = d.building.id
        const anns = await listAnnouncements(annParams)
        setAnnouncements(Array.isArray(anns) ? anns : (anns?.data || anns || []))
      } catch (e) {
        setAnnouncements([])
      }
    } catch (e: any) {
      console.error('load tenant', e)
      toast.addToast('Failed to load tenant details', 'error')
      setShowDetail(false)
    }
  }

  async function handleUpdateTenant(e: React.FormEvent) {
    e.preventDefault()
    if (!detailTenant) return
    try {
      const updated = await updateTenant(detailTenant.id, detailTenant)
      setDetailTenant(updated)
      setEditing(false)
      load()
      toast.addToast('Tenant updated successfully', 'success')
    } catch (err: any) {
      console.error('update tenant', err)
      toast.addToast(err?.response?.data?.message || 'Failed to update tenant', 'error')
    }
  }

  async function handleUploadDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!detailTenant) return
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.addToast('Please select a file', 'error'); return }
    
    const fd = new FormData()
    fd.append('tenant_id', String(detailTenant.id))
    fd.append('type', 'id_card')
    fd.append('file', file)
    
    try {
      await createDocument(fd)
      toast.addToast('Document uploaded successfully', 'success')
      const docs = await listDocuments({ tenant_id: detailTenant.id })
      setDocuments(Array.isArray(docs) ? docs : (docs?.data || docs || []))
    } catch (err: any) {
      console.error('upload doc', err)
      toast.addToast(err?.response?.data?.message || 'Upload failed', 'error')
    }
  }

  async function handleVerifyDocument(docId: any, action = 'verify') {
    if (!detailTenant) return
    try {
      const profile = await getProfile()
      const reviewer_id = profile?.id
      await verifyDocument(docId, { 
        action, 
        reviewer_id, 
        notes: action === 'verify' ? 'Verified by admin' : 'Rejected' 
      })
      toast.addToast(`Document ${action}ed successfully`, 'success')
      const docs = await listDocuments({ tenant_id: detailTenant.id })
      setDocuments(Array.isArray(docs) ? docs : (docs?.data || docs || []))
    } catch (err: any) {
      console.error('verify doc', err)
      toast.addToast(err?.response?.data?.message || 'Verification failed', 'error')
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!detailTenant) return
    try {
      await sendMessage({ tenant_id: detailTenant.id, subject: messageSubject, body: messageBody })
      toast.addToast('Message sent successfully', 'success')
      setMessageSubject('')
      setMessageBody('')
      
      // Refresh messages
      const msgs = await getMessages(detailTenant.id)
      setMessages(Array.isArray(msgs) ? msgs : (msgs?.data || msgs || []))
    } catch (err: any) {
      console.error('send message', err)
      toast.addToast(err?.response?.data?.message || 'Failed to send message', 'error')
    }
  }

  async function handleCreateAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!detailTenant) return
    try {
      const scope: any = {}
      if (detailTenant.unit?.id) scope.unit_id = detailTenant.unit.id
      else if (detailTenant.building?.id) scope.building_id = detailTenant.building.id
      
      await createAnnouncement({ title: announcementTitle, body: announcementBody, scope })
      toast.addToast('Announcement created successfully', 'success')
      setAnnouncementTitle('')
      setAnnouncementBody('')
    } catch (err: any) {
      console.error('announcement', err)
      toast.addToast(err?.response?.data?.message || 'Failed to create announcement', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FiUsers className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Tenants</h1>
                <p className="text-blue-100 text-sm mt-1">Manage all tenant information and applications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRegister(true)}
                className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiUserPlus className="mr-2" />
                Register Tenant
              </button>
              <button
                onClick={openApplications}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiClock className="mr-2" />
                Pending Applications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <FiFilter className="text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <FiDownload className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tenant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tax Info</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <FiRefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading tenants...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FiUsers className="h-12 w-12 mb-3" />
                        <p className="text-lg font-medium">No tenants found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {(tenant.first_name?.[0] || tenant.name?.[0] || 'T').toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => openDetail(tenant.id)}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {tenant.first_name || tenant.name || ''} {tenant.last_name || ''}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMail className="h-3.5 w-3.5 mr-1" />
                            {tenant.email}
                          </div>
                          {tenant.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FiPhone className="h-3.5 w-3.5 mr-1" />
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900">TIN: {tenant.tin_number || '-'}</div>
                          <div className="text-gray-500 text-xs">VAT: {tenant.vat_reg_number || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.unit ? (
                          <div className="flex items-center text-sm">
                            <FiHome className="h-3.5 w-3.5 mr-1 text-gray-400" />
                            {tenant.unit.unit_number}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDetail(tenant.id)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800">
                          <FiMoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredTenants.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTenants.length)} of {filteredTenants.length} tenants
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Register Tenant Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FiUserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Register New Tenant</h3>
              </div>
              <button
                onClick={() => setShowRegister(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md"
                >
                  Register Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Applications Modal */}
      {showApplications && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <FiClock className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
              </div>
              <button
                onClick={() => setShowApplications(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FiClock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{a.tenant?.name}</p>
                        <p className="text-sm text-gray-500">Unit: {a.unit?.unit_number}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {showDetail && detailTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
                    {(detailTenant.first_name?.[0] || detailTenant.name?.[0] || 'T').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {detailTenant.first_name || detailTenant.name || ''} {detailTenant.last_name || ''}
                    </h3>
                    <p className="text-sm text-gray-500">Tenant ID: #{detailTenant.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => { setShowDetail(false); setDetailTenant(null); }}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-4 mt-6">
                {['details', 'documents', 'messages', 'announcements'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div>
                  {!editing ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Contact Information</label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-sm">
                              <FiMail className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{detailTenant.email}</span>
                            </div>
                            {detailTenant.phone && (
                              <div className="flex items-center text-sm">
                                <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-900">{detailTenant.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Tax Information</label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center text-sm">
                              <FiHash className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">TIN: {detailTenant.tin_number || '-'}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <FiBriefcase className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">VAT: {detailTenant.vat_reg_number || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Assignment</label>
                          <div className="mt-2 space-y-2">
                            {detailTenant.unit ? (
                              <div className="flex items-center text-sm">
                                <FiHome className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-900">
                                  Unit {detailTenant.unit.unit_number}
                                  {detailTenant.unit.building && ` (${detailTenant.unit.building.name})`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No unit assigned</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Status & Dates</label>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detailTenant.status)}`}>
                                {detailTenant.status}
                              </span>
                            </div>
                            {detailTenant.created_at && (
                              <div className="flex items-center text-sm">
                                <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-500">
                                  Joined {new Date(detailTenant.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateTenant} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            value={detailTenant.first_name || ''}
                            onChange={e => setDetailTenant({...detailTenant, first_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            value={detailTenant.last_name || ''}
                            onChange={e => setDetailTenant({...detailTenant, last_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            value={detailTenant.email || ''}
                            onChange={e => setDetailTenant({...detailTenant, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <input
                            value={detailTenant.phone || ''}
                            onChange={e => setDetailTenant({...detailTenant, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                          <input
                            value={detailTenant.tin_number || ''}
                            onChange={e => setDetailTenant({...detailTenant, tin_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                          <input
                            value={detailTenant.vat_reg_number || ''}
                            onChange={e => setDetailTenant({...detailTenant, vat_reg_number: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <button
                          type="submit"
                          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                        >
                          <FiSave className="mr-2" />
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <form onSubmit={handleUploadDocument} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        ref={fileRef}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <button
                        type="submit"
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      >
                        <FiUpload className="mr-2" />
                        Upload
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FiFileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No documents uploaded yet</p>
                      </div>
                    ) : (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FiFileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.filename || doc.file_name || doc.name}</p>
                              <p className="text-sm text-gray-500">Type: {doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {doc.status}
                            </span>
                            {doc.status !== 'verified' && (
                              <>
                                <button
                                  onClick={() => handleVerifyDocument(doc.id, 'verify')}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <FiCheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleVerifyDocument(doc.id, 'reject')}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FiXCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{msg.subject || msg.title}</p>
                            <p className="text-xs text-gray-500">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{msg.body || msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900">Send New Message</h4>
                    <input
                      placeholder="Subject"
                      value={messageSubject}
                      onChange={e => setMessageSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Message"
                      value={messageBody}
                      onChange={e => setMessageBody(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    >
                      <FiMessageSquare className="mr-2" />
                      Send Message
                    </button>
                  </form>
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {announcements.length === 0 ? (
                      <div className="text-center py-8">
                        <FiBell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No announcements yet</p>
                      </div>
                    ) : (
                      announcements.map((ann) => (
                        <div key={ann.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{ann.title}</p>
                            <p className="text-xs text-gray-500">
                              {ann.created_at ? new Date(ann.created_at).toLocaleString() : ''}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{ann.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleCreateAnnouncement} className="space-y-3 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900">Create Announcement</h4>
                    <input
                      placeholder="Title"
                      value={announcementTitle}
                      onChange={e => setAnnouncementTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <textarea
                      placeholder="Body"
                      value={announcementBody}
                      onChange={e => setAnnouncementBody(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="submit"
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    >
                      <FiBell className="mr-2" />
                      Create Announcement
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}