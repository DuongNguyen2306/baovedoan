import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Sparkles,
  Home,
  MapPin,
  Banknote,
  FileText,
  CalendarDays,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Trash2,
} from 'lucide-react'
import { housingProjectsApi } from '@/api/housing-projects'
import { housingProjectStatusesApi, parseStatuses } from '@/api/housing-project-statuses'
import { Modal } from '@/components/ui/modal'
import { Alert } from '@/components/ui/alert'
import { ensureHcmLocationsLoaded, HCM_PROVINCE } from '@/lib/vietnam-locations'
import { formatError } from '@/lib/format-error'
import { navigate } from '@/hooks/useHashRoute'
import type { CreateApartmentDto, CreateHousingProjectRequestDto } from '@/types'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void | Promise<void>
}

type StepId = 'basic' | 'pricing' | 'schedule'

const STEPS: { id: StepId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'basic', label: 'Thông tin cơ bản', icon: Home },
  { id: 'pricing', label: 'Giá & Hồ sơ', icon: Banknote },
  { id: 'schedule', label: 'Thời gian & Hình ảnh', icon: CalendarDays },
]

const inputClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-50 dark:placeholder:text-slate-500 dark:hover:border-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30 dark:disabled:bg-slate-900/40'
const labelClass = 'mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100'
const requiredDot = <span className="text-rose-500" aria-hidden>*</span>

export function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statuses, setStatuses] = useState<{ id: string; label: string }[]>([])
  const [step, setStep] = useState<StepId>('basic')

  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [ward, setWard] = useState('')
  const [street, setStreet] = useState('')
  const [wards, setWards] = useState<string[]>([])
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
  const [apartments, setApartments] = useState<
    { unitName: string; area: string; price: string }[]
  >([{ unitName: '', area: '', price: '' }])

  useEffect(() => {
    if (!open) {
      setProjectName('')
      setDescription('')
      setWard('')
      setStreet('')
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
      setApartments([{ unitName: '', area: '', price: '' }])
      setError('')
      setStep('basic')
      return
    }
    void housingProjectStatusesApi.list()
      .then((data) => setStatuses(parseStatuses(data).map((s) => ({ id: s.id, label: s.label }))))
      .catch(() => setStatuses([]))
    void ensureHcmLocationsLoaded()
      .then(setWards)
      .catch(() => setWards([]))
  }, [open])

  const currentStepIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step])

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1].id)
    }
  }
  const goPrev = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const validate = (): string | null => {
    if (!projectName.trim()) return 'Vui lòng nhập tên dự án.'
    if (projectName.trim().length < 5) return 'Tên dự án phải có ít nhất 5 ký tự.'
    if (!ward) return 'Vui lòng chọn phường/xã.'
    if (!housingProjectStatusId) return 'Vui lòng chọn trạng thái dự án.'

    const filled = apartments.filter(
      (r) => r.unitName.trim() || r.area.trim() || r.price.trim(),
    )
    if (filled.length === 0) {
      return 'Vui lòng thêm ít nhất 1 căn (tên, diện tích, giá).'
    }
    for (let i = 0; i < filled.length; i++) {
      const r = filled[i]
      if (!r.unitName.trim()) return `Căn #${i + 1}: thiếu tên căn.`
      if (!r.area.trim() || isNaN(parseFloat(r.area)) || parseFloat(r.area) <= 0)
        return `Căn #${i + 1}: diện tích không hợp lệ.`
      if (!r.price.trim() || isNaN(parseFloat(r.price)) || parseFloat(r.price) <= 0)
        return `Căn #${i + 1}: giá không hợp lệ.`
    }
    return null
  }

  const buildApartmentsPayload = (): CreateApartmentDto[] =>
    apartments
      .filter((r) => r.unitName.trim())
      .map((r) => ({
        unitName: r.unitName.trim(),
        area: parseFloat(r.area) || 0,
        price: parseFloat(r.price) || 0,
      }))

  const updateAptRow = (
    index: number,
    field: 'unitName' | 'area' | 'price',
    value: string,
  ) => {
    setApartments((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
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
      const aptPayload = buildApartmentsPayload()
      const areas = aptPayload.map((a) => a.area)
      const prices = aptPayload.map((a) => a.price)
      const body: CreateHousingProjectRequestDto = {
        projectName: projectName.trim(),
        description: description.trim(),
        province: HCM_PROVINCE,
        district: ward.trim(),
        street: street.trim() || undefined,
        ward: ward.trim() || undefined,
        address: [street.trim(), ward.trim(), HCM_PROVINCE].filter(Boolean).join(', '),
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        minArea: areas.length ? Math.min(...areas) : 0,
        maxArea: areas.length ? Math.max(...areas) : 0,
        availableUnits: aptPayload.length,
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
        apartments: aptPayload,
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
      <form onSubmit={handleSubmit} noValidate className="flex max-h-[75vh] flex-col">
        {error && (
          <div className="px-1 pt-1">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* === Stepper === */}
        <div className="mb-5 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-3 shadow-sm dark:border-indigo-500/30 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-violet-950/30">
          <ol className="flex items-stretch gap-1.5">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step
              const isDone = idx < currentStepIndex
              const Icon = s.icon
              return (
                <li key={s.id} className="flex flex-1 min-w-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    disabled={submitting}
                    className={[
                      'group flex min-w-0 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition',
                      isActive
                        ? 'bg-white shadow-lg ring-2 ring-indigo-300 dark:bg-slate-800 dark:ring-indigo-500/60'
                        : 'hover:bg-white/70 dark:hover:bg-slate-800/50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition',
                        isActive
                          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md'
                          : isDone
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                      ].join(' ')}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span
                        className={[
                          'block truncate text-[10px] font-bold uppercase tracking-wider leading-none',
                          isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400',
                        ].join(' ')}
                      >
                        Bước {idx + 1}
                      </span>
                      <span
                        className={[
                          'mt-0.5 block truncate text-xs font-bold leading-tight',
                          isActive
                            ? 'bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent dark:from-indigo-300 dark:to-violet-300'
                            : 'text-slate-700 dark:text-slate-200',
                        ].join(' ')}
                        title={s.label}
                      >
                        {s.label}
                      </span>
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <span
                      className={[
                        'h-0.5 w-2 shrink-0 rounded-full sm:w-4',
                        idx < currentStepIndex
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                          : 'bg-slate-200 dark:bg-slate-700',
                      ].join(' ')}
                      aria-hidden
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </div>

        {/* === Body theo step === */}
        <div className="flex-1 space-y-5 overflow-y-auto px-1 pr-2">
          {step === 'basic' && (
            <>
              <SectionCard icon={Home} title="Thông tin cơ bản" subtitle="Tên dự án & mô tả ngắn gọn">
                <Field label="Tên dự án" required>
                  <input
                    className={inputClass}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="VD: Khu NOXH Bình Dương — Block A"
                    maxLength={150}
                    disabled={submitting}
                  />
                </Field>
                <Field label="Mô tả" hint="Tối đa 500 ký tự, dùng để hiển thị trên trang chủ.">
                  <textarea
                    className={`${inputClass} min-h-[90px] resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về dự án, vị trí, tiện ích nổi bật..."
                    disabled={submitting}
                  />
                </Field>
              </SectionCard>

              <SectionCard icon={MapPin} title="Vị trí dự án" subtitle="Địa chỉ chi tiết phục vụ công khai">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tỉnh/Thành phố" required>
                    <select
                      className={`${inputClass} cursor-not-allowed bg-slate-100 dark:bg-slate-900/80`}
                      value={HCM_PROVINCE}
                      disabled
                    >
                      <option value={HCM_PROVINCE}>{HCM_PROVINCE}</option>
                    </select>
                  </Field>
                  <Field label="Phường/Xã" required>
                    <select
                      className={inputClass}
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      disabled={submitting || wards.length === 0}
                    >
                      <option value="">
                        {wards.length ? '-- Chọn phường/xã --' : 'Đang tải danh sách...'}
                      </option>
                      {wards.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Đường/Số nhà">
                  <input
                    className={inputClass}
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="VD: 123 Nguyễn Trãi"
                    disabled={submitting}
                  />
                </Field>
              </SectionCard>
            </>
          )}

          {step === 'pricing' && (
            <>
              <SectionCard
                icon={Home}
                title="Danh sách căn"
                subtitle="Mỗi dòng = một căn cụ thể (tên, diện tích, giá). Giá / số căn trống được tính từ danh sách này."
              >
                <div className="space-y-3">
                  {apartments.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-4">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Tên căn</label>
                        <input
                          className={inputClass}
                          value={row.unitName}
                          onChange={(e) => updateAptRow(idx, 'unitName', e.target.value)}
                          placeholder="VD: A-101"
                          disabled={submitting}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Diện tích (m²)</label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.area}
                          onChange={(e) => updateAptRow(idx, 'area', e.target.value)}
                          placeholder="38.5"
                          disabled={submitting}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Giá (VNĐ)</label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={row.price}
                          onChange={(e) => updateAptRow(idx, 'price', e.target.value)}
                          placeholder="720000000"
                          disabled={submitting}
                        />
                      </div>
                      <div className="flex items-end sm:col-span-2">
                        <button
                          type="button"
                          className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900 dark:hover:bg-rose-950/40"
                          disabled={submitting || apartments.length <= 1}
                          onClick={() =>
                            setApartments((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <Trash2 className="h-4 w-4" /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    disabled={submitting}
                    onClick={() =>
                      setApartments((prev) => [
                        ...prev,
                        { unitName: '', area: '', price: '' },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" /> Thêm căn
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Số căn: <strong>{apartments.filter((r) => r.unitName.trim()).length}</strong>
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                icon={FileText}
                title="Thông tin hồ sơ"
                subtitle="Tiền cọc và trạng thái pháp lý"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tiền đặt cọc" suffix="VNĐ">
                    <input
                      className={`${inputClass} pr-12`}
                      type="number"
                      min="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Trạng thái" required>
                    <select
                      className={inputClass}
                      value={housingProjectStatusId}
                      onChange={(e) => setHousingProjectStatusId(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="">
                        {statuses.length ? 'Chọn trạng thái' : 'Đang tải...'}
                      </option>
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Số quyết định">
                    <input
                      className={inputClass}
                      value={decisionNumber}
                      onChange={(e) => setDecisionNumber(e.target.value)}
                      placeholder="VD: 1234/QĐ-UBND"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Ngày phê duyệt">
                    <input
                      className={inputClass}
                      type="date"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500"
                        checked={isConfirmed}
                        onChange={(e) => setIsConfirmed(e.target.checked)}
                        disabled={submitting}
                      />
                      Đã được phê duyệt
                    </label>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {step === 'schedule' && (
            <>
              <SectionCard
                icon={CalendarDays}
                title="Lịch đăng ký & bốc thăm"
                subtitle="Thời gian mở/đóng đăng ký và ngày bốc thăm"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ngày mở đăng ký">
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={applicationOpenDate}
                      onChange={(e) => setApplicationOpenDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Ngày đóng đăng ký">
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={applicationCloseDate}
                      onChange={(e) => setApplicationCloseDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ngày bốc thăm">
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={lotteryDate}
                      onChange={(e) => setLotteryDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Field>
                  <Field label="Địa điểm bốc thăm">
                    <input
                      className={inputClass}
                      value={lotteryLocation}
                      onChange={(e) => setLotteryLocation(e.target.value)}
                      placeholder="VD: Hội trường TTTM Bình Dương"
                      disabled={submitting}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                icon={ImageIcon}
                title="Hình ảnh dự án"
                subtitle="Ảnh đại diện sẽ hiển thị ở trang chủ và danh sách"
              >
                <Field label="Ảnh đại diện (thumbnail)">
                  <FilePicker
                    mode="single"
                    onPickSingle={(f) => setThumbnailFile(f)}
                    file={thumbnailFile}
                    disabled={submitting}
                    placeholder="Chọn 1 ảnh đại diện (JPG/PNG/WebP)"
                  />
                </Field>
                <Field
                  label="Ảnh chi tiết dự án"
                  hint={imagesFiles.length > 0 ? `${imagesFiles.length} ảnh đã chọn` : undefined}
                >
                  <FilePicker
                    mode="multi"
                    onPickMulti={(files) => setImagesFiles(files)}
                    files={imagesFiles}
                    disabled={submitting}
                    placeholder="Chọn nhiều ảnh (JPG/PNG/WebP)"
                  />
                </Field>
              </SectionCard>
            </>
          )}
        </div>

        {/* === Footer === */}
        <div className="sticky bottom-0 -mx-1 mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80 px-5 py-3 shadow-md dark:border-slate-700/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-violet-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 px-2 text-[11px] font-bold text-white shadow">
              {currentStepIndex + 1}/{STEPS.length}
            </span>
            <span>{STEPS[currentStepIndex].label}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={goPrev}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
              Huỷ
            </button>
            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Tạo dự án
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}

/* ===== Helper components ===== */

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  hint,
  suffix,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  suffix?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={labelClass}>
        <span>{label}</span>
        {required && requiredDot}
      </label>
      {suffix ? (
        <div className="relative">
          {children}
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        </div>
      ) : (
        children
      )}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

type SinglePickerProps = {
  mode: 'single'
  onPickSingle: (f: File | null) => void
  file: File | null
}

type MultiPickerProps = {
  mode: 'multi'
  onPickMulti: (files: File[]) => void
  files: File[]
}

type FilePickerProps = {
  disabled?: boolean
  placeholder: string
} & (SinglePickerProps | MultiPickerProps)

function FilePicker(props: FilePickerProps) {
  const { mode, disabled, placeholder } = props
  const multiple = mode === 'multi'
  const inputId = useMemo(() => `fp-${Math.random().toString(36).slice(2, 9)}`, [])
  const summary = multiple
    ? props.files.length > 0
      ? `${props.files.length} ảnh đã chọn`
      : null
    : props.file
      ? props.file.name
      : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'multi') {
      props.onPickMulti(e.target.files ? Array.from(e.target.files) : [])
    } else {
      props.onPickSingle(e.target.files?.[0] ?? null)
    }
  }

  const handleClear = () => {
    if (mode === 'multi') props.onPickMulti([])
    else props.onPickSingle(null)
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={[
          'flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-50/80 px-4 py-3 text-sm transition hover:border-indigo-400 hover:bg-indigo-50/60',
          disabled ? 'pointer-events-none opacity-50' : '',
          'dark:border-slate-600 dark:bg-slate-800/60 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <ImageIcon className="h-4 w-4 text-indigo-500" />
          {summary ? (
            <span className="font-semibold text-slate-900 dark:text-slate-50">{summary}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        <span className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
          Chọn file
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
      {((multiple && props.files.length > 0) || (!multiple && props.file)) && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="mt-1 text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
        >
          {multiple ? 'Xoá tất cả' : 'Xoá ảnh'}
        </button>
      )}
    </div>
  )
}