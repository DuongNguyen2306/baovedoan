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
  { title: 'Hồ sơ chờ nhận', desc: 'Danh sách hồ sơ đã nộp cần nhận thẩm định.', route: 'applications' },
  { title: 'Hồ sơ đang xử lý', desc: 'Hồ sơ đang thẩm định thuộc hàng chờ của bạn.', route: 'applications' },
  { title: 'Dự án nhà ở', desc: 'Quản lý dự án và gửi hồ sơ lên Sở Xây dựng.', route: 'projects' },
  { title: 'Bảng điều phối', desc: 'Kiểm tra phiên và quyền truy cập.', route: 'dashboard' },
  { title: 'Hồ sơ cá nhân', desc: 'Thông tin tài khoản cán bộ.', route: 'profile' },
]

const STEPS: WorkflowStep[] = [
  { num: '1', title: 'Nhận hồ sơ', desc: 'Chuyển trạng thái từ "Đã nộp" sang "Đang thẩm định".' },
  { num: '2', title: 'Thẩm định', desc: 'Kiểm tra hồ sơ, tài liệu, yêu cầu bổ sung hoặc từ chối.' },
  { num: '3', title: 'Gửi Sở Xây dựng', desc: 'Chốt danh sách và gửi lên Sở Xây dựng hậu kiểm.' },
]

export function developerHomeView(): HTMLElement {
  const statsHost = el('div', { class: 'role-stats-inner' },
    statCard('—', 'Chờ nhận', 'Đã nộp'),
    statCard('—', 'Đang thẩm định', 'Đang xử lý'),
    statCard('—', 'Cần bổ sung', 'Yêu cầu thêm'),
    statCard('—', 'Dự án', 'Tham chiếu'),
  )

  const queueRows = el('div', { class: 'role-activity-list' })
  const queueSection = activityPanel('Hàng đợi thẩm định', 'Không có hồ sơ chờ nhận.', queueRows)

  const page = buildRolePage(
    'home-developer',
    'Tiếp nhận và thẩm định hồ sơ đăng ký nhà ở, gửi danh sách lên Sở Xây dựng.',
    statsHost,
    ACTIONS,
    [queueSection],
    workflowPanel(STEPS),
  )

  const welcome = page.querySelector('.role-welcome') as HTMLElement

  void (async () => {
    const [profile, submitted, reviewing, needMore, projects, queue] = await Promise.allSettled([
      usersApi.getProfile(),
      housingApplicationsApi.getAll({ pageSize: 1, status: 'SUBMITTED' }),
      housingApplicationsApi.getAll({ pageSize: 1, status: 'REVIEWING' }),
      housingApplicationsApi.getAll({ pageSize: 1, status: 'NEED_MORE_DOCUMENTS' }),
      housingProjectsApi.list({ pageSize: 1 }),
      housingApplicationsApi.getAll({ pageSize: 6, status: 'SUBMITTED' }),
    ])

    if (profile.status === 'fulfilled') {
      const p = profile.value as Record<string, unknown>
      setWelcome(welcome, String(p.fullName ?? p.FullName ?? ''))
    } else {
      setWelcome(welcome)
    }

    statsHost.replaceChildren(
      statCard(submitted.status === 'fulfilled' ? countFromPaged(submitted.value) : 0, 'Chờ nhận', 'Đã nộp'),
      statCard(reviewing.status === 'fulfilled' ? countFromPaged(reviewing.value) : 0, 'Đang thẩm định', 'Đang xử lý'),
      statCard(needMore.status === 'fulfilled' ? countFromPaged(needMore.value) : 0, 'Cần bổ sung', 'Yêu cầu thêm'),
      statCard(projects.status === 'fulfilled' ? countFromPaged(projects.value) : 0, 'Dự án', 'Tham chiếu'),
    )

    if (queue.status === 'fulfilled') {
      const apps = parsePagedApplications(queue.value)
      if (apps.length === 0) {
        queueRows.replaceChildren(el('p', { class: 'role-empty' }, 'Không có hồ sơ nào đang chờ nhận.'))
      } else {
        queueRows.replaceChildren(
          ...apps.map((a) =>
            activityRow(
              a.applicantFullName,
              `${a.projectName} · ${a.documentCount} tài liệu`,
              el('span', { class: 'role-tag is-info' }, STATUS[a.applicationStatus] ?? a.applicationStatus),
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
