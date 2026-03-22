import React from 'react'

export default function PageLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header Area */}
      <div className="bg-white dark:bg-slate-800/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 dark:border-slate-800/60 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">{title}</h1>
                {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
