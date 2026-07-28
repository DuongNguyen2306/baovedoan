import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileSignature, Inbox, Sparkles } from 'lucide-react'
import {
  housingProjectsApi,
  parseProjectEvaluation,
  type ApplicationSummaryItemDto,
  type DeveloperDecisionType,
  type ProjectApplicationEvaluationDto,
} from '@/api/housing-projects'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { navigate } from '@/hooks/useHashRoute'
import { formatError } from '@/lib/format-error'

const PRIORITY_LABELS: Record<string, string> = {
  REVOLUTIONARY_CONTRIBUTION: 'Có công với cách mạng',
  POOR_HOUSEHOLD: 'Hộ nghèo / cận nghèo',
  SINGLE_MOTHER: 'Mẹ đơn thân',
  DISABILITY: 'Người khuyết tật',
  ETHNIC_MINORITY: 'Dân tộc thiểu số',
}

/**
 * CĐT quyết định sau khi SXD duyệt hồ sơ:
 * - ≤ số căn: chốt ký HĐ hoặc giữ mở nhận thêm
 * - > số căn: duyệt ưu tiên trước, phần còn lại bốc thăm
 */
export function DeveloperDecisionPanel({ projectId }: { projectId: string }) {
  const [evaluation, setEvaluation] = useState<ProjectApplicationEvaluationDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [closeProject, setCloseProject] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await housingProjectsApi.getEvaluation(projectId)
      const e = parseProjectEvaluation(data)
      setEvaluation(e)
      if (e) {
        // Mặc định chọn tối đa AvailableUnits hồ sơ ưu tiên (theo điểm cao nhất từ BE)
        const auto = e.priorityApplications.slice(0, e.availableUnits).map((a) => a.applicationId)
        setSelectedPriority(new Set(auto))
      }
    } catch (err) {
      setError(formatError(err))
      setEvaluation(null)
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

    const labels: Record<DeveloperDecisionType, string> = {
      CLOSE_AND_SIGN: 'Chốt danh sách và chuyển sang ký hợp đồng?',
      KEEP_OPEN: 'Giữ danh sách đạt yêu cầu và tiếp tục nhận thêm hồ sơ?',
      PROCESS_PRIORITY_AND_LOTTERY:
        'Duyệt đối tượng ưu tiên trước, phần còn lại sẽ tổ chức bốc thăm?',
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
      })

      if (decisionType === 'CLOSE_AND_SIGN') {
        setMsg({
          type: 'success',
          text: closeProject
            ? 'Đã chốt danh sách, chuyển ký hợp đồng và đóng dự án.'
            : 'Đã chốt danh sách và chuyển sang ký hợp đồng nguyên tắc.',
        })
      } else if (decisionType === 'KEEP_OPEN') {
        setMsg({
          type: 'success',
          text: 'Đã lưu danh sách đạt yêu cầu. Dự án tiếp tục nhận thêm hồ sơ.',
        })
      } else {
        setMsg({
          type: 'success',
          text: 'Đã duyệt ưu tiên sang ký hợp đồng. Hồ sơ còn lại sẵn sàng cho bốc thăm — chuyển sang đề xuất lịch.',
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
        <h3 className="font-semibold text-slate-900 dark:text-white">Chốt danh sách sau SXD duyệt</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          So sánh hồ sơ đã phê duyệt với số căn còn lại của dự án, rồi chọn hướng xử lý.
        </p>
      </div>

      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Căn còn lại" value={evaluation.availableUnits} />
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
            Số hồ sơ đủ điều kiện ({evaluation.totalQualifiedApplications}) ≤ số căn (
            {evaluation.availableUnits}). Có thể chốt ký hợp đồng ngay hoặc tiếp tục nhận thêm hồ
            sơ.
          </Alert>

          <AppList title="Hồ sơ đủ điều kiện" items={[...evaluation.priorityApplications, ...evaluation.nonPriorityApplications]} />

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
              disabled={!!busy}
              onClick={() => void execute('CLOSE_AND_SIGN')}
            >
              <FileSignature className="mr-1.5 h-4 w-4" />
              {busy === 'CLOSE_AND_SIGN' ? 'Đang chốt…' : 'Chốt danh sách → ký hợp đồng'}
            </Button>
            <Button variant="outline" disabled={!!busy} onClick={() => void execute('KEEP_OPEN')}>
              <Inbox className="mr-1.5 h-4 w-4" />
              {busy === 'KEEP_OPEN' ? 'Đang lưu…' : 'Giữ & nhận thêm hồ sơ'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Alert variant="warning">
            Số hồ sơ đủ điều kiện ({evaluation.totalQualifiedApplications}) &gt; số căn (
            {evaluation.availableUnits}). Duyệt đối tượng ưu tiên trước; phần còn lại tổ chức bốc
            thăm.
          </Alert>

          {excessPriority ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Số ưu tiên ({evaluation.priorityCount}) vượt số căn — chọn tối đa{' '}
                {evaluation.availableUnits} hồ sơ để duyệt trước ({selectedPriority.size}/
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
            <AppList title="Đối tượng ưu tiên (duyệt trước)" items={evaluation.priorityApplications} />
          )}

          <AppList
            title="Hồ sơ còn lại (sẽ bốc thăm)"
            items={
              excessPriority
                ? [
                    ...evaluation.priorityApplications.filter((a) => !selectedPriority.has(a.applicationId)),
                    ...evaluation.nonPriorityApplications,
                  ]
                : evaluation.nonPriorityApplications
            }
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              disabled={!!busy}
              onClick={() => void execute('PROCESS_PRIORITY_AND_LOTTERY')}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {busy === 'PROCESS_PRIORITY_AND_LOTTERY'
                ? 'Đang xử lý…'
                : 'Duyệt ưu tiên → chuẩn bị bốc thăm'}
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
          <li key={a.applicationId} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800">
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
