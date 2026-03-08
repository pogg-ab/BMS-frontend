import React, { useEffect, useState, useRef } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as docApi from '../api/documents'

type Tab = 'browse' | 'history'

const TABS: { key: Tab; label: string }[] = [
  { key: 'browse', label: 'Upload & Browse' },
  { key: 'history', label: 'Version History' },
]

const MODULE_TYPES = ['lease', 'tenant', 'maintenance', 'payment', 'building']

export default function Documents() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('browse')

  // Upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadModuleType, setUploadModuleType] = useState('lease')
  const [uploadModuleId, setUploadModuleId] = useState('')
  const [uploading, setUploading] = useState(false)

  // Search / Browse
  const [docs, setDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterName, setFilterName] = useState('')

  // History
  const [historyDocId, setHistoryDocId] = useState('')
  const [versions, setVersions] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (tab === 'browse') loadDocuments()
  }, [tab, filterType])

  async function loadDocuments() {
    setDocsLoading(true)
    try {
      const filters: any = {}
      if (filterType) filters.module_type = filterType
      if (filterName) filters.file_name = filterName
      const data = await docApi.searchDocuments(filters)
      setDocs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load documents', 'error')
    } finally { setDocsLoading(false) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile) { toast.addToast('Select a file', 'error'); return }
    if (!uploadModuleId) { toast.addToast('Enter a module ID', 'error'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('module_type', uploadModuleType)
      formData.append('module_id', uploadModuleId)
      await docApi.uploadDocument(formData)
      toast.addToast('Document uploaded', 'success')
      setUploadFile(null)
      setUploadModuleId('')
      if (fileRef.current) fileRef.current.value = ''
      loadDocuments()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Upload failed', 'error')
    } finally { setUploading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      await docApi.deleteDocument(id)
      toast.addToast('Document deleted', 'success')
      loadDocuments()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Delete failed', 'error')
    }
  }

  async function handleViewHistory(id: string) {
    setHistoryDocId(id)
    setTab('history')
    setHistLoading(true)
    try {
      const data = await docApi.getDocumentHistory(id)
      setVersions(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.addToast('Failed to load history', 'error')
    } finally { setHistLoading(false) }
  }

  function formatFileSize(bytes: number) {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <PageLayout title="Documents" subtitle="Upload, search, and manage documents across modules">
      {/* Tab Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ────── BROWSE TAB ────── */}
      {tab === 'browse' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Upload Document</h3>
              <form onSubmit={handleUpload} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadFile ? (
                      <div>
                        <span className="text-blue-600 font-medium">{uploadFile.name}</span>
                        <span className="text-sm text-gray-400 ml-2">({formatFileSize(uploadFile.size)})</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <div className="text-3xl mb-1">📄</div>
                        Click to select a file
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module Type</label>
                    <select
                      value={uploadModuleType}
                      onChange={e => setUploadModuleType(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module ID</label>
                    <input
                      placeholder="e.g. lease or tenant ID"
                      value={uploadModuleId}
                      onChange={e => setUploadModuleId(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Search & Filter</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module Type</label>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">All Types</option>
                    {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <input
                    placeholder="Search by file name..."
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={loadDocuments}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 border rounded bg-blue-50 text-center">
                  <div className="text-2xl font-bold text-blue-700">{docs.length}</div>
                  <div className="text-xs text-gray-500">Total Documents</div>
                </div>
                <div className="p-3 border rounded bg-green-50 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {formatFileSize(docs.reduce((s, d) => s + (d.file_size || 0), 0))}
                  </div>
                  <div className="text-xs text-gray-500">Total Size</div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">Documents</h3>
            {docsLoading ? <div className="text-gray-500">Loading...</div> : docs.length === 0 ? (
              <div className="text-gray-400 text-sm">No documents found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="p-3">File Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Version</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc: any) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{doc.file_name}</td>
                        <td className="p-3 text-xs text-gray-500">{doc.mime_type}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            {doc.module_type}
                          </span>
                        </td>
                        <td className="p-3 text-xs">{formatFileSize(doc.file_size)}</td>
                        <td className="p-3 text-xs">v{doc.version || 1}</td>
                        <td className="p-3 space-x-2">
                          <button onClick={() => handleViewHistory(doc.id)} className="text-blue-600 hover:underline text-xs">
                            History
                          </button>
                          <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:underline text-xs">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────── HISTORY TAB ────── */}
      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Version History {historyDocId && <span className="text-sm text-gray-400 ml-2">Doc: {historyDocId.slice(0, 8)}…</span>}</h3>
            <button onClick={() => setTab('browse')} className="text-sm text-blue-600 hover:underline">← Back to Browse</button>
          </div>

          {!historyDocId ? (
            <div className="text-gray-400 text-sm">Select a document from the Browse tab to view its history.</div>
          ) : histLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="text-gray-400 text-sm">No previous versions found. This is the first version.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="p-3">Version</th>
                    <th className="p-3">Storage Path</th>
                    <th className="p-3">Uploaded At</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v: any, i: number) => (
                    <tr key={v.id || i} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">v{v.version_number}</td>
                      <td className="p-3 text-xs text-gray-500 max-w-[300px] truncate">{v.storage_path}</td>
                      <td className="p-3 text-xs">{v.uploaded_at ? new Date(v.uploaded_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
