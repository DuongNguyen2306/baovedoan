import { resolveRoleTheme, type RoleThemeId } from '@/lib/role-theme'

const AMBIENT_CLASS: Record<RoleThemeId, string> = {
  public: '',
  applicant: 'ambient-glow-applicant',
  sxd: 'ambient-glow-sxd',
  developer: 'ambient-glow-developer',
  admin: 'ambient-glow-admin',
}

/** Lấy theme id tương ứng với trạng thái đăng nhập + role */
export function roleAmbientId(logged: boolean, role: string | null): RoleThemeId {
  return resolveRoleTheme(role, logged).id
}

/** Lớp ambient glow nền phía sau nội dung trang — phối theo role */
export function RoleAmbient({ roleId }: { roleId: RoleThemeId }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 ${AMBIENT_CLASS[roleId] ?? ''}`}
    />
  )
}
