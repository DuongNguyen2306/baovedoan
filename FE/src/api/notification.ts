import { request } from './http'
import type { ApiResult } from '../types'

export interface NotificationDto {
  notificationId: string
  title: string
  content: string
  notificationType: string
  isRead: boolean
  createdAt: string
}

export interface PagedNotificationResultDto {
  items: NotificationDto[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface UnreadCountResponse {
  success: boolean
  unreadCount: number
}

export function parsePagedNotifications(data: unknown): PagedNotificationResultDto {
  const empty: PagedNotificationResultDto = {
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  }
  if (!data || typeof data !== 'object') return empty
  const o = data as Record<string, unknown>

  // Backend có thể trả nhiều dạng:
  //   1) { success, data: { items, totalCount, ... } }
  //   2) { items, totalCount, ... } (không có wrapper)
  //   3) { Data: { Items, TotalCount, ... } } (PascalCase)
  const nested =
    (o.data as Record<string, unknown> | undefined) ??
    (o.Data as Record<string, unknown> | undefined) ??
    undefined

  const fromNested = (n: Record<string, unknown>): PagedNotificationResultDto => {
    const items = (n.items ?? n.Items ?? n.data ?? n.Data) as NotificationDto[] | undefined
    const safe = Array.isArray(items) ? items : []
    return {
      items: safe,
      totalCount: Number(n.totalCount ?? n.TotalCount ?? safe.length),
      page: Number(n.page ?? n.Page ?? 1),
      pageSize: Number(n.pageSize ?? n.PageSize ?? 20),
      totalPages: Number(n.totalPages ?? n.TotalPages ?? 1),
      hasNextPage: Boolean(n.hasNextPage ?? n.HasNextPage ?? false),
      hasPreviousPage: Boolean(n.hasPreviousPage ?? n.HasPreviousPage ?? false),
    }
  }

  if (nested && typeof nested === 'object') {
    const parsed = fromNested(nested)
    if (parsed.items.length > 0 || parsed.totalCount > 0) return parsed
  }
  // Fallback: thử đọc trực tiếp từ root
  const fromRoot = fromNested(o)
  return fromRoot.items.length > 0 || fromRoot.totalCount > 0 ? fromRoot : empty
}

export function parseUnreadCount(data: unknown): number {
  if (data == null) return 0
  if (typeof data === 'number') return data
  if (typeof data !== 'object') return 0
  const o = data as Record<string, unknown>

  const tryRead = (src: Record<string, unknown>): number | undefined => {
    const v = src.unreadCount ?? src.UnreadCount ?? src.count ?? src.Count
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isFinite(n) ? n : undefined
    }
    return undefined
  }

  // Dạng 1: trực tiếp ở root
  const root = tryRead(o)
  if (root !== undefined) return root

  // Dạng 2: { success, data: <number | object> }
  const nested = (o.data ?? o.Data) as Record<string, unknown> | undefined
  if (nested != null) {
    if (typeof nested === 'number') return nested
    if (typeof nested === 'object') {
      const v = tryRead(nested as Record<string, unknown>)
      if (v !== undefined) return v
    }
  }
  return 0
}

export const notificationApi = {
  getMy: (page = 1, pageSize = 20) =>
    request<ApiResult>(
      `/api/Notification/my?page=${page}&pageSize=${pageSize}`,
      { auth: true },
    ),

  getUnreadCount: () =>
    request<ApiResult>('/api/Notification/unread-count', { auth: true }),

  markAsRead: (id: string) =>
    request<ApiResult>(`/api/Notification/${id}/read`, {
      method: 'PUT',
      auth: true,
    }),

  markAllAsRead: () =>
    request<ApiResult>('/api/Notification/read-all', {
      method: 'PUT',
      auth: true,
    }),
}
