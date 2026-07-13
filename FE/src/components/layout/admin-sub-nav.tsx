import { User, Users } from 'lucide-react'
import { useHashRoute, navigate } from '@/hooks/useHashRoute'
import { type RouteId } from '@/router'
import { ROLE_THEMES } from '@/lib/role-theme'
import { NotificationBell } from '@/components/layout/notification-bell'

const THEME = ROLE_THEMES.admin

interface NavItem {
  route: RouteId
  label: string
  icon: React.ComponentType<{ className?: string }>
  aliases?: RouteId[]
}

const ITEMS: NavItem[] = [
  { route: 'admin-staff', label: 'Quản lý cán bộ', icon: Users, aliases: ['create-staff', 'staff-detail'] },
  { route: 'profile', label: 'Tài khoản', icon: User, aliases: ['change-password'] },
]

export const ADMIN_SUB_NAV_ROUTES: RouteId[] = [
  'admin-staff',
  'create-staff',
  'staff-detail',
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
                  : `${THEME.navTextColor} ${THEME.navBgHover} hover:text-white`
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
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('notifications')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('notifications')}
          className={`relative ml-auto shrink-0 rounded-md px-3 py-1.5 transition-colors ${
            route === 'notifications'
              ? `${THEME.navActiveBg} ${THEME.navActiveTextColor}`
              : `${THEME.navTextColor} ${THEME.navBgHover} hover:text-white`
          }`}
        >
          <NotificationBell />
        </div>
      </div>
    </nav>
  )
}
