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
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-gradient-to-r from-blue-700 to-blue-900">
        <span className="text-xl font-bold text-white tracking-tight">BMS Admin</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </NavLink>
          )
        })}
      </div>

      {/* Footer / User Actions */}
      <div className="border-t border-gray-100 p-4 space-y-1 bg-gray-50 flex-shrink-0">
        <span className="block px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</span>
        
        <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
          <User size={18} className="text-gray-500" />
          Profile
        </NavLink>
        
        <NavLink to="/login-history" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
          <History size={18} className="text-gray-500" />
          Login History
        </NavLink>
        
        <button 
          onClick={() => { logout(); navigate('/login'); }} 
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
        >
          <LogOut size={18} className="text-red-500" />
          Logout
        </button>
      </div>

    </div>
  )
}
