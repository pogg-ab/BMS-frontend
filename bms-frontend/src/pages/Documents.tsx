import React, { useEffect, useState, useRef, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as docApi from '../api/documents'
import { listLeases } from '../api/leases'
import { listTenants } from '../api/tenants'
import { listBuildings } from '../api/buildings'
import { 
  FileText, Upload, History, Filter, 
  AlertCircle, CheckCircle2, FileJson, 
  Calendar, Trash2, Clock, Wand2
} from 'lucide-react'

type Tab = 'browse' | 'history' | 'templates'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'browse', label: 'Upload & Browse', icon: Upload },
  { key: 'templates', label: 'Contract Templates', icon: FileJson },
  { key: 'history', label: 'Version History', icon: History },
]

const MODULE_TYPES = ['lease', 'tenant', 'maintenance', 'payment', 'building']
const CATEGORIES = ['CONTRACT', 'ID', 'RECEIPT', 'INSURANCE', 'OTHER']

export default function Documents() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('browse')

  // Upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadModuleType, setUploadModuleType] = useState('lease')
  const [uploadModuleId, setUploadModuleId] = useState('')
  const [uploadCategory, setUploadCategory] = useState('OTHER')
  const [uploadExpiry, setUploadExpiry] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [uploading, setUploading] = useState(false)

  // Search / Browse
  const [docs, setDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterName, setFilterName] = useState('')

  // Contract Generation
  const [genLeaseId, setGenLeaseId] = useState('')
  const [genTemplateId, setGenTemplateId] = useState('')
  const [generating, setGenerating] = useState(false)

  // History
  const [historyDocId, setHistoryDocId] = useState('')
  const [versions, setVersions] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)

  // Lookups
  const [allLeases, setAllLeases] = useState<any[]>([])
  const [allTenants, setAllTenants] = useState<any[]>([])
  const [allBuildings, setAllBuildings] = useState<any[]>([])

  useEffect(() => {
    loadDocuments()
  }, [tab, filterType, filterCategory])

  useEffect(() => {
    listLeases({ page: 1, per_page: 500 }).then(res => setAllLeases(res || [])).catch(console.error)
    listTenants({ page: 1, per_page: 500 }).then(res => setAllTenants(res?.data || res || [])).catch(console.error)
    listBuildings({ page: 1, per_page: 500 }).then(res => setAllBuildings(res?.data || res || [])).catch(console.error)
  }, [])

  const moduleIdOptions = useMemo(() => {
    switch (uploadModuleType) {
      case 'lease': return allLeases.map(l => ({ value: l.id, label: `Lease #${l.id.slice(0,8)} — ${l.tenant?.first_name || 'N/A'}` }))
      case 'tenant': return allTenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
      case 'building': return allBuildings.map(b => ({ value: b.id, label: b.name }))
      default: return []
    }
  }, [uploadModuleType, allLeases, allTenants, allBuildings])

  async function loadDocuments() {
    setDocsLoading(true)
    try {
      const filters: any = {}
      if (filterType) filters.module_type = filterType
      if (filterCategory) filters.category = filterCategory
      if (filterName) filters.file_name = filterName
      if (tab === 'templates') filters.is_template = true
      
      const data = await docApi.searchDocuments(filters)
      setDocs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.addToast('Failed to load documents', 'error')
    } finally { setDocsLoading(false) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile && !isTemplate) { toast.addToast('Select a file', 'error'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      if (uploadFile) formData.append('file', uploadFile)
      formData.append('module_type', uploadModuleType)
      formData.append('module_id', uploadModuleId)
      formData.append('category', uploadCategory)
      if (uploadExpiry) formData.append('expiry_date', uploadExpiry)
      if (isTemplate) {
        formData.append('is_template', 'true')
        formData.append('template_content', templateContent)
      }
      
      await docApi.uploadDocument(formData)
      toast.addToast('Document processed', 'success')
      resetForm()
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Operation failed', 'error')
    } finally { setUploading(false) }
  }

  function resetForm() {
    setUploadFile(null)
    setUploadModuleId('')
    setUploadExpiry('')
    setIsTemplate(false)
    setTemplateContent('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleGenerate() {
    if (!genLeaseId || !genTemplateId) return
    setGenerating(true)
    try {
      await docApi.generateContract({ lease_id: genLeaseId, template_id: genTemplateId })
      toast.addToast('Contract generated successfully!', 'success')
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Contract generation failed', 'error')
    } finally { setGenerating(false) }
  }

  const getExpiryStatus = (date: string) => {
    if (!date) return null
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50 border-rose-100' }
    if (days < 30) return { label: `Expires in ${days}d`, color: 'text-amber-600 bg-amber-50 border-amber-100' }
    return { label: `Valid (${days}d)`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      await docApi.deleteDocument(id)
      toast.addToast('Document deleted', 'success')
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Delete failed', 'error')
    }
  }

  async function handlePromoteAndVerify(doc: any) {
    if (!doc || !doc.id || !doc.module_id) { toast.addToast('Cannot verify this document', 'error'); return }
    try {
      // Determine tenant id and type
      const tenantId = doc.module_type === 'tenant' ? doc.module_id : null
      if (!tenantId) { toast.addToast('Document is not linked to a tenant', 'error'); return }
      // map category or use PRIMARY_ID by default
      const dtype = (doc.category && ['ID','PRIMARY_ID','PASSPORT'].includes(doc.category)) ? doc.category : 'PRIMARY_ID'
      await docApi.promoteToTenantAndVerify(doc.id, { tenant_id: tenantId, type: dtype })
      toast.addToast('Document promoted and verified', 'success')
      loadDocuments()
    } catch (e: any) {
      console.error('Promote+verify failed', e)
      toast.addToast('Operation failed', 'error')
    }
  }

  return (
    <PageLayout title="Document Center" subtitle="Automated contract generation and document lifecycle management">
      {/* Tabs */}
      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full sm:w-fit mb-8">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              tab === t.key 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="text-indigo-500" size={20} />
              {isTemplate ? 'New Template' : 'Upload Document'}
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              {!isTemplate && (
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 break-all px-2">
                    {uploadFile ? uploadFile.name : 'Click to upload document'}
                  </p>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 text-slate-800 dark:text-slate-200">
                <input 
                  type="checkbox" 
                  checked={isTemplate} 
                  onChange={e => setIsTemplate(e.target.checked)}
                  className="rounded text-indigo-600 bg-white"
                />
                <span className="text-sm font-bold">Mark as Contract Template</span>
              </div>

              {isTemplate && (
                <textarea
                  placeholder="Paste HTML Template here..."
                  className="w-full p-4 border rounded-2xl h-48 text-sm font-mono dark:bg-slate-900 dark:text-white"
                  value={templateContent}
                  onChange={e => setTemplateContent(e.target.value)}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Category</label>
                  <select 
                    value={uploadCategory} 
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={uploadExpiry} 
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Module Type</label>
                  <select
                    value={uploadModuleType}
                    onChange={e => setUploadModuleType(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Module ID <span className="text-red-500">*</span></label>
                  <select
                    value={uploadModuleId}
                    onChange={e => setUploadModuleId(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    <option value="">Select ID</option>
                    {moduleIdOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm sm:text-base"
              >
                {uploading ? 'Processing...' : isTemplate ? 'Save Template' : 'Upload Document'}
              </button>
            </form>
          </div>

          {tab === 'templates' && (
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-indigo-100 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-400">
                <Wand2 size={20} />
                Generate Contract
              </h3>
              <div className="space-y-4">
                <select 
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold text-sm"
                  value={genLeaseId}
                  onChange={e => setGenLeaseId(e.target.value)}
                >
                  <option value="">Select Lease</option>
                  {allLeases.map(l => <option key={l.id} value={l.id}>Lease #{l.id.slice(0,8)}</option>)}
                </select>
                <select 
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold text-sm"
                  value={genTemplateId}
                  onChange={e => setGenTemplateId(e.target.value)}
                >
                  <option value="">Select Template</option>
                  {docs.filter(d => d.is_template).map(t => <option key={t.id} value={t.id}>{t.file_name}</option>)}
                </select>
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !genLeaseId || !genTemplateId}
                  className="w-full py-3.5 sm:py-4 bg-white dark:bg-slate-800 text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  {generating ? 'Generating...' : 'Magic Generate'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tab === 'templates' ? 'Active Templates' : 'Document Library'}
              </h3>
              <div className="flex flex-col xs:flex-row gap-2">
                <input 
                  placeholder="Search filename..." 
                  className="p-2.5 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white flex-1"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
                <select 
                  className="p-2.5 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white font-bold"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {docsLoading ? (
              <div className="py-20 text-center animate-pulse text-indigo-600">Scanning library...</div>
            ) : docs.length === 0 ? (
              <div className="py-20 text-center text-slate-400">No documents found matching criteria.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map(doc => {
                  const expiry = getExpiryStatus(doc.expiry_date)
                  return (
                    <div key={doc.id} className="group p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                      <div className="flex items-start justify-between text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600">
                            {doc.is_template ? <FileJson size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold truncate max-w-[150px]">{doc.file_name}</h4>
                            <p className="text-xs text-slate-500">{doc.category} • v{doc.version}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {expiry && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${expiry.color}`}>
                              {expiry.label}
                            </span>
                          )}
                          <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(doc.id)} className="p-2 bg-white dark:bg-slate-800 text-rose-500 rounded-lg shadow-sm hover:bg-rose-50"><Trash2 size={14} /></button>
                            {doc.module_type === 'tenant' && (
                              <button onClick={() => handlePromoteAndVerify(doc)} className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600 flex items-center gap-2 px-3">
                                <CheckCircle2 size={14} /> Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
