import { cn } from '@/lib/utils'
import { GOV_IMAGES } from '@/lib/media'

interface GovHeroBannerProps {
  title: string
  subtitle?: string
  badge?: string
  className?: string
  compact?: boolean
}

/** Banner ảnh nền kiểu hiện đại, nhẹ nhàng — không dùng strip bar cờ VN */
export function GovHeroBanner({ title, subtitle, badge, className, compact }: GovHeroBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-sm',
        compact ? 'min-h-[120px]' : 'min-h-[160px] md:min-h-[200px]',
        className,
      )}
    >
      {/* Ảnh nền */}
      <img
        src={GOV_IMAGES.heroBanner}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {/* Overlay xanh nhạt — không đậm như trước */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/75 via-blue-500/60 to-blue-400/40" />
      {/* Pattern overlay mờ */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: `url(${GOV_IMAGES.pattern})`, backgroundSize: '24px 24px' }}
      />

      {/* Nội dung */}
      <div className={cn('relative flex h-full flex-col justify-center px-6 py-5 text-white md:px-8 md:py-6', compact ? '' : '')}>
        {badge && (
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            {badge}
          </span>
        )}
        <h2 className={cn(
          'font-bold leading-tight tracking-tight text-white',
          compact ? 'text-lg md:text-xl' : 'text-xl md:text-2xl lg:text-3xl',
        )}>
          {title}
        </h2>
        {subtitle && (
          <p className={cn(
            'mt-1.5 max-w-2xl text-white/90',
            compact ? 'text-xs md:text-sm' : 'text-sm md:text-base',
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
