import { Activity, Building2, ChevronRight } from 'lucide-react'
import { useUserProfile } from '@/providers/user-profile-provider'
import { BRAND } from '@/lib/brand'
import { resolveRoleTheme } from '@/lib/role-theme'
import { getRole } from '@/router'
import { cn } from '@/lib/utils'

export function UserWelcomeBar({ className }: { className?: string }) {
  const { greeting, roleLabel, avatarUrl, initials } = useUserProfile()
  const theme = resolveRoleTheme(getRole(), true)
  const ThemeIcon = theme.Icon

  return (
    <div className={cn('relative mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white/85 shadow-[0_18px_50px_-18px_rgb(15_23_42_/_25%)] backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/70', className)}>
      {/* Glow ambient theo role */}
      <div className={`absolute -inset-px -z-10 bg-gradient-to-br ${theme.brandAccent} opacity-[0.12] blur-2xl`} aria-hidden />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />

      <div className="flex flex-wrap items-stretch">
        {/* Avatar + greeting */}
        <div className={`flex min-w-[240px] flex-[1.4] items-center gap-4 ${theme.brandAccent} px-5 py-4 text-white`}>
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 bg-white/15 text-xl font-extrabold shadow-lg ring-2 ring-white/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] shadow-inner backdrop-blur-md">
              <ThemeIcon className="h-3 w-3" />
              {theme.badgeFull}
            </span>
            <h1 className="mt-1.5 truncate text-lg font-bold md:text-xl">{greeting}</h1>
            <p className="mt-0.5 truncate text-xs text-white/85">{roleLabel}</p>
          </div>
        </div>

        {/* Stats / quick info */}
        <div className="flex flex-1 items-center gap-2 border-t border-primary/10 bg-white/40 px-5 py-3 sm:border-l sm:border-t-0 dark:bg-slate-900/40">
          <span className="chip-glass anim-up">
            <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Phiên hoạt động
          </span>
          <span className="chip-glass anim-up anim-up-d2 hidden md:inline-flex">
            <Building2 className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            {BRAND.systemName}
          </span>
        </div>

        {/* Slogan strip */}
        <div className="flex w-full items-center justify-between gap-3 border-t border-primary/10 bg-gradient-to-r from-secondary/70 via-white/40 to-secondary/50 px-5 py-2.5 text-[11px] dark:border-slate-700/70 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60">
          <div className="flex items-center gap-3">
            <span className="font-bold uppercase tracking-wide text-primary">Slogan</span>
            <span className="text-slate-600 dark:text-slate-300">{BRAND.slogan}</span>
          </div>
          <span className="hidden items-center gap-1 text-[11px] font-semibold text-primary sm:inline-flex">
            Hotline: <strong className="text-amber-700 dark:text-amber-400">{BRAND.hotline}</strong> · {BRAND.workingHours}
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  )
}
