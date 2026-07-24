/** Số ngày Sở Xây dựng hậu kiểm trước khi hệ thống tự duyệt (Case 6). */
export const TACIT_APPROVAL_DAYS = 20

export function getSxdDeadline(start: string | Date): Date {
  const d = typeof start === 'string' ? new Date(start) : new Date(start.getTime())
  d.setDate(d.getDate() + TACIT_APPROVAL_DAYS)
  return d
}

export function getCountdown(deadline: Date, now = new Date()) {
  const totalMs = deadline.getTime() - now.getTime()
  const isOverdue = totalMs <= 0
  const abs = Math.abs(totalMs)
  const days = Math.floor(abs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000))
  const label = isOverdue
    ? `Quá hạn ${days}d ${hours}h`
    : `Còn ${days} ngày ${hours} giờ`
  return { days, hours, minutes, totalMs, isOverdue, label }
}

export function formatSxdCountdown(submittedAt: string | null | undefined, now = new Date()) {
  if (!submittedAt) return null
  const deadline = getSxdDeadline(submittedAt)
  return {
    deadline,
    ...getCountdown(deadline, now),
  }
}
