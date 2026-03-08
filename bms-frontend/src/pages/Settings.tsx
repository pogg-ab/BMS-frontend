import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as settingsApi from '../api/settings'

export default function Settings() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [tinNumber, setTinNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [vatRate, setVatRate] = useState(0.15)
  const [withholdingRate, setWithholdingRate] = useState(0.02)
  const [logoPath, setLogoPath] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await settingsApi.getSettings()
      if (data) {
        setCompanyName(data.company_name || '')
        setTinNumber(data.tin_number || '')
        setVatNumber(data.vat_number || '')
        setVatRate(Number(data.vat_rate) || 0.15)
        setWithholdingRate(Number(data.withholding_rate) || 0.02)
        setLogoPath(data.logo_path || '')
      }
    } catch (e: any) {
      console.error(e)
      toast.addToast('Failed to load settings', 'error')
    } finally { setLoading(false) }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.updateSettings({
        company_name: companyName,
        tin_number: tinNumber,
        vat_number: vatNumber,
        vat_rate: vatRate,
        withholding_rate: withholdingRate,
        logo: logoFile || undefined,
      })
      toast.addToast('Settings saved successfully', 'success')
      setLogoFile(null)
      setLogoPreview('')
      loadSettings()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Save failed', 'error')
    } finally { setSaving(false) }
  }

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:2546'

  if (loading) {
    return (
      <PageLayout title="Settings" subtitle="Organization configuration">
        <div className="text-gray-500">Loading settings...</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Settings" subtitle="Organization configuration and tax rates">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold mb-4 text-lg">Organization Details</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number</label>
                <input
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                <input
                  value={vatNumber}
                  onChange={e => setVatNumber(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={vatRate}
                    onChange={e => setVatRate(parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">({(vatRate * 100).toFixed(0)}%)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withholding Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={withholdingRate}
                    onChange={e => setWithholdingRate(parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">({(withholdingRate * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full p-2 border rounded" />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Logo Preview + Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">Logo Preview</h3>
            <div className="border-2 border-dashed rounded-lg p-6 text-center min-h-[150px] flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="New logo" className="max-h-[120px] object-contain" />
              ) : logoPath ? (
                <img src={`${apiBase}${logoPath}`} alt="Current logo" className="max-h-[120px] object-contain" />
              ) : (
                <div className="text-gray-400">
                  <div className="text-4xl mb-2">🏢</div>
                  <span className="text-sm">No logo uploaded</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4 text-lg">Current Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">Company</span>
                <span className="font-medium">{companyName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">TIN</span>
                <span className="font-medium">{tinNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">VAT Number</span>
                <span className="font-medium">{vatNumber || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-500">VAT Rate</span>
                <span className="font-medium">{(vatRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Withholding</span>
                <span className="font-medium">{(withholdingRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
