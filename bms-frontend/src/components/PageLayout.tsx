import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TopHeaderBar from './TopHeaderBar'

export default function PageLayout({
  title,
  subtitle,
  actions,
  children,
  searchPlaceholder,
  showBack,
  backTo
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  searchPlaceholder?: string
  showBack?: boolean
  backTo?: string
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header Bar */}
      <TopHeaderBar searchPlaceholder={searchPlaceholder} />

      {/* Page Header */}
      <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 lg:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {showBack && backTo && (
                <Link to={backTo} className="mt-1 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                  <ArrowLeft size={18} />
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors font-display">{title}</h1>
                {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 transition-colors">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-6 page-enter">
        {children}
      </main>
    </div>
  )
}
