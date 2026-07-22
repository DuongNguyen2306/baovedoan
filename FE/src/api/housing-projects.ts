import { request } from './http'
import type { ApiResult, CreateHousingProjectRequestDto } from '../types'

export interface HousingProjectFilter {
  pageIndex?: number
  pageSize?: number
  search?: string
  province?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  statusId?: string
}

function buildQuery(params?: HousingProjectFilter): string {
  const qs = new URLSearchParams()
  qs.set('pageIndex', String(params?.pageIndex ?? 1))
  qs.set('pageSize', String(params?.pageSize ?? 100))
  if (params?.search) qs.set('search', params.search)
  if (params?.province) qs.set('province', params.province)
  if (params?.district) qs.set('district', params.district)
  if (params?.minPrice != null) qs.set('minPrice', String(params.minPrice))
  if (params?.maxPrice != null) qs.set('maxPrice', String(params.maxPrice))
  if (params?.minArea != null) qs.set('minArea', String(params.minArea))
  if (params?.maxArea != null) qs.set('maxArea', String(params.maxArea))
  if (params?.statusId) qs.set('statusId', params.statusId)
  return qs.toString()
}

function toFormData(body: CreateHousingProjectRequestDto): FormData {
  const fd = new FormData()
  fd.append('ProjectName', body.projectName)
  fd.append('Description', body.description)
  fd.append('Province', body.province)
  fd.append('District', body.district)
  if (body.street) fd.append('Street', body.street)
  if (body.ward) fd.append('Ward', body.ward)
  fd.append('Address', body.address ?? '')
  fd.append('MinPrice', String(body.minPrice))
  fd.append('MaxPrice', String(body.maxPrice))
  fd.append('MinArea', String(body.minArea))
  fd.append('MaxArea', String(body.maxArea))
  fd.append('AvailableUnits', String(body.availableUnits))
  if (body.decisionNumber) fd.append('DecisionNumber', body.decisionNumber)
  if (body.approvalDate) fd.append('ApprovalDate', body.approvalDate)
  if (body.isConfirmed !== undefined) fd.append('IsConfirmed', String(body.isConfirmed))
  if (body.depositAmount !== undefined) fd.append('DepositAmount', String(body.depositAmount))
  if (body.lotteryDate) fd.append('LotteryDate', body.lotteryDate)
  if (body.lotteryLocation) fd.append('LotteryLocation', body.lotteryLocation)
  if (body.applicationOpenDate) fd.append('ApplicationOpenDate', body.applicationOpenDate)
  if (body.applicationCloseDate) fd.append('ApplicationCloseDate', body.applicationCloseDate)
  fd.append('HousingProjectStatusId', body.housingProjectStatusId)
  if (body.thumbnailUrl) fd.append('ThumbnailUrl', body.thumbnailUrl)
  if (body.thumbnailFile) fd.append('ThumbnailFile', body.thumbnailFile)
  if (body.imagesFiles) {
    for (const file of body.imagesFiles) fd.append('ImageFiles', file)
  }
  return fd
}

export const housingProjectsApi = {
  list: (params?: HousingProjectFilter) =>
    request<ApiResult>(`/api/HousingProjects?${buildQuery(params)}`),

  create: (body: CreateHousingProjectRequestDto) =>
    request<ApiResult>('/api/HousingProjects', {
      method: 'POST',
      body: toFormData(body),
      auth: true,
    }),

  getById: (id: string) =>
    request<ApiResult>(`/api/HousingProjects/${id}`),

  update: (id: string, body: CreateHousingProjectRequestDto) =>
    request<ApiResult>(`/api/HousingProjects/${id}`, {
      method: 'PUT',
      body: toFormData(body),
      auth: true,
    }),

  delete: (id: string) =>
    request<ApiResult>(`/api/HousingProjects/${id}`, {
      method: 'DELETE',
      auth: true,
    }),

  getEvaluation: (id: string) =>
    request<ApiResult>(`/api/HousingProjects/${id}/application-evaluation`, { auth: true }),

  executeDeveloperDecision: (id: string, body: DeveloperWorkflowDecisionRequestDto) =>
    request<ApiResult>(`/api/HousingProjects/${id}/developer-decision`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    }),
}

export interface DeveloperWorkflowDecisionRequestDto {
  /** e.g. APPROVE_ALL, RUN_LOTTERY, REJECT, COMPLETE */
  decision: string
  /** Danh sách applicationId (cho REJECT/COMPLETE) */
  applicationIds?: string[]
  /** Override tổng số căn (cho RUN_LOTTERY) */
  totalUnits?: number
  notes?: string
}
