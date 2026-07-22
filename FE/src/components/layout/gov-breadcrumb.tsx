import { Home } from 'lucide-react'
import { getRouteConfig, roleHome, isLoggedIn, getRole } from '@/router'
import { useHashRoute } from '@/hooks/useHashRoute'

export function GovBreadcrumb() {
  const route = useHashRoute()
  const logged = isLoggedIn()
  const cfg = getRouteConfig(route)
  const homeRoute = logged ? roleHome(logged ? getRole() : '') : 'landing'

  if (route === 'landing' || route === homeRoute) return null

  return (
    <nav aria-label="Breadcrumb" className="gov-breadcrumb mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li className="flex items-center gap-1.5 text-slate-400">
          <Home className="h-3.5 w-3.5" />
          <span className="font-semibold text-[#003D7A] dark:text-slate-200">{cfg.label}</span>
        </li>
      </ol>
    </nav>
  )
}
