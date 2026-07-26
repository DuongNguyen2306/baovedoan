/**
 * Fallback khớp default policy BE `DEPOSIT_PAYMENT_HOURS` (Applicant không đọc được Policy API).
 * deadline = finalDecisionDate + hours — không dùng ngày nộp/đăng ký.
 */
export const DEPOSIT_PAYMENT_HOURS = 24

const APPROVED_FOR_DEPOSIT_DEADLINE = new Set(['APPROVED', 'APPROVED_BY_TIMEOUT'])

export function isDepositDeadlineStatus(status: string | null | undefined): boolean {
  return !!status && APPROVED_FOR_DEPOSIT_DEADLINE.has(status)
}

export function getDepositDeadline(finalDecisionDate: string | Date): Date {
  const d =
    typeof finalDecisionDate === 'string'
      ? new Date(finalDecisionDate)
      : new Date(finalDecisionDate.getTime())
  d.setTime(d.getTime() + DEPOSIT_PAYMENT_HOURS * 60 * 60 * 1000)
  return d
}

export function getDepositCountdown(deadline: Date, now = new Date()) {
  const totalMs = deadline.getTime() - now.getTime()
  const isOverdue = totalMs <= 0
  const abs = Math.abs(totalMs)
  const hours = Math.floor(abs / (60 * 60 * 1000))
  const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((abs % (60 * 1000)) / 1000)
  const hhmmss = [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
  const label = isOverdue
    ? `Đã quá hạn ${hhmmss}`
    : `Còn ${hhmmss}`
  return { hours, minutes, seconds, totalMs, isOverdue, label, hhmmss }
}

/** Trả null nếu không áp dụng (thiếu mốc duyệt hoặc sai trạng thái). */
export function formatDepositCountdown(
  status: string | null | undefined,
  finalDecisionDate: string | null | undefined,
  now = new Date(),
) {
  if (!isDepositDeadlineStatus(status) || !finalDecisionDate) return null
  const deadline = getDepositDeadline(finalDecisionDate)
  return {
    deadline,
    hoursLimit: DEPOSIT_PAYMENT_HOURS,
    ...getDepositCountdown(deadline, now),
  }
}
