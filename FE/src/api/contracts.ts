import { request } from './http'
import type { ApiResult } from '../types'

/**
 * Module API cho Hợp đồng mua bán + Lịch thanh toán.
 *
 * BE thật cung cấp:
 *  - GET  /api/contract-sign/{applicationId}/status         : Trạng thái ký HĐ nguyên tắc
 *  - POST /api/contract-sign/{applicationId}/sign           : Applicant đồng ý ký
 *  - GET  /api/Payment/installments/{applicationId}         : Danh sách đợt thanh toán
 *  - POST /api/Payment/installments/{installmentId}/pay    : Tạo URL thanh toán đợt
 *  - GET  /api/Payment/download-contract/{applicationId}   : Tải PDF hợp đồng
 *
 * Hợp đồng mua bán thật tồn tại ở DB thông qua ApplicationDetail (status CONTRACT_SIGNED).
 */

export type ContractStatus =
  | 'NOT_AVAILABLE'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'PAYMENT_PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'FINALIZED'
  | 'CANCELED'

export interface ContractStatusDto {
  applicationId: string
  isSigned: boolean
  signedAt?: string | null
  pdfUrl?: string | null
  applicationStatus: string
}

export interface PaymentInstallment {
  installmentId: string
  applicationId: string
  ordinal: number
  label?: string | null
  amount: number
  dueDate: string
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL'
  paidAt?: string | null
  paidAmount?: number
  paymentOrderId?: string | null
  paymentUrl?: string | null
}

export interface ContractParty {
  id: string
  name: string
  role: 'BUYER' | 'DEVELOPER'
  signedAt?: string | null
  signatureUrl?: string | null
}

export interface ContractDto {
  applicationId: string
  applicationStatus: string
  isSigned: boolean
  signedAt?: string | null
  pdfUrl?: string | null
  installments: PaymentInstallment[]
}

export interface PaymentResponseDto {
  success?: boolean
  message?: string
  data?: {
    paymentUrl?: string
    orderId?: string
    amount?: number
  }
}

function pickArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const items = o.items ?? o.Items ?? o.data ?? o.Data
    if (Array.isArray(items)) return items
  }
  return []
}

export function parseInstallments(data: unknown): PaymentInstallment[] {
  const arr = pickArray(data)
  return arr.map((it) => {
    const x = it as Record<string, unknown>
    return {
      installmentId: String(x.installmentId ?? x.InstallmentId ?? ''),
      applicationId: String(x.applicationId ?? x.ApplicationId ?? ''),
      ordinal: Number(x.ordinal ?? x.Ordinal ?? 0),
      label: (x.label ?? x.Label) as string | null | undefined,
      amount: Number(x.amount ?? x.Amount ?? 0),
      dueDate: String(x.dueDate ?? x.DueDate ?? ''),
      status: (String(x.status ?? x.Status ?? 'UNPAID') as PaymentInstallment['status']),
      paidAt: (x.paidAt ?? x.PaidAt) as string | null | undefined,
      paidAmount: Number(x.paidAmount ?? x.PaidAmount ?? 0) || undefined,
      paymentOrderId: (x.paymentOrderId ?? x.PaymentOrderId) as string | null | undefined,
      paymentUrl: (x.paymentUrl ?? x.PaymentUrl) as string | null | undefined,
    }
  })
}

export function parseContractStatus(data: unknown): ContractStatusDto | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const nested = o.data ?? o.Data
  if (nested && typeof nested === 'object') return nested as ContractStatusDto
  return data as ContractStatusDto
}

export const contractApi = {
  getStatus(applicationId: string) {
    return request<ApiResult>(`/api/contract-sign/${applicationId}/status`, { auth: true })
  },

  sign(applicationId: string) {
    return request<ApiResult>(`/api/contract-sign/${applicationId}/sign`, {
      method: 'POST',
      auth: true,
    })
  },

  getInstallments(applicationId: string) {
    return request<ApiResult>(`/api/Payment/installments/${applicationId}`, { auth: true })
  },

  payInstallment(installmentId: string) {
    return request<PaymentResponseDto>(
      `/api/Payment/installments/${installmentId}/pay`,
      { method: 'POST', auth: true },
    )
  },

  downloadContract(applicationId: string) {
    return request<ApiResult>(`/api/Payment/download-contract/${applicationId}`, { auth: true })
  },
}

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  NOT_AVAILABLE: 'Chưa có hợp đồng',
  PENDING_SIGNATURE: 'Chờ ký',
  SIGNED: 'Đã ký',
  PAYMENT_PENDING: 'Chờ thanh toán',
  PARTIALLY_PAID: 'Thanh toán một phần',
  PAID: 'Đã thanh toán đủ',
  FINALIZED: 'Hoàn tất',
  CANCELED: 'Đã hủy',
}

export const CONTRACT_STATUS_TONE: Record<
  ContractStatus,
  'default' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  NOT_AVAILABLE: 'secondary',
  PENDING_SIGNATURE: 'warning',
  SIGNED: 'default',
  PAYMENT_PENDING: 'warning',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  FINALIZED: 'success',
  CANCELED: 'danger',
}

export const INSTALLMENT_STATUS_LABEL: Record<PaymentInstallment['status'], string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  PARTIAL: 'Thanh toán một phần',
}

export const INSTALLMENT_STATUS_TONE: Record<
  PaymentInstallment['status'],
  'default' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  UNPAID: 'secondary',
  PAID: 'success',
  OVERDUE: 'danger',
  PARTIAL: 'warning',
}

export function summarizeInstallments(items: PaymentInstallment[]): {
  paid: number
  remaining: number
  total: number
  paidCount: number
  totalCount: number
  progress: number
} {
  const total = items.reduce((s, i) => s + i.amount, 0)
  const paid = items.reduce(
    (s, i) => s + (i.paidAmount ?? (i.status === 'PAID' ? i.amount : 0)),
    0,
  )
  const paidCount = items.filter((i) => i.status === 'PAID').length
  return {
    paid,
    remaining: total - paid,
    total,
    paidCount,
    totalCount: items.length,
    progress: total > 0 ? Math.round((paid / total) * 100) : 0,
  }
}

// Aliases giữ tương thích với code cũ
export const summarizeContract = summarizeInstallments
export type { ContractDto as ContractLegacyDto }
export type { ContractStatus as ContractLegacyStatus }
export function parseContracts(data: unknown): ContractDto[] {
  if (!data) return []
  if (Array.isArray(data)) return data as ContractDto[]
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>
    const items = o.items ?? o.Items ?? o.data ?? o.Data
    if (Array.isArray(items)) return items as ContractDto[]
  }
  return []
}
export function parseContract(data: unknown): ContractDto | null {
  if (!data || typeof data !== 'object') return null
  return data as ContractDto
}
