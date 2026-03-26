import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as qrApi from '../api/qr'
import { listUnits } from '../api/units'

type Tab = 'manage' | 'analytics'

const TABS: { key: Tab; label: string }[] = [
  { key: 'manage', label: 'Generate & Manage' },
  { key: 'analytics', label: 'Analytics' },
]

export default function QR() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('manage')

  // Lookups
  const [units, setUnits] = useState<any[]>([])

  // Generate
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<any>(null)

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Selected for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadUnits()
  }, [])

  useEffect(() => {
    if (tab === 'analytics') loadAnalytics()
    if (tab === 'manage') loadAnalytics()
  }, [tab])

  async function loadUnits() {
    try {
      const u: any = await listUnits({ page: 1, per_page: 500 })
      const ul = Array.isArray(u) ? u : (u?.data || [])
      setUnits(ul)
    } catch (e: any) { console.error('load units', e) }
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const data = await qrApi.getAnalytics(100)
      setAnalyticsData(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load QR data', 'error')
    } finally { setAnalyticsLoading(false) }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUnitId) { toast.addToast('Select a unit', 'error'); return }
    setGenerating(true)
    try {
      const data = await qrApi.generateQr(selectedUnitId)
      setLastGenerated(data)
      toast.addToast('QR code generated', 'success')
      loadAnalytics()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Generate failed', 'error')
    } finally { setGenerating(false) }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this QR code?')) return
    try {
      await qrApi.deactivateQr(id)
      toast.addToast('QR code deactivated', 'success')
      loadAnalytics()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Deactivate failed', 'error')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleExportPdf() {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined
    const url = qrApi.getExportPdfUrl(ids)
    window.open(url, '_blank')
  }

  function unitLabel(u: any) {
    if (!u) return ''
    return u.unit_number || u.name || u.id
  }

  return (
    <PageLayout title="QR Codes" subtitle="Generate, manage, and export QR codes for units">
      {/* Tab Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 mb-6">
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

      {/* ────── MANAGE TAB ────── */}
      {tab === 'manage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generate Form */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">Generate QR Code</h3>
              <form onSubmit={handleGenerate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={selectedUnitId}
                    onChange={e => setSelectedUnitId(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select unit</option>
                    {units.map((u: any) => (
                      <option key={u.id} value={String(u.id)}>{unitLabel(u)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate QR'}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold mb-4 text-lg">QR Preview</h3>
              <div className="border-2 border-dashed rounded-lg p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                {lastGenerated?.token ? (
                  <>
                    <img
                      src={qrApi.getQrPngUrl(lastGenerated.token)}
                      alt="QR Code"
                      className="w-48 h-48 object-contain mb-3"
                    />
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Token:</strong> {lastGenerated.token}</div>
                      <div><strong>Unit:</strong> {lastGenerated.unit_id}</div>
                      <div><strong>Status:</strong> <span className="text-green-600">Active</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-4xl mb-2">📱</div>
                    <span className="text-sm">Generate a QR code to see the preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Codes Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">All QR Codes</h3>
              <button
                onClick={handleExportPdf}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              >
                📥 Export PDF {selectedIds.size > 0 ? `(${selectedIds.size})` : '(All)'}
              </button>
            </div>
            {analyticsLoading ? <div className="text-gray-500">Loading...</div> : analyticsData.length === 0 ? (
              <div className="text-gray-400 text-sm">No QR codes generated yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50 dark:bg-slate-900">
                      <th className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === analyticsData.length && analyticsData.length > 0}
                          onChange={() => {
                            if (selectedIds.size === analyticsData.length) setSelectedIds(new Set())
                            else setSelectedIds(new Set(analyticsData.map(q => q.id)))
                          }}
                        />
                      </th>
                      <th className="p-3">Token</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Building</th>
                      <th className="p-3">Scans</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.map((qr: any) => (
                      <tr key={qr.id} className="border-b hover:bg-gray-50 dark:bg-slate-900">
                        <td className="p-3">
                          <input type="checkbox" checked={selectedIds.has(qr.id)} onChange={() => toggleSelect(qr.id)} />
                        </td>
                        <td className="p-3 font-mono text-xs">{qr.token}</td>
                        <td className="p-3">{qr.unit_number || qr.unit_id?.slice(0, 8) || '-'}</td>
                        <td className="p-3">{qr.building || '-'}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {qr.scan_count || 0}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            qr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {qr.status}
                          </span>
                        </td>
                        <td className="p-3 space-x-2">
                          {qr.status === 'active' && (
                            <button onClick={() => handleDeactivate(qr.id)} className="text-red-600 hover:underline text-xs">
                              Deactivate
                            </button>
                          )}
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

      {/* ────── ANALYTICS TAB ────── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Total QR Codes</div>
              <div className="text-2xl font-bold text-blue-700">{analyticsData.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-700">{analyticsData.filter(q => q.status === 'active').length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Total Scans</div>
              <div className="text-2xl font-bold text-indigo-700">{analyticsData.reduce((s, q) => s + (q.scan_count || 0), 0)}</div>
            </div>
          </div>

          {/* Top Scanned */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">Top Scanned QR Codes</h3>
            {analyticsData.length === 0 ? (
              <div className="text-gray-400 text-sm">No scan data available yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="text-left border-b bg-gray-50 dark:bg-slate-900">
                      <th className="p-3">#</th>
                      <th className="p-3">Token</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Building</th>
                      <th className="p-3">Scans</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...analyticsData]
                      .sort((a, b) => (b.scan_count || 0) - (a.scan_count || 0))
                      .map((qr: any, i: number) => (
                        <tr key={qr.id} className="border-b hover:bg-gray-50 dark:bg-slate-900">
                          <td className="p-3 font-medium text-gray-400">{i + 1}</td>
                          <td className="p-3 font-mono text-xs">{qr.token}</td>
                          <td className="p-3">{qr.unit_number || '-'}</td>
                          <td className="p-3">{qr.building || '-'}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {qr.scan_count || 0}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              qr.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {qr.status}
                            </span>
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
    </PageLayout>
  )
}
