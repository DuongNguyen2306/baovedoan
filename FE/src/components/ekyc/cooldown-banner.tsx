import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { formatCooldown, getOcrCooldownRemainingMs } from '@/lib/ekyc-helpers'

/**
 * Banner đếm ngược cooldown OCR — state cục bộ, chỉ re-render chính nó mỗi giây
 * thay vì kéo cả trang verify-identity re-render theo.
 * Phát custom event 'ocr-cooldown-tick' để trang cha cập nhật trạng thái disable nút.
 */
export function CooldownBanner() {
  const [remainingMs, setRemainingMs] = useState(() => getOcrCooldownRemainingMs())

  useEffect(() => {
    const tick = () => {
      const ms = getOcrCooldownRemainingMs()
      setRemainingMs(ms)
      window.dispatchEvent(new CustomEvent<number>('ocr-cooldown-tick', { detail: ms }))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (remainingMs <= 0) return null

  return (
    <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
      <AlertCircle className="h-4 w-4" />
      OCR tạm khóa — thử lại sau {formatCooldown(remainingMs)} hoặc nhập tay.
    </p>
  )
}
