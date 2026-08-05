import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileSignature, Inbox, Sparkles } from 'lucide-react'
import {
  housingProjectsApi,
  parseApartments,
  parseProjectEvaluation,
  type ApplicationSummaryItemDto,
  type DeveloperDecisionType,
  type ProjectApplicationEvaluationDto,
} from '@/api/housing-projects'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { navigate } from '@/hooks/useHashRoute'
import { formatError } from '@/lib/format-error'
import type { ApartmentDto } from '@/types'

const PRIORITY_LABELS: Record<string, string> = {
  REVOLUTIONARY_CONTRIBUTION: 'Có công với cách mạng',
  POOR_HOUSEHOLD: 'Hộ nghèo / cận nghèo',
  SINGLE_MOTHER: 'Mẹ đơn thân',
  DISABILITY: 'Người khuyết tật',
  ETHNIC_MINORITY: 'Dân tộc thiểu số',
}

/**
 * CĐT quyết định sau khi SXD duyệt hồ sơ:
 * - ≤ số căn: chốt + chọn căn → ký HĐ
 * - > số căn: duyệt ưu tiên + chọn căn trước; phần còn lại bốc thăm
 */
export function DeveloperDecisionPanel({ projectId }: { projectId: string }) {
  const [evaluation, setEvaluation] = useState<ProjectApplicationEvaluationDto | null>(null)
  const [availableApts, setAvailableApts] = useState<ApartmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [closeProject, setCloseProject] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<Set<string>>(new Set())
  /** applicationId → apartmentId */
  const [aptByApp, setAptByApp] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [evalData, projectData] = await Promise.all([
        housingProjectsApi.getEvaluation(projectId),
        housingProjectsApi.getById(projectId),
      ])
      const e = parseProjectEvaluation(evalData)
      setEvaluation(e)
      const apts = parseApartments(projectData).filter(
        (a) => String(a.status).toUpperCase() === 'AVAILABLE',
      )
      setAvailableApts(apts)
      if (e) {
        const auto = e.priorityApplications.slice(0, e.availableUnits).map((a) => a.applicationId)
        setSelectedPriority(new Set(auto))
      }
      setAptByApp({})
    } catch (err) {
      setError(formatError(err))
      setEvaluation(null)
      setAvailableApts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [projectId])

  const excessPriority = useMemo(() => {
    if (!evaluation) return false
    return evaluation.priorityCount > evaluation.availableUnits
  }, [evaluation])

  const closeAndSignApps = useMemo(() => {
    if (!evaluation) return [] as ApplicationSummaryItemDto[]
    return [...evaluation.priorityApplications, ...evaluation.nonPriorityApplications]
  }, [evaluation])

  const priorityGrantApps = useMemo(() => {
    if (!evaluation) return [] as ApplicationSummaryItemDto[]
    if (excessPriority) {
      return evaluation.priorityApplications.filter((a) => selectedPriority.has(a.applicationId))
    }
    return evaluation.priorityApplications
  }, [evaluation, excessPriority, selectedPriority])

  const usedAptIds = useMemo(() => new Set(Object.values(aptByApp).filter(Boolean)), [aptByApp])

  const setAppApartment = (applicationId: string, apartmentId: string) => {
    setAptByApp((prev) => {
      const next = { ...prev }
      if (!apartmentId) {
        delete next[applicationId]
        return next
      }
      // Một căn chỉ gán 1 hồ sơ
      for (const [appId, aptId] of Object.entries(next)) {
        if (aptId === apartmentId && appId !== applicationId) delete next[appId]
      }
      next[applicationId] = apartmentId
      return next
    })
  }

  const buildAssignments = (apps: ApplicationSummaryItemDto[]) =>
    apps.map((a) => ({
      applicationId: a.applicationId,
      apartmentId: aptByApp[a.applicationId] ?? '',
    }))

  const validateAssignments = (apps: ApplicationSummaryItemDto[]): string | null => {
    if (apps.length === 0) return 'Không có hồ sơ để cấp căn.'
    if (availableApts.length < apps.length) {
      return `Không đủ căn trống (${availableApts.length}) cho ${apps.length} hồ sơ.`
    }
    for (const a of apps) {
      if (!aptByApp[a.applicationId]) {
        return `Chưa chọn căn cho hồ sơ: ${a.fullName}.`
      }
    }
    const ids = apps.map((a) => aptByApp[a.applicationId])
    if (new Set(ids).size !== ids.length) {
      return 'Mỗi căn chỉ được cấp cho một hồ sơ.'
    }
    return null
  }

  const execute = async (decisionType: DeveloperDecisionType) => {
    if (!evaluation || busy) return

    if (decisionType === 'PROCESS_PRIORITY_AND_LOTTERY' && excessPriority) {
      if (selectedPriority.size === 0) {
        setMsg({ type: 'error', text: 'Chọn ít nhất một hồ sơ ưu tiên để duyệt trước.' })
        return
      }
      if (selectedPriority.size > evaluation.availableUnits) {
        setMsg({
          type: 'error',
          text: `Chỉ được chọn tối đa ${evaluation.availableUnits} hồ sơ ưu tiên (bằng số căn còn lại).`,
        })
        return
      }
    }

    let appsToAssign: ApplicationSummaryItemDto[] = []
    if (decisionType === 'CLOSE_AND_SIGN') {
      appsToAssign = closeAndSignApps
      const err = validateAssignments(appsToAssign)
      if (err) {
        setMsg({ type: 'error', text: err })
        return
      }
    } else if (decisionType === 'PROCESS_PRIORITY_AND_LOTTERY') {
      appsToAssign = priorityGrantApps
      const err = validateAssignments(appsToAssign)
      if (err) {
        setMsg({ type: 'error', text: err })
        return
      }
    }

    const labels: Record<DeveloperDecisionType, string> = {
      CLOSE_AND_SIGN: 'Chốt danh sách, cấp căn và chuyển sang ký hợp đồng?',
      KEEP_OPEN: 'Giữ danh sách đạt yêu cầu và tiếp tục nhận thêm hồ sơ?',
      PROCESS_PRIORITY_AND_LOTTERY:
        'Cấp căn cho đối tượng ưu tiên đã chọn, phần còn lại sẽ tổ chức bốc thăm?',
    }
    if (!window.confirm(labels[decisionType])) return

    setBusy(decisionType)
    setMsg(null)
    try {
      await housingProjectsApi.executeDeveloperDecision(projectId, {
        decisionType,
        closeProject: decisionType === 'CLOSE_AND_SIGN' ? closeProject : false,
        selectedPriorityApplicationIds:
          decisionType === 'PROCESS_PRIORITY_AND_LOTTERY' && excessPriority
            ? Array.from(selectedPriority)
            : undefined,
        apartmentAssignments:
          decisionType === 'KEEP_OPEN'
            ? undefined
            : buildAssignments(appsToAssign).map((x) => ({
                applicationId: x.applicationId,
                apartmentId: x.apartmentId,
              })),
      })

      if (decisionType === 'CLOSE_AND_SIGN') {
        setMsg({
          type: 'success',
          text: closeProject
            ? 'Đã cấp căn, chuyển ký hợp đồng và đóng dự án.'
            : 'Đã cấp căn và chuyển sang ký hợp đồng mua bán NOXH.',
        })
      } else if (decisionType === 'KEEP_OPEN') {
        setMsg({
          type: 'success',
          text: 'Đã lưu danh sách đạt yêu cầu. Dự án tiếp tục nhận thêm hồ sơ.',
        })
      } else {
        setMsg({
          type: 'success',
          text: 'Đã cấp căn cho hồ sơ ưu tiên. Hồ sơ còn lại sẵn sàng bốc thăm — chuyển sang đề xuất lịch.',
        })
        sessionStorage.setItem('lotteryProjectId', projectId)
        sessionStorage.setItem('projectId', projectId)
        window.setTimeout(() => navigate('lottery-detail'), 800)
        return
      }
      await load()
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy('')
    }
  }

  const togglePriority = (id: string) => {
    if (!evaluation) return
    setSelectedPriority((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setAptByApp((m) => {
          const copy = { ...m }
          delete copy[id]
          return copy
        })
        return next
      }
      if (next.size >= evaluation.availableUnits) return prev
      next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải đánh giá hồ sơ đã duyệt...</p>
      </div>
    )
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>
  }

  if (!evaluation) {
    return <Alert variant="info">Chưa có dữ liệu đánh giá cho dự án này.</Alert>
  }

  const isLessOrEqual = evaluation.recommendedScenario === 'LESS_OR_EQUAL_AVAILABLE'
  const hasQualified = evaluation.totalQualifiedApplications > 0

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Cấp căn &amp; chuyển ký hợp đồng
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sau khi Sở duyệt: nếu số hồ sơ ≤ số căn → chọn căn rồi chốt thẳng; nếu vượt căn → cấp căn
          cho ưu tiên, phần còn lại đề xuất lịch bốc thăm.
        </p>
      </div>

      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Căn còn trống" value={availableApts.length} />
        <Stat label="Đã duyệt (SXD)" value={evaluation.totalQualifiedApplications} tone="primary" />
        <Stat label="Ưu tiên" value={evaluation.priorityCount} tone="warning" />
        <Stat label="Không ưu tiên" value={evaluation.nonPriorityCount} tone="success" />
      </div>

      {!hasQualified ? (
        <Alert variant="info">
          Chưa có hồ sơ nào ở trạng thái đã duyệt bởi Sở Xây dựng. Khi SXD phê duyệt, danh sách sẽ
          hiện tại đây.
        </Alert>
      ) : isLessOrEqual ? (
        <div className="space-y-4">
          <Alert variant="info">
            Số hồ sơ đủ điều kiện ({evaluation.totalQualifiedApplications}) ≤ số căn trống (
            {availableApts.length}). Chọn căn cho từng hồ sơ rồi chốt → ký hợp đồng.
          </Alert>

          <ApartmentAssignList
            title="Cấp căn cho hồ sơ đủ điều kiện"
            items={closeAndSignApps}
            availableApts={availableApts}
            aptByApp={aptByApp}
            usedAptIds={usedAptIds}
            onChange={setAppApartment}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={closeProject}
              onChange={(e) => setCloseProject(e.target.checked)}
            />
            Đóng dự án với số căn còn lại sau khi chốt (không nhận thêm hồ sơ)
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              disabled={!!busy || availableApts.length === 0}
              onClick={() => void execute('CLOSE_AND_SIGN')}
            >
              <FileSignature className="mr-1.5 h-4 w-4" />
              {busy === 'CLOSE_AND_SIGN' ? 'Đang chốt…' : 'Cấp căn → ký hợp đồng'}
            </Button>
            <Button variant="outline" disabled={!!busy} onClick={() => void execute('KEEP_OPEN')}>
              <Inbox className="mr-1.5 h-4 w-4" />
              {busy === 'KEEP_OPEN' ? 'Đang lưu…' : 'Giữ &amp; nhận thêm hồ sơ'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="warning">
            Số hồ sơ đủ điều kiện ({evaluation.totalQualifiedApplications}) &gt; số căn trống (
            {availableApts.length}). Duyệt ưu tiên + cấp căn trước; phần còn lại tổ chức bốc thăm.
          </Alert>

          {excessPriority ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Số ưu tiên ({evaluation.priorityCount}) vượt số căn — chọn tối đa{' '}
                {evaluation.availableUnits} hồ sơ ({selectedPriority.size}/
                {evaluation.availableUnits}):
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                {evaluation.priorityApplications.map((app) => (
                  <label
                    key={app.applicationId}
                    className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-blue-600"
                      checked={selectedPriority.has(app.applicationId)}
                      onChange={() => togglePriority(app.applicationId)}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium">{app.fullName}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {PRIORITY_LABELS[app.priorityGroup ?? ''] ?? app.priorityGroup ?? 'Ưu tiên'}{' '}
                        · Điểm {app.priorityScore} · CCCD {app.citizenId}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tất cả {evaluation.priorityCount} hồ sơ ưu tiên sẽ được cấp căn (không vượt số căn trống).
            </p>
          )}

          <ApartmentAssignList
            title="Cấp căn cho hồ sơ ưu tiên được chọn"
            items={priorityGrantApps}
            availableApts={availableApts}
            aptByApp={aptByApp}
            usedAptIds={usedAptIds}
            onChange={setAppApartment}
          />

          <AppList
            title="Hồ sơ còn lại (sẽ bốc thăm — cấp căn sau khi trúng)"
            items={
              excessPriority
                ? [
                    ...evaluation.priorityApplications.filter(
                      (a) => !selectedPriority.has(a.applicationId),
                    ),
                    ...evaluation.nonPriorityApplications,
                  ]
                : evaluation.nonPriorityApplications
            }
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              disabled={!!busy || priorityGrantApps.length === 0 || availableApts.length === 0}
              onClick={() => void execute('PROCESS_PRIORITY_AND_LOTTERY')}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {busy === 'PROCESS_PRIORITY_AND_LOTTERY'
                ? 'Đang xử lý…'
                : 'Cấp căn ưu tiên → chuẩn bị bốc thăm'}
            </Button>
            <Button
              variant="outline"
              disabled={!!busy}
              onClick={() => {
                sessionStorage.setItem('lotteryProjectId', projectId)
                navigate('lottery-sessions')
              }}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              Mở quản lý bốc thăm
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ApartmentAssignList({
  title,
  items,
  availableApts,
  aptByApp,
  usedAptIds,
  onChange,
}: {
  title: string
  items: ApplicationSummaryItemDto[]
  availableApts: ApartmentDto[]
  aptByApp: Record<string, string>
  usedAptIds: Set<string>
  onChange: (applicationId: string, apartmentId: string) => void
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}: chưa có hồ sơ.</p>
    )
  }

  if (availableApts.length === 0) {
    return (
      <Alert variant="error">
        Dự án chưa có căn trống (AVAILABLE). Hãy thêm căn ở form dự án trước khi cấp.
      </Alert>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title} ({items.length})
      </p>
      <p className="text-xs text-slate-500">
        Mỗi hồ sơ chọn một căn còn trống. Hợp đồng sẽ ghi tên căn · diện tích · giá đã chọn.
      </p>
      <ul className="space-y-3">
        {items.map((app) => {
          const selected = aptByApp[app.applicationId] ?? ''
          return (
            <li
              key={app.applicationId}
              className="grid gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40 sm:grid-cols-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{app.fullName}</p>
                <p className="text-xs text-slate-500">
                  {app.priorityGroup
                    ? PRIORITY_LABELS[app.priorityGroup] ?? app.priorityGroup
                    : 'Không ưu tiên'}{' '}
                  · {app.citizenId}
                </p>
              </div>
              <Select
                value={selected}
                onChange={(e) => onChange(app.applicationId, e.target.value)}
                aria-label={`Chọn căn cho ${app.fullName}`}
              >
                <option value="">Chọn căn…</option>
                {availableApts.map((apt) => {
                  const taken = usedAptIds.has(apt.id) && selected !== apt.id
                  return (
                    <option key={apt.id} value={apt.id} disabled={taken}>
                      {apt.unitName} · {apt.area}m² · {Number(apt.price).toLocaleString('vi-VN')}đ
                      {taken ? ' (đã chọn)' : ''}
                    </option>
                  )
                })}
              </Select>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function AppList({ title, items }: { title: string; items: ApplicationSummaryItemDto[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {title}: không có hồ sơ.
      </p>
    )
  }
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        {title} ({items.length})
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
        {items.map((a) => (
          <li
            key={a.applicationId}
            className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800"
          >
            <span className="font-medium">{a.fullName}</span>
            <span className="text-xs text-slate-500">
              {a.priorityGroup
                ? PRIORITY_LABELS[a.priorityGroup] ?? a.priorityGroup
                : 'Không ưu tiên'}{' '}
              · {a.citizenId}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone?: 'primary' | 'warning' | 'success'
}) {
  const toneClass =
    tone === 'primary'
      ? 'text-blue-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'success'
          ? 'text-emerald-600'
          : 'text-slate-900 dark:text-slate-100'
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
