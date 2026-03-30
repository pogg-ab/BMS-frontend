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

  return (
    <PageLayout title="Document Center" subtitle="Automated contract generation and document lifecycle management">
      {/* Tabs */}
      <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit mb-8">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.key 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="text-indigo-500" />
              {isTemplate ? 'New Template' : 'Upload Document'}
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              {!isTemplate && (
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
                  placeholder="Paste HTML Template here (use {{tenant_name}}, {{lease_start}}, etc.)"
                  className="w-full p-4 border rounded-2xl h-48 text-sm font-mono dark:bg-slate-900 dark:text-white"
                  value={templateContent}
                  onChange={e => setTemplateContent(e.target.value)}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-bold">Category</label>
                  <select 
                    value={uploadCategory} 
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-bold">Expiry Date</label>
                  <input 
                    type="date" 
                    value={uploadExpiry} 
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-bold">Module Type</label>
                  <select
                    value={uploadModuleType}
                    onChange={e => setUploadModuleType(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold"
                  >
                    {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 font-bold">Module ID</label>
                  <select
                    value={uploadModuleId}
                    onChange={e => setUploadModuleId(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold"
                  >
                    <option value="">Select ID</option>
                    {moduleIdOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                {uploading ? 'Processing...' : isTemplate ? 'Save Template' : 'Upload Document'}
              </button>
            </form>
          </div>

          {tab === 'templates' && (
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:border-slate-800 p-8 rounded-[32px] border border-indigo-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-400">
                <Wand2 />
                Generate Contract
              </h3>
              <div className="space-y-4">
                <select 
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold"
                  value={genLeaseId}
                  onChange={e => setGenLeaseId(e.target.value)}
                >
                  <option value="">Select Lease</option>
                  {allLeases.map(l => <option key={l.id} value={l.id}>Lease #{l.id.slice(0,8)}</option>)}
                </select>
                <select 
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold"
                  value={genTemplateId}
                  onChange={e => setGenTemplateId(e.target.value)}
                >
                  <option value="">Select Template</option>
                  {docs.filter(d => d.is_template).map(t => <option key={t.id} value={t.id}>{t.file_name}</option>)}
                </select>
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !genLeaseId || !genTemplateId}
                  className="w-full py-4 bg-white dark:bg-slate-800 text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Magic Generate'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tab === 'templates' ? 'Active Templates' : 'Document Library'}
              </h3>
              <div className="flex gap-2">
                <input 
                  placeholder="Search filename..." 
                  className="p-2 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
                <select 
                  className="p-2 text-sm bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white font-bold"
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
