import { ChevronRight, ShieldCheck, ShieldAlert, BadgeCheck, Calendar, Fingerprint } from 'lucide-react'
import { useUserProfile } from '@/providers/user-profile-provider'
import { BRAND } from '@/lib/brand'
import { resolveRoleTheme } from '@/lib/role-theme'
import { getRole } from '@/router'
import { cn } from '@/lib/utils'

export function UserWelcomeBar({ className }: { className?: string }) {
  const { greeting, roleLabel, avatarUrl, initials, ekycVerified } = useUserProfile()
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
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 border-t border-primary/10 bg-white/40 px-5 py-3 sm:border-l sm:border-t-0 dark:bg-slate-900/40">
          {ekycVerified ? (
            <div className="group w-full max-w-md rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-3 shadow-sm transition-all hover:shadow-md dark:border-emerald-700/50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/40">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md ring-2 ring-emerald-400/30">
                  <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      eKYC đã xác minh
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Danh tính đã được xác thực bởi hệ thống
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full border border-emerald-200 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Đang hoạt động
                </span>
              </div>

              {/* Mini info rows */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-emerald-200/60 pt-2.5 dark:border-emerald-800/60">
                <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 dark:bg-slate-900/30">
                  <Fingerprint className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Mã hồ sơ</p>
                    <p className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">#eKYC-89234</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 dark:bg-slate-900/30">
                  <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Xác minh lúc</p>
                    <p className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">07/08/2026</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="group w-full max-w-md rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 p-3 shadow-sm transition-all hover:shadow-md dark:border-amber-700/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md ring-2 ring-amber-400/30">
                  <ShieldAlert className="h-5 w-5 text-white" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    eKYC chưa xác minh
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Vui lòng xác minh danh tính để tiếp tục
                  </p>
                </div>
                <button className="shrink-0 rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-amber-600 transition-colors">
                  Xác minh ngay
                </button>
              </div>

              {/* Mini info rows */}
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-amber-200/60 pt-2.5 dark:border-amber-800/60">
                <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 dark:bg-slate-900/30">
                  <Fingerprint className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Trạng thái</p>
                    <p className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">Chưa có</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 dark:bg-slate-900/30">
                  <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Thời hạn</p>
                    <p className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-200">Không giới hạn</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slogan strip */}
        <div className="flex w-full items-center justify-between gap-3 border-t border-primary/10 bg-gradient-to-r from-secondary/70 via-white/40 to-secondary/50 px-5 py-2.5 text-[11px] dark:border-slate-700/70 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60">
          <div className="flex items-center gap-3">
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
