import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  ClipboardCheck,
  Globe2,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react'

export type RoleThemeId = 'public' | 'applicant' | 'sxd' | 'developer' | 'admin'

export interface RoleTheme {
  id: RoleThemeId
  badge: string
  badgeFull: string
  /** Background cho thanh nav: gradient + hiệu ứng glass. */
  navBg: string
  navBgHover: string
  navActiveBg: string
  navTextColor: string
  navActiveTextColor: string
  /** Thanh active bar dưới nav item. */
  activeBar: string
  /** Màu nhấn thương hiệu (badge, ring). */
  brandAccent: string
  brandAccentHover: string
  brandRing: string
  /** CTA chính. */
  ctaBg: string
  ctaBgHover: string
  ctaText: string
  ctaLabel: string
  ctaShort: string
  ctaRoute: string
  homeRoute: string
  Icon: LucideIcon
}

/**
 * Bảng phối màu theo vai trò — phong cách hiện đại, sáng sủa, chuyên nghiệp.
 * Nền trắng/sáng — accent màu riêng cho từng role.
 */
export const ROLE_THEMES: Record<RoleThemeId, RoleTheme> = {
  public: {
    id: 'public',
    badge: 'Cổng DVC',
    badgeFull: 'Cổng dịch vụ công trực tuyến',
    navBg:
      'bg-white border-b-2 border-blue-600 shadow-sm',
    navBgHover: 'hover:bg-blue-50',
    navActiveBg: 'bg-blue-50 border-b-2 border-blue-600 font-semibold',
    navTextColor: 'text-slate-600 hover:text-blue-600',
    navActiveTextColor: 'text-blue-700',
    activeBar: 'bg-blue-600 h-0.5',
    brandAccent:
      'bg-blue-600 text-white shadow-sm',
    brandAccentHover: 'hover:bg-blue-700',
    brandRing: 'ring-blue-400/40',
    ctaBg:
      'bg-blue-600 text-white shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)]',
    ctaBgHover: 'hover:bg-blue-700 hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)]',
    ctaText: 'text-white',
    ctaLabel: 'Đăng ký ngay',
    ctaShort: 'Đăng ký',
    ctaRoute: 'register',
    homeRoute: 'landing',
    Icon: Globe2,
  },
  applicant: {
    id: 'applicant',
    badge: 'Người dùng',
    badgeFull: 'Cổng công dân',
    navBg:
      'bg-white border-b border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800',
    navBgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-950',
    navActiveBg: 'bg-emerald-50 text-emerald-700 font-semibold border-b-2 border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300',
    navTextColor: 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400',
    navActiveTextColor: 'text-emerald-700 dark:text-emerald-300',
    activeBar: 'bg-emerald-500 h-0.5 shadow-[0_0_6px_rgba(16,185,129,0.4)]',
    brandAccent:
      'bg-emerald-500 text-white dark:bg-emerald-600',
    brandAccentHover: 'hover:bg-emerald-600 dark:hover:bg-emerald-700',
    brandRing: 'ring-emerald-400/40',
    ctaBg:
      'bg-emerald-500 text-white shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)] dark:bg-emerald-600',
    ctaBgHover: 'hover:bg-emerald-600 hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] dark:hover:bg-emerald-700',
    ctaText: 'text-white',
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
    navBg:
      'bg-white border-b border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800',
    navBgHover: 'hover:bg-amber-50 dark:hover:bg-amber-950',
    navActiveBg: 'bg-amber-50 text-amber-800 font-semibold border-b-2 border-amber-500 dark:bg-amber-950/50 dark:text-amber-300',
    navTextColor: 'text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-400',
    navActiveTextColor: 'text-amber-800 dark:text-amber-300',
    activeBar: 'bg-amber-500 h-0.5 shadow-[0_0_6px_rgba(245,158,11,0.4)]',
    brandAccent:
      'bg-amber-500 text-white shadow-sm dark:bg-amber-600',
    brandAccentHover: 'hover:bg-amber-600 dark:hover:bg-amber-700',
    brandRing: 'ring-amber-400/40',
    ctaBg:
      'bg-amber-500 text-white shadow-[0_4px_12px_-2px_rgba(245,158,11,0.4)] dark:bg-amber-600',
    ctaBgHover: 'hover:bg-amber-600 hover:shadow-[0_6px_16px_-4px_rgba(245,158,11,0.5)] dark:hover:bg-amber-700',
    ctaText: 'text-white',
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
    navBg:
      'bg-white border-b border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800',
    navBgHover: 'hover:bg-blue-50 dark:hover:bg-blue-950',
    navActiveBg: 'bg-blue-50 text-blue-800 font-semibold border-b-2 border-blue-500 dark:bg-blue-950/50 dark:text-blue-300',
    navTextColor: 'text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-400',
    navActiveTextColor: 'text-blue-800 dark:text-blue-300',
    activeBar: 'bg-blue-500 h-0.5 shadow-[0_0_6px_rgba(37,99,235,0.4)]',
    brandAccent:
      'bg-blue-600 text-white shadow-sm dark:bg-blue-700',
    brandAccentHover: 'hover:bg-blue-700 dark:hover:bg-blue-800',
    brandRing: 'ring-blue-400/40',
    ctaBg:
      'bg-blue-600 text-white shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)] dark:bg-blue-700',
    ctaBgHover: 'hover:bg-blue-700 hover:shadow-[0_6px_16px_-4px_rgba(37,99,235,0.5)] dark:hover:bg-blue-800',
    ctaText: 'text-white',
    ctaLabel: 'Thẩm định hồ sơ',
    ctaShort: 'Duyệt',
    ctaRoute: 'applications',
    homeRoute: 'home-developer',
    Icon: Building2,
  },
  admin: {
    id: 'admin',
    badge: 'Quản trị',
    badgeFull: 'Quản trị hệ thống',
    navBg:
      'bg-white border-b border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800',
    navBgHover: 'hover:bg-rose-50 dark:hover:bg-rose-950',
    navActiveBg: 'bg-rose-50 text-rose-700 font-semibold border-b-2 border-rose-500 dark:bg-rose-950/50 dark:text-rose-300',
    navTextColor: 'text-slate-600 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-300',
    navActiveTextColor: 'text-rose-700 dark:text-rose-300',
    activeBar: 'bg-rose-500 h-0.5 shadow-[0_0_6px_rgba(244,63,94,0.4)]',
    brandAccent:
      'bg-rose-500 text-white shadow-sm dark:bg-rose-600',
    brandAccentHover: 'hover:bg-rose-600 dark:hover:bg-rose-700',
    brandRing: 'ring-rose-400/40',
    ctaBg:
      'bg-rose-500 text-white shadow-[0_4px_12px_-2px_rgba(244,63,94,0.4)] dark:bg-rose-600',
    ctaBgHover: 'hover:bg-rose-600 hover:shadow-[0_6px_16px_-4px_rgba(244,63,94,0.5)] dark:hover:bg-rose-700',
    ctaText: 'text-white',
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
