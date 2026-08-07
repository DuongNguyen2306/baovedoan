import { BRAND } from '@/lib/brand'

export function GovFooter() {
  return (
    <footer className="bg-[#003D7A] text-white">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <h3 className="text-base font-bold leading-snug">{BRAND.projectName}</h3>
            <p className="mt-2 text-sm text-white/80">{BRAND.acronymExpanded}</p>
            <p className="mt-1 text-xs italic text-white/55">{BRAND.slogan}</p>
            <p className="mt-3 text-xs text-white/60">{BRAND.footerLine}</p>
          </div>
          <div>
            <h4 className="mb-3 border-l-4 border-[#FFCD00] pl-3 text-sm font-bold uppercase tracking-wide">
              Trụ sở
            </h4>
            <div className="space-y-2 text-sm text-white/75">
              <p>{BRAND.address}</p>
              <p className="text-xs text-white/55">Trụ sở chính — TP. Hồ Chí Minh</p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 border-l-4 border-[#FFCD00] pl-3 text-sm font-bold uppercase tracking-wide">
              Liên hệ
            </h4>
            <div className="space-y-2 text-sm text-white/75">
              <p>Email: {BRAND.email}</p>
              <p>Hotline: {BRAND.hotline}</p>
              <p>Fax: (028) 3822 1234</p>
              <p className="text-xs text-white/55">{BRAND.workingHours}</p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 border-l-4 border-[#FFCD00] pl-3 text-sm font-bold uppercase tracking-wide">
              Cơ quan vận hành
            </h4>
            <div className="space-y-2 text-sm text-white/75">
              <p>Sở Xây dựng TP. Hồ Chí Minh</p>
              <p className="text-xs text-white/55">Đơn vị quản trị hệ thống</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white/80">
                Phiên bản 1.0.0
              </span>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-6 md:flex-row">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} {BRAND.projectName}. Mọi quyền được bảo lưu.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/55">
            <span>Chính sách bảo mật</span>
            <span>·</span>
            <span>Điều khoản sử dụng</span>
            <span>·</span>
            <span>Sơ đồ trang</span>
          </div>
        </div>
      </div>
    </footer>
  )
}