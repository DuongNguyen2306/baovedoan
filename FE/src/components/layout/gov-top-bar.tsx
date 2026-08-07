import { Mail, MapPin, Phone } from 'lucide-react'
import { BRAND } from '@/lib/brand'
import { LiveClock } from '@/components/layout/live-clock'

/**
 * Thanh trên cùng — hotline, email, địa điểm, trạng thái hệ thống, đồng hồ.
 * Phiên bản 4.1: glassy, LED sweep, pulse status, các item nằm cùng 1 dòng.
 */
export function GovTopBar() {
  return (
    <div className="relative border-b border-[#003D7A]/30 bg-gradient-to-r from-[#003D7A] via-[#0a4a8e] to-[#003D7A] text-white">
      <div className="led-strip absolute inset-x-0 top-0" aria-hidden />
      <div className="mx-auto flex max-w-[1600px] flex-nowrap items-center justify-between gap-x-4 gap-y-0 whitespace-nowrap px-4 py-1.5 text-[11px] lg:px-8">
        <div className="flex flex-nowrap items-center gap-x-4 whitespace-nowrap">
          <span className="inline-flex shrink-0 items-center gap-1.5 font-medium">
            <Phone className="h-3 w-3 text-[#FFCD00]" />
            {BRAND.hotlineLabel}: <strong className="text-[#FFCD00]">{BRAND.hotline}</strong>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:inline-flex whitespace-nowrap">
            <Mail className="h-3 w-3 text-white/70" />
            {BRAND.email}
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 md:inline-flex whitespace-nowrap">
            <MapPin className="h-3 w-3 text-white/70" />
            TP.HCM
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap">
            <LiveClock className="text-white/85" />
          </span>
        </div>
      </div>
    </div>
  )
}

/** Khối hotline nổi bật trong footer */
export function GovHotlineBox({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{BRAND.hotlineLabel}</p>
      <p className="mt-1 text-2xl font-bold text-[#FFCD00]">{BRAND.hotline}</p>
      <p className="mt-1 text-xs text-white/60">{BRAND.workingHours}</p>
    </div>
  )
}

export function GovContactLines() {
  return (
    <div className="space-y-2 text-sm text-white/80">
      <p className="inline-flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FFCD00]" />
        {BRAND.address}
      </p>
      <p className="inline-flex items-center gap-2">
        <Mail className="h-4 w-4 shrink-0 text-[#FFCD00]" />
        {BRAND.email}
      </p>
    </div>
  )
}
