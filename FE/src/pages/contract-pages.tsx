import { useEffect, useState } from 'react'
import { FileText, PenLine, Download, Wallet, Unlock, Hammer, HardHat, KeyRound, BookOpen } from 'lucide-react'
import {
  contractApi,
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_TONE,
  INSTALLMENT_STATUS_LABEL,
  INSTALLMENT_STATUS_TONE,
  parseContractStatus,
  parseInstallmentsEnvelope,
  summarizeInstallments,
  UNLOCK_PHASE_LABEL,
  UNLOCK_PHASE_ORDINAL,
  type ContractStatusDto,
  type PaymentInstallment,
  type ContractStatus,
  type UnlockPhaseTrigger,
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

function persistApplicationId(id: string, projectId?: string) {
  if (id) {
    sessionStorage.setItem('contractApplicationId', id)
    if (projectId) sessionStorage.setItem('contractProjectId', projectId)
  } else {
    sessionStorage.removeItem('contractApplicationId')
    sessionStorage.removeItem('contractProjectId')
  }
}

function readApplicationId(): string {
  return sessionStorage.getItem('contractApplicationId') ?? ''
}

function readProjectId(): string {
  return sessionStorage.getItem('contractProjectId') ?? ''
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
                persistApplicationId(a.applicationId, a.projectId)
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

function DepositCountdown({
  signedAt,
  paid,
  expired,
}: {
  signedAt: string | null | undefined
  paid: boolean
  expired?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (paid || expired || !signedAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [paid, expired, signedAt])

  if (paid) return null
  if (expired) {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
        ⛔ Đã hết hạn đặt cọc
      </span>
    )
  }
  if (!signedAt) return null

  const deadline = new Date(signedAt).getTime() + 168 * 60 * 60 * 1000 // 7 ngày = 168h (PAY.MD)
  const ms = deadline - now
  if (ms <= 0) {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
        ⛔ Đã hết hạn đặt cọc
      </span>
    )
  }
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const urgent = ms < 24 * 60 * 60 * 1000 // < 24h → vàng
  const critical = ms < 6 * 60 * 60 * 1000 // < 6h → đỏ
  const tone = critical
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
    : urgent
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
  return (
    <span
      className={`ml-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tone}`}
      title="Hạn 168h (7 ngày) kể từ khi ký hợp đồng"
    >
      ⏰ Còn {days > 0 ? `${days} ngày ` : ''}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')} để đặt cọc
    </span>
  )
}

/**
 * Thanh điều khiển của CĐT: mở (unlock) Đợt 3-6 theo tiến độ xây dựng.
 * Hiển thị sau khi người dân đã ký HĐ (signedAt có).
 * Quy tắc nghiệp vụ (PAY.MD):
 *   - Đợt trước phải PAID thì mới được mở đợt sau.
 *   - Đợt đã PAID/CANCELLED thì nút bị disable.
 */
function DeveloperUnlockBar({
  projectId,
  installments,
  onUnlocked,
}: {
  projectId: string
  installments: PaymentInstallment[]
  onUnlocked: () => void
}) {
  const [busy, setBusy] = useState<UnlockPhaseTrigger | ''>('')
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const phases: { trigger: UnlockPhaseTrigger; icon: typeof Hammer; ordinal: number }[] = [
    { trigger: 'CONSTRUCTION_ROUGH_FLOOR', icon: Hammer, ordinal: 3 },
    { trigger: 'ROOFING_COMPLETED', icon: HardHat, ordinal: 4 },
    { trigger: 'HANDOVER', icon: KeyRound, ordinal: 5 },
    { trigger: 'RED_BOOK_ISSUED', icon: BookOpen, ordinal: 6 },
  ]

  const isPrevPaid = (ordinal: number): boolean => {
    if (ordinal <= 1) return true // Đợt 3 cần Đợt 2 PAID; ordinal=3 → check ordinal=2
    const prev = installments.find((i) => i.ordinal === ordinal - 1)
    return !prev || prev.status === 'PAID'
  }
  const findInst = (ordinal: number) => installments.find((i) => i.ordinal === ordinal)

  const handleUnlock = async (trigger: UnlockPhaseTrigger) => {
    if (!projectId || busy) return
    const ordinal = UNLOCK_PHASE_ORDINAL[trigger]
    const inst = findInst(ordinal)
    if (inst?.status === 'PAID' || inst?.status === 'CANCELLED') return
    if (!isPrevPaid(ordinal)) {
      setMsg({ type: 'error', text: `Đợt ${ordinal - 1} chưa thanh toán — không thể mở Đợt ${ordinal}.` })
      return
    }
    setBusy(trigger)
    setMsg(null)
    try {
      await contractApi.unlockPhase(projectId, trigger)
      await onUnlocked()
      setMsg({ type: 'success', text: `Đã mở Đợt ${ordinal} (${UNLOCK_PHASE_LABEL[trigger]}).` })
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
      <div className="mb-2 flex items-center gap-2">
        <Unlock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <h4 className="font-semibold">Mở đợt thanh toán theo tiến độ (CĐT)</h4>
      </div>
      <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
        Bấm mở khi đến mốc tiến độ tương ứng. Đợt trước phải được người dân thanh toán trước.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map(({ trigger, icon: Icon, ordinal }) => {
          const inst = findInst(ordinal)
          const opened = !!inst // BE chỉ trả về khi unlock xong
          const paid = inst?.status === 'PAID'
          const cancelled = inst?.status === 'CANCELLED'
          const disabled = !projectId || paid || cancelled || !isPrevPaid(ordinal) || !!busy
          const label = `Đợt ${ordinal}`
          const sub = UNLOCK_PHASE_LABEL[trigger]
          return (
            <button
              key={trigger}
              type="button"
              disabled={disabled}
              onClick={() => void handleUnlock(trigger)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition ${
                paid
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                  : disabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/40'
                    : 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-900 dark:hover:bg-indigo-950/40'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span className="text-xs">{sub}</span>
              <span className="text-[11px]">
                {paid ? '✓ Đã thanh toán' : cancelled ? '✗ Đã hủy' : opened ? '⏳ Chờ thanh toán' : '🔒 Chưa mở'}
              </span>
            </button>
          )
        })}
      </div>
      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'} className="mt-3">{msg.text}</Alert>}
    </div>
  )
}

function InstallmentRow({
  inst,
  onPaid,
  signedAt,
}: {
  inst: PaymentInstallment
  onPaid: () => void
  signedAt?: string | null
}) {
  const [paying, setPaying] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const isOverdue = inst.status === 'UNPAID' && new Date(inst.dueDate) < new Date()
  const isDeposit = inst.ordinal === 1
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
          {isDeposit && (
            <DepositCountdown
              signedAt={signedAt}
              paid={inst.status === 'PAID'}
              expired={inst.status === 'CANCELLED' || inst.status === 'OVERDUE'}
            />
          )}
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
  const [officialPrice, setOfficialPrice] = useState<number | null>(null)
  const [housePrice, setHousePrice] = useState<number | null>(null)
  const [contractPrice, setContractPrice] = useState<number | null>(null)
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
        const env = parseInstallmentsEnvelope(i)
        setInstallments(env.installments)
        setOfficialPrice(env.officialPrice ?? null)
        setHousePrice(env.housePrice ?? null)
        setContractPrice(env.contractPrice ?? null)
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
  const projectId = readProjectId()
  const canDeveloperUnlock =
    role === 'Housing Developer' && !!projectId && !!status?.isSigned

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

        {/* CĐT: mở đợt 3-6 theo tiến độ */}
        {canDeveloperUnlock && (
          <DeveloperUnlockBar
            projectId={projectId}
            installments={installments}
            onUnlocked={() => void reload()}
          />
        )}

        {/* Tiến độ thanh toán (thanh bar) */}
        {installments.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold">Tiến độ thanh toán</h4>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Lịch thanh toán */}
        {installments.length > 0 ? (
          <div>
            <h4 className="mb-3 font-semibold">Lịch thanh toán ({installments.length} đợt)</h4>
            {/* Cảnh báo nếu sum(đợt) != contractPrice (BE bug) */}
            {(() => {
              const sumPhases = installments.reduce((s, i) => s + (i.amount || 0), 0)
              const ref =
                contractPrice != null
                  ? contractPrice
                  : housePrice != null
                  ? housePrice
                  : null
              if (ref == null) return null
              const diff = Math.abs(sumPhases - ref)
              const mismatch = diff > 1000 // bỏ qua sai số do làm tròn
              return mismatch ? (
                <Alert variant="warning" className="mb-3">
                  <div>
                    <p className="font-medium">
                      Số tiền lịch thanh toán không khớp giá nhà chính thức.
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Tổng 6 đợt: <b>{sumPhases.toLocaleString('vi-VN')}</b> VNĐ —
                      Giá nhà: <b>{ref.toLocaleString('vi-VN')}</b> VNĐ
                      (chênh {(sumPhases - ref > 0 ? '+' : '') + (sumPhases - ref).toLocaleString('vi-VN')} VNĐ).
                      Vui lòng báo CĐT/ban quản lý đối soát.
                    </p>
                  </div>
                </Alert>
              ) : null
            })()}
            {/* Tổng quan hợp đồng */}
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Giá nhà chính thức
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                  {(() => {
                    const ref =
                      contractPrice != null
                        ? contractPrice
                        : officialPrice != null
                        ? officialPrice
                        : housePrice != null
                        ? housePrice
                        : installments.reduce((s, i) => s + (i.amount || 0), 0)
                    return Number(ref || 0).toLocaleString('vi-VN') + ' VNĐ'
                  })()}
                </p>
                {(housePrice != null || contractPrice != null) && (
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {housePrice != null && (
                      <span>Giá niêm yết: {housePrice.toLocaleString('vi-VN')} · </span>
                    )}
                    {contractPrice != null && (
                      <span>Giá HĐ: {contractPrice.toLocaleString('vi-VN')}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Đã đóng</p>
                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {Number(paid).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Còn lại</p>
                <p className="mt-1 text-base font-bold text-amber-600 dark:text-amber-400">
                  {Number(remaining).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">Tiến độ</p>
                <p className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">
                  {progress}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {installments.map((inst) => (
                <InstallmentRow
                  key={inst.installmentId}
                  inst={inst}
                  signedAt={status?.signedAt ?? null}
                  onPaid={() => void reload()}
                />
              ))}
            </div>
          </div>
        ) : status?.isSigned ? (
          <Alert variant="warning">
            <div className="space-y-2">
              <p className="font-medium">
                Hợp đồng đã ký nhưng hệ thống chưa sinh lịch thanh toán.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Vui lòng liên hệ CĐT / Ban quản lý dự án để được tạo lịch 6 đợt.
                (Mã hồ sơ: <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{id.slice(0, 8)}…</code>)
              </p>
              <Button size="sm" variant="outline" onClick={() => void reload()}>
                Tải lại
              </Button>
            </div>
          </Alert>
        ) : (
          <Alert variant="info">
            Hồ sơ chưa có lịch thanh toán. Hệ thống sẽ tạo lịch sau khi hợp đồng được ký.
          </Alert>
        )}
      </PageCard>
    </div>
  )
}
