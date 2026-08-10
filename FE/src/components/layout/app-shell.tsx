import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ApplicantSubNav, APPLICANT_SUB_NAV_ROUTES } from '@/components/layout/applicant-sub-nav'
import { AdminSubNav, ADMIN_SUB_NAV_ROUTES } from '@/components/layout/admin-sub-nav'
import { DeveloperSubNav, DEVELOPER_SUB_NAV_ROUTES } from '@/components/layout/developer-sub-nav'
import { SxdSubNav, SXD_SUB_NAV_ROUTES } from '@/components/layout/sxd-sub-nav'
import { BrandLogo } from '@/components/brand/brand-logo'
import { BRAND } from '@/lib/brand'
import { GovFooter } from '@/components/layout/gov-footer'
import { GovTopBar } from '@/components/layout/gov-top-bar'
import { NotificationBell } from '@/components/layout/notification-bell'
import { RoleAmbient, roleAmbientId } from '@/components/layout/role-ambient'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserWelcomeBar } from '@/components/layout/user-welcome-bar'
import { Button } from '@/components/ui/button'
import { resolveRoleTheme } from '@/lib/role-theme'
import { useHashRoute, navigate } from '@/hooks/useHashRoute'
import { isLoggedIn, ADMIN_ROLE, AUTH_FORM_ROUTES, getRole, type RouteId } from '@/router'
import { Sparkles, Smartphone } from 'lucide-react'

function AppDownloadBadge() {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        className="group relative flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#005BAC] to-[#0066C4] px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
        title="Tải ứng dụng"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <Smartphone className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tải ứng dụng</span>
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl shadow-primary/30 dark:border-slate-700/60 dark:bg-slate-800"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
          >
            {/* Header gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0066C4] via-[#005BAC] to-[#003D7A] p-4 text-center">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FFCD00]/30 blur-2xl" />
              <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-emerald-400/30 blur-2xl" />
              <div className="relative">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 shadow-lg backdrop-blur-sm">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Nền tảng RHS</h3>
                <p className="mt-0.5 text-[11px] text-white/85">Nhà ở xã hội thông minh</p>
              </div>
            </div>

            {/* QR Code + Stores */}
            <div className="p-4">
              {/* QR Code placeholder */}
              <div className="mb-3 flex justify-center">
                <div className="relative rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 dark:from-slate-700 dark:to-slate-800">
                  <div className="grid h-24 w-24 grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${Math.random() > 0.5 ? 'bg-[#003D7A]' : 'bg-white dark:bg-slate-600'}`}
                      />
                    ))}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#005BAC] to-[#0066C4] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-md">
                    RHS
                  </div>
                </div>
              </div>

              {/* Store buttons */}
              <div className="space-y-2">
                <a href="#" className="group flex items-center gap-3 rounded-lg bg-black px-3 py-2 text-white transition-all hover:bg-black/90 hover:shadow-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-transform group-hover:scale-110">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-70">Tải về từ</p>
                    <p className="text-sm font-bold leading-tight">App Store</p>
                  </div>
                </a>
                <a href="#" className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-500 via-[#005BAC] to-[#0066C4] px-3 py-2 text-white transition-all hover:shadow-md">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 transition-transform group-hover:scale-110">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-70">Tải về từ</p>
                    <p className="text-sm font-bold leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-2 text-center dark:border-slate-700 dark:from-slate-800/50 dark:to-slate-800">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">v1.0.0 · Miễn phí</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/15 bg-white shadow-[0_2px_16px_rgb(0_61_122_/_12%)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_2px_16px_rgb(0_0_0_/_50%)]">
      <div className="led-strip" aria-hidden />
      <div className="flex h-1">
        <div className="flex-1 bg-[#DA251D]" />
        <div className="flex-1 bg-[#FFCD00]" />
        <div className="flex-1 bg-[#005BAC]" />
      </div>
      <div className="mx-auto flex max-w-full items-center justify-between gap-3 px-6 py-3 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="flex min-w-0 items-center text-left"
          aria-label="Trang chủ"
        >
          <BrandLogo size="sm" showPortal showAcronym className="inline-flex max-w-[min(100%,520px)]" />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <AppDownloadBadge />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-2 border-primary/40 font-bold text-primary shadow-sm hover:border-primary/60 hover:bg-primary/5 hover:shadow-md"
            onClick={() => navigate('login')}
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    </header>
  )
}

function AuthHeader() {
  return (
    <header className="border-b border-primary/15 bg-white shadow-[0_2px_16px_rgb(0_61_122_/_12%)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_2px_16px_rgb(0_0_0_/_50%)]">
      <div className="led-strip" aria-hidden />
      <div className="flex h-1">
        <div className="flex-1 bg-[#DA251D]" />
        <div className="flex-1 bg-[#FFCD00]" />
        <div className="flex-1 bg-[#005BAC]" />
      </div>
      <div className="mx-auto flex max-w-full items-center justify-between gap-3 px-6 py-3 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="flex min-w-0 items-center text-left"
          aria-label="Trang chủ"
        >
          <BrandLogo size="sm" showPortal showAcronym className="inline-flex max-w-[min(100%,520px)]" />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <AppDownloadBadge />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg border-2 border-primary/40 font-bold text-primary shadow-sm hover:border-primary/60 hover:bg-primary/5 hover:shadow-md"
            onClick={() => navigate('landing')}
          >
            Trang chủ
          </Button>
        </div>
      </div>
    </header>
  )
}

function InternalHeader({ logged, role, wideScreen = false }: { logged: boolean; role: string; wideScreen?: boolean }) {
  const theme = resolveRoleTheme(role, logged)
  const ThemeIcon = theme.Icon
  const route = useHashRoute()
  const isApplicant = logged && role === 'Applicant'
  const isAdmin = logged && role === ADMIN_ROLE
  const isDeveloper = logged && role === 'Housing Developer'
  const isSxd = logged && role === 'Department Of Construction'
  const showApplicantNav = isApplicant && APPLICANT_SUB_NAV_ROUTES.includes(route)
  const showAdminNav = isAdmin && ADMIN_SUB_NAV_ROUTES.includes(route)
  const showDeveloperNav = isDeveloper && DEVELOPER_SUB_NAV_ROUTES.includes(route)
  const showSxdNav = isSxd && SXD_SUB_NAV_ROUTES.includes(route)
  const ambientId = roleAmbientId(logged, role)
  const containerMax = wideScreen ? 'max-w-[1760px]' : 'max-w-full'

  return (
    <div>
      <GovTopBar />
      <div className="led-strip" aria-hidden />
      <div className={`h-1 ${theme.brandAccent}`} aria-hidden />
      <header className="header-glass sticky top-0 z-50 border-b border-primary/20 bg-white/95 shadow-md dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-lg">
        <RoleAmbient roleId={ambientId} />
        <div className={`mx-auto flex ${containerMax} items-center gap-3 px-3 py-3.5 sm:px-4 lg:gap-5 lg:px-5`}>
          <button
            type="button"
            onClick={() => navigate(logged ? (theme.homeRoute as RouteId) : 'landing')}
            className="flex min-w-0 flex-1 items-center text-left"
            aria-label="Trang chủ"
          >
            <BrandLogo size="sm" showPortal showAcronym className="hidden md:inline-flex max-w-[min(100%,520px)]" />
            <BrandLogo size="sm" showWordmark={false} className="md:hidden" />
            <span className="min-w-0 md:hidden">
              <span className="block text-[10px] font-bold leading-snug text-[#003D7A] dark:text-slate-100 line-clamp-2">{BRAND.projectName}</span>
              <span className="mt-0.5 block text-[9px] font-semibold text-primary">{BRAND.acronym}</span>
            </span>
          </button>

          {/* Role badge */}
          {logged && (
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/20 md:inline-flex ${theme.brandAccent}`}
              title={theme.badgeFull}
            >
              <ThemeIcon className="h-4 w-4" />
              {theme.badge}
            </span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {logged && (
              <span className="hidden items-center gap-1.5 rounded-full border-2 border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 xl:inline-flex dark:border-emerald-400/50 dark:bg-emerald-500/15 dark:text-emerald-300" title="Trạng thái hệ thống">
                <span className="pulse-dot" /> Trực tuyến
              </span>
            )}
            <AppDownloadBadge />
            <ThemeToggle />
            {logged && <NotificationBell />}
            {!logged && <Button variant="outline" size="sm" className="rounded-lg border-2 border-primary/40 font-bold text-primary shadow-sm hover:border-primary/60 hover:bg-primary/5 hover:shadow-md" onClick={() => navigate('login')}>Đăng nhập</Button>}
            {logged && (
              <Button size="sm" className={`glow-cta rounded-md font-bold ${theme.ctaBg} ${theme.ctaBgHover} ${theme.ctaText}`} onClick={() => navigate(theme.ctaRoute as RouteId)}>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                <span className="hidden sm:inline">{theme.ctaLabel}</span>
                <span className="sm:hidden">{theme.ctaShort}</span>
              </Button>
            )}
          </div>
        </div>

        {showApplicantNav && <ApplicantSubNav />}
        {showAdminNav && <AdminSubNav />}
        {showDeveloperNav && <DeveloperSubNav />}
        {showSxdNav && <SxdSubNav />}
      </header>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const route = useHashRoute()
  const logged = isLoggedIn()
  const role = getRole()

  const isFullBleed = route === 'landing'
  const isAuthForm = AUTH_FORM_ROUTES.has(route)
  const isApplicant = logged && role === 'Applicant'
  const isDeveloper = logged && role === 'Housing Developer'
  // Developer & Applicant dùng layout rộng sát 2 cạnh (full màn hình)
  const isWideScreen = !isFullBleed && (isApplicant || isDeveloper)
  const ambientId = roleAmbientId(logged, role)
  const showFooter = !isFullBleed && !isAuthForm && route !== 'profile' && route !== 'change-password'

  return (
    <div className={`flex min-h-screen flex-col ${!isFullBleed ? `ambient-glow-${ambientId}` : ''}`}>
      {isFullBleed ? (
        <LandingHeader />
      ) : isAuthForm ? (
        <AuthHeader />
      ) : (
        <InternalHeader logged={logged} role={role} wideScreen={isWideScreen} />
      )}

      <main className={
        isFullBleed
          ? 'flex-1'
          : isWideScreen
            ? isDeveloper
              ? 'mx-auto w-full max-w-[1760px] flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6'
              : 'mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8'
            : 'mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8'
      }>
        {logged && !isFullBleed && <UserWelcomeBar />}
        {children}
      </main>

      {showFooter && <GovFooter />}
    </div>
  )
}
