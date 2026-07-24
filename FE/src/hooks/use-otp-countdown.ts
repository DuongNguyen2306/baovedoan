import { useCallback, useEffect, useRef, useState } from 'react'

/** Đếm ngược gửi lại OTP (mặc định 60 giây). */
export function useOtpCountdown(initialSeconds = 60) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (from = initialSeconds) => {
      clear()
      setSecondsLeft(from)
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clear()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [clear, initialSeconds],
  )

  const reset = useCallback(() => {
    clear()
    setSecondsLeft(0)
  }, [clear])

  useEffect(() => () => clear(), [clear])

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start,
    reset,
  }
}
