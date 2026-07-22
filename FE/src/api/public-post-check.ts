import { request } from './http'

/**
 * Public Post-check APIs (tra cứu công khai, không cần auth).
 *  - GET /api/public/post-check-list                       : DS hồ sơ công bố
 *  - GET /api/public/post-check-list/{applicationId}       : Chi tiết
 *  - GET /api/public/post-check-list/verify-citizen?citizenId=...
 *  - GET /api/public/post-check-list/stats                 : Thống kê
 */

export interface PublicPostCheckItem {
  applicationId: string
  fullName?: string
  citizenId?: string
  projectName?: string
  applicationStatus?: string
  slotCode?: string | null
  lotteryResult?: string | null
  finalDecisionDate?: string | null
}

export interface PublicPostCheckStats {
  totalApplications?: number
  approved?: number
  rejected?: number
  pending?: number
  totalProjects?: number
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

export const publicPostCheckApi = {
  list: () => request<unknown>('/api/public/post-check-list'),

  getById: (id: string) => request<unknown>(`/api/public/post-check-list/${id}`),

  verifyCitizen: (citizenId: string) =>
    request<unknown>(`/api/public/post-check-list/verify-citizen?citizenId=${encodeURIComponent(citizenId)}`),

  stats: () => request<unknown>('/api/public/post-check-list/stats'),
}

export function parsePublicPostCheckList(data: unknown): PublicPostCheckItem[] {
  return pickArray(data).map((it) => {
    const x = it as Record<string, unknown>
    return {
      applicationId: String(x.applicationId ?? x.ApplicationId ?? ''),
      fullName: (x.fullName ?? x.FullName) as string | undefined,
      citizenId: (x.citizenId ?? x.CitizenId) as string | undefined,
      projectName: (x.projectName ?? x.ProjectName) as string | undefined,
      applicationStatus: (x.applicationStatus ?? x.ApplicationStatus) as string | undefined,
      slotCode: (x.slotCode ?? x.SlotCode) as string | null | undefined,
      lotteryResult: (x.lotteryResult ?? x.LotteryResult) as string | null | undefined,
      finalDecisionDate: (x.finalDecisionDate ?? x.FinalDecisionDate) as string | null | undefined,
    }
  })
}

export function parsePublicPostCheckItem(data: unknown): PublicPostCheckItem | null {
  const o = pickItem(data)
  if (!o) return null
  return {
    applicationId: String(o.applicationId ?? o.ApplicationId ?? ''),
    fullName: (o.fullName ?? o.FullName) as string | undefined,
    citizenId: (o.citizenId ?? o.CitizenId) as string | undefined,
    projectName: (o.projectName ?? o.ProjectName) as string | undefined,
    applicationStatus: (o.applicationStatus ?? o.ApplicationStatus) as string | undefined,
    slotCode: (o.slotCode ?? o.SlotCode) as string | null | undefined,
    lotteryResult: (o.lotteryResult ?? o.LotteryResult) as string | null | undefined,
    finalDecisionDate: (o.finalDecisionDate ?? o.FinalDecisionDate) as string | null | undefined,
  }
}

export function parsePublicPostCheckStats(data: unknown): PublicPostCheckStats | null {
  const o = pickItem(data)
  if (!o) return null
  return {
    totalApplications: Number(o.totalApplications ?? o.TotalApplications ?? 0) || undefined,
    approved: Number(o.approved ?? o.Approved ?? 0) || undefined,
    rejected: Number(o.rejected ?? o.Rejected ?? 0) || undefined,
    pending: Number(o.pending ?? o.Pending ?? 0) || undefined,
    totalProjects: Number(o.totalProjects ?? o.TotalProjects ?? 0) || undefined,
  }
}
