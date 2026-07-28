import { request } from './http'
import type {
  ApiResult,
  ApplicationDetailDto,
  ApplicationFilterDto,
  CreateApplicationDto,
  PagedResultDto,
  ApplicationSummaryDto,
  ReviewRequestDto,
} from '../types'

function buildQuery(filter: ApplicationFilterDto = {}): string {
  const params = new URLSearchParams()
  if (filter.pageIndex != null) params.set('pageIndex', String(filter.pageIndex))
  if (filter.pageSize != null) params.set('pageSize', String(filter.pageSize))
  if (filter.status) params.set('status', filter.status)
  if (filter.projectId) params.set('projectId', filter.projectId)
  if (filter.search) params.set('search', filter.search)
  if (filter.submittedFrom) params.set('submittedFrom', filter.submittedFrom)
  if (filter.submittedTo) params.set('submittedTo', filter.submittedTo)
  const q = params.toString()
  return q ? `?${q}` : ''
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

/** Normalize list/dashboard items so web always gets applicantFullName + citizenId. */
export function parsePagedApplications(data: unknown): ApplicationSummaryDto[] {
  if (!data || typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const items = o.items ?? o.Items
  if (!Array.isArray(items)) return []
  return items.map((raw) => {
    const x = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const fullName =
      str(x.applicantFullName) ||
      str(x.ApplicantFullName) ||
      str(x.applicantName) ||
      str(x.ApplicantName) ||
      str(x.fullName) ||
      str(x.FullName)
    return {
      ...(x as unknown as ApplicationSummaryDto),
      applicationId: str(x.applicationId ?? x.ApplicationId),
      projectId: str(x.projectId ?? x.ProjectId),
      projectName: str(x.projectName ?? x.ProjectName),
      applicantId: str(x.applicantId ?? x.ApplicantId),
      applicantFullName: fullName,
      citizenId: str(x.citizenId ?? x.CitizenId),
      applicationStatus: str(x.applicationStatus ?? x.ApplicationStatus),
      createdAt: str(x.createdAt ?? x.CreatedAt),
      submittedAt: str(x.submittedAt ?? x.SubmittedAt),
      updatedAt: (x.updatedAt ?? x.UpdatedAt) as string | null | undefined,
      housingStatus: str(x.housingStatus ?? x.HousingStatus),
      estimatedMonthlyIncome: Number(x.estimatedMonthlyIncome ?? x.EstimatedMonthlyIncome ?? 0),
      documentCount: Number(x.documentCount ?? x.DocumentCount ?? 0),
      receiptUrl: (x.receiptUrl ?? x.ReceiptUrl) as string | null | undefined,
      isViolation: Boolean(x.isViolation ?? x.IsViolation ?? false),
      violationReason: (x.violationReason ?? x.ViolationReason) as string | null | undefined,
    }
  })
}

export function parseApplicationDetail(data: unknown): ApplicationDetailDto | null {
  if (!data || typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  const nested = root.data ?? root.Data
  const o =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : root
  const app = o as unknown as ApplicationDetailDto
  // Normalize apartment / lottery fields (camelCase + PascalCase)
  const aptId = o.apartmentId ?? o.ApartmentId
  const aptName = o.apartmentUnitName ?? o.ApartmentUnitName
  const aptArea = o.apartmentArea ?? o.ApartmentArea
  const aptPrice = o.apartmentPrice ?? o.ApartmentPrice
  const aptStatus = o.apartmentStatus ?? o.ApartmentStatus
  const slot = o.slotCode ?? o.SlotCode
  const lottery = o.lotteryResult ?? o.LotteryResult
  return {
    ...app,
    applicationId: String(o.applicationId ?? o.ApplicationId ?? app.applicationId ?? ''),
    projectId: String(o.projectId ?? o.ProjectId ?? app.projectId ?? ''),
    applicationStatus: String(o.applicationStatus ?? o.ApplicationStatus ?? app.applicationStatus ?? ''),
    slotCode: slot != null ? String(slot) : app.slotCode,
    lotteryResult: lottery != null ? String(lottery) : app.lotteryResult,
    apartmentId: aptId != null && String(aptId) ? String(aptId) : null,
    apartmentUnitName: aptName != null ? String(aptName) : null,
    apartmentArea: aptArea != null && aptArea !== '' ? Number(aptArea) : null,
    apartmentPrice: aptPrice != null && aptPrice !== '' ? Number(aptPrice) : null,
    apartmentStatus: aptStatus != null ? String(aptStatus) : null,
  }
}

export const housingApplicationsApi = {
  activeCheck: () =>
    request<{ hasActiveApplication?: boolean; HasActiveApplication?: boolean; message?: string }>(
      '/api/housing-applications/active-check',
      { auth: true },
    ),

  update: (id: string, body: Omit<CreateApplicationDto, 'projectId'>) =>
    request<ApiResult>(`/api/housing-applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
    }),

  create: (body: CreateApplicationDto) =>
    request<ApiResult>('/api/housing-applications', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),

  getMy: (filter?: ApplicationFilterDto) =>
    request<PagedResultDto<ApplicationSummaryDto>>(
      `/api/housing-applications/my${buildQuery(filter)}`,
      { auth: true },
    ),

  getAll: (filter?: ApplicationFilterDto) =>
    request<PagedResultDto<ApplicationSummaryDto>>(
      `/api/housing-applications${buildQuery(filter)}`,
      { auth: true },
    ),

  getSxdDashboard: (filter?: ApplicationFilterDto) =>
    request<PagedResultDto<ApplicationSummaryDto>>(
      `/api/housing-applications/dashboard/sxd${buildQuery(filter)}`,
      { auth: true },
    ),

  getDeveloperDashboard: (filter?: ApplicationFilterDto) =>
    request<PagedResultDto<ApplicationSummaryDto>>(
      `/api/housing-applications/dashboard/developer${buildQuery(filter)}`,
      { auth: true },
    ),

  submitToDepartment: (applicationIds: string[]) =>
    request<ApiResult>('/api/housing-developer/submit-to-department', {
      method: 'POST',
      body: JSON.stringify({ applicationIds }),
      auth: true,
    }),

  developerReview: (id: string, body: ReviewRequestDto) =>
    request<ApiResult>(`/api/housing-applications/${id}/developer-review`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      auth: true,
    }),

  sxdReview: (id: string, body: ReviewRequestDto) =>
    request<ApiResult>(`/api/housing-applications/${id}/sxd-review`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      auth: true,
    }),

  cancel: (id: string, reason?: string) =>
    request<ApiResult>(`/api/housing-applications/${id}/cancel`, {
      method: 'PATCH',
      // BE: CancelApplicationRequestDto.CancelReason (bắt buộc)
      body: JSON.stringify({ cancelReason: reason?.trim() ?? '' }),
      auth: true,
    }),

  getById: (id: string) =>
    request<ApplicationDetailDto>(`/api/housing-applications/${id}`, { auth: true }),

  submit: (id: string) =>
    request<ApiResult>(`/api/housing-applications/${id}/submit`, {
      method: 'POST',
      auth: true,
    }),

  assign: (id: string) =>
    request<ApiResult>(`/api/housing-applications/${id}/assign`, {
      method: 'PATCH',
      auth: true,
    }),

  /** CĐT/SXD bàn giao căn cụ thể → sinh lịch thanh toán đợt */
  assignApartment: (id: string, apartmentId: string) =>
    request<ApiResult>(`/api/housing-applications/${id}/assign-apartment`, {
      method: 'POST',
      body: JSON.stringify({ apartmentId }),
      auth: true,
    }),

  voReview: (id: string, body: ReviewRequestDto) =>
    request<ApiResult>(`/api/housing-applications/${id}/vo-review`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),

  wmReview: (id: string, body: ReviewRequestDto) =>
    request<ApiResult>(`/api/housing-applications/${id}/wm-review`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),

  uploadDocument: (applicationId: string, documentType: string, file: File) => {
    const fd = new FormData()
    fd.append('DocumentType', documentType)
    fd.append('File', file)
    return request<ApiResult>(`/api/housing-applications/${applicationId}/documents`, {
      method: 'POST',
      body: fd,
      auth: true,
    })
  },

  deleteDocument: (applicationId: string, documentId: string) =>
    request<ApiResult>(`/api/housing-applications/${applicationId}/documents/${documentId}`, {
      method: 'DELETE',
      auth: true,
    }),
}
