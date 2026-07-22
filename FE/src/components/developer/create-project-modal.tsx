import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { housingProjectsApi } from '@/api/housing-projects'
import { housingProjectStatusesApi, parseStatuses } from '@/api/housing-project-statuses'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { VIETNAM_PROVINCES, getDistrictsByProvince } from '@/lib/vietnam-locations'
import { formatError } from '@/lib/format-error'
import { navigate } from '@/hooks/useHashRoute'
import type { CreateHousingProjectRequestDto } from '@/types'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void | Promise<void>
}

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statuses, setStatuses] = useState<{ id: string; label: string }[]>([])

  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [ward, setWard] = useState('')
  const [street, setStreet] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [availableUnits, setAvailableUnits] = useState('')
  const [decisionNumber, setDecisionNumber] = useState('')
  const [approvalDate, setApprovalDate] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [lotteryDate, setLotteryDate] = useState('')
  const [lotteryLocation, setLotteryLocation] = useState('')
  const [applicationOpenDate, setApplicationOpenDate] = useState('')
  const [applicationCloseDate, setApplicationCloseDate] = useState('')
  const [housingProjectStatusId, setHousingProjectStatusId] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [imagesFiles, setImagesFiles] = useState<File[]>([])

  useEffect(() => {
    if (!open) {
      setProjectName('')
      setDescription('')
      setProvince('')
      setDistrict('')
      setWard('')
      setStreet('')
      setMinPrice('')
      setMaxPrice('')
      setMinArea('')
      setMaxArea('')
      setAvailableUnits('')
      setDecisionNumber('')
      setApprovalDate('')
      setDepositAmount('')
      setLotteryDate('')
      setLotteryLocation('')
      setApplicationOpenDate('')
      setApplicationCloseDate('')
      setHousingProjectStatusId('')
      setIsConfirmed(false)
      setThumbnailFile(null)
      setImagesFiles([])
      setError('')
      return
    }
    void housingProjectStatusesApi.list()
      .then((data) => setStatuses(parseStatuses(data).map((s) => ({ id: s.id, label: s.label }))))
      .catch(() => setStatuses([]))
  }, [open])

  const districts = getDistrictsByProvince(province)

  const validate = (): string | null => {
    if (!projectName.trim()) return 'Vui lòng nhập tên dự án.'
    if (projectName.trim().length < 5) return 'Tên dự án phải có ít nhất 5 ký tự.'
    if (!province) return 'Vui lòng chọn tỉnh/thành.'
    if (!district) return 'Vui lòng chọn quận/huyện.'
    if (!housingProjectStatusId) return 'Vui lòng chọn trạng thái dự án.'
    const mp = parseFloat(minPrice)
    const MaP = parseFloat(maxPrice)
    if (minPrice && isNaN(mp)) return 'Giá tối thiểu phải là số.'
    if (maxPrice && isNaN(MaP)) return 'Giá tối đa phải là số.'
    if (minPrice && maxPrice && mp > MaP) return 'Giá tối thiểu không được lớn hơn giá tối đa.'
    const miA = parseFloat(minArea)
    const MaA = parseFloat(maxArea)
    if (minArea && isNaN(miA)) return 'Diện tích tối thiểu phải là số.'
    if (maxArea && isNaN(MaA)) return 'Diện tích tối đa phải là số.'
    if (minArea && maxArea && miA > MaA) return 'Diện tích tối thiểu không được lớn hơn diện tích tối đa.'
    if (availableUnits && isNaN(parseInt(availableUnits, 10))) return 'Số căn phải là số.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const body: CreateHousingProjectRequestDto = {
        projectName: projectName.trim(),
        description: description.trim(),
        province,
        district,
        street: street.trim() || undefined,
        ward: ward.trim() || undefined,
        address: [street.trim(), ward.trim(), district, province].filter(Boolean).join(', '),
        minPrice: parseFloat(minPrice) || 0,
        maxPrice: parseFloat(maxPrice) || 0,
        minArea: parseFloat(minArea) || 0,
        maxArea: parseFloat(maxArea) || 0,
        availableUnits: parseInt(availableUnits, 10) || 0,
        decisionNumber: decisionNumber.trim() || undefined,
        approvalDate: approvalDate || undefined,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        lotteryDate: lotteryDate || undefined,
        lotteryLocation: lotteryLocation.trim() || undefined,
        applicationOpenDate: applicationOpenDate || undefined,
        applicationCloseDate: applicationCloseDate || undefined,
        isConfirmed,
        housingProjectStatusId,
        thumbnailFile: thumbnailFile ?? undefined,
        imagesFiles: imagesFiles.length > 0 ? imagesFiles : undefined,
      }
      await housingProjectsApi.create(body)
      await onCreated?.()
      onClose()
      setTimeout(() => navigate('projects'), 100)
    } catch (err) {
      setError(formatError(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Tạo dự án nhà ở mới"
      description="Nhập đầy đủ thông tin dự án theo quy định của Sở Xây dựng."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {error && <Alert variant="error">{error}</Alert>}

        {/* === Thông tin cơ bản === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin cơ bản</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tên dự án <span className="text-red-500">*</span>
              </label>
              <input className="input w-full" value={projectName} onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Khu NOXH Bình Dương — Block A" maxLength={150} required disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả</label>
              <textarea className="input w-full min-h-[80px] resize-y" value={description}
                onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về dự án..."
                disabled={submitting} />
            </div>
          </div>
        </div>

        {/* === Vị trí === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Vị trí</p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tỉnh/Thành phố <span className="text-red-500">*</span>
                </label>
                <select className="input w-full" value={province}
                  onChange={(e) => { setProvince(e.target.value); setDistrict(''); setWard('') }}
                  required disabled={submitting}>
                  <option value="">-- Chọn tỉnh/thành --</option>
                  {VIETNAM_PROVINCES.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Quận/Huyện <span className="text-red-500">*</span>
                </label>
                <select className="input w-full" value={district}
                  onChange={(e) => { setDistrict(e.target.value); setWard('') }}
                  required disabled={!province || submitting}>
                  <option value="">-- Chọn quận/huyện --</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phường/Xã</label>
                <input className="input w-full" value={ward} onChange={(e) => setWard(e.target.value)}
                  placeholder="VD: Phường Phú Hòa" disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Đường/Số nhà</label>
                <input className="input w-full" value={street} onChange={(e) => setStreet(e.target.value)}
                  placeholder="VD: 123 Nguyễn Trãi" disabled={submitting} />
              </div>
            </div>
          </div>
        </div>

        {/* === Giá & diện tích === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Giá &amp; Diện tích</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Giá tối thiểu (VNĐ)</label>
              <input className="input w-full" type="number" min="0" value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)} placeholder="0" disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Giá tối đa (VNĐ)</label>
              <input className="input w-full" type="number" min="0" value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)} placeholder="0" disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Diện tích min (m²)</label>
              <input className="input w-full" type="number" min="0" value={minArea}
                onChange={(e) => setMinArea(e.target.value)} placeholder="0" disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Diện tích max (m²)</label>
              <input className="input w-full" type="number" min="0" value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)} placeholder="0" disabled={submitting} />
            </div>
          </div>
        </div>

        {/* === Thông tin hồ sơ === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin hồ sơ</p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Số căn còn trống</label>
                <input className="input w-full" type="number" min="0" value={availableUnits}
                  onChange={(e) => setAvailableUnits(e.target.value)} placeholder="0" disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Tiền đặt cọc (VNĐ)</label>
                <input className="input w-full" type="number" min="0" value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)} placeholder="0" disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select className="input w-full" value={housingProjectStatusId}
                  onChange={(e) => setHousingProjectStatusId(e.target.value)} required disabled={submitting}>
                  <option value="">{statuses.length ? 'Chọn trạng thái' : 'Đang tải...'}</option>
                  {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* === Thông tin quyết định === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Quyết định &amp; Phê duyệt</p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Số quyết định</label>
                <input className="input w-full" value={decisionNumber}
                  onChange={(e) => setDecisionNumber(e.target.value)}
                  placeholder="VD: 1234/QĐ-UBND" disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày phê duyệt</label>
                <input className="input w-full" type="date" value={approvalDate}
                  onChange={(e) => setApprovalDate(e.target.value)} disabled={submitting} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" className="accent-blue-600" checked={isConfirmed}
                    onChange={(e) => setIsConfirmed(e.target.checked)} disabled={submitting} />
                  Đã được phê duyệt
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* === Thời gian === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Thời gian</p>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày mở đăng ký</label>
                <input className="input w-full" type="datetime-local" value={applicationOpenDate}
                  onChange={(e) => setApplicationOpenDate(e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày đóng đăng ký</label>
                <input className="input w-full" type="datetime-local" value={applicationCloseDate}
                  onChange={(e) => setApplicationCloseDate(e.target.value)} disabled={submitting} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ngày bốc thăm</label>
                <input className="input w-full" type="datetime-local" value={lotteryDate}
                  onChange={(e) => setLotteryDate(e.target.value)} disabled={submitting} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Địa điểm bốc thăm</label>
                <input className="input w-full" value={lotteryLocation}
                  onChange={(e) => setLotteryLocation(e.target.value)}
                  placeholder="VD: Hội trường TTTM Bình Dương" disabled={submitting} />
              </div>
            </div>
          </div>
        </div>

        {/* === Hình ảnh === */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Hình ảnh</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ảnh đại diện (thumbnail)</label>
              <input className="input w-full" type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} disabled={submitting} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Ảnh chi tiết dự án (chọn nhiều)</label>
              <input className="input w-full" type="file" accept="image/jpeg,image/png,image/webp" multiple
                onChange={(e) => setImagesFiles(e.target.files ? Array.from(e.target.files) : [])} disabled={submitting} />
              {imagesFiles.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">{imagesFiles.length} ảnh đã chọn</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Huỷ
          </button>
          <button type="submit" disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50">
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Tạo dự án</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
