import { useEffect, useState } from 'react'
import { BarChart3, Gavel, Sparkles } from 'lucide-react'
import { housingProjectsApi } from '@/api/housing-projects'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { formatError } from '@/lib/format-error'
import { navigate } from '@/hooks/useHashRoute'

interface EvaluationDto {
  projectId: string
  projectName?: string
  totalUnits?: number
  eligibleCount?: number
  povertyGroupCount?: number
  revenueGroupCount?: number
  policyGroupCount?: number
  needsLottery?: boolean
  summary?: string
  notes?: string
}

/**
 * Panel cho CĐT: xem thống kê phân tích hồ sơ đủ điều kiện + chạy quyết định
 * (phê duyệt / chạy bốc thăm). Hiển thị trên trang chi tiết dự án.
 */
export function DeveloperDecisionPanel({ projectId }: { projectId: string }) {
  const [evaluation, setEvaluation] = useState<EvaluationDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await housingProjectsApi.getEvaluation(projectId)
      const e = (data && typeof data === 'object' && 'data' in (data as object)
        ? (data as { data?: EvaluationDto }).data
        : (data as EvaluationDto))
      setEvaluation(e ?? null)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [projectId])

  const execute = async (decision: 'APPROVE_ALL' | 'RUN_LOTTERY' | 'REJECT') => {
    setBusy(decision)
    setMsg(null)
    try {
      await housingProjectsApi.executeDeveloperDecision(projectId, { decision })
      setMsg({ type: 'success', text: `Đã thực thi quyết định ${decision}.` })
      if (decision === 'RUN_LOTTERY') {
        sessionStorage.setItem('lotteryProjectId', projectId)
        navigate('lottery-detail')
      } else {
        await load()
      }
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy('')
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải đánh giá hồ sơ...</p>
      </div>
    )
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Đánh giá hồ sơ đủ điều kiện</h3>
      </div>
      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}
      {evaluation ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Tổng căn" value={evaluation.totalUnits ?? '—'} />
            <Stat label="Đủ điều kiện" value={evaluation.eligibleCount ?? 0} tone="primary" />
            <Stat label="Nhóm nghèo" value={evaluation.povertyGroupCount ?? 0} tone="warning" />
            <Stat label="Nhóm chính sách" value={evaluation.policyGroupCount ?? 0} tone="success" />
          </div>
          {evaluation.summary && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
              {evaluation.summary}
            </div>
          )}
          {evaluation.needsLottery && (
            <Alert variant="info">
              Số hồ sơ đủ điều kiện vượt quá số căn ({evaluation.eligibleCount}/{evaluation.totalUnits}).
              Hệ thống khuyến nghị tổ chức bốc thăm.
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              disabled={!!busy}
              onClick={() => void execute('APPROVE_ALL')}
            >
              <Gavel className="mr-1.5 h-4 w-4" />
              {busy === 'APPROVE_ALL' ? 'Đang duyệt...' : 'Phê duyệt tất cả'}
            </Button>
            <Button
              variant="outline"
              disabled={!!busy}
              onClick={() => void execute('RUN_LOTTERY')}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {busy === 'RUN_LOTTERY' ? 'Đang chạy...' : 'Chạy bốc thăm'}
            </Button>
          </div>
        </>
      ) : (
        <Alert variant="info">Chưa có dữ liệu đánh giá cho dự án này.</Alert>
      )}
    </div>
  )
}

function Stat({
  label, value, tone,
}: { label: string; value: number | string; tone?: 'primary' | 'warning' | 'success' }) {
  const toneClass =
    tone === 'primary' ? 'text-blue-600' :
    tone === 'warning' ? 'text-amber-600' :
    tone === 'success' ? 'text-emerald-600' :
    'text-slate-900 dark:text-slate-100'
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
