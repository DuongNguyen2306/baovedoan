import { useEffect, useState } from 'react'
import { FileText, PenLine, Download, Wallet } from 'lucide-react'
import {
  contractApi,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_TONE,
  INSTALLMENT_STATUS_LABEL,
  INSTALLMENT_STATUS_TONE,
  parseContractStatus,
  parseInstallments,
  summarizeInstallments,
  type ContractStatusDto,
  type PaymentInstallment,
  type ContractStatus,
} from '@/api/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { PageCard, PageHeader } from '@/components/layout/page-header'
import { navigate } from '@/hooks/useHashRoute'
import { formatError } from '@/lib/format-error'
import { getRole } from '@/router'
import { extractOrderId, extractPaymentUrl } from '@/api/payment'
import { housingApplicationsApi } from '@/api/housing-applications'
import { openVnPayPopupAndWait, vnPayResultMessage } from '@/lib/vnpay-popup'
import type { ApplicationSummaryDto } from '@/types'

function persistApplicationId(id: string) {
  if (id) sessionStorage.setItem('contractApplicationId', id)
  else sessionStorage.removeItem('contractApplicationId')
}

function readApplicationId(): string {
  return sessionStorage.getItem('contractApplicationId') ?? ''
}

function mapStatus(s: ContractStatusDto | null): ContractStatus {
  if (!s) return 'NOT_AVAILABLE'
  if (s.isSigned) return 'SIGNED'
  switch (s.applicationStatus) {
    case 'CONTRACT_SIGNED':
    case 'CONTRACTING':
    case 'PAID':
    case 'FINALIZED':
      return 'SIGNED'
    case 'PAYMENT_PENDING':
      return 'PAYMENT_PENDING'
    case 'PARTIALLY_PAID':
      return 'PARTIALLY_PAID'
    case 'CANCELED':
    case 'REJECTED':
      return 'CANCELED'
    default:
      return 'PENDING_SIGNATURE'
  }
}

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <Badge variant={CONTRACT_STATUS_TONE[status]}>{CONTRACT_STATUS_LABEL[status]}</Badge>
}

export function ContractsPage() {
  const role = getRole()
  const isApplicant = role === 'Applicant'
  const isDev = role === 'Housing Developer'
  const [applications, setApplications] = useState<ApplicationSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      let data: ApplicationSummaryDto[] = []
      if (isApplicant) {
        const res = await housingApplicationsApi.getMy({ pageIndex: 1, pageSize: 50 })
        data = Array.isArray((res as { items?: ApplicationSummaryDto[] }).items)
          ? (res as { items: ApplicationSummaryDto[] }).items
          : []
      } else if (isDev) {
        const res = await housingApplicationsApi.getDeveloperDashboard({ pageIndex: 1, pageSize: 50 })
        data = Array.isArray((res as { items?: ApplicationSummaryDto[] }).items)
          ? (res as { items: ApplicationSummaryDto[] }).items
          : []
      } else {
        const res = await housingApplicationsApi.getAll({ pageIndex: 1, pageSize: 50 })
        data = Array.isArray((res as { items?: ApplicationSummaryDto[] }).items)
          ? (res as { items: ApplicationSummaryDto[] }).items
          : []
      }
      // Hồ sơ từ chờ ký → đã ký → đã đặt cọc (và các trạng thái thanh toán tiếp theo)
      const eligible = data.filter((a) =>
        [
          'CONTRACT_PENDING',
          'CONTRACT_SIGNED',
          'DEPOSIT_PAID',
          'CONTRACTING',
          'PARTIALLY_PAID',
          'PAID',
          'FINALIZED',
          'FULLY_PAID',
        ].includes(a.applicationStatus),
      )
      setApplications(eligible)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [role])

  return (
    <div>
      <PageHeader routeId="contracts" />
      <PageCard className="p-6">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {loading ? 'Đang tải...' : `${applications.length} hồ sơ có hợp đồng (chờ ký / đã ký / đã TT Đợt 1)`}
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        {!loading && applications.length === 0 && (
          <Alert variant="info">
            Chưa có hồ sơ nào ở bước hợp đồng. Hồ sơ xuất hiện khi CĐT chốt suất hoặc trúng bốc thăm
            (<strong> chờ ký</strong> → ký → thanh toán Đợt 1).
          </Alert>
        )}
        <div className="grid gap-3">
          {applications.map((a) => (
            <button
              key={a.applicationId}
              type="button"
              className="glass-card flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left transition hover:ring-2 hover:ring-primary/20"
              onClick={() => {
                persistApplicationId(a.applicationId)
                navigate('contract-detail')
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h3 className="font-semibold">{a.applicantFullName}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Dự án: {a.projectName}
                </p>
                <p className="text-xs text-slate-400">
                  CCCD: {a.citizenId} · Trạng thái: {a.applicationStatus}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-emerald-500" />
            </button>
          ))}
        </div>
      </PageCard>
    </div>
  )
}

export function ContractCreatePage() {
  return (
    <div>
      <PageHeader routeId="contract-create" />
      <PageCard className="p-6">
        <Alert variant="info">
          <p className="font-semibold">Hợp đồng được tạo tự động từ hồ sơ trúng</p>
          <p className="mt-1 text-sm">
            Hệ thống sinh Hợp đồng mua bán nhà ở xã hội (Mẫu số 01 – TT 05/2024/TT-BXD)
            khi hồ sơ được chốt suất. Mở mục <strong>Hợp đồng</strong> và chọn hồ sơ để xem / ký.
          </p>
          <Button className="mt-3" variant="accent" onClick={() => navigate('contracts')}>
            Đi tới danh sách hợp đồng
          </Button>
        </Alert>
      </PageCard>
    </div>
  )
}

function InstallmentRow({
  inst,
  onPaid,
}: {
  inst: PaymentInstallment
  onPaid: () => void
}) {
  const [paying, setPaying] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const isOverdue = inst.status === 'UNPAID' && new Date(inst.dueDate) < new Date()
  const tone = INSTALLMENT_STATUS_TONE[inst.status]
  const role = getRole()
  const canPay = role === 'Applicant' && inst.status !== 'PAID'

  const handlePay = async () => {
    setPaying(true)
    setMsg(null)
    try {
      const res = await contractApi.payInstallment(inst.installmentId)
      const paymentUrl = extractPaymentUrl(res)
      const orderId = extractOrderId(res)
      if (paymentUrl && orderId) {
        setMsg({ type: 'success', text: 'Đã mở cổng VNPay — đang chờ kết quả…' })
        const result = await openVnPayPopupAndWait(paymentUrl, orderId)
        setMsg(vnPayResultMessage(result))
        if (result === 'success') onPaid()
        return
      }
      if (paymentUrl) {
        window.location.href = paymentUrl
        return
      }
      setMsg({ type: 'success', text: 'Đã tạo giao dịch thanh toán.' })
      onPaid()
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{inst.label || `Đợt ${inst.ordinal}`}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hạn: {new Date(inst.dueDate).toLocaleDateString('vi-VN')}
            {isOverdue && <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">⚠ Quá hạn</span>}
          </p>
          <p className="text-sm">
            {Number(inst.amount).toLocaleString('vi-VN')} VNĐ
            {inst.paidAmount != null && inst.paidAmount > 0 && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                · Đã đóng: {Number(inst.paidAmount).toLocaleString('vi-VN')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={tone}>{INSTALLMENT_STATUS_LABEL[inst.status]}</Badge>
          {canPay && (
            <Button variant="outline" size="sm" disabled={paying} onClick={() => void handlePay()}>
              {paying ? 'Đang xử lý...' : 'Thanh toán'}
            </Button>
          )}
        </div>
      </div>
      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'} className="mt-2">{msg.text}</Alert>}
    </div>
  )
}

export function ContractDetailPage() {
  const id = readApplicationId()
  const role = getRole()
  const [status, setStatus] = useState<ContractStatusDto | null>(null)
  const [installments, setInstallments] = useState<PaymentInstallment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const reload = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      try {
        const s = await contractApi.getStatus(id)
        setStatus(parseContractStatus(s))
      } catch {
        setStatus(null)
      }
      try {
        const i = await contractApi.getInstallments(id)
        setInstallments(parseInstallments(i))
      } catch {
        setInstallments([])
      }
    } catch (err) {
      setError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [id])

  const signContract = async () => {
    if (!id || busy) return
    setBusy(true)
    setMsg(null)
    try {
      await contractApi.sign(id)
      await reload()
      setMsg({ type: 'success', text: 'Đồng ý điều khoản hợp đồng thành công.' })
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy(false)
    }
  }

  if (!id) {
    return (
      <div>
        <PageHeader routeId="contract-detail" />
        <PageCard className="p-6">
          <Alert variant="error">Không tìm thấy hồ sơ. Vui lòng chọn từ danh sách hợp đồng.</Alert>
          <Button className="mt-3" variant="outline" onClick={() => navigate('contracts')}>
            ← Danh sách hợp đồng
          </Button>
        </PageCard>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <PageHeader routeId="contract-detail" />
        <PageCard className="p-6"><p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p></PageCard>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader routeId="contract-detail" />
        <PageCard className="p-6"><Alert variant="error">{error}</Alert></PageCard>
      </div>
    )
  }

  const derivedStatus = mapStatus(status)
  const { paid, remaining, progress } = summarizeInstallments(installments)
  const canSign = role === 'Applicant' && !status?.isSigned

  return (
    <div>
      <PageHeader routeId="contract-detail" />
      <PageCard className="space-y-6 p-6">
        <Button variant="ghost" className="mb-2" onClick={() => navigate('contracts')}>← Danh sách hợp đồng</Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Hồ sơ: {id.slice(0, 8)}…</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Trạng thái hồ sơ: {status?.applicationStatus ?? 'Không rõ'}
            </p>
            {status?.signedAt && (
              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                Đã ký: {new Date(status.signedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
          <ContractStatusBadge status={derivedStatus} />
        </div>

        {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}

        {/* Ký hợp đồng */}
        {canSign && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <h4 className="mb-2 font-semibold">Bạn cần đồng ý điều khoản hợp đồng mua bán nhà ở xã hội</h4>
            <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
              Bằng việc bấm «Đồng ý», bạn xác nhận đã đọc và đồng ý với các điều khoản mua bán nhà ở xã hội.
            </p>
            <Button variant="accent" disabled={busy} onClick={() => void signContract()}>
              <PenLine className="mr-1.5 h-4 w-4" />{busy ? 'Đang ký...' : 'Đồng ý điều khoản'}
            </Button>
          </div>
        )}

        {/* Tải PDF */}
        {status?.pdfUrl && (
          <a
            href={status.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
          >
            <Download className="h-4 w-4" /> Tải PDF hợp đồng
          </a>
        )}

        {/* Tiến độ thanh toán */}
        {installments.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Tiến độ thanh toán</h4>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Đã đóng: {Number(paid).toLocaleString('vi-VN')} VNĐ</span>
              <span className="font-medium">{progress}%</span>
              <span>Còn lại: {Number(remaining).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Lịch thanh toán */}
        {installments.length > 0 ? (
          <div>
            <h4 className="mb-3 font-semibold">Lịch thanh toán ({installments.length} đợt)</h4>
            <div className="space-y-2">
              {installments.map((inst) => (
                <InstallmentRow
                  key={inst.installmentId}
                  inst={inst}
                  onPaid={() => void reload()}
                />
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="info">
            Hồ sơ chưa có lịch thanh toán. Hệ thống sẽ tạo lịch sau khi hợp đồng được ký.
          </Alert>
        )}
      </PageCard>
    </div>
  )
}
