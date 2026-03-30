import React from 'react'

type StatusType = 'active' | 'draft' | 'expired' | 'terminated' | 'overdue' | 'paid' | 'sent' | 'pending' | 'cancelled' | 'completed' | 'in_progress' | 'submitted' | 'approved' | 'assigned' | 'inactive' | 'closed' | 'renewed' | 'maintenance' | 'occupied' | 'vacant' | string

interface StatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md'
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  renewed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
  occupied: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',

  draft: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  assigned: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',

  expired: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',

  sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
  in_progress: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',

  inactive: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30',
  closed: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30',
  vacant: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
}

export default function StatusBadge({ status, className = '', size = 'sm' }: StatusBadgeProps) {
  const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '_')
  const style = STATUS_STYLES[normalizedStatus] || 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30'
  
  const sizeClasses = size === 'md' 
    ? 'px-3 py-1 text-xs' 
    : 'px-2.5 py-0.5 text-[11px]'

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full font-semibold uppercase tracking-wide border ${style} ${className}`}>
      {status}
    </span>
  )
}
