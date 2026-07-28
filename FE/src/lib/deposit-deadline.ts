/**
 * Fallback khớp default policy BE `DEPOSIT_PAYMENT_HOURS` (168h = 7 ngày).
 * Mốc đúng: sau khi ký HĐ (`CONTRACT_SIGNED`), không dùng ngày duyệt SXD / APPROVED.
 */
export const DEPOSIT_PAYMENT_HOURS = 168
export const DEPOSIT_PAYMENT_DAYS = 7

const DEPOSIT_DEADLINE_STATUSES = new Set(['CONTRACT_SIGNED'])

export function isDepositDeadlineStatus(status: string | null | undefined): boolean {
  return !!status && DEPOSIT_DEADLINE_STATUSES.has(status)
}

/** @param signedAt Mốc ký HĐ (SignedAt / updatedAt fallback). */
export function getDepositDeadline(signedAt: string | Date): Date {
  const d =
    typeof signedAt === 'string'
      ? new Date(signedAt)
      : new Date(signedAt.getTime())
  d.setTime(d.getTime() + DEPOSIT_PAYMENT_HOURS * 60 * 60 * 1000)
  return d
}

export function getDepositCountdown(deadline: Date, now = new Date()) {
  const totalMs = deadline.getTime() - now.getTime()
  const isOverdue = totalMs <= 0
  const abs = Math.abs(totalMs)
  const totalHours = Math.floor(abs / (60 * 60 * 1000))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000))
  const seconds = Math.floor((abs % (60 * 1000)) / 1000)
  const hhmmss =
    days > 0
      ? `${days} ngày ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : [
          String(hours).padStart(2, '0'),
          String(minutes).padStart(2, '0'),
          String(seconds).padStart(2, '0'),
        ].join(':')
  const label = isOverdue ? `Đã quá hạn ${hhmmss}` : `Còn ${hhmmss}`
  return { days, hours, minutes, seconds, totalMs, isOverdue, label, hhmmss }
}

/** Trả null nếu không áp dụng (thiếu mốc ký hoặc sai trạng thái). */
export function getDepositDeadlineInfo(
  status: string | null | undefined,
  signedAt: string | null | undefined,
  now = new Date(),
) {
  if (!isDepositDeadlineStatus(status) || !signedAt) return null
  const deadline = getDepositDeadline(signedAt)
  return {
    deadline,
    hoursLimit: DEPOSIT_PAYMENT_HOURS,
    daysLimit: DEPOSIT_PAYMENT_DAYS,
    ...getDepositCountdown(deadline, now),
  }
}

/** Alias cho UI — chỉ hiện khi CONTRACT_SIGNED; signedAt = SignedAt hoặc updatedAt fallback. */
export function formatDepositCountdown(
  status: string | null | undefined,
  signedAt: string | null | undefined,
  now = new Date(),
) {
  return getDepositDeadlineInfo(status, signedAt, now)
}
