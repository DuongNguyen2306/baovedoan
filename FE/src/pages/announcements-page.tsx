import { useCallback, useEffect, useState } from 'react'
import { Pin, Paperclip } from 'lucide-react'
import {
  announcementsApi,
  parseAnnouncement,
  parsePagedAnnouncements,
  type AnnouncementDto,
} from '@/api/announcements'
import { GovHeroBanner } from '@/components/layout/gov-hero-banner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { formatError } from '@/lib/format-error'

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'OFFICIAL', label: 'Thông báo chính thức' },
  { value: 'LOTTERY', label: 'Lịch bốc thăm' },
  { value: 'PRICE_ADJUSTMENT', label: 'Điều chỉnh giá' },
  { value: 'GENERAL', label: 'Chung' },
]

function typeLabel(t: string) {
  return TYPE_OPTIONS.find((o) => o.value === t)?.label || t || 'Thông báo'
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<AnnouncementDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async (q?: { search?: string; type?: string }) => {
    setLoading(true)
    setError('')
    try {
      const data = await announcementsApi.getPublished({
        page: 1,
        pageSize: 30,
        search: q?.search || undefined,
        type: q?.type || undefined,
      })
      setItems(parsePagedAnnouncements(data).items)
    } catch (err) {
      setError(formatError(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const data = await announcementsApi.getById(id)
      const parsed = parseAnnouncement(data)
      setSelected(parsed)
    } catch (err) {
      setError(formatError(err))
    } finally {
      setDetailLoading(false)
    }
  }

  if (selected) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelected(null)}>← Danh sách thông báo</Button>
        {detailLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                {typeLabel(selected.announcementType)}
              </span>
              {selected.isPinned && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Pin className="h-3 w-3" /> Ghim
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selected.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {selected.createdByName}
              {selected.projectName ? ` · ${selected.projectName}` : ''}
              {' · '}
              {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : ''}
            </p>
            {selected.legalDocumentNumber && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Số văn bản: <strong>{selected.legalDocumentNumber}</strong>
              </p>
            )}
            <div
              className="prose prose-slate mt-6 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: selected.content }}
            />
            {selected.attachments.length > 0 && (
              <div className="mt-6 border-t pt-4 dark:border-slate-700">
                <h3 className="mb-2 text-sm font-semibold">Đính kèm</h3>
                <ul className="space-y-2">
                  {selected.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                      >
                        <Paperclip className="h-4 w-4" />
                        {a.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GovHeroBanner
        badge="Công khai"
        title="Thông báo từ Sở Xây dựng & Chủ đầu tư"
        subtitle="Lịch bốc thăm, điều chỉnh giá bán và các thông báo chính thức."
      />

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          void load({ search, type })
        }}
      >
        <Input
          placeholder="Tìm theo tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-56">
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>{o.label}</option>
          ))}
        </Select>
        <Button type="submit" variant="outline">Lọc</Button>
      </form>

      {loading && (
        <div className="grid gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {error && <Alert variant="error">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="Chưa có thông báo"
          description="Hiện chưa có bài viết thông báo công khai."
        />
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void openDetail(item.id)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:ring-2 hover:ring-blue-200 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <div className="flex items-center gap-2">
                {item.isPinned && <Pin className="h-4 w-4 text-amber-500" />}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {typeLabel(item.announcementType)}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {item.createdByName}
              {item.projectName ? ` · ${item.projectName}` : ''}
              {' · '}
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
