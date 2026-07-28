import { useEffect, useMemo, useState } from 'react'
import { FileText, Printer, Send } from 'lucide-react'
import { housingApplicationsApi, parseApplicationDetail, parsePagedApplications } from '@/api/housing-applications'
import { reportsApi } from '@/api/reports'
import { CreateApplicationWizard } from '@/components/ekyc/create-application-wizard'
import { ApplicationTimeline } from '@/components/shared/application-timeline'
import { FileDropzone } from '@/components/shared/file-dropzone'
import { PageCard, PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/label'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { startVnPayPayment } from '@/api/payment'
import { openVnPayPopupAndWait, vnPayResultMessage } from '@/lib/vnpay-popup'
import { navigate } from '@/hooks/useHashRoute'
import { labelApplicationStatus } from '@/lib/labels'
import { APPLICATION_STATUS, DOC_TYPE_LABELS, HOUSING_STATUS_LABELS } from '@/lib/constants'
import { formatError } from '@/lib/format-error'
import { ensureVerifiedForApplication } from '@/lib/ekyc-gate'
import { formatDepositCountdown } from '@/lib/deposit-deadline'
import { formatSxdCountdown } from '@/lib/sxd-deadline'
import { getRole } from '@/router'
import type { ApplicationDetailDto, ApplicationSummaryDto } from '@/types'

function DetailRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800 sm:flex-row sm:justify-between ${danger ? 'bg-rose-50/80 px-2 dark:bg-rose-950/30' : ''}`}>
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${danger ? 'text-rose-700 dark:text-rose-300' : ''}`}>{value}</span>
    </div>
  )
}

export function ApplicationsPage() {
  const role = getRole()
  const isApplicant = role === 'Applicant'
  const isDeveloper = role === 'Housing Developer'
  const isSxd = role === 'Department Of Construction'
  const [apps, setApps] = useState<ApplicationSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>(() => {
    if (typeof window === 'undefined') return isDeveloper ? 'SUBMITTED' : ''
    const hash = window.location.hash.replace(/^#\/?/, '')
    const qIdx = hash.indexOf('?')
    if (qIdx < 0) return isDeveloper ? 'SUBMITTED' : ''
    const params = new URLSearchParams(hash.slice(qIdx + 1))
    return params.get('status') ?? (isDeveloper ? 'SUBMITTED' : '')
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkMsg, setBulkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isSxd && !isApplicant) return
    const ms = isApplicant ? 1_000 : 60_000
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [isSxd, isApplicant])

  const load = async (filter?: { search?: string; status?: string }) => {
    setLoading(true)
    setError('')
    try {
      const data = isApplicant
        ? await housingApplicationsApi.getMy({ pageIndex: 1, pageSize: 50, ...filter })
        : role === 'Housing Developer'
        ? await housingApplicationsApi.getDeveloperDashboard({ pageIndex: 1, pageSize: 50, ...filter })
        : role === 'Department Of Construction'
        ? await housingApplicationsApi.getSxdDashboard({ pageIndex: 1, pageSize: 50, ...filter })
        : await housingApplicationsApi.getAll({ pageIndex: 1, pageSize: 50, ...filter })
      setApps(parsePagedApplications(data))
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load({ status: status || undefined }) }, [isApplicant, role])

  const submittable = useMemo(
    () => apps.filter((a) => a.applicationStatus === 'REVIEWING'),
    [apps],
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === submittable.length) return new Set()
      return new Set(submittable.map((a) => a.applicationId))
    })
  }

  const submitSelectedToSxd = async () => {
    if (selected.size === 0 || bulkSending) return
    if (!window.confirm(
      `Gửi ${selected.size} hồ sơ đã chọn lên Sở Xây dựng? Hành động này không thể hoàn tác.`,
    )) return
    setBulkSending(true)
    setBulkMsg(null)
    try {
      await housingApplicationsApi.submitToDepartment(Array.from(selected))
      setBulkMsg({ type: 'success', text: `Đã gửi ${selected.size} hồ sơ lên Sở Xây dựng.` })
      setSelected(new Set())
      await load({ search: search || undefined, status: status || undefined })
    } catch (err) {
      setBulkMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBulkSending(false)
    }
  }

  const exportDraft = async () => {
    setExporting(true)
    setBulkMsg(null)
    try {
      await reportsApi.exportApplicationsExcel({
        status: status || (isDeveloper ? 'REVIEWING' : undefined),
        search: search || undefined,
      })
      setBulkMsg({ type: 'success', text: 'Đã xuất file Excel danh sách dự kiến.' })
    } catch (err) {
      setBulkMsg({ type: 'error', text: formatError(err) })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader routeId="applications" />
      <PageCard className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Đang tải...' : `Tổng cộng ${apps.length} hồ sơ`}
          </p>
          <div className="flex flex-wrap gap-2">
            {(isDeveloper || isSxd) && (
              <Button variant="outline" size="sm" disabled={exporting} onClick={() => void exportDraft()}>
                {exporting ? 'Đang xuất…' : 'Xuất danh sách (Excel)'}
              </Button>
            )}
            {isApplicant && (
              <Button
                variant="accent"
                onClick={() => {
                  void ensureVerifiedForApplication().then((ok) => {
                    if (ok) navigate('create-application')
                  })
                }}
              >
                + Tạo hồ sơ mới
              </Button>
            )}
          </div>
        </div>
        <form className="mb-6 grid gap-3 sm:grid-cols-3" onSubmit={(e) => {
          e.preventDefault()
          void load({ search: search || undefined, status: status || undefined })
        }}>
          <FormField label="Tìm kiếm" htmlFor="search"><Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Họ tên / CCCD" /></FormField>
          <FormField label="Trạng thái" htmlFor="status">
            <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(APPLICATION_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </Select>
          </FormField>
          <div className="flex items-end"><Button type="submit" variant="outline">Lọc</Button></div>
        </form>

        {isDeveloper && submittable.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={submittable.length > 0 && selected.size === submittable.length}
                onChange={toggleSelectAll}
              />
              Gom danh sách dự kiến: đã chọn <strong>{selected.size}</strong> / {submittable.length} hồ sơ đang thẩm định
            </label>
            <Button
              variant="accent"
              size="sm"
              disabled={selected.size === 0 || bulkSending}
              onClick={() => void submitSelectedToSxd()}
            >
              <Send className="mr-1.5 h-4 w-4" />
              {bulkSending ? 'Đang gửi…' : `Gửi thẩm định sang Sở (${selected.size || 0})`}
            </Button>
          </div>
        )}
        {bulkMsg && (
          <Alert variant={bulkMsg.type === 'error' ? 'error' : 'success'} className="mb-4">
            {bulkMsg.text}
          </Alert>
        )}

        {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>}
        {error && <Alert variant="error">{error}</Alert>}
        {!loading && !error && apps.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{isApplicant ? 'Bạn chưa có hồ sơ nào.' : 'Không có hồ sơ phù hợp.'}</p>
        )}

        {(isDeveloper || isSxd) ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  {isDeveloper && <th className="px-3 py-2">Chọn</th>}
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">CCCD</th>
                  <th className="px-3 py-2">Dự án</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  {isSxd && <th className="px-3 py-2">Hạn 20 ngày</th>}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => {
                  const canSelect = isDeveloper && app.applicationStatus === 'REVIEWING'
                  const countdown =
                    isSxd && app.applicationStatus === 'PENDING_SXD_REVIEW'
                      ? formatSxdCountdown(app.submittedAt || app.createdAt)
                      : null
                  return (
                    <tr
                      key={app.applicationId}
                      className={`border-t border-slate-100 dark:border-slate-800 ${app.isViolation ? 'bg-rose-50 dark:bg-rose-950/30' : ''}`}
                    >
                      {isDeveloper && (
                        <td className="px-3 py-2">
                          {canSelect && (
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-blue-600"
                              checked={selected.has(app.applicationId)}
                              onChange={() => toggleSelect(app.applicationId)}
                            />
                          )}
                        </td>
                      )}
                      <td className="px-3 py-2 font-medium">{app.applicantFullName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{app.citizenId}</td>
                      <td className="px-3 py-2">{app.projectName}</td>
                      <td className="px-3 py-2"><StatusBadge status={app.applicationStatus} /></td>
                      {isSxd && (
                        <td className="px-3 py-2">
                          {countdown ? (
                            <span className={`text-xs font-semibold ${countdown.isOverdue ? 'text-rose-600' : countdown.days <= 3 ? 'text-amber-600' : 'text-slate-600'}`}>
                              {countdown.label}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            sessionStorage.setItem('applicationId', app.applicationId)
                            navigate('application-detail')
                          }}
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3">
            {apps.map((app) => {
              const depositCd = formatDepositCountdown(app.applicationStatus, app.updatedAt)
              return (
              <button
                key={app.applicationId}
                type="button"
                className="glass-card w-full p-4 text-left transition hover:ring-2 hover:ring-primary/20"
                onClick={() => {
                  sessionStorage.setItem('applicationId', app.applicationId)
                  navigate('application-detail')
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{app.projectName || 'Dự án'}</h3>
                  <StatusBadge status={app.applicationStatus} />
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{app.applicantFullName} · CCCD: {app.citizenId}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{app.documentCount} tài liệu · {new Date(app.createdAt).toLocaleDateString('vi-VN')}</p>
                {depositCd && (
                  <p className={`mt-1 text-xs font-semibold ${depositCd.isOverdue ? 'text-rose-600' : 'text-amber-700'}`}>
                    Hạn đặt cọc ({depositCd.hoursLimit}h từ duyệt): {depositCd.label}
                    {' · '}đến {depositCd.deadline.toLocaleString('vi-VN')}
                  </p>
                )}
              </button>
              )
            })}
          </div>
        )}
      </PageCard>
    </div>
  )
}

export function CreateApplicationPage() {
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void ensureVerifiedForApplication({ silent: true }).then((ok) => {
      if (cancelled) return
      setReady(ok)
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PageHeader routeId="create-application" />
      <PageCard className="p-6">
        {checking ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Đang kiểm tra xác minh danh tính...</p>
        ) : ready ? (
          <CreateApplicationWizard />
        ) : (
          <div className="space-y-4">
            <Alert variant="warning">
              Cần xác minh danh tính (eKYC) trước khi tạo hồ sơ đăng ký nhà ở xã hội. Bạn vẫn có thể
              duyệt dự án và lưu quan tâm mà không cần eKYC.
            </Alert>
            <Button variant="accent" onClick={() => navigate('verify-identity')}>
              Xác minh danh tính
            </Button>
            <Button variant="outline" onClick={() => navigate('applications')}>
              Quay lại danh sách hồ sơ
            </Button>
          </div>
        )}
      </PageCard>
    </div>
  )
}

function ApplicationDetailInner({ appId }: { appId: string }) {
  const role = getRole()
  const [app, setApp] = useState<ApplicationDetailDto | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [acting, setActing] = useState('')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [docType, setDocType] = useState(Object.keys(DOC_TYPE_LABELS)[0] ?? '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [, setTick] = useState(0)

  const refresh = async () => {
    const data = await housingApplicationsApi.getById(appId)
    setApp(parseApplicationDetail(data))
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        await refresh()
      } catch (err) {
        if (!cancelled) setMsg({ type: 'error', text: formatError(err) })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [appId])

  useEffect(() => {
    const status = app?.applicationStatus
    if (!status) return
    const depositActive = status === 'APPROVED' || status === 'APPROVED_BY_TIMEOUT'
    if (status !== 'PENDING_SXD_REVIEW' && !depositActive) return
    const ms = depositActive ? 1_000 : 60_000
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [app?.applicationStatus])

  const review = async (action: string, needNote = false) => {
    if (acting) return
    let note: string | null = null
    if (needNote) {
      note = window.prompt('Nhập ghi chú / lý do:')
      if (!note?.trim()) { setMsg({ type: 'error', text: 'Ghi chú là bắt buộc.' }); return }
    }
    setActing(`${role}-${action}`)
    try {
      const body = { action, note: note?.trim() || null }
      if (role === 'Housing Developer') await housingApplicationsApi.developerReview(appId, body)
      else if (role === 'Department Of Construction') await housingApplicationsApi.sxdReview(appId, body)
      await refresh()
      setMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công.' })
      if (role === 'Housing Developer' && action === 'REQUEST_MORE_DOCUMENTS') {
        /* no-op */
      }
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setActing('')
    }
  }

  const submitToSxd = async (applicationIds: string[]) => {
    if (acting) return
    setActing('submit-sxd')
    try {
      await housingApplicationsApi.submitToDepartment(applicationIds)
      await refresh()
      setMsg({ type: 'success', text: `Đã gửi ${applicationIds.length} hồ sơ lên Sở Xây dựng.` })
      setReceiptOpen(true)
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setActing('')
    }
  }

  const confirmWithdraw = async () => {
    if (!withdrawReason.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập lý do rút hồ sơ.' })
      return
    }
    setActing('cancel')
    setMsg(null)
    try {
      await housingApplicationsApi.cancel(appId, withdrawReason.trim())
      setWithdrawOpen(false)
      setWithdrawReason('')
      await refresh()
      setMsg({ type: 'success', text: 'Đã rút hồ sơ.' })
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setActing('')
    }
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
  if (!app) return <Alert variant="error">Không đọc được dữ liệu hồ sơ.</Alert>

  const canEditDocs = role === 'Applicant' && (app.applicationStatus === 'DRAFT' || app.applicationStatus === 'NEED_MORE_DOCUMENTS')
  const needMoreNote = (app.reviewHistories ?? [])
    .filter((h) => h.newStatus === 'NEED_MORE_DOCUMENTS' || h.action?.includes('REQUEST_MORE'))
    .at(-1)?.note
  const countdown =
    app.applicationStatus === 'PENDING_SXD_REVIEW'
      ? formatSxdCountdown(app.submittedAt || app.createdAt)
      : null
  const depositCountdown = formatDepositCountdown(app.applicationStatus, app.updatedAt)
  const pdfDoc = (app.documents ?? []).find((d) => d.fileUrl?.toLowerCase().includes('.pdf') || d.fileName?.toLowerCase().endsWith('.pdf'))
  const isStaff = role === 'Housing Developer' || role === 'Department Of Construction'

  const profilePanel = (
    <div className="space-y-4">
      {(app.isViolation || app.violationReason) && (
        <Alert variant="error">
          <strong>Cảnh báo vi phạm:</strong> {app.violationReason || 'Hồ sơ bị đánh dấu vi phạm (trùng CCCD / đã có nhà đất).'}
        </Alert>
      )}
      {role === 'Applicant' && ['APPROVED', 'APPROVED_BY_TIMEOUT'].includes(app.applicationStatus) && (
        <Alert variant="info">
          <strong>Hồ sơ đã được Sở duyệt.</strong> Tiếp theo cần qua bốc thăm / chốt danh sách → ký{' '}
          <strong>hợp đồng nguyên tắc</strong> → rồi mới đặt cọc VNPay. Trạng thái cần để thanh toán:{' '}
          <code>CONTRACT_SIGNED</code>.
        </Alert>
      )}
      {role === 'Applicant' && depositCountdown && (
        <Alert variant={depositCountdown.isOverdue ? 'error' : 'warning'}>
          <strong>Hạn đặt cọc ({depositCountdown.daysLimit} ngày sau khi ký).</strong>{' '}
          {depositCountdown.isOverdue
            ? <>Đã quá hạn đặt cọc — tải lại trang để xem trạng thái mới nhất từ hệ thống.</>
            : <>Còn lại: <strong>{depositCountdown.label}</strong></>}
          {' · '}đến {depositCountdown.deadline.toLocaleString('vi-VN')}
        </Alert>
      )}
      {role === 'Applicant' && app.applicationStatus === 'CONTRACT_PENDING' && (
        <Alert variant="info">
          <strong>Chờ ký hợp đồng nguyên tắc.</strong> Vào mục <strong>Hợp đồng</strong> để xem và ký,
          sau đó mới đặt cọc được.
        </Alert>
      )}
      {role === 'Applicant' && app.applicationStatus === 'CONTRACT_SIGNED' && (
        <Alert variant="info">
          <strong>Đã ký hợp đồng nguyên tắc.</strong> Vui lòng đặt cọc qua VNPay.
          Thẻ sandbox: NCB · <code>9704198526191432198</code> · hết hạn <code>07/15</code> · OTP <code>123456</code>.
        </Alert>
      )}
      {role === 'Applicant' && app.applicationStatus === 'NEED_MORE_DOCUMENTS' && (
        <Alert variant="warning">
          <strong>Yêu cầu bổ sung hồ sơ.</strong>{' '}
          {needMoreNote || 'Chủ đầu tư yêu cầu bổ sung giấy tờ. Vui lòng tải lại tài liệu bên dưới rồi nộp lại.'}
        </Alert>
      )}
      {countdown && role === 'Department Of Construction' && (
        <Alert variant={countdown.isOverdue ? 'error' : countdown.days <= 3 ? 'warning' : 'info'}>
          Hạn hậu kiểm 20 ngày: <strong>{countdown.label}</strong>
          {' · '}đến {countdown.deadline.toLocaleString('vi-VN')}
          {countdown.isOverdue && ' — hệ thống có thể tự duyệt quá hạn.'}
        </Alert>
      )}

      <div className="glass-card p-4">
        <h3 className="mb-3 font-semibold">Tiến độ hồ sơ</h3>
        <ApplicationTimeline currentStatus={app.applicationStatus} histories={app.reviewHistories} />
      </div>

      <div className={`glass-card p-4 ${app.isViolation ? 'ring-2 ring-rose-400' : ''}`}>
        <h3 className="mb-2 font-semibold">Thông tin đăng ký</h3>
        <DetailRow label="Họ tên" value={app.fullName} danger={app.isViolation} />
        <DetailRow label="CCCD" value={app.citizenId} danger={app.isViolation} />
        <DetailRow label="Nghề nghiệp" value={app.occupation || '—'} />
        <DetailRow label="Nơi làm việc" value={app.workPlace || '—'} />
        <DetailRow label="Nơi ở hiện tại" value={app.currentResidence} />
        <DetailRow label="Thường trú/tạm trú" value={app.permanentAddress} />
        <DetailRow label="Thực trạng nhà ở" value={HOUSING_STATUS_LABELS[app.housingStatus] ?? app.housingStatus} />
        <DetailRow label="Thu nhập/tháng" value={`${Number(app.estimatedMonthlyIncome).toLocaleString('vi-VN')} VNĐ`} />
        <DetailRow label="Ngày tạo" value={new Date(app.createdAt).toLocaleString('vi-VN')} />
        {app.submittedAt && <DetailRow label="Ngày nộp" value={new Date(app.submittedAt).toLocaleString('vi-VN')} />}
        {app.finalDecisionDate && (
          <DetailRow label="Ngày duyệt" value={new Date(app.finalDecisionDate).toLocaleString('vi-VN')} />
        )}
        {app.officerFullName && <DetailRow label="Cán bộ thẩm định" value={app.officerFullName} />}
      </div>

      <div className="glass-card p-4">
        <h3 className="mb-2 font-semibold">Tài liệu đính kèm</h3>
        {(app.documents ?? []).length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có tài liệu.</p>}
        {(app.documents ?? []).map((doc) => (
          <div key={doc.documentId} className="flex flex-wrap items-center justify-between gap-2 border-b py-3 last:border-0">
            <div>
              <p className="font-medium">{DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{doc.fileName} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB</p>
            </div>
            <div className="flex gap-2">
              <a href={doc.fileUrl} target="_blank" rel="noopener" className="text-sm font-semibold text-primary hover:underline">Xem PDF</a>
              {canEditDocs && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 dark:text-red-400"
                  disabled={deletingId === doc.documentId}
                  onClick={async () => {
                    if (deletingId) return
                    if (!window.confirm(`Xóa tài liệu "${DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}"?`)) return
                    setDeletingId(doc.documentId)
                    try {
                      await housingApplicationsApi.deleteDocument(app.applicationId, doc.documentId)
                      await refresh()
                      setMsg({ type: 'success', text: 'Đã xóa tài liệu.' })
                    } catch (err) {
                      setMsg({ type: 'error', text: formatError(err) })
                    } finally {
                      setDeletingId(null)
                    }
                  }}
                >
                  {deletingId === doc.documentId ? 'Đang xóa…' : 'Xóa'}
                </Button>
              )}
            </div>
          </div>
        ))}
        {canEditDocs && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <FormField label="Loại giấy tờ" htmlFor="documentType">
              <Select id="documentType" value={docType} onChange={(e) => setDocType(e.target.value)}>
                {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </FormField>
            <FileDropzone onFile={setPendingFile} disabled={uploading} />
            {pendingFile && <p className="text-xs text-slate-500">Đã chọn: {pendingFile.name}</p>}
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !pendingFile}
              onClick={async () => {
                if (!pendingFile || uploading) return
                setUploading(true)
                try {
                  await housingApplicationsApi.uploadDocument(app.applicationId, docType, pendingFile)
                  await refresh()
                  setPendingFile(null)
                  setMsg({ type: 'success', text: 'Tải lên tài liệu thành công.' })
                } catch (err) {
                  setMsg({ type: 'error', text: formatError(err) })
                } finally {
                  setUploading(false)
                }
              }}
            >
              {uploading ? 'Đang tải lên…' : 'Tải lên tài liệu'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{app.projectName}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={app.applicationStatus} />
          {(app.receiptUrl || app.applicationStatus !== 'DRAFT') && (
            <Button variant="outline" size="sm" onClick={() => setReceiptOpen(true)}>
              <Printer className="mr-1.5 h-4 w-4" /> Phiếu tiếp nhận
            </Button>
          )}
        </div>
      </div>

      {isStaff ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">{profilePanel}</div>
          <div className="glass-card flex min-h-[480px] flex-col overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">Xem trước tài liệu PDF</span>
            </div>
            {pdfDoc ? (
              <iframe title="PDF hồ sơ" src={pdfDoc.fileUrl} className="min-h-[440px] w-full flex-1 bg-slate-100" />
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
                Chưa có file PDF để xem. Mở từng tài liệu ở cột trái.
              </div>
            )}
          </div>
        </div>
      ) : (
        profilePanel
      )}

      <div className="flex flex-wrap gap-2">
        {role === 'Applicant' && app.applicationStatus === 'DRAFT' && (
          <Button variant="accent" disabled={acting === 'submit'} onClick={async () => {
            if (acting) return
            setActing('submit')
            try {
              await housingApplicationsApi.submit(app.applicationId)
              await refresh()
              setMsg({ type: 'success', text: 'Đã nộp hồ sơ.' })
              setReceiptOpen(true)
            } catch (err) {
              setMsg({ type: 'error', text: formatError(err) })
            } finally {
              setActing('')
            }
          }}>{acting === 'submit' ? 'Đang nộp…' : 'Nộp hồ sơ'}</Button>
        )}
        {role === 'Applicant' && app.applicationStatus === 'NEED_MORE_DOCUMENTS' && (
          <Button variant="accent" disabled={acting === 'submit'} onClick={async () => {
            if (acting) return
            setActing('submit')
            try {
              await housingApplicationsApi.submit(app.applicationId)
              await refresh()
              setMsg({ type: 'success', text: 'Đã nộp lại hồ sơ bổ sung.' })
            } catch (err) {
              setMsg({ type: 'error', text: formatError(err) })
            } finally {
              setActing('')
            }
          }}>{acting === 'submit' ? 'Đang nộp…' : 'Nộp lại sau bổ sung'}</Button>
        )}
        {role === 'Applicant' && app.applicationStatus === 'CONTRACT_PENDING' && (
          <Button variant="accent" onClick={() => navigate('contracts')}>
            Xem &amp; ký hợp đồng nguyên tắc
          </Button>
        )}
        {role === 'Applicant' && app.applicationStatus === 'CONTRACT_SIGNED' && (
          <Button
            variant="accent"
            disabled={acting === 'pay'}
            onClick={async () => {
              if (acting) return
              setActing('pay')
              setMsg(null)
              try {
                const { url, orderId } = await startVnPayPayment(
                  app.applicationId,
                  `Dat coc ho so ${app.applicationId.slice(0, 8)}`,
                )
                setMsg({ type: 'success', text: 'Đã mở cổng VNPay — đang chờ kết quả…' })
                const result = await openVnPayPopupAndWait(url, orderId)
                const notice = vnPayResultMessage(result)
                setMsg(notice)
                if (result === 'success') await refresh()
              } catch (err) {
                setMsg({ type: 'error', text: formatError(err) })
              } finally {
                setActing('')
              }
            }}
          >
            {acting === 'pay' ? 'Đang chờ thanh toán…' : 'Đặt cọc / Tiếp tục VNPay'}
          </Button>
        )}
        {role === 'Applicant' && app.applicationStatus === 'DEPOSIT_PAID' && (
          <Button variant="outline" onClick={() => navigate('payments')}>
            Xem lịch sử thanh toán
          </Button>
        )}
        {role === 'Applicant' && !['APPROVED', 'APPROVED_BY_TIMEOUT', 'DEPOSIT_PAID', 'CONTRACT_SIGNED', 'CONTRACT_PENDING', 'REJECTED', 'CANCELED', 'EXPIRED', 'LOTTERY_LOST'].includes(app.applicationStatus) && (
          <Button variant="outline" className="text-red-600" disabled={acting === 'cancel'} onClick={() => setWithdrawOpen(true)}>
            Rút hồ sơ
          </Button>
        )}
        {role === 'Housing Developer' && ['SUBMITTED', 'NEED_MORE_DOCUMENTS'].includes(app.applicationStatus) && (
          <Button variant="accent" disabled={acting === 'assign'} onClick={async () => {
            if (acting) return
            setActing('assign')
            try {
              await housingApplicationsApi.assign(app.applicationId)
              await refresh()
              setMsg({ type: 'success', text: 'Đã nhận hồ sơ.' })
            } catch (err) {
              setMsg({ type: 'error', text: formatError(err) })
            } finally {
              setActing('')
            }
          }}>{acting === 'assign' ? 'Đang nhận…' : 'Nhận hồ sơ thẩm định'}</Button>
        )}
        {role === 'Housing Developer' && app.applicationStatus === 'REVIEWING' && (
          <>
            <Button variant="outline" className="border-amber-400 text-amber-700" disabled={!!acting} onClick={() => void review('REQUEST_MORE_DOCUMENTS', true)}>🟡 Yêu cầu bổ sung</Button>
            <Button variant="outline" className="border-rose-400 text-rose-700" disabled={!!acting} onClick={() => void review('REJECT', true)}>🔴 Từ chối</Button>
            <Button variant="accent" disabled={acting === 'submit-sxd'} onClick={() => void submitToSxd([app.applicationId])}>
              {acting === 'submit-sxd' ? 'Đang gửi…' : '🟢 Đạt sơ duyệt → Gửi Sở'}
            </Button>
          </>
        )}
        {role === 'Department Of Construction' && app.applicationStatus === 'PENDING_SXD_REVIEW' && (
          <>
            <Button variant="accent" disabled={!!acting} onClick={() => void review('APPROVE')}>Phê duyệt</Button>
            <Button variant="outline" disabled={!!acting} onClick={() => void review('REJECT', true)}>Từ chối</Button>
          </>
        )}
      </div>

      {(app.reviewHistories ?? []).length > 0 && (
        <div className="glass-card p-4">
          <h3 className="mb-2 font-semibold">Lịch sử xét duyệt</h3>
          <ul className="space-y-2 text-sm">
            {app.reviewHistories!.map((h, i) => (
              <li key={i}>
                <strong>{labelApplicationStatus(h.oldStatus)} → {labelApplicationStatus(h.newStatus)}</strong>
                <span className="text-slate-500 dark:text-slate-400"> · {h.changedByFullName} · {new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                {h.note && <p className="text-slate-600 dark:text-slate-300">{h.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}

      <Modal
        open={withdrawOpen}
        onClose={() => { if (acting !== 'cancel') setWithdrawOpen(false) }}
        title="Rút hồ sơ đã nộp"
        description="Hành động này không thể hoàn tác. Vui lòng nêu rõ lý do."
      >
        {msg?.type === 'error' && (
          <Alert variant="error" className="mb-3">{msg.text}</Alert>
        )}
        <FormField label="Lý do rút hồ sơ *" htmlFor="withdraw-reason">
          <Textarea
            id="withdraw-reason"
            rows={3}
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Ví dụ: Không còn nhu cầu mua nữa"
            disabled={acting === 'cancel'}
          />
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" disabled={acting === 'cancel'} onClick={() => setWithdrawOpen(false)}>Huỷ</Button>
          <Button variant="accent" className="bg-red-600 hover:bg-red-700" disabled={acting === 'cancel'} onClick={() => void confirmWithdraw()}>
            {acting === 'cancel' ? 'Đang rút…' : 'Xác nhận rút hồ sơ'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title="Phiếu tiếp nhận hồ sơ"
        description="Bản xem trước để in gửi người dân."
        size="lg"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm dark:border-slate-700 dark:bg-slate-900 print:border-0">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Phiếu tiếp nhận hồ sơ NOXH</p>
          <h4 className="mt-2 text-center text-lg font-bold">{app.projectName}</h4>
          <div className="mt-4 space-y-2">
            <p><strong>Mã tiếp nhận:</strong> <span className="font-mono">{app.applicationId}</span></p>
            <p><strong>Người nộp:</strong> {app.fullName}</p>
            <p><strong>CCCD:</strong> {app.citizenId}</p>
            <p><strong>Thời điểm:</strong> {new Date(app.submittedAt || app.updatedAt || app.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Trạng thái:</strong> {labelApplicationStatus(app.applicationStatus)}</p>
          </div>
          {app.receiptUrl ? (
            <a href={app.receiptUrl} target="_blank" rel="noopener" className="mt-4 inline-block font-semibold text-blue-600 hover:underline">
              Mở file PDF phiếu tiếp nhận
            </a>
          ) : (
            <p className="mt-4 text-xs text-slate-500">PDF phiếu sẽ hiển thị khi hệ thống đã sinh `receiptUrl`.</p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReceiptOpen(false)}>Đóng</Button>
          <Button variant="accent" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> In
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function ApplicationDetailPage() {
  const appId = sessionStorage.getItem('applicationId')
  return (
    <div>
      <PageHeader routeId="application-detail" />
      <PageCard className="p-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('applications')}>← Danh sách hồ sơ</Button>
        {!appId ? <Alert variant="error">Không tìm thấy hồ sơ. Quay lại danh sách.</Alert> : <ApplicationDetailInner appId={appId} />}
      </PageCard>
    </div>
  )
}
