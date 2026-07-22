import { Bell } from 'lucide-react'

const ANNOUNCEMENTS = [
  { date: '05/07/2026', text: 'Cập nhật danh sách dự án nhà ở xã hội Quý III/2026 trên toàn quốc' },
  { date: '01/07/2026', text: 'Hướng dẫn tra cứu hồ sơ đã đăng ký qua cổng RHS' },
  { date: '28/06/2026', text: 'Thông báo lịch nghỉ và tiếp nhận hồ sơ dịp Quốc khánh 2/9' },
]

/** Dòng thông báo — phong cách hiện đại, nhẹ nhàng */
export function GovAnnouncements() {
  return (
    <div className="soft-card flex flex-col gap-0 overflow-hidden p-0 sm:flex-row">
      {/* Strip màu nhẹ bên trái */}
      <div className="flex shrink-0 items-center gap-2 bg-blue-50 px-4 py-2.5 text-blue-600 sm:py-0 dark:bg-blue-950/50 dark:text-blue-300">
        <Bell className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Thông báo</span>
      </div>
      {/* Danh sách thông báo */}
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-2.5 sm:py-2">
        {ANNOUNCEMENTS.map((a) => (
          <p key={a.date} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <time className="shrink-0 font-semibold text-blue-500 dark:text-blue-400">[{a.date}]</time>
            <span className="text-slate-600 dark:text-slate-300">{a.text}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
