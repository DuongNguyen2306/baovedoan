import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Play, Send, Sparkles, Trophy, Users } from 'lucide-react'
import {
  lotteryApi,
  LOTTERY_STATUS_LABEL,
  LOTTERY_STATUS_TONE,
  parseLotteryResult,
  parseLotterySchedule,
  parseEligibleList,
  type LotteryEligibleEntry,
  type LotteryResultDto,
  type LotteryScheduleDto,
} from '@/api/lottery'
import { connectLotteryHub, stopLotteryHub } from '@/api/lotteryHub'
import { housingProjectsApi } from '@/api/housing-projects'
import type { HousingProjectSummaryDto } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { FormField } from '@/components/ui/label'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageCard, PageHeader } from '@/components/layout/page-header'
import { navigate } from '@/hooks/useHashRoute'
import { formatError } from '@/lib/format-error'
import {
  getLotteryPhase,
  LOTTERY_PHASE_STEPS,
  phaseChipLabel,
  phaseStepIndex,
} from '@/lib/lottery-phase'
import { getRole } from '@/router'

interface ProjectLotteryRow {
  project: HousingProjectSummaryDto
  schedule: LotteryScheduleDto | null
}

function StatusChip({ status }: { status: string }) {
  return <Badge variant={LOTTERY_STATUS_TONE[status] ?? 'secondary'}>{LOTTERY_STATUS_LABEL[status] ?? status}</Badge>
}

function loadProjectIdFromStorage(): string {
  return sessionStorage.getItem('lotteryProjectId') ?? ''
}

function persistProjectId(id: string) {
  if (id) sessionStorage.setItem('lotteryProjectId', id)
  else sessionStorage.removeItem('lotteryProjectId')
}

function nextActionHint(schedule: LotteryScheduleDto | null, role: string): string {
  const phase = getLotteryPhase(schedule)
  const isDev = role === 'Housing Developer'
  const isSxd = role === 'Department Of Construction'
  if (isDev) {
    switch (phase) {
      case 'not_scheduled': return 'Tiếp theo: Lên lịch'
      case 'awaiting_approval': return 'Chờ Sở duyệt'
      case 'ready_open_lobby': return 'Tiếp theo: Mở sảnh'
      case 'waiting_lobby': return 'Tiếp theo: Bắt đầu Live (cần SXD online)'
      case 'live': return 'Đang Live — kết thúc khi xong'
      case 'finished': return 'Chờ Sở công bố'
      case 'published': return 'Đã xong — tải biên bản'
    }
  }
  if (isSxd) {
    switch (phase) {
      case 'not_scheduled': return 'Chờ CĐT lên lịch'
      case 'awaiting_approval': return 'Tiếp theo: Phê duyệt lịch'
      case 'ready_open_lobby':
      case 'waiting_lobby':
      case 'live': return 'Giám sát sảnh (giữ trang / Live)'
      case 'finished': return 'Tiếp theo: Công bố kết quả'
      case 'published': return 'Đã công bố'
    }
  }
  return ''
}

export function LotterySessionsPage() {
  const role = getRole()
  const [rows, setRows] = useState<ProjectLotteryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await housingProjectsApi.list({ pageIndex: 1, pageSize: 50 })
      const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
      const list = (raw.items ?? raw.Items ?? []) as HousingProjectSummaryDto[]
      // Hiện mọi dự án CĐT quản lý (trừ đã đóng rõ ràng) — tránh lọc nhầm vì status đã map tiếng Việt
      const items = list.filter((p) => {
        const s = String(p.status ?? '').toUpperCase()
        return !/CLOSED|ĐÃ ĐÓNG|REJECTED/.test(s)
      })
      const enriched: ProjectLotteryRow[] = await Promise.all(
        items.map(async (p) => {
          try {
            const scheduleData = await lotteryApi.getSchedule(p.id)
            return { project: p, schedule: parseLotterySchedule(scheduleData) }
          } catch {
            return { project: p, schedule: null }
          }
        }),
      )
      setRows(enriched)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (!filter) return true
      const status = r.schedule?.status ?? 'NOT_SCHEDULED'
      return status === filter
    })
    return filtered.sort((a, b) => {
      const sa = a.schedule?.scheduledAt ?? ''
      const sb = b.schedule?.scheduledAt ?? ''
      return sb.localeCompare(sa)
    })
  }, [rows, filter])

  return (
    <div>
      <PageHeader routeId="lottery-sessions" />
      <PageCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Đang tải...' : `${visible.length} dự án`}
          </p>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(LOTTERY_STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        {!loading && visible.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chưa có dự án nào mở bốc thăm. Hãy chọn dự án ở trang Dự án và dùng nút "Lên lịch bốc thăm".
          </p>
        )}
        <div className="grid gap-3">
          {visible.map(({ project, schedule }) => (
            <button
              key={project.id}
              type="button"
              className="glass-card flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition hover:ring-2 hover:ring-primary/20"
              onClick={() => {
                persistProjectId(project.id)
                navigate('lottery-detail')
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{project.projectName}</h3>
                  <StatusChip status={schedule?.status ?? 'NOT_SCHEDULED'} />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar className="mr-1 inline h-3 w-3" />
                  {schedule?.scheduledAt
                    ? `Lịch: ${new Date(schedule.scheduledAt).toLocaleString('vi-VN')}`
                    : 'Chưa có lịch bốc thăm'}
                </p>
                {schedule?.totalUnits != null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tổng căn: {schedule.totalUnits}
                  </p>
                )}
                <p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {nextActionHint(schedule, role)}
                </p>
              </div>
              <Trophy className="h-5 w-5 text-amber-500" />
            </button>
          ))}
        </div>
      </PageCard>
    </div>
  )
}

export function LotteryCreatePage() {
  return (
    <div>
      <PageHeader routeId="lottery-create" />
      <PageCard className="p-6">
        <Alert variant="info">
          <p className="font-semibold">Lên lịch bốc thăm từ trang chi tiết dự án</p>
          <p className="mt-1 text-sm">
            BE thiết kế lịch bốc thăm theo dự án (không có phiên riêng). Mở trang chi tiết dự án
            (Dự án → chọn một dự án) rồi bấm nút <strong>«Lên lịch bốc thăm»</strong> để tạo.
          </p>
          <Button className="mt-3" variant="accent" onClick={() => navigate('projects')}>
            Đi tới trang Dự án
          </Button>
        </Alert>
      </PageCard>
    </div>
  )
}

export function LotteryDetailPage() {
  const projectId = loadProjectIdFromStorage()
  const role = getRole()
  const isDev = role === 'Housing Developer'
  const isSxd = role === 'Department Of Construction'
  const [schedule, setSchedule] = useState<LotteryScheduleDto | null>(null)
  const [eligible, setEligible] = useState<LotteryEligibleEntry[]>([])
  const [result, setResult] = useState<LotteryResultDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hubError, setHubError] = useState('')
  const [hubConnected, setHubConnected] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedForm, setSchedForm] = useState({
    lotteryDate: '',
    lotteryLocation: 'Hội trường / Zoom (demo)',
    totalUnits: '10',
    priorityRatio: '30',
  })
  const connectionRef = useRef<import('@microsoft/signalr').HubConnection | null>(null)

  const reload = async (opts?: { quiet?: boolean }) => {
    if (!projectId) return
    if (!opts?.quiet) {
      setLoading(true)
      setError('')
    }
    try {
      const sched = parseLotterySchedule(await lotteryApi.getSchedule(projectId))
      setSchedule(sched)
      try {
        setEligible(parseEligibleList(await lotteryApi.getEligibleParticipants(projectId)))
      } catch {
        setEligible([])
      }
      try {
        const res = parseLotteryResult(await lotteryApi.getResult(projectId))
        if (res) setResult(res)
      } catch {
        setResult(null)
      }
    } catch (err) {
      if (!opts?.quiet) setError(formatError(err))
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [projectId])

  // Staff: join SignalR để SXD được đếm online + CĐT nhận realtime sxdOnlineCount
  useEffect(() => {
    if (!projectId || (!isDev && !isSxd)) return
    if (!schedule?.isLotteryApproved) return

    let cancelled = false
    void (async () => {
      try {
        await stopLotteryHub(connectionRef.current)
        const conn = await connectLotteryHub(projectId, undefined, {
          onSxdSupervisorCount: (n) => {
            setSchedule((prev) => (prev ? { ...prev, sxdOnlineCount: n } : prev))
          },
          onStatus: (s) => {
            setSchedule((prev) => (prev ? { ...prev, sessionStatus: s } : prev))
          },
        })
        if (cancelled) {
          await stopLotteryHub(conn)
          return
        }
        connectionRef.current = conn
        setHubConnected(true)
        setHubError('')
        // Đồng bộ lại count từ API sau khi join
        await reload({ quiet: true })
      } catch (err) {
        if (!cancelled) {
          setHubConnected(false)
          setHubError(formatError(err))
        }
      }
    })()

    const poll = window.setInterval(() => {
      void reload({ quiet: true })
    }, 4000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      void stopLotteryHub(connectionRef.current)
      connectionRef.current = null
      setHubConnected(false)
    }
  }, [projectId, isDev, isSxd, schedule?.isLotteryApproved])

  const action = async (label: string, fn: () => Promise<unknown>) => {
    if (!projectId || busy) return
    setBusy(label)
    setMsg(null)
    try {
      await fn()
      await reload()
      setMsg({ type: 'success', text: `${label} thành công.` })
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy('')
    }
  }

  if (!projectId) {
    return (
      <div>
        <PageHeader routeId="lottery-detail" />
        <PageCard className="p-6">
          <Alert variant="error">Không tìm thấy dự án. Vui lòng chọn lại từ trang Bốc thăm.</Alert>
          <Button className="mt-3" variant="outline" onClick={() => navigate('lottery-sessions')}>
            ← Danh sách dự án bốc thăm
          </Button>
        </PageCard>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <PageHeader routeId="lottery-detail" />
        <PageCard className="p-6"><p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p></PageCard>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader routeId="lottery-detail" />
        <PageCard className="p-6"><Alert variant="error">{error}</Alert></PageCard>
      </div>
    )
  }

  const phase = getLotteryPhase(schedule)
  const stepIdx = phaseStepIndex(phase)
  const sxdOnline = schedule?.sxdOnlineCount ?? 0
  const winners = result?.winners ?? []
  const totalUnits = schedule?.totalUnits ?? result?.totalUnits ?? 0

  const openScheduleModal = () => {
    const next = new Date(Date.now() + 86400000)
    const local = new Date(next.getTime() - next.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setSchedForm({
      lotteryDate: local,
      lotteryLocation: schedule?.lotteryLocation || 'Hội trường / Zoom (demo)',
      totalUnits: String(schedule?.totalUnits || 10),
      priorityRatio: '30',
    })
    setScheduleOpen(true)
  }

  const downloadMinutes = () => {
    const token = localStorage.getItem('accessToken')
    void (async () => {
      try {
        const res = await fetch(lotteryApi.minutesUrl(projectId), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(await res.text())
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `BienBan_${projectId}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        setMsg({ type: 'error', text: formatError(e) })
      }
    })()
  }

  return (
    <div>
      <PageHeader routeId="lottery-detail" />
      <PageCard className="space-y-6 p-6">
        <Button variant="ghost" className="mb-2" onClick={() => navigate('lottery-sessions')}>
          ← Danh sách dự án
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{schedule?.projectName ?? 'Dự án'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="mr-1 inline h-4 w-4" />
              {schedule?.scheduledAt
                ? `Lịch: ${new Date(schedule.scheduledAt).toLocaleString('vi-VN')}`
                : 'Chưa có lịch'}
              {totalUnits ? ` · Căn: ${totalUnits}` : ''}
            </p>
          </div>
          <Badge variant={phase === 'live' ? 'warning' : phase === 'published' || phase === 'finished' ? 'success' : 'default'}>
            {phaseChipLabel(phase)}
          </Badge>
        </div>

        {/* Stepper — người chấm nhìn 1 mạch rõ ràng */}
        <ol className="grid gap-2 sm:grid-cols-7">
          {LOTTERY_PHASE_STEPS.map((s, i) => {
            const done = i < stepIdx
            const current = i === stepIdx
            return (
              <li
                key={s.id}
                className={`rounded-lg border px-2 py-2 text-center text-[11px] font-semibold leading-tight ${
                  current
                    ? 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                    : done
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                      : 'border-slate-200 text-slate-400 dark:border-slate-700'
                }`}
              >
                {s.label}
              </li>
            )
          })}
        </ol>

        {hubError && (
          <Alert variant="error">
            Không nối được sảnh realtime (SignalR): {hubError}. Hãy chạy API rồi F5. SXD online chỉ tăng khi Hub nối thành công.
          </Alert>
        )}
        {schedule?.isLotteryApproved && !hubError && (
          <Alert variant={hubConnected ? 'success' : 'info'}>
            {hubConnected
              ? `Đã nối sảnh realtime · SXD online: ${sxdOnline}${isSxd ? ' (bạn đang giám sát — giữ trang này mở)' : ''}`
              : 'Đang nối sảnh realtime…'}
          </Alert>
        )}

        {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}

        {/* ── CĐT: chỉ nút hợp lệ theo phase ── */}
        {isDev && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác Chủ đầu tư</p>

            {phase === 'not_scheduled' && (
              <>
                <Alert variant="info">Bước 1: tạo lịch bốc thăm cho dự án. Sau đó chờ Sở phê duyệt.</Alert>
                <Button variant="accent" disabled={!!busy} onClick={openScheduleModal}>
                  <Calendar className="mr-1.5 h-4 w-4" /> Lên lịch bốc thăm
                </Button>
              </>
            )}

            {phase === 'awaiting_approval' && (
              <Alert variant="warning">
                Đã gửi lịch — đang chờ <strong>Sở Xây dựng phê duyệt</strong>. CĐT không thao tác thêm ở bước này.
              </Alert>
            )}

            {phase === 'ready_open_lobby' && (
              <>
                <Alert variant="info">
                  Sở đã duyệt. Bước tiếp theo: <strong>Mở sảnh chờ</strong> để dân vào bằng OTP.
                  {schedule?.joinCode ? <> Mã OTP: <strong>{schedule.joinCode}</strong></> : null}
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button variant="accent" disabled={!!busy} onClick={() => action('Mở sảnh', () => lotteryApi.openLobby(projectId))}>
                    Mở sảnh chờ
                  </Button>
                  <Button variant="outline" onClick={() => navigate('lottery-live')}>Xem màn giám sát</Button>
                </div>
              </>
            )}

            {phase === 'waiting_lobby' && (
              <>
                <Alert variant={sxdOnline < 1 ? 'warning' : 'success'}>
                  {sxdOnline < 1
                    ? 'Sảnh đã mở. Cần Sở vào trang này (hoặc màn Live) để SXD online ≥ 1 trước khi bắt đầu Live (NĐ 100/2024 Đ36.2.b).'
                    : `SXD đang giám sát (${sxdOnline}). Có thể bắt đầu Live.`}
                  {schedule?.joinCode ? <> · OTP dân: <strong>{schedule.joinCode}</strong></> : null}
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="accent"
                    disabled={!!busy || sxdOnline < 1}
                    onClick={() => action('Bắt đầu Live', () => lotteryApi.startLive(projectId))}
                  >
                    <Play className="mr-1.5 h-4 w-4" /> Bắt đầu Live
                  </Button>
                  <Button variant="outline" onClick={() => navigate('lottery-live')}>Màn giám sát Live</Button>
                </div>
              </>
            )}

            {phase === 'live' && (
              <>
                <Alert variant="warning">
                  Phiên đang Live — dân bốc trên App. Kết thúc khi đủ căn / hết thời gian bốc.
                  {sxdOnline < 1 ? ' Cảnh báo: SXD offline — không nên kết thúc phiên.' : ` SXD online: ${sxdOnline}.`}
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="accent"
                    disabled={!!busy || sxdOnline < 1}
                    onClick={() => action('Kết thúc phiên', () => lotteryApi.finishSession(projectId))}
                  >
                    Kết thúc phiên
                  </Button>
                  <Button variant="outline" onClick={() => navigate('lottery-live')}>Màn giám sát Live</Button>
                </div>
              </>
            )}

            {phase === 'finished' && (
              <Alert variant="info">
                Phiên đã kết thúc. Chờ <strong>Sở Xây dựng công bố</strong> kết quả / biên bản. CĐT không công bố được.
              </Alert>
            )}

            {phase === 'published' && (
              <>
                <Alert variant="success">Đã công bố. Có thể tải biên bản PDF.</Alert>
                <div className="flex flex-wrap gap-2">
                  <Button variant="accent" onClick={downloadMinutes}>Tải biên bản PDF</Button>
                  <Button variant="outline" onClick={() => navigate('projects')}>Về dự án</Button>
                </div>
              </>
            )}

            {/* Batch chỉ khi đã duyệt — thu vào để không làm rối demo */}
            {(phase === 'ready_open_lobby' || phase === 'waiting_lobby' || phase === 'live') && (
              <details className="rounded-lg border border-dashed border-slate-300 p-2 text-sm dark:border-slate-600">
                <summary className="cursor-pointer text-slate-500">Nâng cao (batch Đ38.2 — không dùng cho demo Live)</summary>
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  disabled={!!busy}
                  onClick={() => action('Chạy batch Đ38.2', () => lotteryApi.runLottery(projectId))}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" /> Chạy batch
                </Button>
              </details>
            )}
          </div>
        )}

        {/* ── SXD: phê duyệt → giám sát → công bố ── */}
        {isSxd && (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
              Thao tác Sở Xây dựng
            </p>

            {phase === 'not_scheduled' && (
              <Alert variant="info">Chưa có lịch — chờ Chủ đầu tư lên lịch bốc thăm.</Alert>
            )}

            {phase === 'awaiting_approval' && (
              <>
                <Alert variant="warning">Có lịch chờ phê duyệt. Sau khi duyệt, hệ thống sinh OTP vào sảnh.</Alert>
                <Button variant="accent" disabled={!!busy} onClick={() => action('Phê duyệt lịch', () => lotteryApi.approveSchedule(projectId))}>
                  <Send className="mr-1.5 h-4 w-4" /> Phê duyệt lịch bốc thăm
                </Button>
              </>
            )}

            {(phase === 'ready_open_lobby' || phase === 'waiting_lobby' || phase === 'live') && (
              <>
                <Alert variant={hubConnected ? 'success' : 'warning'}>
                  {hubConnected
                    ? `Bạn đang giám sát realtime (SXD online = ${sxdOnline}). Giữ trang này hoặc mở màn Live — đừng đóng tab.`
                    : 'Chưa nối Hub — F5 hoặc mở «Màn giám sát Live». Không giám sát thì CĐT không Start Live được.'}
                  {schedule?.joinCode ? <> · OTP dân: <strong>{schedule.joinCode}</strong></> : null}
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate('lottery-live')}>Màn giám sát Live (ticker)</Button>
                </div>
              </>
            )}

            {phase === 'finished' && (
              <>
                <Alert variant="info">
                  Phiên Finished — chỉ Sở được <strong>Công bố</strong> kết quả / biên bản.
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button variant="accent" disabled={!!busy} onClick={() => action('Công bố', () => lotteryApi.publishSession(projectId))}>
                    Công bố kết quả
                  </Button>
                  <Button variant="outline" onClick={() => navigate('lottery-live')}>Xem log Live</Button>
                </div>
              </>
            )}

            {phase === 'published' && (
              <>
                <Alert variant="success">Đã công bố.</Alert>
                <Button variant="accent" onClick={downloadMinutes}>Tải biên bản PDF</Button>
              </>
            )}
          </div>
        )}

        {result && (
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Tổng tham gia" value={result.allEntries?.length ?? eligible.length} icon={<Users className="h-4 w-4" />} />
            <Stat label="Trúng" value={winners.length} tone="success" icon={<Trophy className="h-4 w-4" />} />
            <Stat label="Trượt" value={result.losers?.length ?? 0} tone="danger" />
            <Stat label="Căn" value={totalUnits || 0} tone="warning" />
          </div>
        )}

        {result && winners.length > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Danh sách trúng ({winners.length})</h3>
            <div className="grid gap-2">
              {winners.map((w, i) => (
                <div key={w.applicationId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
                  <div>
                    <p className="font-medium">{w.applicantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">CCCD: {w.citizenId}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Trúng #{i + 1}</Badge>
                    {w.slotCode && <p className="mt-1 font-mono text-xs text-emerald-700 dark:text-emerald-300">Mã căn: {w.slotCode}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (result.losers?.length ?? 0) > 0 && (
          <div>
            <h3 className="mb-3 font-semibold">Danh sách chờ bổ sung ({result.losers!.length})</h3>
            <div className="grid gap-2">
              {result.losers!.map((w, i) => (
                <div key={w.applicationId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                  <div>
                    <p className="font-medium">{w.applicantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">CCCD: {w.citizenId}</p>
                  </div>
                  <Badge variant="warning">Chờ #{i + 1}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && eligible.length > 0 && (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Danh sách đủ điều kiện ({eligible.length})</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động từ hồ sơ APPROVED / APPROVED_BY_TIMEOUT — không cần xác nhận tay.
              </p>
            </div>
            <div className="grid gap-2">
              {eligible.map((e) => (
                <div key={e.applicationId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                  <div>
                    <p className="font-medium">{e.applicantName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">CCCD: {e.citizenId}</p>
                  </div>
                  <Badge variant="secondary">Đang chờ</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageCard>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Thiết lập phiên bốc thăm trực tuyến"
        description="Nhập ngày/giờ mở sảnh, số căn mở bán và tỷ lệ ưu tiên trước."
        size="lg"
      >
        <div className="space-y-3">
          <FormField label="Ngày/giờ mở sảnh *" htmlFor="lotteryDate">
            <Input
              id="lotteryDate"
              type="datetime-local"
              value={schedForm.lotteryDate}
              onChange={(e) => setSchedForm((f) => ({ ...f, lotteryDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Địa điểm / link *" htmlFor="lotteryLocation">
            <Input
              id="lotteryLocation"
              value={schedForm.lotteryLocation}
              onChange={(e) => setSchedForm((f) => ({ ...f, lotteryLocation: e.target.value }))}
            />
          </FormField>
          <FormField label="Số căn hộ mở bán thực tế *" htmlFor="totalUnits">
            <Input
              id="totalUnits"
              type="number"
              min={1}
              value={schedForm.totalUnits}
              onChange={(e) => setSchedForm((f) => ({ ...f, totalUnits: e.target.value }))}
            />
          </FormField>
          <FormField label="Tỷ lệ phân bổ ưu tiên trước (%)" htmlFor="priorityRatio">
            <Input
              id="priorityRatio"
              type="number"
              min={0}
              max={100}
              value={schedForm.priorityRatio}
              onChange={(e) => setSchedForm((f) => ({ ...f, priorityRatio: e.target.value }))}
            />
          </FormField>
          <p className="text-xs text-slate-500">
            Tỷ lệ ưu tiên được ghi nhận trên mô tả lịch; logic phân bổ ưu tiên xử lý ở bước quyết định CĐT / BE.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Huỷ</Button>
            <Button
              variant="accent"
              disabled={!!busy}
              onClick={() => {
                const totalUnits = Number(schedForm.totalUnits)
                if (!schedForm.lotteryDate || !schedForm.lotteryLocation.trim()) {
                  setMsg({ type: 'error', text: 'Vui lòng nhập đủ ngày giờ và địa điểm.' })
                  return
                }
                if (Number.isNaN(totalUnits) || totalUnits <= 0) {
                  setMsg({ type: 'error', text: 'Số căn không hợp lệ.' })
                  return
                }
                const iso = new Date(schedForm.lotteryDate).toISOString()
                setScheduleOpen(false)
                void action('Lên lịch', () =>
                  lotteryApi.schedule(projectId, {
                    lotteryDate: iso,
                    lotteryLocation: schedForm.lotteryLocation.trim(),
                    lotteryType: 'ONLINE',
                    totalUnits,
                    lotteryDescription: `Tỷ lệ ưu tiên trước: ${schedForm.priorityRatio}%`,
                    notes: `priorityRatio=${schedForm.priorityRatio}`,
                  }),
                )
              }}
            >
              Lưu lịch bốc thăm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value, tone, icon }: { label: string; value: number; tone?: 'success' | 'danger' | 'warning'; icon?: React.ReactNode }) {
  const toneClass = tone === 'success' ? 'text-emerald-600' : tone === 'danger' ? 'text-rose-600' : tone === 'warning' ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 flex items-center gap-2 text-2xl font-bold ${toneClass}`}>{icon}{value}</p>
    </div>
  )
}

export function LotteryLobbyPage() {
  const projectId = loadProjectIdFromStorage()
  const role = getRole()
  const isApplicant = role === 'Applicant'
  const isStaff = role === 'Housing Developer' || role === 'Department Of Construction'
  const [otp, setOtp] = useState('')
  const [joined, setJoined] = useState(false)
  const [sessionStatus, setSessionStatus] = useState('')
  const [lobbyCount, setLobbyCount] = useState(0)
  const [sxdCount, setSxdCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [drawResult, setDrawResult] = useState<unknown>(null)
  const [ticker, setTicker] = useState<string[]>([])
  const connectionRef = useRef<import('@microsoft/signalr').HubConnection | null>(null)

  useEffect(() => {
    return () => {
      void stopLotteryHub(connectionRef.current)
      connectionRef.current = null
    }
  }, [])

  const join = async () => {
    if (!projectId || busy) return
    setBusy(true)
    setMsg(null)
    try {
      if (isApplicant) {
        const v = await lotteryApi.verifyOtp(projectId, otp)
        const ok = (v as { success?: boolean }).success !== false
        if (!ok && (v as { Success?: boolean }).Success === false) {
          throw new Error((v as { message?: string }).message || 'OTP không hợp lệ')
        }
      }
      await stopLotteryHub(connectionRef.current)
      const conn = await connectLotteryHub(projectId, isStaff ? undefined : otp, {
        onLobbyCount: (n) => setLobbyCount(n),
        onSxdSupervisorCount: (n) => setSxdCount(n),
        onStatus: (s) => setSessionStatus(s),
        onDrawResult: (data) => {
          setTicker((prev) => {
            const o = data as Record<string, unknown>
            const line = `${o.applicantName ?? o.ApplicantName ?? '?'}: ${o.result ?? o.Result ?? ''} ${o.slotCode ?? o.SlotCode ?? ''}`
            return [line, ...prev].slice(0, 30)
          })
        },
      })
      connectionRef.current = conn
      setJoined(true)
      setMsg({ type: 'success', text: 'Đã vào sảnh realtime.' })
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy(false)
    }
  }

  const draw = async () => {
    if (!projectId || busy) return
    setBusy(true)
    setMsg(null)
    try {
      if (connectionRef.current) {
        await connectionRef.current.invoke('DrawUnit', projectId)
        setMsg({ type: 'success', text: 'Đã gửi lệnh bốc thăm qua Hub.' })
      } else {
        const res = await lotteryApi.drawUnit(projectId)
        setDrawResult(res)
        setMsg({ type: 'success', text: 'Bốc thăm REST thành công.' })
      }
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy(false)
    }
  }

  if (!projectId) {
    return (
      <div>
        <PageHeader routeId="lottery-lobby" />
        <PageCard className="p-6">
          <Alert variant="info">Vui lòng chọn dự án bốc thăm trước.</Alert>
          <Button className="mt-3" variant="outline" onClick={() => navigate('lottery-sessions')}>
            ← Về danh sách dự án
          </Button>
        </PageCard>
      </div>
    )
  }

  return (
    <div>
      <PageHeader routeId="lottery-lobby" />
      <PageCard className="space-y-4 p-6">
        <Alert variant="info">
          Sảnh chờ realtime (SignalR). Applicant nhập OTP từ thông báo sau khi Sở duyệt lịch.
          Staff giám sát không cần OTP. Chỉ bốc được khi phiên = <strong>Live</strong> và có SXD online giám sát.
        </Alert>
        {msg && (
          <Alert variant={msg.type === 'error' ? 'error' : msg.type === 'info' ? 'info' : 'success'}>
            {msg.text}
          </Alert>
        )}
        {!joined && (
          <div className="flex flex-wrap items-end gap-2">
            {isApplicant && (
              <div>
                <label className="mb-1 block text-xs text-slate-500">OTP 6 số</label>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                />
              </div>
            )}
            <Button variant="accent" disabled={busy || (isApplicant && otp.length < 6)} onClick={() => void join()}>
              {busy ? 'Đang vào...' : 'Vào sảnh'}
            </Button>
          </div>
        )}
        {joined && (
          <>
            <div className="flex flex-wrap gap-4 text-sm">
              <Badge variant="default">Phiên: {sessionStatus || '...'}</Badge>
              <Badge variant="secondary">Online: {lobbyCount}</Badge>
              <Badge variant={sxdCount > 0 ? 'success' : 'warning'}>SXD giám sát: {sxdCount}</Badge>
            </div>
            {sxdCount < 1 && (
              <Alert variant="warning">Chưa có đại diện Sở online — không thể bắt đầu Live / bốc thăm.</Alert>
            )}
            {isApplicant && (
              <Button variant="accent" disabled={busy || sessionStatus !== 'Live' || sxdCount < 1} onClick={() => void draw()}>
                <Play className="mr-1.5 h-4 w-4" /> {busy ? 'Đang bốc...' : 'Bốc căn của tôi'}
              </Button>
            )}
            {sessionStatus && sessionStatus !== 'Live' && isApplicant && (
              <Alert variant="warning">Nút bốc chỉ mở khi CĐT chuyển phiên sang Live.</Alert>
            )}
            {ticker.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold">Ticker realtime</h3>
                <ul className="space-y-1 text-sm">
                  {ticker.map((t, i) => (
                    <li key={i} className="rounded bg-slate-50 px-2 py-1 dark:bg-slate-800/50">{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {drawResult != null && (
          <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
            {JSON.stringify(drawResult, null, 2)}
          </pre>
        )}
      </PageCard>
    </div>
  )
}

export function LotteryLivePage() {
  const projectId = loadProjectIdFromStorage()
  const [result, setResult] = useState<LotteryResultDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hubError, setHubError] = useState('')
  const [hubConnected, setHubConnected] = useState(false)
  const [lobbyCount, setLobbyCount] = useState(0)
  const [sxdCount, setSxdCount] = useState(0)
  const [sessionStatus, setSessionStatus] = useState('')
  const [ticker, setTicker] = useState<string[]>([])
  const [totalUnits, setTotalUnits] = useState(0)
  const connectionRef = useRef<import('@microsoft/signalr').HubConnection | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    const load = async () => {
      try {
        const data = await lotteryApi.getResult(projectId)
        if (!cancelled) {
          const parsed = parseLotteryResult(data)
          setResult(parsed)
          if (parsed?.totalUnits) setTotalUnits(parsed.totalUnits)
          setLoading(false)
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatError(err))
          setLoading(false)
        }
      }
      try {
        const sched = parseLotterySchedule(await lotteryApi.getSchedule(projectId))
        if (!cancelled && sched?.sessionStatus) setSessionStatus(sched.sessionStatus)
        if (!cancelled && sched?.totalUnits) setTotalUnits(sched.totalUnits)
        if (!cancelled && typeof sched?.sxdOnlineCount === 'number') setSxdCount(sched.sxdOnlineCount)
      } catch { /* ignore */ }
    }

    void load()
    const poll = window.setInterval(() => { void load() }, 4000)

    void (async () => {
      try {
        const conn = await connectLotteryHub(projectId, undefined, {
          onLobbyCount: (n) => setLobbyCount(n),
          onSxdSupervisorCount: (n) => setSxdCount(n),
          onStatus: (s) => setSessionStatus(s),
          onDrawResult: (data) => {
            const o = data as Record<string, unknown>
            const line = `${o.applicantName ?? o.ApplicantName ?? '?'}: ${o.result ?? o.Result ?? ''} ${o.slotCode ?? o.SlotCode ?? ''}`
            setTicker((prev) => [line, ...prev].slice(0, 40))
            void load()
          },
        })
        if (cancelled) {
          await stopLotteryHub(conn)
          return
        }
        connectionRef.current = conn
        setHubConnected(true)
        setHubError('')
        await load()
      } catch (err) {
        if (!cancelled) {
          setHubConnected(false)
          setHubError(formatError(err))
        }
      }
    })()

    return () => {
      cancelled = true
      window.clearInterval(poll)
      void stopLotteryHub(connectionRef.current)
      connectionRef.current = null
      setHubConnected(false)
    }
  }, [projectId])

  const drawn = result?.winners?.length ?? ticker.filter((t) => /WIN|Trúng|win/i.test(t)).length
  const units = totalUnits || result?.totalUnits || 0
  const pct = units > 0 ? Math.min(100, Math.round((drawn / units) * 100)) : 0

  if (!projectId) {
    return (
      <div>
        <PageHeader routeId="lottery-live" />
        <PageCard className="p-6">
          <Alert variant="warning">
            Chưa chọn dự án — vào <strong>Bốc thăm</strong> → chọn <strong>NOXH Bình Minh — Thủ Đức</strong> rồi mở Live.
          </Alert>
          <Button className="mt-3" variant="outline" onClick={() => navigate('lottery-sessions')}>
            ← Danh sách dự án bốc thăm
          </Button>
        </PageCard>
      </div>
    )
  }

  return (
    <div>
      <PageHeader routeId="lottery-live" />
      <PageCard className="space-y-4 p-6">
        {hubError && (
          <Alert variant="error">Không nối sảnh realtime: {hubError}</Alert>
        )}
        {!hubError && (
          <Alert variant={hubConnected ? 'success' : 'info'}>
            {hubConnected
              ? `Đã nối sảnh · SXD giám sát: ${sxdCount}`
              : 'Đang nối sảnh realtime…'}
          </Alert>
        )}
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Phiên: {sessionStatus || '...'}</Badge>
          <Badge variant="secondary">Online: {lobbyCount}</Badge>
          <Badge variant={sxdCount > 0 ? 'success' : 'warning'}>SXD giám sát: {sxdCount}</Badge>
          <Button
            variant="outline"
            onClick={() => {
              const token = localStorage.getItem('accessToken')
              void (async () => {
                const res = await fetch(lotteryApi.minutesUrl(projectId), {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                })
                if (!res.ok) {
                  setError('Không tải được biên bản')
                  return
                }
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `BienBan_${projectId}.pdf`
                a.click()
                URL.revokeObjectURL(url)
              })()
            }}
          >
            Tải biên bản PDF
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">Tiến độ bốc thăm</span>
            <span className="tabular-nums text-slate-600 dark:text-slate-300">
              {drawn}/{units || '—'} căn ({pct}%)
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {ticker.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">Live log (không cần F5)</h3>
            <ul className="max-h-48 space-y-1 overflow-auto text-sm">
              {ticker.map((t, i) => (
                <li key={i} className="rounded bg-emerald-50/80 px-2 py-1 dark:bg-emerald-950/30">{t}</li>
              ))}
            </ul>
          </div>
        )}
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>}
        {error && <Alert variant="error">{error}</Alert>}
        {!result && !loading && !error && (
          <Alert variant="info">Chưa có kết quả lưu (Finish phiên để tạo biên bản / LotteryDraw).</Alert>
        )}
        {result && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Danh sách trúng ({result.winners.length})</h3>
              <div className="mt-2 grid gap-2">
                {result.winners.map((w, i) => (
                  <div key={w.applicationId} className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <div>
                      <span className="font-medium">{w.applicantName}</span>
                      {w.slotCode && <p className="font-mono text-xs text-emerald-700">Mã căn: {w.slotCode}</p>}
                    </div>
                    <Badge variant="success">Trúng #{i + 1}</Badge>
                  </div>
                ))}
              </div>
            </div>
            {(result.losers?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-semibold">Danh sách chờ bổ sung ({result.losers!.length})</h3>
                <div className="mt-2 grid gap-2">
                  {result.losers!.map((w, i) => (
                    <div key={w.applicationId} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <span className="font-medium">{w.applicantName}</span>
                      <Badge variant="secondary">Chờ #{i + 1}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageCard>
    </div>
  )
}

export { parseEligibleList as parseLotteries }
