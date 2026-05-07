import React, { useState } from 'react'
import { Calendar, Mail, Clock, X, CheckCircle2 } from 'lucide-react'
import { createSchedule } from '../api/reports'
import { useToast } from './ToastProvider'

interface ScheduleReportModalProps {
  onClose: () => void
}

const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const toast = useToast()
  
  const [form, setForm] = useState({
    name: '',
    frequency: 'WEEKLY',
    format: 'PDF',
    email_recipients: '',
    report_type: 'revenue'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createSchedule({
        ...form,
        email_recipients: form.email_recipients.split(',').map(e => e.trim())
      })
      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      toast.addToast('Failed to create schedule', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-700">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Success!</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Your report schedule has been created and activated.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Automate Reports</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get insights delivered straight to your inbox.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 overflow-y-auto">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Schedule Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Monthly Revenue Summary"
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 ring-indigo-500/20"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Frequency</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 appearance-none pl-10"
                    value={form.frequency}
                    onChange={e => setForm({...form, frequency: e.target.value})}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Format</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 ring-indigo-500/20 appearance-none pl-10"
                    value={form.format}
                    onChange={e => setForm({...form, format: e.target.value})}
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="CSV">CSV Spreadsheet</option>
                  </select>
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Report Type</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 ring-indigo-500/20"
                value={form.report_type}
                onChange={e => setForm({...form, report_type: e.target.value})}
              >
                <option value="revenue">Financial Overview</option>
                <option value="occupancy">Occupancy Trends</option>
                <option value="maintenance">Maintenance Analytics</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Recipients</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-3.5 pl-10 text-sm font-bold focus:ring-2 ring-indigo-500/20"
                  value={form.email_recipients}
                  onChange={e => setForm({...form, email_recipients: e.target.value})}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Separate multiple emails with commas.</p>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-4 rounded-2xl text-sm font-black shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Activate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleReportModal
