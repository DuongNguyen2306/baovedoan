export const APPLICATION_STATUS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary' }> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  SUBMITTED: { label: 'Đã nộp', variant: 'default' },
  REVIEWING: { label: 'Đang thẩm định', variant: 'warning' },
  NEED_MORE_DOCUMENTS: { label: 'Cần bổ sung', variant: 'warning' },
  PENDING_SXD_REVIEW: { label: 'Chờ Sở Xây dựng', variant: 'warning' },
  APPROVED: { label: 'Đã phê duyệt', variant: 'success' },
  DEPOSIT_PAID: { label: 'Đã đặt cọc', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
  CANCELED: { label: 'Đã hủy', variant: 'secondary' },
  EXPIRED: { label: 'Hết hạn', variant: 'danger' },
}

export const CLOSED_APPLICATION_STATUSES = ['APPROVED', 'DEPOSIT_PAID', 'REJECTED', 'CANCELED', 'EXPIRED']

export const DOC_TYPE_LABELS: Record<string, string> = {
  HOUSING_CONDITION_PROOF: 'Giấy chứng nhận thực trạng nhà ở',
  POVERTY_HOUSEHOLD_CERTIFICATE: 'Giấy chứng nhận hộ nghèo/cận nghèo',
}

export const HOUSING_STATUS_LABELS: Record<string, string> = {
  NO_HOUSE: 'Chưa có nhà ở',
  SMALL_HOUSE: 'Nhà diện tích dưới 15m²',
}

export const ROLE_OPTIONS = [
  { value: 'Applicant', label: 'Người dùng' },
  { value: 'Department Of Construction', label: 'Sở Xây dựng' },
  { value: 'Housing Developer', label: 'Chủ đầu tư' },
] as const

export const FLASH_CREATE_PROJECT_KEY = 'flashCreateProjectSuccess'
