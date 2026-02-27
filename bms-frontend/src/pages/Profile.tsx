import React, { useEffect, useState } from 'react'
import { getProfile } from '../auth/auth'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getProfile()
      .then((p) => {
        if (mounted) setProfile(p)
      })
      .catch((e: any) => {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load profile')
      })
    return () => { mounted = false }
  }, [])

  return (
    <div className="container">
      <h1>Profile</h1>
      <div className="card">
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {!error && !profile && <div>Loading...</div>}
        {profile && (
          <div>
            <p><strong>Name:</strong> {profile.name || profile.fullName || profile.username}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Roles:</strong> {Array.isArray(profile.roles) ? profile.roles.join(', ') : profile.roles}</p>
            <p><strong>Permissions:</strong> {Array.isArray(profile.permissions) ? profile.permissions.join(', ') : profile.permissions}</p>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{JSON.stringify(profile, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
