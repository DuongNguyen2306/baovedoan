import { Building2, FileSearch, Search, UserPlus } from 'lucide-react'
import { navigate } from '@/hooks/useHashRoute'

const SERVICES = [
  { icon: Search, label: 'Tra cứu hồ sơ', desc: 'Theo dõi tiến độ', route: 'tra-cuu' as const },
  { icon: Search, label: 'Tìm nhà ở', desc: 'Tra cứu dự án', route: 'tim-nha' as const },
  { icon: Building2, label: 'Dự án nhà ở', desc: 'Danh sách dự án', route: 'projects' as const },
  { icon: FileSearch, label: 'Hồ sơ của tôi', desc: 'Xem hồ sơ', route: 'applications' as const },
  { icon: UserPlus, label: 'Đăng ký tài khoản', desc: 'Tạo tài khoản mới', route: 'register' as const },
]

/** Lưới dịch vụ công — kiểu hiện đại, card trắng, icon pastel nhẹ */
export function GovServiceGrid() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header nhẹ */}
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Dịch vụ công trực tuyến</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Thực hiện thủ tục hành chính mọi lúc, mọi nơi
        </p>
      </div>

      {/* Grid services */}
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-3 lg:grid-cols-5 dark:divide-slate-800">
        {SERVICES.map((svc) => {
          const Icon = svc.icon
          return (
            <button
              key={svc.route}
              type="button"
              onClick={() => navigate(svc.route)}
              className="group flex flex-col items-center gap-2.5 px-4 py-6 text-center transition-colors hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-800/80"
            >
              {/* Icon trong vòng tròn xanh nhạt */}
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500 shadow-sm ring-1 ring-inset ring-blue-100 transition-transform group-hover:scale-105 group-hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-800">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{svc.label}</span>
              <span className="text-[10px] leading-tight text-slate-400 dark:text-slate-500">{svc.desc}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
