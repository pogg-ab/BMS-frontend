import React, { useEffect, useState, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import { getProfile } from '../auth/auth'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getProfile()
      .then((p) => { if (mounted) setProfile(p) })
      .catch((e: any) => {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load profile')
      })
    return () => { mounted = false }
  }, [])

  const displayName = profile?.name || profile?.fullName || profile?.username || profile?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const roles: string[] = Array.isArray(profile?.roles) ? profile.roles : (profile?.roles ? [profile.roles] : [])
  const permissions: string[] = Array.isArray(profile?.permissions) ? profile.permissions : []

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {}
    permissions.forEach(p => {
      const parts = p.split(':')
      const module = parts.length > 1 ? parts[0] : 'general'
      const action = parts.length > 1 ? parts.slice(1).join(':') : p
      if (!groups[module]) groups[module] = []
      groups[module].push(action)
    })
    return groups
  }, [permissions])

  const moduleColors: Record<string, string> = {
    users: 'bg-blue-50 text-blue-700 border-blue-200',
    buildings: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    units: 'bg-violet-50 text-violet-700 border-violet-200',
    tenants: 'bg-purple-50 text-purple-700 border-purple-200',
    leases: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    visitors: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    roles: 'bg-rose-50 text-rose-700 border-rose-200',
    permissions: 'bg-pink-50 text-pink-700 border-pink-200',
    sites: 'bg-teal-50 text-teal-700 border-teal-200',
    owners: 'bg-lime-50 text-lime-700 border-lime-200',
    documents: 'bg-sky-50 text-sky-700 border-sky-200',
    amenities: 'bg-orange-50 text-orange-700 border-orange-200',
    qr: 'bg-slate-50 text-slate-700 border-slate-200',
    utilities: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    reports: 'bg-green-50 text-green-700 border-green-200',
    settings: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  if (error) {
    return (
      <PageLayout title="Profile" subtitle="Your account details">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <div className="text-red-600 font-medium">{error}</div>
        </div>
      </PageLayout>
    )
  }

  if (!profile) {
    return (
      <PageLayout title="Profile" subtitle="Your account details">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-200 rounded-full" />
            <div className="h-4 bg-slate-200 rounded w-40" />
            <div className="h-3 bg-slate-100 rounded w-56" />
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Profile" subtitle="Your account details and permissions">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Profile Header Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="px-8 pb-8 -mt-14">
            <div className="flex items-end gap-6">
              <div className="w-28 h-28 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center text-3xl font-bold text-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 flex-shrink-0">
                {initials}
              </div>
              <div className="pt-16 pb-1 flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                <p className="text-slate-500 mt-0.5">{profile.email}</p>
              </div>
            </div>

            {/* Role Badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {roles.map((role: string) => (
                <span key={role} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Account Details Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12">
            {[
              { label: 'Email', value: profile.email },
              { label: 'Name', value: displayName },
              { label: 'Roles', value: roles.join(', ') || '—' },
              { label: 'Created', value: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
              { label: 'Last Login', value: profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-sm font-medium text-slate-400 w-24 flex-shrink-0">{label}</span>
                <span className="text-sm text-slate-800 font-medium break-all">{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Permissions Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Permissions
            </h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {permissions.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedPermissions).map(([module, actions]) => (
              <div key={module} className={`rounded-xl border p-4 ${moduleColors[module] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                <div className="font-semibold text-sm capitalize mb-2 flex items-center justify-between">
                  {module.replace(/_/g, ' ')}
                  <span className="text-xs opacity-60 font-normal">{actions.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {actions.map(action => (
                    <span key={action} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white/60 border border-current/10">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageLayout>
  )
}
