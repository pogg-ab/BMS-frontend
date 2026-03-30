import React from 'react'

type KPIVariant = 'purple' | 'green' | 'blue' | 'white'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: string; direction: 'up' | 'down' }
  variant?: KPIVariant
  icon?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

const variantClasses: Record<KPIVariant, string> = {
  purple: 'kpi-gradient-purple',
  green: 'kpi-gradient-green',
  blue: 'kpi-gradient-blue',
  white: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60',
}

export default function KPICard({ title, value, subtitle, trend, variant = 'white', icon, className = '', children }: KPICardProps) {
  const isWhite = variant === 'white'

  return (
    <div className={`rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start justify-between mb-1">
        <p className={`text-xs font-semibold uppercase tracking-wider ${isWhite ? 'text-slate-500 dark:text-slate-400' : 'text-white/80'}`}>
          {title}
        </p>
        {icon && <div className={`${isWhite ? 'text-slate-400' : 'text-white/60'}`}>{icon}</div>}
      </div>
      <div className="flex items-end gap-3">
        <h2 className={`text-3xl font-bold tracking-tight ${isWhite ? '' : ''}`}>
          {value}
        </h2>
        {trend && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${
            isWhite
              ? trend.direction === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              : 'bg-white/20 text-white'
          }`}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className={`text-sm mt-1 ${isWhite ? 'text-slate-500 dark:text-slate-400' : 'text-white/70'}`}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}
