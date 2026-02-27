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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                {/* decorative icon slot - kept for symmetry */}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                {subtitle && <p className="text-blue-100 text-sm mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">{actions}</div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
