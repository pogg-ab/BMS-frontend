import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../auth/auth'
import { getPermissions, getRoles } from '../utils/jwt'
import {
  LayoutDashboard, Building2, Coffee, Map, DoorOpen,
  Users, FileSignature, Zap, UserCheck, Wrench,
  Wallet, FileText, UserCog, ShieldCheck, UserSquare2,
  BarChart3, Settings, QrCode, User, History, LogOut, Bell, Bot
} from 'lucide-react'

// Define the nav items and their required permissions
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true }, // Always visible
  { to: '/buildings', label: 'Buildings', icon: Building2, permission: 'buildings:read' },
  { to: '/amenities', label: 'Amenities', icon: Coffee, permission: 'amenities:read' },
  { to: '/sites', label: 'Sites', icon: Map, permission: 'sites:read' },
  { to: '/units', label: 'Units', icon: DoorOpen, permission: 'units:read' },
  { to: '/tenants', label: 'Tenants', icon: Users, permission: 'users:read' }, // Assuming users:read for now
  { to: '/leases', label: 'Leases', icon: FileSignature, permission: 'leases:read' }, // Assume leases:read or similar, if no exact match we restrict gracefully
  { to: '/utilities', label: 'Utilities', icon: Zap, permission: 'utilities:meters:read' },
  { to: '/visitors', label: 'Visitors', icon: UserCheck, permission: 'visitors:read' },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, permission: 'maintenance:reports:read' }, // Or just general maintenance access
  { to: '/finance', label: 'Finance', icon: Wallet, permission: 'finance:invoices:all' },
  { to: '/documents', label: 'Documents', icon: FileText, permission: 'documents:search' },
  { to: '/users', label: 'Users', icon: UserCog, permission: 'users:read' },
  { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles:read' },
  { to: '/owners', label: 'Owners', icon: UserSquare2, permission: 'owners:read' },
  { to: '/automations', label: 'Automations', icon: Bot, permission: 'settings:read' }, // Grouped with settings 
  { to: '/notifications', label: 'Notifications', icon: Bell, permission: 'announcements:create' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports:dashboard' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings:read' },
  { to: '/qr', label: 'QR Codes', icon: QrCode, permission: 'qr:analytics' },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const userRoles = getRoles()
  const userPermissions = getPermissions()
  const isSuperAdmin = userRoles.includes('super_admin')

  // Filter items based on permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (isSuperAdmin) return true // Super admin sees everything
    if (!item.permission) return true // Items without explicit permission requirements (like Dashboard)
    return userPermissions.includes(item.permission)
  })

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 shadow-xl flex flex-col z-50 transition-all duration-300">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">BMS Pro</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Main Menu</div>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <Icon size={18} className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors duration-200`} />
              {item.label}
            </NavLink>
          )
        })}
      </div>

      {/* Footer / User Actions */}
      <div className="border-t border-white/10 p-4 space-y-1 bg-slate-950 flex-shrink-0">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Account</div>

        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 group">
          <User size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          Profile
        </NavLink>

        <NavLink to="/login-history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 group">
          <History size={18} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
          Login History
        </NavLink>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all duration-200 group mt-2"
        >
          <LogOut size={18} className="text-rose-600 group-hover:text-rose-400 transition-colors" />
          Logout
        </button>
      </div>
    </div>
  )
}
