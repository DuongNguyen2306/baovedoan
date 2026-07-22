import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: ReactNode
  hint?: string
  trend?: { value: string; positive?: boolean }
  icon: ReactNode
  /** Lớp gradient cho accent bar ở đỉnh card + accent gradient cho icon badge. */
  accent?: string
  accentSoft?: string
  sparkline?: ReactNode
  className?: string
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent = 'from-primary via-cyan-500 to-primary',
  accentSoft = 'from-primary/20 via-cyan-500/10 to-transparent',
  sparkline,
  className,
}: KpiCardProps) {
  return (
    <div className={cn('kpi-card group hover-lift anim-up', className)}>
      <span className={`kpi-accent-bar bg-gradient-to-r ${accent}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">{value}</p>
          {hint && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
          )}
          {trend && (
            <span
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                trend.positive
                  ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
              )}
            >
              {trend.positive ? '▲' : '▼'} {trend.value}
            </span>
          )}
        </div>
        <div className={cn('relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-1 ring-inset ring-white/30', accent)}>
          <div className={cn('absolute -inset-2 -z-10 rounded-2xl bg-gradient-to-br opacity-60 blur-xl', accentSoft)} />
          {icon}
        </div>
      </div>
      {sparkline && <div className="mt-4 h-12">{sparkline}</div>}
    </div>
  )
}
