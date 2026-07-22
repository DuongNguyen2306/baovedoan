import { request } from './http'
import type { ApiResult } from '../types'

/**
 * Module API cho Hậu kiểm (Audit) — sau danh sách chính thức.
 *
 * BE không có /api/audit-records riêng. Hậu kiểm của Sở Xây dựng
 * được ghi nhận thông qua Announcement có announcementType = 'AUDIT'.
 *
 * Mapping:
 *  - GET  /api/announcements/management?type=AUDIT            : Sở/Admin xem DS hậu kiểm
 *  - GET  /api/announcements?type=AUDIT                       : Public xem DS hậu kiểm
 *  - GET  /api/announcements/{id}                             : Chi tiết
 *  - POST /api/announcements                                   : Tạo mới (Sở/Admin)
 *  - PUT  /api/announcements/{id}                              : Cập nhật
 *  - DELETE /api/announcements/{id}                            : Xoá
 */

export type AuditStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'FLAGGED'

export interface AuditCheck {
  field: string
  status: 'OK' | 'WARN' | 'FAIL'
  note?: string
}

export interface AuditRecord {
  id: string
  title: string
  content: string
  announcementType: string
  legalDocumentNumber?: string | null
  effectiveDate?: string | null
  expirationDate?: string | null
  projectId?: string | null
  projectName?: string | null
  isPinned?: boolean
  status: string
  createdBy?: string | null
  createdByName?: string | null
  createdAt: string
  updatedAt?: string | null
  /** Phân tích ngầm từ content (nếu có JSON `checks:` ở đầu content) */
  checks?: AuditCheck[]
  summary?: string
}

export interface CreateAuditInput {
  title: string
  content: string
  projectId?: string | null
  projectName?: string | null
  legalDocumentNumber?: string | null
  effectiveDate?: string | null
  expirationDate?: string | null
  isPinned?: boolean
  status?: string
  announcementType?: string
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

function pickItem(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const nested = o.data ?? o.Data
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>
  return o
}

function extractChecks(content?: string | null): AuditCheck[] | undefined {
  if (!content) return undefined
  // Định dạng JSON-in-content: `checks:[{...}]|summary:...|rest content`
  const m = content.match(/^checks:(\[.*?\])(?:\|summary:(.*?))?(?:\||$)/s)
  if (!m) return undefined
  try {
    return JSON.parse(m[1]) as AuditCheck[]
  } catch {
    return undefined
  }
}

export function parseAuditRecords(data: unknown): AuditRecord[] {
  return pickArray(data).map((it) => {
    const x = (it as Record<string, unknown>) ?? {}
    const content = (x.content ?? x.Content) as string | undefined
    const checks = extractChecks(content)
    return {
      id: String(x.id ?? x.Id ?? ''),
      title: String(x.title ?? x.Title ?? ''),
      content: content ?? '',
      announcementType: String(x.announcementType ?? x.AnnouncementType ?? 'AUDIT'),
      legalDocumentNumber: (x.legalDocumentNumber ?? x.LegalDocumentNumber) as string | null | undefined,
      effectiveDate: (x.effectiveDate ?? x.EffectiveDate) as string | null | undefined,
      expirationDate: (x.expirationDate ?? x.ExpirationDate) as string | null | undefined,
      projectId: (x.projectId ?? x.ProjectId) as string | null | undefined,
      projectName: (x.projectName ?? x.ProjectName) as string | null | undefined,
      isPinned: Boolean(x.isPinned ?? x.IsPinned),
      status: String(x.status ?? x.Status ?? 'PUBLISHED'),
      createdBy: (x.createdBy ?? x.CreatedBy) as string | null | undefined,
      createdByName: (x.createdByName ?? x.CreatedByName) as string | null | undefined,
      createdAt: String(x.createdAt ?? x.CreatedAt ?? ''),
      updatedAt: (x.updatedAt ?? x.UpdatedAt) as string | null | undefined,
      checks,
    }
  })
}

export function parseAuditRecord(data: unknown): AuditRecord | null {
  const o = pickItem(data)
  if (!o) return null
  const content = (o.content ?? o.Content) as string | undefined
  const checks = extractChecks(content)
  return {
    id: String(o.id ?? o.Id ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    content: content ?? '',
    announcementType: String(o.announcementType ?? o.AnnouncementType ?? 'AUDIT'),
    legalDocumentNumber: (o.legalDocumentNumber ?? o.LegalDocumentNumber) as string | null | undefined,
    effectiveDate: (o.effectiveDate ?? o.EffectiveDate) as string | null | undefined,
    expirationDate: (o.expirationDate ?? o.ExpirationDate) as string | null | undefined,
    projectId: (o.projectId ?? o.ProjectId) as string | null | undefined,
    projectName: (o.projectName ?? o.ProjectName) as string | null | undefined,
    isPinned: Boolean(o.isPinned ?? o.IsPinned),
    status: String(o.status ?? o.Status ?? 'PUBLISHED'),
    createdBy: (o.createdBy ?? o.CreatedBy) as string | null | undefined,
    createdByName: (o.createdByName ?? o.CreatedByName) as string | null | undefined,
    createdAt: String(o.createdAt ?? o.CreatedAt ?? ''),
    updatedAt: (o.updatedAt ?? o.UpdatedAt) as string | null | undefined,
    checks,
  }
}

export const auditApi = {
  list() {
    return request<ApiResult>('/api/announcements/management', { auth: true })
  },

  listPublic(type = 'AUDIT') {
    return request<ApiResult>(`/api/announcements?type=${encodeURIComponent(type)}`)
  },

  getById(id: string) {
    return request<ApiResult>(`/api/announcements/${id}`, { auth: true })
  },

  create(input: CreateAuditInput) {
    const body: Record<string, unknown> = {
      title: input.title,
      content: input.content,
      announcementType: input.announcementType ?? 'AUDIT',
    }
    if (input.projectId) body.projectId = input.projectId
    if (input.projectName) body.projectName = input.projectName
    if (input.legalDocumentNumber) body.legalDocumentNumber = input.legalDocumentNumber
    if (input.effectiveDate) body.effectiveDate = input.effectiveDate
    if (input.expirationDate) body.expirationDate = input.expirationDate
    if (input.isPinned != null) body.isPinned = input.isPinned
    if (input.status) body.status = input.status
    return request<ApiResult>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    })
  },

  saveChecks(id: string, _checks: AuditCheck[], summary: string) {
    // Gộp checks + summary vào content để BE lưu
    const content = `checks:${JSON.stringify(_checks)}|summary:${summary}`
    return request<ApiResult>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
      auth: true,
    })
  },

  approve(id: string, summary: string) {
    return request<ApiResult>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'PUBLISHED',
        content: `checks:[]|summary:${summary}`,
      }),
      auth: true,
    })
  },

  flag(id: string, reason: string) {
    return request<ApiResult>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'FLAGGED', content: `checks:[]|summary:${reason}` }),
      auth: true,
    })
  },

  reject(id: string, reason: string) {
    return request<ApiResult>(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ARCHIVED', content: `checks:[]|summary:${reason}` }),
      auth: true,
    })
  },

  remove(id: string) {
    return request<ApiResult>(`/api/announcements/${id}`, {
      method: 'DELETE',
      auth: true,
    })
  },
}

export const AUDIT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã công bố',
  ARCHIVED: 'Đã lưu trữ',
  FLAGGED: 'Cần xem xét',
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  APPROVED: 'Đạt',
  REJECTED: 'Không đạt',
}

export const AUDIT_STATUS_TONE: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  ARCHIVED: 'secondary',
  FLAGGED: 'warning',
  PENDING: 'secondary',
  IN_PROGRESS: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export const DEFAULT_CHECK_TEMPLATES: AuditCheck[] = [
  { field: 'CCCD hợp lệ', status: 'OK' },
  { field: 'Hộ khẩu thường trú', status: 'OK' },
  { field: 'Thu nhập trong ngưỡng', status: 'OK' },
  { field: 'Chưa sở hữu nhà ở', status: 'OK' },
  { field: 'Đủ giấy tờ theo quy định', status: 'OK' },
]
