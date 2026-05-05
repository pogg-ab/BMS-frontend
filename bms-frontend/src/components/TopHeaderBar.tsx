import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, HelpCircle, Sun, Moon, LogOut, Menu } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'
import { logout } from '../auth/auth'

interface TopHeaderBarProps {
  searchPlaceholder?: string
}

export default function TopHeaderBar({ searchPlaceholder = 'Search leases, tenants, or units...' }: TopHeaderBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotification()
  const { toggleMobileSidebar } = useLayout()

  const navTabs = [
    { to: '/', label: 'Dashboard', match: ['/'] },
  ]

  // Get user name from token (best-effort)
  let userName = 'Admin'
  let userRole = 'Portfolio Mgr.'
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userName = payload.name || payload.email?.split('@')[0] || 'Admin'
      const roles = payload.roles || []
      if (roles.includes('super_admin')) userRole = 'Super Admin'
      else if (roles.includes('company_admin')) userRole = 'Company Admin'
      else if (roles.includes('nominee_admin')) userRole = 'Building Admin'
      else if (roles.includes('tenant')) userRole = 'Tenant'
      else if (roles.includes('owner')) userRole = 'Owner'
    }
  } catch {}

  return (
    <div className="h-[60px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Search & Menu */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1">
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-xs lg:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={window.innerWidth < 640 ? "Search..." : searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav className="hidden md:flex items-center gap-1">
        {navTabs.map(tab => {
          const isActive = tab.match.includes(location.pathname)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Right: notifications, help, user */}
      <div className="flex items-center gap-1.5 lg:gap-4 ml-2 lg:ml-6">
        <NavLink to="/notifications" className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        <button 
          onClick={toggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        <NavLink 
          to="/profile"
          title="Support"
          className="hidden sm:block p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
        >
          <HelpCircle size={18} />
        </NavLink>

        <button 
          onClick={() => { logout(); navigate('/login'); }}
          title="Logout"
          className="p-2 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <LogOut size={18} />
        </button>

        {/* User Profile */}
        <NavLink to="/profile" className="flex items-center gap-3 pl-2 lg:pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden lg:block">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{userName}</div>
            <div className="text-[11px] text-slate-400">{userRole}</div>
          </div>
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs lg:text-sm font-bold shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </NavLink>
      </div>
    </div>
  )
}
