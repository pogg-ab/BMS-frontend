import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as settingsApi from '../api/settings'
import { Building2, Landmark, Gavel, ClipboardList, Upload, Save, CheckCircle2, AlertCircle, Percent, Calendar, FileText, Image as ImageIcon } from 'lucide-react'

export default function Settings() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form States
  const [companyName, setCompanyName] = useState('')
  const [tinNumber, setTinNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [vatRate, setVatRate] = useState(0.15)
  const [withholdingRate, setWithholdingRate] = useState(0.02)
  const [lateFee, setLateFee] = useState(2.0)
  const [penaltyPct, setPenaltyPct] = useState(0.0)
  const [escalationPct, setEscalationPct] = useState(0.0)
  const [defaultDuration, setDefaultDuration] = useState(12)
  const [logoPath, setLogoPath] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => { loadSettings() }, [])

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
        setLateFee(Number(data.late_fee_percentage) || 2.0)
        setPenaltyPct(Number(data.early_termination_penalty_pct) || 0)
        setEscalationPct(Number(data.rent_escalation_pct) || 0)
        setDefaultDuration(Number(data.default_lease_duration_months) || 12)
        setLogoPath(data.logo_path || '')
      }
    } catch (e: any) {
      toast.addToast('Failed to load system settings', 'error')
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
        company_name: companyName, tin_number: tinNumber, vat_number: vatNumber,
        vat_rate: vatRate, withholding_rate: withholdingRate, late_fee_percentage: lateFee,
        early_termination_penalty_pct: penaltyPct, rent_escalation_pct: escalationPct,
        default_lease_duration_months: defaultDuration, logo: logoFile || undefined,
      })
      toast.addToast('System configuration updated', 'success')
      setLogoFile(null); setLogoPreview(''); loadSettings()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Update failed', 'error')
    } finally { setSaving(false) }
  }

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:2546'

  return (
    <PageLayout 
      title="Global Settings" 
      subtitle="Configure organization identity, tax policies, and default lease parameters."
    >
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 pb-20 max-w-6xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: IDENTITIY & LOGO */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" /> Organization Logo
                </h3>
                
                <div className="relative group">
                  <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : logoPath ? (
                      <img src={`${apiBase}${logoPath}`} alt="Current" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center text-slate-300">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-wider">No Logo Uploaded</p>
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all rounded-2xl">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <Upload size={18} className="text-indigo-600" />
                    </div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-4 text-center">Recommend 512x512px SVG or transparent PNG.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ClipboardList size={16} className="text-emerald-500" /> Profile Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Vendor</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{companyName || 'Not Set'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax ID (TIN)</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{tinNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT Reg.</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{vatNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CORE FORMS */}
            <div className="lg:col-span-2 space-y-8">
              {/* Organization Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Legal Identity</h3>
                    <p className="text-sm text-slate-500 font-medium">Core business information used for invoicing and contracts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company Legal Name</label>
                    <input required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">TIN Number</label>
                    <input required value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">VAT Number</label>
                    <input required value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Taxation & Rates</h3>
                    <p className="text-sm text-slate-500 font-medium">Define automatic calculation values for your transactions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">VAT Rate (Decimal)</label>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{(vatRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" step="0.01" min="0" max="1" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Withholding Rate</label>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{(withholdingRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" step="0.01" min="0" max="1" value={withholdingRate} onChange={e => setWithholdingRate(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lease Policy Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                    <Gavel size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lease Enforcement</h3>
                    <p className="text-sm text-slate-500 font-medium">Standardized terms and penalty procedures for tenant management.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Daily Late Fee (%)</label>
                    <input type="number" step="0.1" min="0" value={lateFee} onChange={e => setLateFee(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400 mt-2">Applied to outstanding balance after grace period.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Duration (Months)</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" min="1" step="1" value={defaultDuration} onChange={e => setDefaultDuration(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Termination Penalty (%)</label>
                    <input type="number" step="0.1" min="0" value={penaltyPct} onChange={e => setPenaltyPct(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400 mt-2">% of remaining total rent charged as penalty fee.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rent Escalation (%)</label>
                    <input type="number" step="0.1" min="0" value={escalationPct} onChange={e => setEscalationPct(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400 mt-2">Standard annual percentage increase for renewals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOAT BAR FOR SAVE */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'UPDATING CONFIG...' : 'PUBLISH CHANGES'}
            </button>
          </div>
        </form>
      )}
    </PageLayout>
  )
}
