import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../auth/auth'
import { getPermissions, getRoles } from '../utils/jwt'
import { useLayout } from '../contexts/LayoutContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import {
  LayoutDashboard, Building2, Coffee, Map, DoorOpen,
  Users, FileSignature, Zap, UserCheck, Wrench,
  Wallet, FileText, UserCog, ShieldCheck, UserSquare2,
  BarChart3, Settings, QrCode, User, History, LogOut, Bell, Bot,
  Menu, ChevronLeft, Sun, Moon
} from 'lucide-react'

// Define the nav items and their required permissions
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, permission: 'reports:dashboard' },
  { to: '/buildings', label: 'Buildings', icon: Building2, permission: 'buildings:read' },
  { to: '/amenities', label: 'Amenities', icon: Coffee, permissions: ['amenities:read', 'reports:view'] },
  { to: '/sites', label: 'Sites', icon: Map, permission: 'sites:read' },
  { to: '/units', label: 'Units', icon: DoorOpen, permission: 'units:read' },
  { to: '/tenants', label: 'Tenants', icon: Users, permission: 'users:read' },
  { to: '/leases', label: 'Leases', icon: FileSignature, permissions: ['leases:read', 'documents:history'] },
  { to: '/utilities', label: 'Utilities', icon: Zap, permissions: ['utilities:meters:read', 'utilities:readings:read'] },
  { to: '/visitors', label: 'Visitors', icon: UserCheck, permission: 'visitors:read' },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, permissions: ['maintenance:reports:read', 'maintenance:requests:read', 'maintenance:work_orders:update'] },
  { to: '/finance', label: 'Finance', icon: Wallet, permissions: ['finance:invoices:all', 'finance:invoices:read'], roles: ['tenant'] },
  { to: '/documents', label: 'Documents', icon: FileText, permissions: ['documents:search', 'documents:upload', 'documents:history'] },
  { to: '/users', label: 'Users', icon: UserCog, permission: 'users:read' },
  { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles:read' },
  { to: '/owners', label: 'Owners', icon: UserSquare2, permission: 'owners:read' },
  { to: '/automations', label: 'Automations', icon: Bot, permission: 'settings:read' },
  { to: '/notifications', label: 'Notifications', icon: Bell }, // Make notifications visible to all roles
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

  const { sidebarCollapsed, toggleSidebar } = useLayout()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotification()

  // Filter items based on permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (isSuperAdmin) return true // Super admin sees everything
    if (!item.permission && !(item as any).permissions && !(item as any).roles) return true // Items without explicit permission requirements
    
    // Check if the user has a specific role required for this nav item
    if ((item as any).roles && (item as any).roles.some((r: string) => userRoles.includes(r))) {
      return true
    }

    if ((item as any).permissions) {
      return (item as any).permissions.some((p: string) => userPermissions.includes(p))
    }
    return item.permission ? userPermissions.includes(item.permission as string) : false
  })

  // Redirect unauthorized users from Dashboard or Reports to Profile
  React.useEffect(() => {
    const isUnauthorizedPath = (path: string) => {
      const item = NAV_ITEMS.find(i => i.to === path)
      if (!item) return false
      if (isSuperAdmin) return false
      
      const hasRole = (item as any).roles?.some((r: string) => userRoles.includes(r))
      const hasPermission = item.permission && userPermissions.includes(item.permission as string)
      const hasPermissions = (item as any).permissions?.some((p: string) => userPermissions.includes(p))
      
      return !(hasRole || hasPermission || hasPermissions)
    }

    if ((location.pathname === '/' || location.pathname === '/reports' || location.pathname === '/automations') && isUnauthorizedPath(location.pathname)) {
      navigate('/profile')
    }
  }, [location.pathname, userPermissions, userRoles, isSuperAdmin, navigate])

  return (
    <div className={`fixed inset-y-0 left-0 bg-slate-900 shadow-xl flex flex-col z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/20 flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">BMS Pro</span>
        </div>
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white dark:bg-slate-800/10 transition-colors shrink-0"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {!sidebarCollapsed && <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Main Menu</div>}
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
          const isNotification = item.to === '/notifications'

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={sidebarCollapsed ? item.label : undefined}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
            >
              <div className="relative">
                <Icon size={18} className={`${isActive ? 'text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-300'} shrink-0 transition-colors duration-200`} />
                {isNotification && unreadCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 ${sidebarCollapsed ? '' : 'animate-pulse'}`}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
              
              {/* Badge for expanded view on right side */}
              {isNotification && unreadCount > 0 && !sidebarCollapsed && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-medium text-white shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Footer / User Actions */}
      <div className="border-t border-white/10 p-4 space-y-1 bg-slate-950 flex-shrink-0">
        {!sidebarCollapsed && <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Account</div>}

        <button 
          onClick={toggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 group border border-transparent"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400 shrink-0" /> : <Moon size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 shrink-0 transition-colors" />}
          <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>

        <NavLink to="/profile" title={sidebarCollapsed ? "Profile" : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 group border border-transparent">
          <User size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 shrink-0 transition-colors" />
          <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>Profile</span>
        </NavLink>

        <NavLink to="/login-history" title={sidebarCollapsed ? "Login History" : undefined} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 group border border-transparent">
          <History size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-300 shrink-0 transition-colors" />
          <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>Login History</span>
        </NavLink>

        <button
          onClick={() => { logout(); navigate('/login'); }}
          title={sidebarCollapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all duration-200 group mt-2"
        >
          <LogOut size={18} className="text-rose-600 group-hover:text-rose-400 shrink-0 transition-colors" />
          <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>Logout</span>
        </button>
      </div>
    </div>
  )
}

