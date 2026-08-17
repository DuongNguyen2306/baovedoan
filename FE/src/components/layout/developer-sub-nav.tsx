import {
  Home,
  FileText,
  Building2,
  Gavel,
  Radio,
  User,
} from 'lucide-react'
import { useHashRoute, navigate } from '@/hooks/useHashRoute'
import { type RouteId } from '@/router'
import { ROLE_THEMES } from '@/lib/role-theme'

const THEME = ROLE_THEMES.developer

interface NavItem {
  route: RouteId
  label: string
  icon: React.ComponentType<{ className?: string }>
  aliases?: RouteId[]
}

const ITEMS: NavItem[] = [
  { route: 'home-developer', label: 'Trang chủ', icon: Home },
  {
    route: 'applications',
    label: 'Thẩm định hồ sơ',
    icon: FileText,
    aliases: ['application-detail'],
  },
  {
    route: 'projects',
    label: 'Dự án',
    icon: Building2,
    aliases: ['project-detail', 'create-project'],
  },
  {
    route: 'lottery-sessions',
    label: 'Bốc thăm',
    icon: Gavel,
    aliases: ['my-lottery'],
  },
  {
    route: 'lottery-live',
    label: 'Bốc thăm trực tiếp',
    icon: Radio,
  },
  { route: 'profile', label: 'Tài khoản', icon: User, aliases: ['change-password'] },
]

// Tất cả route của Housing Developer dùng sub-nav này.
export const DEVELOPER_SUB_NAV_ROUTES: RouteId[] = [
  'home-developer',
  'applications',
  'application-detail',
  'projects',
  'project-detail',
  'create-project',
  'lottery-sessions',
  'lottery-live',
  'my-lottery',
  'dashboard',
  'profile',
  'change-password',
  'notifications',
  'report-issue',
]

function isActive(current: RouteId, item: NavItem): boolean {
  if (current === item.route) return true
  return item.aliases?.includes(current) ?? false
}

/** Menu ngang dành riêng cho Chủ đầu tư — thay thế hoàn toàn header nav cũ. */
export function DeveloperSubNav() {
  const route = useHashRoute()

  return (
    <nav className={`${THEME.navBg}`} aria-label="Điều hướng chủ đầu tư">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-center overflow-x-auto px-4 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => {
          const active = isActive(route, item)
          const Icon = item.icon
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              data-active={active}
              className={`relative inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 text-sm font-medium transition-colors min-w-[120px] ${
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
  )
}