import { housingApplicationsApi, parsePagedApplications } from '../../api/housing-applications'
import { housingProjectsApi } from '../../api/housing-projects'
import { usersApi } from '../../api/users'
import { navigate } from '../../router'
import { el } from '../../ui/helpers'
import {
  activityPanel,
  activityRow,
  buildRolePage,
  countFromPaged,
  setWelcome,
  statCard,
  workflowPanel,
  type QuickAction,
  type WorkflowStep,
} from './shared'

const STATUS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWING: 'Đang thẩm định',
  NEED_MORE_DOCUMENTS: 'Cần bổ sung',
  PENDING_SXD_REVIEW: 'Chờ Sở Xây dựng',
  APPROVED: 'Đã phê duyệt',
  DEPOSIT_PAID: 'Đã đặt cọc',
  REJECTED: 'Từ chối',
  CANCELED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}

const ACTIONS: QuickAction[] = [
  { title: 'Hồ sơ chờ duyệt', desc: 'Hậu kiểm và phê duyệt hồ sơ đã được CĐT gửi lên.', route: 'applications' },
  { title: 'Dự án', desc: 'Xem và phê duyệt dự án nhà ở.', route: 'projects' },
  { title: 'Bảng điều phối', desc: 'Kiểm tra phiên và quyền truy cập.', route: 'dashboard' },
  { title: 'Hồ sơ cá nhân', desc: 'Thông tin tài khoản cán bộ.', route: 'profile' },
]

const STEPS: WorkflowStep[] = [
  { num: '1', title: 'Tiếp nhận hồ sơ', desc: 'CĐT gửi danh sách đã thẩm định lên Sở Xây dựng.' },
  { num: '2', title: 'Hậu kiểm', desc: 'Đối soát CCCD theo Đ38.1.đ và xác minh hồ sơ.' },
  { num: '3', title: 'Phê duyệt cuối', desc: 'Phê duyệt hoặc từ chối. Tự động duyệt sau 20 ngày.' },
]

export function sxdHomeView(): HTMLElement {
  const statsHost = el('div', { class: 'role-stats-inner' },
    statCard('—', 'Chờ duyệt', 'CĐT gửi lên'),
    statCard('—', 'Đã phê duyệt', 'Hồ sơ được duyệt'),
    statCard('—', 'Dự án', 'Được cấp phép'),
    statCard('—', 'Từ chối', 'Bị từ chối'),
  )

  const appRows = el('div', { class: 'role-activity-list' })
  const appSection = activityPanel('Hồ sơ chờ hậu kiểm', 'Không có hồ sơ nào đang chờ.', appRows)

  const page = buildRolePage(
    'home-sxd',
    'Hậu kiểm và phê duyệt cuối cùng các hồ sơ đăng ký nhà ở xã hội.',
    statsHost,
    ACTIONS,
    [appSection],
    workflowPanel(STEPS),
  )

  const welcome = page.querySelector('.role-welcome') as HTMLElement

  void (async () => {
    const [profile, pendingSxd, approved, projects, recent] = await Promise.allSettled([
      usersApi.getProfile(),
      housingApplicationsApi.getSxdDashboard({ pageSize: 1, status: 'PENDING_SXD_REVIEW' }),
      housingApplicationsApi.getAll({ pageSize: 1, status: 'APPROVED' }),
      housingProjectsApi.list({ pageSize: 1 }),
      housingApplicationsApi.getSxdDashboard({ pageSize: 6, status: 'PENDING_SXD_REVIEW' }),
    ])

    if (profile.status === 'fulfilled') {
      const p = profile.value as Record<string, unknown>
      setWelcome(welcome, String(p.fullName ?? p.FullName ?? ''))
    } else {
      setWelcome(welcome)
    }

    statsHost.replaceChildren(
      statCard(pendingSxd.status === 'fulfilled' ? countFromPaged(pendingSxd.value) : 0, 'Chờ duyệt', 'CĐT gửi lên'),
      statCard(approved.status === 'fulfilled' ? countFromPaged(approved.value) : 0, 'Đã phê duyệt', 'Hồ sơ được duyệt'),
      statCard(projects.status === 'fulfilled' ? countFromPaged(projects.value) : 0, 'Dự án', 'Được cấp phép'),
    )

    if (recent.status === 'fulfilled') {
      const apps = parsePagedApplications(recent.value)
      if (apps.length === 0) {
        appRows.replaceChildren(el('p', { class: 'role-empty' }, 'Không có hồ sơ nào đang chờ hậu kiểm.'))
      } else {
        appRows.replaceChildren(
          ...apps.map((a) =>
            activityRow(
              a.applicantFullName,
              `${a.projectName} · ${a.citizenId}`,
              el('span', { class: 'role-tag is-warn' }, STATUS[a.applicationStatus] ?? a.applicationStatus),
              () => {
                sessionStorage.setItem('applicationId', a.applicationId)
                navigate('application-detail')
              },
            ),
          ),
        )
      }
    }
  })()

  return page
}
