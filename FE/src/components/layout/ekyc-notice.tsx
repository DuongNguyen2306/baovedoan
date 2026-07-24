import { useEffect, useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { navigate } from '@/router'
import { getCachedVerified } from '@/lib/verification'
import { refreshVerifiedStatus } from '@/lib/ekyc-gate'

const DISMISS_KEY = 'ekyc_notice_dismissed'

/**
 * Nhắc nhẹ khi Applicant chưa eKYC — không chặn duyệt dự án / quan tâm.
 * Hard gate nằm ở nút Đăng ký / Tạo hồ sơ (ekyc-gate).
 */
export function EkycNotice() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return
    const cached = getCachedVerified()
    if (cached === true) {
      setShow(false)
      return
    }
    if (cached === false) {
      setShow(true)
      return
    }
    void refreshVerifiedStatus().then((v) => {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return
      setShow(v === false)
    })
  }, [])

  if (!show) return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Bạn chưa xác minh danh tính (eKYC). Vẫn xem dự án và lưu quan tâm được — chỉ cần xác minh
          trước khi <strong>đăng ký hồ sơ</strong>.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="accent" onClick={() => navigate('verify-identity')}>
          Xác minh ngay
        </Button>
        <button
          type="button"
          aria-label="Đóng"
          className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
          onClick={() => {
            sessionStorage.setItem(DISMISS_KEY, '1')
            setShow(false)
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
