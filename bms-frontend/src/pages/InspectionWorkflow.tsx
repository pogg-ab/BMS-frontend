import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, AlertTriangle, Camera, 
  ChevronRight, ChevronLeft, Save, Send,
  Info, LayoutGrid, Home, Settings
} from 'lucide-react'
import axios from '../api/axios'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'

export const InspectionWorkflow = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [inspection, setInspection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0) // 0: Start, 1: Items, 2: Submit
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    axios.get(`/inspections/${id}`)
      .then(r => setInspection(r.data))
      .catch(() => toast.addToast('Failed to load inspection', 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const categories = inspection?.items ? Array.from(new Set(inspection.items.map((i: any) => i.room_category))) : []

  const updateItem = async (itemId: string, updates: any) => {
    setSyncing(true)
    try {
      await axios.patch(`/inspections/items/${itemId}`, updates)
      setInspection((prev: any) => ({
        ...prev,
        items: prev.items.map((i: any) => i.id === itemId ? { ...i, ...updates } : i)
      }))
    } catch (err) {
      toast.addToast('Failed to save update', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    
    setSyncing(true)
    try {
      const res = await axios.post('/upload', formData)
      const newPhotoUrl = res.data.url
      const item = inspection.items.find((i: any) => i.id === itemId)
      const photos = [...(item.photos || []), newPhotoUrl]
      await updateItem(itemId, { photos })
    } catch (err) {
      toast.addToast('Photo upload failed', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await axios.post(`/inspections/${id}/submit`, { notes: inspection.notes })
      toast.addToast('Inspection submitted successfully!', 'success')
      navigate('/tenant-dashboard')
    } catch (err) {
      toast.addToast('Failed to submit inspection', 'error')
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Inspection...</div>
  if (!inspection) return <div className="p-8 text-center">Inspection Not Found</div>

  return (
    <PageLayout 
      title={`${inspection.type === 'MOVE_IN' ? 'Move-in' : 'Move-out'} Inspection`}
      subtitle={`Unit ${inspection.lease?.unit?.unit_number} — ${inspection.lease?.unit?.building?.name}`}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-between relative px-2">
          {[0, 1, 2].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${activeStep >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {activeStep > s ? <CheckCircle2 size={20} /> : s + 1}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${activeStep >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
                {['Start', 'Checklist', 'Review'][s]}
              </span>
            </div>
          ))}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0" />
          <div className={`absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500 -z-0`} style={{ width: `${(activeStep / 2) * 100}%` }} />
        </div>

        {/* Step 0: Welcome */}
        {activeStep === 0 && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
              <Info size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Unit Condition Report</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Please go through each item in your unit. Take photos of any pre-existing damage or issues to ensure they are documented.
            </p>
            <button
              onClick={() => setActiveStep(1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 mx-auto"
            >
              Start Checklist <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 1: Checklist */}
        {activeStep === 1 && (
          <div className="space-y-12 pb-20">
            {categories.map((cat: any) => (
              <div key={cat} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 px-2">
                  <LayoutGrid size={20} className="text-indigo-500" />
                  {cat}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {inspection.items.filter((i: any) => i.room_category === cat).map((item: any) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.item_name}</span>
                        <div className="flex gap-2">
                          {['GOOD', 'FAIR', 'POOR', 'BROKEN'].map((cond) => (
                            <button
                              key={cond}
                              onClick={() => updateItem(item.id, { condition: cond })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                item.condition === cond 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400'
                              }`}
                            >
                              {cond}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea
                          placeholder="Add comments or details about any issues..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20"
                          rows={2}
                          defaultValue={item.comment}
                          onBlur={(e) => updateItem(item.id, { comment: e.target.value })}
                        />
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-4 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all text-sm font-medium">
                            <Camera size={18} />
                            Add Photo
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(item.id, e)} />
                          </label>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {item.photos?.map((p: string) => (
                              <div key={p} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                                <img src={p} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 z-50">
              <div className="max-w-4xl mx-auto flex gap-4">
                <button
                  onClick={() => setActiveStep(0)}
                  className="flex-1 px-6 py-3 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20"
                >
                  Review Submission
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {activeStep === 2 && (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review & Submit</h2>
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block">General Conclusion / Notes</label>
              <textarea
                placeholder="Any final notes about the unit condition..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                rows={4}
                value={inspection.notes}
                onChange={(e) => setInspection({ ...inspection, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveStep(1)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Edit Checklist
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                {loading ? 'Submitting...' : <><Send size={20} /> Complete Inspection</>}
              </button>
            </div>
            <div className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-700 dark:text-indigo-400 text-sm">
              <Settings className="w-5 h-5 mt-0.5 shrink-0" />
              <p>By submitting this report, you acknowledge that the condition stated above is accurate to the best of your knowledge.</p>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  )
}
