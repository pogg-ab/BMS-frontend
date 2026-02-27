import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { logout } from '../auth/auth'
import PageLayout from '../components/PageLayout'

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data)).catch(() => {})
  }, [])

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Overview and reports"
      actions={<button className="px-3 py-2 bg-white text-blue-600 rounded-md" onClick={() => { logout(); window.location.href = '/login' }}>Logout</button>}
    >
      <div className="-mt-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <pre className="text-sm">{JSON.stringify(data || { message: 'No data yet' }, null, 2)}</pre>
        </div>
      </div>
    </PageLayout>
  )
}
