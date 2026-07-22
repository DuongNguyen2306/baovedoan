import { useEffect, useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface AreaChartSeries {
  name: string
  data: number[]
  color: string
}

export interface AreaChartPoint {
  label: string
  series: AreaChartSeries
}

interface AreaChartProps {
  /** Mỗi phần tử là 1 series (đường + vùng), gồm `label[]` riêng. Nếu dùng cách này thì bỏ `points`. */
  series?: AreaChartSeries[]
  /** Cách cũ: mảng {label, series} */
  points?: AreaChartPoint[]
  className?: string
  height?: number
  showGrid?: boolean
  showAxes?: boolean
  showLegend?: boolean
  drawMs?: number
}

function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  if (pts.length === 0) return ''
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const cx1 = x1 + (x2 - x1) / 2
    const cy1 = y1
    const cx2 = x1 + (x2 - x1) / 2
    const cy2 = y2
    d += ` C${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  return d
}

export function AreaChart({
  series,
  points,
  className,
  height = 240,
  showGrid = true,
  showAxes = true,
  showLegend = true,
  drawMs = 1600,
}: AreaChartProps) {
  const uid = useId()
  const [mounted, setMounted] = useState(false)
  const [hover, setHover] = useState<{ x: number; idx: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const layout = useMemo(() => {
    const w = 720
    const h = height
    const padL = showAxes ? 36 : 8
    const padR = 16
    const padT = 16
    const padB = showAxes ? 28 : 8

    const list: { name: string; data: number[]; color: string }[] = []
    if (points && points.length) {
      const labels = points.map((p) => p.label)
      const seriesArr = Array.from(
        points.reduce((map, p) => {
          if (!map.has(p.series.name)) map.set(p.series.name, { name: p.series.name, data: [], color: p.series.color })
          return map
        }, new Map<string, { name: string; data: number[]; color: string }>()).values(),
      )
      // Tái dựng data theo label
      seriesArr.forEach((s) => {
        s.data = points.filter((p) => p.series.name === s.name).map((p) => p.series.data[0] ?? 0)
      })
      list.push(...seriesArr)
      // Labels chung (lấy union)
      const allLabels = Array.from(new Set(labels))
      return build(w, h, padL, padR, padT, padB, list, allLabels)
    }
    if (series && series.length) {
      const labels = series[0].data.map((_, i) => `T${i + 1}`)
      return build(w, h, padL, padR, padT, padB, series, labels)
    }
    return null
  }, [series, points, height, showAxes])

  if (!layout) return null
  const { w, h, padL, padB, padT, list, labels, stepX, allMin, allMax, yTicks } = layout

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w
    const idx = Math.max(0, Math.min(labels.length - 1, Math.round((x - padL) / stepX)))
    setHover({ x: padL + idx * stepX, idx })
  }

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {list.map((s, i) => (
            <linearGradient key={`${uid}-${i}`} id={`${uid}-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.55" />
              <stop offset="55%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {showGrid &&
          yTicks.map((y, i) => (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={w - 16}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="3 4"
                className="text-slate-300 dark:text-slate-700"
                opacity="0.55"
              />
              {showAxes && (
                <text
                  x={padL - 6}
                  y={y + 3}
                  fontSize="9"
                  textAnchor="end"
                  className="fill-slate-400 font-mono dark:fill-slate-500"
                >
                  {Math.round(allMax - ((y - padT) / (h - padT - padB)) * (allMax - allMin))}
                </text>
              )}
            </g>
          ))}

        {/* Series */}
        {list.map((s, i) => {
          const innerH = h - padT - padB
          const pts: Array<[number, number]> = s.data.map((v, j) => {
            const x = padL + j * stepX
            const t = (v - allMin) / Math.max(allMax - allMin, 1)
            const y = h - padB - t * innerH
            return [x, y]
          })
          const path = smoothPath(pts)
          const areaPath = `${path} L${pts[pts.length - 1][0]} ${h - padB} L${pts[0][0]} ${h - padB} Z`

          return (
            <g key={s.name}>
              {/* Soft glow under */}
              <path d={path} fill="none" stroke={s.color} strokeWidth="6" strokeLinecap="round" opacity="0.18" filter={`url(#${uid}-glow)`} />
              {/* Area fill */}
              <path
                d={areaPath}
                fill={`url(#${uid}-fill-${i})`}
                opacity={mounted ? 1 : 0}
                style={{ transition: `opacity ${drawMs * 0.6}ms ease 200ms` }}
              />
              {/* Stroke draw */}
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 1500,
                  strokeDashoffset: mounted ? 0 : 1500,
                  transition: `stroke-dashoffset ${drawMs}ms cubic-bezier(0.65, 0, 0.35, 1)`,
                }}
              />
              {/* Dots */}
              {pts.map(([x, y], j) => (
                <g key={j}>
                  <circle cx={x} cy={y} r={hover?.idx === j ? 5 : 2.5} fill="#fff" stroke={s.color} strokeWidth="1.8" style={{ transition: 'r 0.2s ease' }} />
                </g>
              ))}
            </g>
          )
        })}

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line x1={hover.x} y1={padT - 6} x2={hover.x} y2={h - padB + 4} stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" className="text-slate-400" opacity="0.7" />
          </g>
        )}

        {/* X axis labels */}
        {showAxes &&
          labels.map((l, i) => (
            <text
              key={l}
              x={padL + i * stepX}
              y={h - padB + 14}
              fontSize="9"
              textAnchor="middle"
              className="fill-slate-500 font-mono dark:fill-slate-400"
            >
              {l}
            </text>
          ))}

        {/* Hover area */}
        <rect x={padL} y={padT} width={w - padL - 16} height={h - padT - padB} fill="transparent" onMouseMove={onMove} />
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="pointer-events-none absolute right-3 top-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold">
          {list.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-slate-700 backdrop-blur-md ring-1 ring-slate-200/80 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-slate-700/70">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-2 rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 text-[11px] font-semibold text-white shadow-xl backdrop-blur-md"
          style={{ left: `${(hover.x / w) * 100}%`, top: '8px' }}
        >
          <div className="mb-1 text-[9px] uppercase tracking-wider text-slate-400">{labels[hover.idx]}</div>
          <div className="space-y-0.5">
            {list.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                <span className="text-slate-200">{s.name}:</span>
                <span className="font-bold">{s.data[hover.idx]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface LayoutResult {
  w: number
  h: number
  padL: number
  padR: number
  padT: number
  padB: number
  list: Array<{ name: string; data: number[]; color: string }>
  labels: string[]
  stepX: number
  allMin: number
  allMax: number
  yTicks: number[]
}

function build(
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
  list: Array<{ name: string; data: number[]; color: string }>,
  labels: string[],
): LayoutResult {
  const allValues = list.flatMap((s) => s.data)
  const max = Math.max(...allValues, 1)
  const min = Math.min(...allValues, 0)
  const stepX = (w - padL - padR) / Math.max(labels.length - 1, 1)
  const yTicks: number[] = []
  for (let i = 0; i <= 4; i++) {
    yTicks.push(padT + ((h - padT - padB) * i) / 4)
  }
  return { w, h, padL, padR, padT, padB, list, labels, stepX, allMin: min, allMax: max, yTicks }
}
