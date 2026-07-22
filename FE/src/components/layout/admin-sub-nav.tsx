import { Bell, FolderTree, Home, ListTree, User, Users } from 'lucide-react'
import { useHashRoute, navigate } from '@/hooks/useHashRoute'
import { type RouteId } from '@/router'
import { ROLE_THEMES } from '@/lib/role-theme'

const THEME = ROLE_THEMES.admin

interface NavItem {
  route: RouteId
  label: string
  icon: React.ComponentType<{ className?: string }>
  aliases?: RouteId[]
}

const ITEMS: NavItem[] = [
  { route: 'home-admin', label: 'Trang chủ', icon: Home },
  { route: 'admin-staff', label: 'Quản lý cán bộ', icon: Users, aliases: ['create-staff', 'staff-detail'] },
  { route: 'admin-logs', label: 'Log hệ thống', icon: ListTree },
  { route: 'admin-categories', label: 'Quản lý danh mục', icon: FolderTree },
  { route: 'notifications', label: 'Thông báo', icon: Bell },
  { route: 'profile', label: 'Hồ sơ', icon: User, aliases: ['change-password'] },
]

export const ADMIN_SUB_NAV_ROUTES: RouteId[] = [
  'home-admin',
  'admin-staff',
  'create-staff',
  'staff-detail',
  'admin-logs',
  'admin-categories',
  'profile',
  'change-password',
  'notifications',
]

function isActive(current: RouteId, item: NavItem): boolean {
  if (current === item.route) return true
  return item.aliases?.includes(current) ?? false
}

export function AdminSubNav() {
  const route = useHashRoute()

  return (
    <div className="relative">
      <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-400" aria-hidden />
      <nav className={`${THEME.navBg} text-white`} aria-label="Điều hướng quản trị">
        <div className="mx-auto flex max-w-7xl items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ITEMS.map((item) => {
            const active = isActive(route, item)
            const Icon = item.icon
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
                data-active={active}
                className={`relative inline-flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? `${THEME.navActiveBg} ${THEME.navActiveTextColor}`
                    : `${THEME.navTextColor} ${THEME.navBgHover}`
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{item.label}</span>
                {active && (
                  <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full ${THEME.activeBar}`} />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
