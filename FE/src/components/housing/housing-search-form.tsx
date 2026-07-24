import { ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { housingProjectStatusesApi, parseStatuses } from '@/api/housing-project-statuses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  countActiveFilters,
  EMPTY_HOUSING_SEARCH,
  type HousingSearchFilter,
} from '@/lib/housing-search'
import { getDistrictsByProvince, VIETNAM_PROVINCES } from '@/lib/vietnam-locations'

interface HousingSearchFormProps {
  value: HousingSearchFilter
  onChange: (next: HousingSearchFilter) => void
  onSubmit: () => void
  loading?: boolean
  compact?: boolean
}

export function HousingSearchForm({ value, onChange, onSubmit, loading, compact }: HousingSearchFormProps) {
  const [statuses, setStatuses] = useState<{ id: string; label: string }[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    void housingProjectStatusesApi.list()
      .then((data) => setStatuses(parseStatuses(data).map((s) => ({ id: s.id, label: s.label }))))
      .catch(() => setStatuses([]))
  }, [])

  const districts = useMemo(() => getDistrictsByProvince(value.province), [value.province])
  const activeCount = countActiveFilters(value)
  const showAdvancedContent = showAdvanced || !compact

  const set = (patch: Partial<HousingSearchFilter>) => onChange({ ...value, ...patch })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Thanh tìm kiếm chính + lọc nhanh trên 1 row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Từ khóa */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 w-full border-slate-200 bg-slate-50 pl-10 pr-10 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Tìm tên dự án, địa chỉ..."
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit() } }}
          />
          {value.search && (
            <button
              type="button"
              onClick={() => set({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tỉnh */}
        <div className="w-full sm:w-48">
          <select
            className="input h-11 w-full border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            value={value.province}
            onChange={(e) => set({ province: e.target.value, district: '' })}
          >
            <option value="">Tất cả tỉnh/thành</option>
            {VIETNAM_PROVINCES.map((p) => (
              <option key={p.code} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Quận */}
        <div className="w-full sm:w-44">
          <select
            className="input h-11 w-full border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            value={value.district}
            disabled={!value.province}
            onChange={(e) => set({ district: e.target.value })}
          >
            <option value="">Quận/huyện</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Nút tìm + toggle */}
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant={showAdvanced ? 'accent' : 'outline'}
            size="sm"
            className="h-11 gap-1.5"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Lọc
            {activeCount > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
          </Button>
          <Button type="submit" variant="accent" disabled={loading} className="h-11 px-5">
            {loading ? '...' : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Bộ lọc nâng cao — ẩn/hiện */}
      {showAdvancedContent && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 dark:border-slate-800">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Giá từ (triệu)</label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              placeholder="VD: 500"
              value={value.minPriceMillion}
              onChange={(e) => set({ minPriceMillion: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Giá đến (triệu)</label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              placeholder="VD: 2000"
              value={value.maxPriceMillion}
              onChange={(e) => set({ maxPriceMillion: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Diện tích từ (m²)</label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              placeholder="VD: 45"
              value={value.minArea}
              onChange={(e) => set({ minArea: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Diện tích đến (m²)</label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              placeholder="VD: 90"
              value={value.maxArea}
              onChange={(e) => set({ maxArea: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Căn tối thiểu</label>
            <Input
              className="h-9 text-sm"
              type="number"
              min={0}
              placeholder="VD: 1"
              value={value.minAvailable}
              onChange={(e) => set({ minAvailable: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Trạng thái mở bán</label>
            <select
              className="input h-9 w-full text-sm"
              value={value.statusCode || value.statusId}
              onChange={(e) => {
                const v = e.target.value
                // Prefer statusCode for OPEN / Open_For_Registration; keep statusId for catalog ids
                if (v === 'OPEN' || v === 'UPCOMING' || v === 'CLOSED') {
                  set({ statusCode: v, statusId: '' })
                } else {
                  set({ statusId: v, statusCode: '' })
                }
              }}
            >
              <option value="">Tất cả</option>
              <option value="OPEN">Đang mở đăng ký (Open_For_Registration)</option>
              <option value="UPCOMING">Sắp mở</option>
              <option value="CLOSED">Đã đóng</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Xóa bộ lọc */}
      {activeCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {activeCount} bộ lọc đang áp dụng
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => onChange({ ...EMPTY_HOUSING_SEARCH })}
          >
            <X className="h-3 w-3" />
            Xóa hết
          </Button>
        </div>
      )}
    </div>
  )
}
