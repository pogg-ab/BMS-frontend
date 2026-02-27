import React, { useEffect, useState } from 'react'
import { getLoginHistory } from '../auth/auth'

export default function LoginHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getLoginHistory()
      .then((h) => { if (mounted) setHistory(Array.isArray(h) ? h : []) })
      .catch((e: any) => { if (mounted) setError(e?.response?.data?.message || 'Failed to load login history') })
    return () => { mounted = false }
  }, [])

  return (
    <div className="container">
      <h1>Login History</h1>
      <div className="card">
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {!error && history.length === 0 && <div>No login history found.</div>}
        {history.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>When</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>IP</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Device</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Success</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>ID</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, idx) => {
                const dateStr = h.login_time || h.loginTime || h.createdAt || h.when || h.timestamp || null
                const date = dateStr ? new Date(dateStr) : null
                const when = date && !isNaN(date.getTime()) ? date.toLocaleString() : (dateStr || '-')
                const ip = h.ip_address || h.ipAddress || h.ip || '-'
                const device = h.userAgent || h.device || '-' 
                const success = (typeof h.success !== 'undefined') ? String(h.success) : (typeof h.successful !== 'undefined' ? String(h.successful) : '-')
                const id = h.id || '-'
                return (
                  <tr key={idx}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{when}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{ip}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{device}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{success}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{id}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
