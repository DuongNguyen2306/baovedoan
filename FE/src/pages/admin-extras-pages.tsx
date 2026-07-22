import { useEffect, useState } from 'react'
import { PageCard, PageHeader } from '@/components/layout/page-header'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { housingProjectStatusesApi } from '@/api/housing-project-statuses'
import { issueReportsApi } from '@/api/issue-reports'
import { formatError } from '@/lib/format-error'

interface ProjectStatus {
  id: string
  statusName?: string
  statusCode?: string
  description?: string
  colorCode?: string
}

interface PolicyConfig {
  policyName: string
  policyValue: string
  description?: string
  unit?: string
  updatedAt?: string
}

const POLICY_DEFAULT_VALUES: Record<string, string> = {
  MAX_MONTHLY_INCOME: '15000000',
  MAX_AVG_HOUSE_AREA: '15',
  SMALL_HOUSE_AREA_THRESHOLD: '15',
  PRIORITY_GROUPS: '["REVOLUTIONARY_CONTRIBUTION","POOR_HOUSEHOLD","SINGLE_MOTHER","DISABILITY","ETHNIC_MINORITY"]',
}

export function SystemLogsPage() {
  const [logs, setLogs] = useState<Array<{ id: string; title?: string; status?: string; category?: string; createdAt?: string; description?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const data = await issueReportsApi.getAllReports({ pageIndex: 1, pageSize: 50 })
        const items = (data && typeof data === 'object' && 'items' in (data as object)
          ? ((data as { items?: unknown[] }).items ?? [])
          : []
        ).map((it) => it as Record<string, unknown>)
        setLogs(items.map((it) => ({
          id: String(it.id ?? it.Id ?? ''),
          title: String(it.title ?? it.Title ?? it.description ?? '—'),
          status: String(it.status ?? it.Status ?? ''),
          category: String(it.category ?? it.Category ?? ''),
          createdAt: (it.createdAt ?? it.CreatedAt) as string | undefined,
          description: (it.description ?? it.Description) as string | undefined,
        })))
      } catch (err) {
        setError(formatError(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader routeId="admin-logs" />
      <PageCard className="p-6">
        <Alert variant="info" className="mb-4">
          <p className="font-semibold">Nhật ký hoạt động (sử dụng tạm Issue Reports)</p>
          <p className="mt-1 text-sm">
            Hệ thống BE chưa có API audit-log riêng. Trang này hiển thị các báo cáo sự cố do người dùng gửi lên
            để admin theo dõi.
          </p>
        </Alert>
        {error && <Alert variant="error">{error}</Alert>}
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có sự cố nào được báo cáo.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{l.title}</span>
                  <div className="flex gap-2">
                    {l.category && <Badge variant="secondary">{l.category}</Badge>}
                    {l.status && <Badge variant="default">{l.status}</Badge>}
                  </div>
                </div>
                {l.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{l.description}</p>}
                {l.createdAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(l.createdAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  )
}

export function CategoriesPage() {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [policies, setPolicies] = useState<PolicyConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editPolicyName, setEditPolicyName] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const s = await housingProjectStatusesApi.list()
      const sl = Array.isArray(s) ? s : ((s as { items?: ProjectStatus[] }).items ?? [])
      setStatuses(sl as ProjectStatus[])

      const policyNames = Object.keys(POLICY_DEFAULT_VALUES)
      const loaded: PolicyConfig[] = []
      for (const name of policyNames) {
        try {
          const p = await housingProjectStatusesApi.getPolicy(name)
          loaded.push({
            policyName: name,
            policyValue: String((p as { policyValue?: string }).policyValue ?? POLICY_DEFAULT_VALUES[name]),
            description: (p as { description?: string }).description,
            unit: (p as { unit?: string }).unit,
            updatedAt: (p as { updatedAt?: string }).updatedAt,
          })
        } catch {
          loaded.push({
            policyName: name,
            policyValue: POLICY_DEFAULT_VALUES[name],
          })
        }
      }
      setPolicies(loaded)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const savePolicy = async (name: string) => {
    setMsg(null)
    try {
      await housingProjectStatusesApi.updatePolicy(name, { policyValue: editValue })
      setMsg({ type: 'success', text: `Đã cập nhật chính sách ${name}.` })
      setEditPolicyName(null)
      await load()
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader routeId="admin-categories" />
      <PageCard className="p-6">
        {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'} className="mb-3">{msg.text}</Alert>}
        {error && <Alert variant="error" className="mb-3">{error}</Alert>}
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
        ) : (
          <>
            <h3 className="mb-2 font-semibold">Trạng thái dự án</h3>
            <div className="mb-6 space-y-2">
              {statuses.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="font-medium">{s.statusName ?? '—'}</p>
                    {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                  </div>
                  <Badge variant="secondary">{s.statusCode ?? '—'}</Badge>
                </div>
              ))}
            </div>

            <h3 className="mb-2 font-semibold">Cấu hình chính sách NOXH</h3>
            <div className="space-y-2">
              {policies.map((p) => (
                <div key={p.policyName} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{p.policyName}</p>
                      {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
                      {p.unit && <p className="text-xs text-slate-400">Đơn vị: {p.unit}</p>}
                    </div>
                    {editPolicyName === p.policyName ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-sm"
                        />
                        <Button variant="accent" size="sm" onClick={() => void savePolicy(p.policyName)}>Lưu</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditPolicyName(null)}>Huỷ</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{p.policyValue}</code>
                        <Button variant="outline" size="sm" onClick={() => { setEditPolicyName(p.policyName); setEditValue(p.policyValue) }}>
                          Sửa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </PageCard>
    </div>
  )
}
