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
  BarChart3, Settings, QrCode, User, History, Bell, Bot,
  Menu, ChevronLeft, ChevronRight, HelpCircle, CircleDot, LayoutGrid, Package
} from 'lucide-react'

interface NavItem {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  permission?: string;
  permissions?: string[];
  roles?: string[];
}

interface NavGroup {
  label: string;
  icon: any;
  items: NavItem[];
}

// Grouped navigation structure with role and permission requirements
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    icon: CircleDot,
    items: [
      { 
        to: '/', 
        label: 'Dashboard', 
        icon: LayoutDashboard, 
        exact: true, 
        permission: 'reports:dashboard',
        roles: ['super_admin', 'admin', 'finance', 'site_admin', 'owner']
      },
    ],
  },
  {
    label: 'Property',
    icon: Building2,
    items: [
      { to: '/sites', label: 'Sites', icon: Map, permission: 'sites:read', roles: ['super_admin', 'admin', 'site_admin', 'owner'] },
      { to: '/buildings', label: 'Buildings', icon: Building2, permission: 'buildings:read', roles: ['super_admin', 'admin', 'site_admin', 'owner'] },
      { to: '/owners', label: 'Owners', icon: UserSquare2, permission: 'owners:read', roles: ['super_admin', 'admin', 'site_admin', 'owner'] },
      { to: '/units', label: 'Units', icon: DoorOpen, permission: 'units:read', roles: ['super_admin', 'admin', 'site_admin', 'owner'] },
      { to: '/assets', label: 'Assets', icon: Package, permission: 'assets:read', roles: ['super_admin', 'admin', 'owner'] },
      { to: '/facilities', label: 'Facilities', icon: LayoutGrid, permissions: ['amenities:read', 'reports:view'], roles: ['super_admin', 'admin', 'owner'] },
      { to: '/management', label: 'Management', icon: ShieldCheck, permission: 'settings:manage', roles: ['super_admin', 'admin'] },
    ],
  },
  {
    label: 'People',
    icon: Users,
    items: [
      { to: '/tenants', label: 'Tenants', icon: Users, permission: 'users:read', roles: ['super_admin', 'admin', 'site_admin', 'owner'] },
      { to: '/visitors', label: 'Visitors', icon: UserCheck, permission: 'visitors:read', roles: ['super_admin', 'admin', 'site_admin', 'tenant', 'owner'] },
    ],
  },
  {
    label: 'Operations',
    icon: Wrench,
    items: [
      { to: '/leases', label: 'Leases', icon: FileSignature, permissions: ['leases:read', 'documents:history'], roles: ['super_admin', 'admin', 'owner'] },
      { to: '/tenders', label: 'Tenders', icon: FileSignature, permissions: ['leases:read'], roles: ['super_admin', 'admin'] },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, permissions: ['maintenance:reports:read', 'maintenance:requests:read', 'maintenance:work_orders:update'], roles: ['super_admin', 'admin', 'contractor', 'tenant', 'owner'] },
      { to: '/finance', label: 'Finance', icon: Wallet, roles: ['super_admin', 'admin', 'tenant', 'finance', 'owner'] },
      { to: '/commissions', label: 'Commissions', icon: Wallet, permissions: ['finance:invoices:all'], roles: ['super_admin', 'admin', 'finance'] },
      { to: '/utilities', label: 'Utilities', icon: Zap, permissions: ['utilities:meters:read', 'utilities:readings:read'], roles: ['super_admin', 'admin', 'tenant', 'owner'] },
      { to: '/documents', label: 'Documents', icon: FileText, permissions: ['documents:search', 'documents:upload', 'documents:history'], roles: ['super_admin', 'admin', 'tenant', 'owner'] },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { to: '/users', label: 'Users', icon: UserCog, permission: 'users:read', roles: ['super_admin', 'admin'] },
      { to: '/roles', label: 'Roles', icon: ShieldCheck, permission: 'roles:read', roles: ['super_admin', 'admin'] },
      { to: '/qr', label: 'QR Codes', icon: QrCode, permission: 'qr:analytics', roles: ['super_admin', 'admin'] },
      { to: '/automations', label: 'Automations', icon: Bot, permission: 'settings:manage', roles: ['super_admin', 'admin'] },
      { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports:view', roles: ['super_admin', 'admin', 'site_admin', 'finance', 'owner'] },
      { to: '/notifications', label: 'Notifications', icon: Bell }, // Accessible by all roles
      { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings:read', roles: ['super_admin', 'admin'] },
    ],
  },
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

  function isItemVisible(item: NavItem) {
    if (isSuperAdmin) return true

    // 1. Role Check
    if (item.roles && !item.roles.some((r: string) => userRoles.includes(r))) {
      return false
    }

    // 2. Permission Check (If no permissions specified, role check is sufficient)
    if (!item.permission && !item.permissions) {
      return true
    }

    if (item.permissions) {
      return item.permissions.some((p: string) => userPermissions.includes(p))
    }

    return item.permission ? userPermissions.includes(item.permission) : false
  }

  // Redirect unauthorized users
  React.useEffect(() => {
    const allItems = NAV_GROUPS.flatMap(g => g.items)
    const item = allItems.find(i => i.to === location.pathname)
    if (!item) return
    if (isSuperAdmin) return
    if (!isItemVisible(item)) {
      if (location.pathname === '/' || location.pathname === '/reports' || location.pathname === '/automations') {
        navigate('/profile')
      }
    }
  }, [location.pathname, userPermissions, userRoles, isSuperAdmin, navigate])

  return (
    <div className={`fixed inset-y-0 left-0 flex flex-col z-50 transition-all duration-300 
      bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
      ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="whitespace-nowrap">
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">BMS Curator</div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Enterprise Suite</div>
          </div>
        </div>
        {sidebarCollapsed && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0 mx-auto">
            <Building2 size={18} className="text-white" />
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isItemVisible)
          if (visibleItems.length === 0) return null

          const GroupIcon = group.icon
          return (
            <div key={group.label}>
              {/* Group Label */}
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 px-3 mb-2">
                  <GroupIcon size={14} className="text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{group.label}</span>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="flex justify-center mb-2">
                  <div className="w-6 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = (item as any).exact ? location.pathname === item.to : location.pathname === item.to
                  const isNotification = item.to === '/notifications'

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                      )}
                      <div className="relative">
                        <Icon size={18} className={`shrink-0 transition-colors duration-200 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`} />
                        {isNotification && unreadCount > 0 && sidebarCollapsed && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={`whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                        {item.label === 'Finance' && userRoles.includes('tenant') ? 'My Invoices' : item.label}
                      </span>
                      
                      {isNotification && unreadCount > 0 && !sidebarCollapsed && (
                        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-medium text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
