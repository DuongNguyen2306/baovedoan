import { request } from './http'
import type { ApiResult } from '../types'

/**
 * Module API cho Lottery (Bốc thăm nhà ở xã hội).
 *
 * BE cung cấp các endpoint dạng project-based (không có phiên riêng):
 *  - POST /api/projects/{projectId}/lottery/schedule          : CĐT lên lịch
 *  - POST /api/projects/{projectId}/lottery/schedule/approve  : Sở phê duyệt lịch
 *  - GET  /api/projects/{projectId}/lottery/schedule          : Public xem lịch
 *  - GET  /api/projects/{projectId}/lottery/eligible-participants : DS đủ điều kiện
 *  - POST /api/projects/{projectId}/lottery/draw-unit         : Applicant bốc realtime
 *  - POST /api/projects/{projectId}/lottery/run               : CĐT chạy bốc thăm hàng loạt
 *  - GET  /api/projects/{projectId}/lottery/result            : Xem kết quả mới nhất
 */

export type LotteryScheduleStatus =
  | 'NOT_SCHEDULED'
  | 'SCHEDULED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'RUNNING'
  | 'FINISHED'

export interface LotteryScheduleDto {
  projectId: string
  projectName?: string
  scheduledAt?: string | null
  totalUnits?: number | null
  status: LotteryScheduleStatus | string
  approvedAt?: string | null
  approvedBy?: string | null
  notes?: string | null
}

export interface LotteryEligibleEntry {
  applicationId: string
  applicantName: string
  citizenId: string
  priorityScore?: number
  lotteryResult?: string | null
  slotCode?: string | null
}

export interface LotteryResultDto {
  projectId: string
  projectName?: string
  totalUnits?: number
  runAt?: string | null
  winners: LotteryEligibleEntry[]
  losers?: LotteryEligibleEntry[]
  allEntries?: LotteryEligibleEntry[]
  notes?: string | null
}

export interface ScheduleLotteryInput {
  scheduledAt: string
  totalUnits?: number
  notes?: string
}

export const lotteryApi = {
  schedule(projectId: string, body: ScheduleLotteryInput) {
    return request<ApiResult>(
      `/api/projects/${projectId}/lottery/schedule`,
      { method: 'POST', body: JSON.stringify(body), auth: true },
    )
  },

  approveSchedule(projectId: string) {
    return request<ApiResult>(
      `/api/projects/${projectId}/lottery/schedule/approve`,
      { method: 'POST', auth: true },
    )
  },

  getSchedule(projectId: string) {
    return request<LotteryScheduleDto>(
      `/api/projects/${projectId}/lottery/schedule`,
      { auth: false },
    )
  },

  getEligibleParticipants(projectId: string) {
    return request<LotteryEligibleEntry[]>(
      `/api/projects/${projectId}/lottery/eligible-participants`,
      { auth: true },
    )
  },

  drawUnit(projectId: string) {
    return request<ApiResult>(
      `/api/projects/${projectId}/lottery/draw-unit`,
      { method: 'POST', auth: true },
    )
  },

  runLottery(projectId: string, totalUnits?: number) {
    return request<LotteryResultDto>(
      `/api/projects/${projectId}/lottery/run`,
      {
        method: 'POST',
        body: JSON.stringify(totalUnits != null ? { totalUnits } : {}),
        auth: true,
      },
    )
  },

  getResult(projectId: string) {
    return request<LotteryResultDto>(
      `/api/projects/${projectId}/lottery/result`,
      { auth: true },
    )
  },
}

export const LOTTERY_STATUS_LABEL: Record<string, string> = {
  NOT_SCHEDULED: 'Chưa lên lịch',
  SCHEDULED: 'Đã lên lịch',
  AWAITING_APPROVAL: 'Chờ Sở phê duyệt',
  APPROVED: 'Đã phê duyệt',
  RUNNING: 'Đang chạy',
  FINISHED: 'Đã có kết quả',
  Published: 'Đã công bố',
}

export const LOTTERY_STATUS_TONE: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'secondary'
> = {
  NOT_SCHEDULED: 'secondary',
  SCHEDULED: 'warning',
  AWAITING_APPROVAL: 'warning',
  APPROVED: 'default',
  RUNNING: 'warning',
  FINISHED: 'success',
  Published: 'success',
}

export function parseLotteryResult(data: unknown): LotteryResultDto | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const nested = o.data ?? o.Data
  if (nested && typeof nested === 'object') return nested as LotteryResultDto
  return data as LotteryResultDto
}

export function parseLotterySchedule(data: unknown): LotteryScheduleDto | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const nested = o.data ?? o.Data
  if (nested && typeof nested === 'object') return nested as LotteryScheduleDto
  return data as LotteryScheduleDto
}

export function parseEligibleList(data: unknown): LotteryEligibleEntry[] {
  if (Array.isArray(data)) return data as LotteryEligibleEntry[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    const items = o.items ?? o.Items ?? o.data ?? o.Data
    if (Array.isArray(items)) return items as LotteryEligibleEntry[]
  }
  return []
}

// Giữ alias cũ để không phải sửa App.tsx hay các page khác có import
export const parseLotterySession = parseLotteryResult
export const parseLotterySessions = parseEligibleList
export type LotterySessionDto = LotteryResultDto
export type LotterySessionStatus = LotteryScheduleStatus | string
