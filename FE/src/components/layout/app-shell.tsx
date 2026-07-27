import { ApplicantSubNav, APPLICANT_SUB_NAV_ROUTES } from '@/components/layout/applicant-sub-nav'
import { AdminSubNav, ADMIN_SUB_NAV_ROUTES } from '@/components/layout/admin-sub-nav'
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
import { isLoggedIn, publicNavRoutes, navRoutes, getRouteConfig, canAccess, getRole, ADMIN_ROLE, AUTH_FORM_ROUTES, type RouteId } from '@/router'
import { Search, Sparkles, LayoutDashboard, Building2, ShieldCheck, Home, FileText, Building, FileSignature, Dice5, ClipboardCheck, Bell, UserCircle, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const PUBLIC = publicNavRoutes()

const ROUTE_ICONS: Partial<Record<RouteId, React.ReactNode>> = {
  'home-developer': <LayoutDashboard className="h-4 w-4" />,
  'home-sxd': <Building2 className="h-4 w-4" />,
  'home-user': <Home className="h-4 w-4" />,
  'home-admin': <ShieldCheck className="h-4 w-4" />,
  applications: <FileText className="h-4 w-4" />,
  projects: <Building className="h-4 w-4" />,
  contracts: <FileSignature className="h-4 w-4" />,
  'lottery-sessions': <Dice5 className="h-4 w-4" />,
  'audit-list': <ClipboardCheck className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  profile: <UserCircle className="h-4 w-4" />,
  'quan-tam': <Heart className="h-4 w-4" />,
}

function HeaderNavLink({ id, active, activeBar, textColor, hoverColor }: { id: RouteId; active: boolean; activeBar: string; textColor: string; hoverColor: string }) {
  const cfg = getRouteConfig(id)
  const Icon = ROUTE_ICONS[id]
  return (
    <button
      type="button"
      onClick={() => navigate(id)}
      className={cn(
        'group relative flex items-center justify-center gap-1.5 whitespace-nowrap px-5 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? textColor
          : cn(hoverColor, 'hover:opacity-80'),
      )}
    >
      {Icon && (
        <span className={cn('transition-transform duration-150', active ? '' : 'group-hover:scale-110')}>
          {Icon}
        </span>
      )}
      <span>{cfg.label}</span>
      <span
        className={cn(
          'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-all duration-200',
          active ? activeBar : 'scale-x-0 group-hover:scale-x-100 group-hover:bg-white/30',
        )}
      />
    </button>
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="flex min-w-0 items-center text-left"
          aria-label="Trang chủ"
        >
          <BrandLogo size="sm" showPortal showAcronym className="inline-flex max-w-[min(100%,520px)]" />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 lg:inline-flex dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="pulse-dot" /> Hệ thống trực tuyến
          </span>
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="rounded-md border-primary/30 font-semibold text-primary"
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('landing')}
          className="flex min-w-0 items-center text-left"
          aria-label="Trang chủ"
        >
          <BrandLogo size="sm" showPortal showAcronym className="inline-flex max-w-[min(100%,520px)]" />
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="rounded-md border-primary/30 font-semibold text-primary"
            onClick={() => navigate('landing')}
          >
            Trang chủ
          </Button>
        </div>
      </div>
    </header>
  )
}

function InternalHeader({ logged, role }: { logged: boolean; role: string }) {
  const theme = resolveRoleTheme(role, logged)
  const ThemeIcon = theme.Icon
  const route = useHashRoute()
  const isApplicant = logged && role === 'Applicant'
  const isAdmin = logged && role === ADMIN_ROLE
  const showApplicantNav = isApplicant && APPLICANT_SUB_NAV_ROUTES.includes(route)
  const showAdminNav = isAdmin && ADMIN_SUB_NAV_ROUTES.includes(route)
  const navIds = logged ? navRoutes(role) : PUBLIC
  const visibleNavIds = navIds.filter((id) => !logged || canAccess(role, id))
  const showHeaderNav = !showApplicantNav && !showAdminNav && visibleNavIds.length > 0
  const ambientId = roleAmbientId(logged, role)

  return (
    <div>
      <GovTopBar />
      <div className="led-strip" aria-hidden />
      <div className={`h-1 ${theme.brandAccent}`} aria-hidden />
      <header className="header-glass sticky top-0 z-50">
        <RoleAmbient roleId={ambientId} />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-5 lg:px-8">
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

          {/* Command bar search */}
          {!isAdmin && (
            <div className="cmd-bar" aria-hidden>
              <Search className="h-3.5 w-3.5" />
              <span>Tìm nhanh dự án, hồ sơ, cán bộ…</span>
              <kbd className="ml-1 rounded border border-slate-300/80 bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">⌘K</kbd>
            </div>
          )}

          {/* Role badge */}
          {logged && (
            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm md:inline-flex ${theme.brandAccent}`}
              title={theme.badgeFull}
            >
              <ThemeIcon className="h-3.5 w-3.5" />
              {theme.badge}
            </span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {logged && (
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 xl:inline-flex dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300" title="Trạng thái hệ thống">
                <span className="pulse-dot" /> Trực tuyến
              </span>
            )}
            <ThemeToggle />
            {logged && <NotificationBell />}
            {!logged && <Button variant="outline" size="sm" className="rounded-md border-primary/30 font-semibold text-primary" onClick={() => navigate('login')}>Đăng nhập</Button>}
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
        {showHeaderNav && (
          <div className="relative">
            <div className={`h-0.5 w-full ${theme.brandAccent}`} aria-hidden />
            <nav className={`${theme.navBg} ${theme.navTextColor}`} aria-label="Menu chính">
              <div className="mx-auto flex w-full max-w-7xl items-stretch justify-center overflow-x-auto gap-2 px-4 lg:gap-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleNavIds.map((id) => <HeaderNavLink key={id} id={id} active={route === id} activeBar={theme.activeBar} textColor={theme.navActiveTextColor} hoverColor={theme.navTextColor} />)}
              </div>
            </nav>
          </div>
        )}
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
  const ambientId = roleAmbientId(logged, role)

  return (
    <div className={`flex min-h-screen flex-col ${!isFullBleed ? `ambient-glow-${ambientId}` : ''}`}>
      {isFullBleed ? (
        <LandingHeader />
      ) : isAuthForm ? (
        <AuthHeader />
      ) : (
        <InternalHeader logged={logged} role={role} />
      )}

      <main className={isFullBleed ? 'flex-1' : 'mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8'}>
        {logged && !isFullBleed && <UserWelcomeBar />}
        {children}
      </main>

      <GovFooter />
    </div>
  )
}
