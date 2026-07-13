import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react'

export type RoleThemeId = 'public' | 'applicant' | 'sxd' | 'developer' | 'admin'

export interface RoleTheme {
  id: RoleThemeId
  badge: string
  badgeFull: string
  navBg: string
  navBgHover: string
  navActiveBg: string
  navTextColor: string
  navActiveTextColor: string
  activeBar: string
  brandAccent: string
  brandAccentHover: string
  brandRing: string
  ctaBg: string
  ctaBgHover: string
  ctaText: string
  ctaLabel: string
  ctaShort: string
  ctaRoute: string
  homeRoute: string
  Icon: LucideIcon
}

export const ROLE_THEMES: Record<RoleThemeId, RoleTheme> = {
  public: {
    id: 'public',
    badge: 'Cổng DVC',
    badgeFull: 'Cổng dịch vụ công trực tuyến',
    navBg: 'bg-[#005BAC]',
    navBgHover: 'hover:bg-white/10',
    navActiveBg: 'bg-white/15',
    navTextColor: 'text-white/85',
    navActiveTextColor: 'text-white',
    activeBar: 'bg-[#FFCD00]',
    brandAccent: 'bg-[#005BAC]',
    brandAccentHover: 'hover:bg-[#003D7A]',
    brandRing: 'ring-[#005BAC]/30',
    ctaBg: 'bg-[#DA251D]',
    ctaBgHover: 'hover:bg-[#b81e17]',
    ctaText: 'text-white',
    ctaLabel: 'Đăng ký ngay',
    ctaShort: 'Đăng ký',
    ctaRoute: 'register',
    homeRoute: 'landing',
    Icon: LayoutDashboard,
  },
  applicant: {
    id: 'applicant',
    badge: 'Người dùng',
    badgeFull: 'Cổng công dân',
    navBg: 'bg-emerald-700',
    navBgHover: 'hover:bg-emerald-600/30',
    navActiveBg: 'bg-white/20',
    navTextColor: 'text-emerald-50/85',
    navActiveTextColor: 'text-white',
    activeBar: 'bg-amber-300',
    brandAccent: 'bg-emerald-700',
    brandAccentHover: 'hover:bg-emerald-800',
    brandRing: 'ring-emerald-600/40',
    ctaBg: 'bg-amber-500',
    ctaBgHover: 'hover:bg-amber-600',
    ctaText: 'text-emerald-950',
    ctaLabel: 'Xem hồ sơ',
    ctaShort: 'Hồ sơ',
    ctaRoute: 'applications',
    homeRoute: 'home-user',
    Icon: UserCircle2,
  },
  sxd: {
    id: 'sxd',
    badge: 'Sở Xây dựng',
    badgeFull: 'Sở Xây dựng',
    navBg: 'bg-blue-700',
    navBgHover: 'hover:bg-blue-600/30',
    navActiveBg: 'bg-white/20',
    navTextColor: 'text-blue-50/85',
    navActiveTextColor: 'text-white',
    activeBar: 'bg-amber-300',
    brandAccent: 'bg-blue-700',
    brandAccentHover: 'hover:bg-blue-800',
    brandRing: 'ring-blue-500/40',
    ctaBg: 'bg-amber-500',
    ctaBgHover: 'hover:bg-amber-600',
    ctaText: 'text-blue-950',
    ctaLabel: 'Hồ sơ chờ duyệt',
    ctaShort: 'Duyệt',
    ctaRoute: 'applications',
    homeRoute: 'home-sxd',
    Icon: Building2,
  },
  developer: {
    id: 'developer',
    badge: 'Chủ đầu tư',
    badgeFull: 'Chủ đầu tư',
    navBg: 'bg-indigo-700',
    navBgHover: 'hover:bg-indigo-600/30',
    navActiveBg: 'bg-white/20',
    navTextColor: 'text-indigo-50/85',
    navActiveTextColor: 'text-white',
    activeBar: 'bg-rose-300',
    brandAccent: 'bg-indigo-700',
    brandAccentHover: 'hover:bg-indigo-800',
    brandRing: 'ring-indigo-500/40',
    ctaBg: 'bg-rose-500',
    ctaBgHover: 'hover:bg-rose-600',
    ctaText: 'text-white',
    ctaLabel: 'Thẩm định hồ sơ',
    ctaShort: 'Duyệt',
    ctaRoute: 'applications',
    homeRoute: 'home-developer',
    Icon: ClipboardCheck,
  },
  admin: {
    id: 'admin',
    badge: 'Quản trị',
    badgeFull: 'Quản trị hệ thống',
    navBg: 'bg-slate-800',
    navBgHover: 'hover:bg-slate-700/40',
    navActiveBg: 'bg-white/15',
    navTextColor: 'text-slate-100/85',
    navActiveTextColor: 'text-white',
    activeBar: 'bg-cyan-300',
    brandAccent: 'bg-slate-800',
    brandAccentHover: 'hover:bg-slate-900',
    brandRing: 'ring-slate-500/40',
    ctaBg: 'bg-cyan-500',
    ctaBgHover: 'hover:bg-cyan-600',
    ctaText: 'text-slate-950',
    ctaLabel: 'Thêm cán bộ',
    ctaShort: 'Cán bộ',
    ctaRoute: 'create-staff',
    homeRoute: 'admin-staff',
    Icon: ShieldCheck,
  },
}

export function resolveRoleTheme(role: string | null, logged: boolean): RoleTheme {
  if (!logged || !role) return ROLE_THEMES.public
  if (role === 'Applicant') return ROLE_THEMES.applicant
  if (role === 'Department Of Construction') return ROLE_THEMES.sxd
  if (role === 'Housing Developer') return ROLE_THEMES.developer
  if (role === 'System Administrator') return ROLE_THEMES.admin
  return ROLE_THEMES.public
}

export const ROLE_ICONS = {
  applicant: UserCircle2,
  sxd: Building2,
  developer: ClipboardCheck,
  admin: ShieldCheck,
  public: Users,
} as const
