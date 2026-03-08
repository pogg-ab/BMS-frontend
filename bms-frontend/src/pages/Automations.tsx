import React, { useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as automationsApi from '../api/automations'

const JOBS = [
  { name: 'lease-expiry', label: 'Lease Expiry Scanner', description: 'Notifies tenants whose leases are expiring in 30, 14, or 7 days.', icon: '📋' },
  { name: 'payment-deadline', label: 'Payment Deadline Scanner', description: 'Sends reminders for invoices due in 5 days and marks overdue invoices.', icon: '💰' },
  { name: 'utility-sync', label: 'Monthly Utility Sync', description: 'Processes unbilled meter readings and prepares them for invoicing.', icon: '⚡' },
]

export default function Automations() {
  const toast = useToast()
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})

  async function handleRunJob(jobName: string) {
    setRunning(jobName)
    try {
      const data = await automationsApi.runJob(jobName)
      setResults(prev => ({ ...prev, [jobName]: { success: true, data, time: new Date().toLocaleTimeString() } }))
      toast.addToast(`Job "${jobName}" executed successfully`, 'success')
    } catch (e: any) {
      setResults(prev => ({ ...prev, [jobName]: { success: false, error: e?.response?.data?.message || e.message, time: new Date().toLocaleTimeString() } }))
      toast.addToast(e?.response?.data?.message || `Job "${jobName}" failed`, 'error')
    } finally { setRunning(null) }
  }

  return (
    <PageLayout title="Automations" subtitle="Manage and manually trigger scheduled background jobs">
      <div className="space-y-4">
        {JOBS.map(job => (
          <div key={job.name} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{job.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg">{job.label}</h3>
                  <p className="text-sm text-gray-500">{job.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Runs automatically via cron. Use the button for a manual override.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {results[job.name] && (
                  <div className={`text-xs px-3 py-1 rounded-full ${results[job.name].success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {results[job.name].success ? '✓ Success' : '✗ Failed'} at {results[job.name].time}
                  </div>
                )}
                <button
                  onClick={() => handleRunJob(job.name)}
                  disabled={running === job.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {running === job.name ? 'Running...' : 'Run Now'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold mb-3">Cron Schedule</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-3">Job</th>
                <th className="p-3">Schedule</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">Lease Expiry</td>
                <td className="p-3 font-mono text-xs">Every day at 1:00 AM</td>
                <td className="p-3 text-gray-500">Checks for leases expiring in 30/14/7 days</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">Payment Deadline</td>
                <td className="p-3 font-mono text-xs">Every day at 1:00 AM</td>
                <td className="p-3 text-gray-500">Reminder 5 days before due, marks overdue</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">Utility Sync</td>
                <td className="p-3 font-mono text-xs">25th of every month at 1:00 AM</td>
                <td className="p-3 text-gray-500">Processes unbilled meter readings</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
