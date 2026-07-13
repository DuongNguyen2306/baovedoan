import { request } from './http'
import type { ApiResult } from '../types'

export interface UploadedMedia {
  url: string
}

export const mediaApi = {
  uploadImage: (file: File) => {
    const fd = new FormData()
    fd.append('upload', file)
    return request<ApiResult>('/api/Media/upload', {
      method: 'POST',
      body: fd,
      auth: true,
    }).then((data) => {
      const url = extractMediaUrl(data)
      if (!url) throw new Error('Phản hồi upload không chứa URL ảnh.')
      return { url } satisfies UploadedMedia
    })
  },
}

function extractMediaUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const candidates = [o.url, o.Url, (o.data as Record<string, unknown> | undefined)?.url]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  return null
}