import { useEffect, useState } from 'react'

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return (
    <span className={className} suppressHydrationWarning>
      <span className="hidden sm:inline">{now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })} · </span>
      <span className="font-mono font-semibold tabular-nums">{time}</span>
    </span>
  )
}
