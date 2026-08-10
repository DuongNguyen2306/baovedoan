import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  FileSearch,
  FileSignature,
  Gavel,
  Inbox,
  Plus,
  Send,
  Users,
  Home,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import { housingApplicationsApi, parsePagedApplications } from '@/api/housing-applications'
import { housingProjectsApi } from '@/api/housing-projects'
import { CreateProjectModal } from '@/components/developer/create-project-modal'
import { HouseCard } from '@/components/housing/house-card'
import { HousingShowcase } from '@/components/housing/housing-showcase'
import { DeveloperHomePage } from '@/pages/developer-home-page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AreaChart } from '@/components/ui/area-chart'
import { useWishlist } from '@/hooks/useWishlist'
import { navigate } from '@/hooks/useHashRoute'
import { formatError } from '@/lib/format-error'
import { mapProjectToCard } from '@/lib/projects'
import { countFromPaged } from '@/lib/parsers'
import { type RouteId } from '@/router'

interface Stats {
  pending: number
  approved: number
  rejected: number
  needMore: number
  submitted: number
  reviewing: number
  projects: number
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWING: 'Đang duyệt',
  NEED_MORE_DOCUMENTS: 'Cần bổ sung',
  PENDING_SXD_REVIEW: 'Chờ SXD',
  APPROVED: 'Đã duyệt',
  DEPOSIT_PAID: 'Đã TT Đợt 1',
  REJECTED: 'Từ chối',
  CANCELED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}

const STATUS_COLOR: Record<string, string> = {
  APPROVED: 'from-emerald-400/80 to-teal-500/80',
  PENDING_SXD_REVIEW: 'from-amber-400/80 to-orange-500/80',
  REVIEWING: 'from-cyan-400/80 to-sky-500/80',
  SUBMITTED: 'from-blue-400/80 to-indigo-500/80',
  REJECTED: 'from-rose-400/80 to-pink-500/80',
  NEED_MORE_DOCUMENTS: 'from-indigo-400/80 to-blue-500/80',
  DRAFT: 'from-slate-400/80 to-slate-500/80',
  CANCELED: 'from-slate-300/80 to-slate-400/80',
  EXPIRED: 'from-slate-300/80 to-slate-400/80',
  DEPOSIT_PAID: 'from-emerald-500/80 to-green-600/80',
}

function buildWeeks(items: Array<{ submittedAt?: string; createdAt?: string }>): number[] {
  const buckets = new Array(12).fill(0)
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const start = now - 11 * weekMs
  items.forEach((it) => {
    const t = it.submittedAt || it.createdAt
    if (!t) return
    const ms = new Date(t).getTime()
    if (Number.isNaN(ms)) return
    const idx = Math.floor((ms - start) / weekMs)
    if (idx >= 0 && idx < 12) buckets[idx] += 1
  })
  return buckets
}

export function ApplicantHomePage() {
  return <HousingShowcase />
}

export function InterestedPage() {
  const { items, loading, isWishlisted, toggle } = useWishlist()
  const [error, setError] = useState('')

  const cards = items.map((w) =>
    mapProjectToCard({
      id: w.projectId,
      projectName: w.projectName,
      description: w.description,
      province: w.province,
      district: w.district,
      address: w.address,
      minPrice: w.minPrice,
      maxPrice: w.maxPrice,
      minArea: w.minArea,
      maxArea: w.maxArea,
      availableUnits: w.availableUnits,
      thumbnailUrl: w.thumbnailUrl,
      status: w.status,
    }),
  )

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dự án quan tâm</h1>
      {loading && <Skeleton className="h-40 w-full" />}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && cards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/50 bg-white/50 p-8 text-center shadow-sm backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/50">
          <p className="text-slate-500 dark:text-slate-400">Bạn chưa quan tâm dự án nào.<br />Nhấn trái tim trên trang chủ để lưu dự án.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((h) => (
            <HouseCard
              key={h.id}
              house={h}
              fav={isWishlisted(h.id)}
              onToggleFavorite={() => { void toggle(h.id).catch((err) => setError(formatError(err))) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function StaffRoleHomePage({ routeId }: { routeId: 'home-developer' | 'home-sxd' }) {
  const isSxd = routeId === 'home-sxd'
  if (!isSxd) return <DeveloperHomePage />
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    pending: 0, approved: 0, rejected: 0, needMore: 0, submitted: 0, reviewing: 0, projects: 0,
  })
  const [recent, setRecent] = useState<Array<{ applicationId: string; name: string; project: string; status: string; at: string }>>([])
  const [statusDist, setStatusDist] = useState<Array<{ label: string; value: number; color: string }>>([])
  const [weekly, setWeekly] = useState<{ submitted: number[]; approved: number[] }>({
    submitted: new Array(12).fill(0),
    approved: new Array(12).fill(0),
  })
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const baseList = isSxd
          ? housingApplicationsApi.getSxdDashboard({ pageSize: 1000 })
          : housingApplicationsApi.getAll({ pageSize: 1000 })

        const [pendingRes, approvedRes, rejectedRes, needMoreRes, submittedRes, reviewingRes, projectsRes, recentRes, allForWeeklyRes] = await Promise.allSettled([
          baseList,
          housingApplicationsApi.getAll({ pageSize: 1, status: isSxd ? 'PENDING_SXD_REVIEW' : 'PENDING_SXD_REVIEW' }),
          housingApplicationsApi.getAll({ pageSize: 1, status: 'APPROVED' }),
          housingApplicationsApi.getAll({ pageSize: 1, status: 'REJECTED' }),
          housingApplicationsApi.getAll({ pageSize: 1, status: 'NEED_MORE_DOCUMENTS' }),
          housingApplicationsApi.getAll({ pageSize: 1, status: 'SUBMITTED' }),
          housingApplicationsApi.getAll({ pageSize: 1, status: 'REVIEWING' }),
          housingProjectsApi.list({ pageSize: 1 }),
          isSxd
            ? housingApplicationsApi.getSxdDashboard({ pageSize: 6, status: 'PENDING_SXD_REVIEW' })
            : housingApplicationsApi.getAll({ pageSize: 6, status: 'SUBMITTED' }),
          baseList,
        ])

        const allApps = allForWeeklyRes.status === 'fulfilled' ? parsePagedApplications(allForWeeklyRes.value) : []
        const weeklySubmitted = buildWeeks(allApps)
        const weeklyApproved = buildWeeks(allApps.filter((a) => a.applicationStatus === 'APPROVED'))

        const statusMap = new Map<string, number>()
        allApps.forEach((a) => statusMap.set(a.applicationStatus, (statusMap.get(a.applicationStatus) ?? 0) + 1))
        const topStatus = Array.from(statusMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([s, v]) => ({
            label: STATUS_LABEL[s] ?? s,
            value: v,
            color: STATUS_COLOR[s] ?? 'from-slate-400/80 to-slate-500/80',
          }))

        const recentList = recentRes.status === 'fulfilled'
          ? parsePagedApplications(recentRes.value).map((a) => ({
              applicationId: a.applicationId,
              name: a.applicantFullName,
              project: a.projectName,
              status: STATUS_LABEL[a.applicationStatus] ?? a.applicationStatus,
              at: a.submittedAt || a.createdAt,
            }))
          : []

        if (!cancelled) {
          setStats({
            pending: pendingRes.status === 'fulfilled' ? countFromPaged(pendingRes.value) : 0,
            approved: approvedRes.status === 'fulfilled' ? countFromPaged(approvedRes.value) : 0,
            rejected: rejectedRes.status === 'fulfilled' ? countFromPaged(rejectedRes.value) : 0,
            needMore: needMoreRes.status === 'fulfilled' ? countFromPaged(needMoreRes.value) : 0,
            submitted: submittedRes.status === 'fulfilled' ? countFromPaged(submittedRes.value) : 0,
            reviewing: reviewingRes.status === 'fulfilled' ? countFromPaged(reviewingRes.value) : 0,
            projects: projectsRes.status === 'fulfilled' ? countFromPaged(projectsRes.value) : 0,
          })
          setRecent(recentList)
          setStatusDist(topStatus)
          setWeekly({ submitted: weeklySubmitted, approved: weeklyApproved })
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [routeId, isSxd, reloadKey])

  const refreshStats = useCallback(() => {
    setLoading(true)
    setReloadKey((k) => k + 1)
  }, [])

  const totalProcessed = stats.approved + stats.rejected
  const approvalRate = totalProcessed > 0 ? Math.round((stats.approved / totalProcessed) * 100) : 0
  const totalAll = stats.pending + stats.approved + stats.rejected + stats.needMore + stats.submitted + stats.reviewing

  return (
    <div className="w-full space-y-6">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isSxd ? 'Sở Xây dựng' : 'Chủ đầu tư'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSxd
              ? 'Hậu kiểm và phê duyệt cuối cùng các hồ sơ nhà ở xã hội.'
              : 'Tiếp nhận, thẩm định hồ sơ và gửi danh sách lên Sở Xây dựng.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSxd && (
            <Button
              size="sm"
              onClick={() => setShowCreateProject(true)}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tạo dự án
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => navigate('applications')}
            className="rounded-xl bg-blue-600 font-semibold text-white shadow-lg hover:bg-blue-700"
          >
            Hồ sơ <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* ── KPI GRID (SXD-tuned) ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <GlassStatCard
          delay={0}
          icon={<Inbox className="h-5 w-5" />}
          label="Chờ duyệt"
          value={loading ? '—' : stats.pending}
          sub={isSxd ? 'Từ Chủ đầu tư' : 'Hồ sơ mới'}
          color="blue"
        />
        <GlassStatCard
          delay={0.05}
          icon={<BadgeCheck className="h-5 w-5" />}
          label="Đã duyệt"
          value={loading ? '—' : stats.approved}
          sub={`${approvalRate}% tỉ lệ duyệt`}
          color="emerald"
        />
        <GlassStatCard
          delay={0.1}
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Từ chối"
          value={loading ? '—' : stats.rejected}
          sub="Cần xem lại"
          color="amber"
        />
        <GlassStatCard
          delay={0.15}
          icon={<FileSearch className="h-5 w-5" />}
          label="Đang thẩm định"
          value={loading ? '—' : stats.reviewing}
          sub="Đang xử lý"
          color="indigo"
        />
        <GlassStatCard
          delay={0.2}
          icon={<Users className="h-5 w-5" />}
          label="Tổng hồ sơ"
          value={loading ? '—' : totalAll}
          sub={`${stats.submitted} tiếp nhận`}
          color="blue"
        />
      </div>

      {/* ── MAIN GRID: chart + status + actions ── */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* CHART */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card overflow-hidden"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                <BarChart3 className="h-4 w-4 shrink-0 text-blue-500" />
                Xu hướng 12 tuần
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Hồ sơ trình SXD &amp; duyệt</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1.5 font-medium text-blue-600 dark:text-blue-400">
                <Send className="h-3 w-3" /> {weekly.submitted.reduce((a, b) => a + b, 0)}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> {weekly.approved.reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
          <div className="-mx-1">
            <AreaChart height={200} series={[
              { name: 'Trình SXD', data: weekly.submitted, color: '#2563eb' },
              { name: 'Đã duyệt', data: weekly.approved, color: '#10b981' },
            ]} />
          </div>
        </motion.div>

        {/* STATUS DISTRIBUTION */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <Activity className="h-4 w-4 text-blue-500" />
              Phân bổ trạng thái
            </h3>
            <span className="rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
              {totalAll} HS
            </span>
          </div>
          <div className="space-y-3.5">
            {statusDist.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                {loading ? 'Đang tải…' : 'Chưa có dữ liệu'}
              </p>
            ) : statusDist.map((row) => {
              const max = Math.max(...statusDist.map((r) => r.value), 1)
              const pct = (row.value / max) * 100
              return (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                      <span className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${row.color}`} />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-400">{row.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100/50 dark:bg-slate-800/50">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${row.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── RECENT APPLICATIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-blue-500" />
            Hồ sơ chờ hậu kiểm
          </h3>
          <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            6 mới nhất
          </span>
        </div>
        <div className="-mx-1 space-y-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            ))
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Không có hồ sơ nào đang chờ hậu kiểm.
            </p>
          ) : (
            recent.map((a, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileHover={{ x: 4 }}
                onClick={() => navigate('applications')}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                  {(a.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.name}</p>
                    {a.applicationId && (
                      <span className="shrink-0 rounded bg-slate-100/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                        #{a.applicationId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{a.project || '—'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-block rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {a.status}
                  </span>
                  {a.at && (
                    <p className="mt-0.5 text-[10px] text-slate-400">{new Date(a.at).toLocaleDateString('vi-VN')}</p>
                  )}
                </div>
              </motion.button>
            ))
          )}
        </div>
        <div className="mt-3 -mx-1 border-t border-slate-100/50 px-1 pt-3 dark:border-slate-800/50">
          <button
            type="button"
            onClick={() => navigate('applications')}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Xem toàn bộ hồ sơ <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS (SXD scope) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
            <Home className="h-4 w-4 text-blue-500" />
            Thao tác nhanh — Sở Xây dựng
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {[
            { icon: <Inbox className="h-5 w-5" />, title: 'Chờ duyệt', desc: 'Hồ sơ cần xử lý', route: 'applications' as RouteId, gradient: 'from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-200/50 dark:border-blue-700/50', iconColor: 'text-blue-600 dark:text-blue-400' },
            { icon: <BadgeCheck className="h-5 w-5" />, title: 'Đã duyệt', desc: 'Lịch sử phê duyệt', route: 'applications' as RouteId, gradient: 'from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 border-emerald-200/50 dark:border-emerald-700/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { icon: <AlertTriangle className="h-5 w-5" />, title: 'Từ chối', desc: 'Hồ sơ bị reject', route: 'applications' as RouteId, gradient: 'from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border-amber-200/50 dark:border-amber-700/50', iconColor: 'text-amber-600 dark:text-amber-400' },
            { icon: <FileSearch className="h-5 w-5" />, title: 'Hậu kiểm', desc: 'Kiểm tra sau duyệt', route: 'audit-list' as RouteId, gradient: 'from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 border-indigo-200/50 dark:border-indigo-700/50', iconColor: 'text-indigo-600 dark:text-indigo-400' },
            { icon: <Gavel className="h-5 w-5" />, title: 'Bốc thăm', desc: 'Phiên bốc thăm', route: 'lottery-sessions' as RouteId, gradient: 'from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 border-cyan-200/50 dark:border-cyan-700/50', iconColor: 'text-cyan-600 dark:text-cyan-400' },
            { icon: <FileSignature className="h-5 w-5" />, title: 'Hợp đồng', desc: 'Quản lý HĐ', route: 'contracts' as RouteId, gradient: 'from-slate-500/20 to-slate-600/20 hover:from-slate-500/30 hover:to-slate-600/30 border-slate-200/50 dark:border-slate-700/50', iconColor: 'text-slate-600 dark:text-slate-400' },
          ].map((q) => (
            <button
              key={q.title}
              type="button"
              onClick={() => navigate(q.route)}
              className={`glass-action rounded-xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${q.gradient}`}
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-900/60 ${q.iconColor}`}>
                {q.icon}
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{q.title}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{q.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {!isSxd && (
        <CreateProjectModal
          open={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onCreated={refreshStats}
        />
      )}
    </div>
  )
}

function GlassStatCard({
  icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color: 'blue' | 'emerald' | 'amber' | 'indigo'
  delay: number
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-700/50' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-700/50' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-700/50' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-700/50' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-card group hover:scale-[1.02] transition-transform`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color].bg} ${colorMap[color].text} shadow-sm group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}
