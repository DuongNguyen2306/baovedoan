import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Heart, MapPin, Plus, X } from 'lucide-react'
import { housingProjectsApi } from '@/api/housing-projects'
import { housingProjectStatusesApi, parseStatuses } from '@/api/housing-project-statuses'
import { CreateProjectModal } from '@/components/developer/create-project-modal'
import { DeveloperDecisionPanel } from '@/components/developer-decision-panel'
import { LocationFields } from '@/components/forms/location-fields'
import { RichEditor } from '@/components/forms/rich-editor'
import { HousingSearchForm } from '@/components/housing/housing-search-form'
import { HouseCard } from '@/components/housing/house-card'
import { PageCard, PageHeader } from '@/components/layout/page-header'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/label'
import { Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { navigate } from '@/hooks/useHashRoute'
import { useWishlist } from '@/hooks/useWishlist'
import { extractProjects, extractSingleProject } from '@/lib/parsers'
import { formatError, formatSuccess } from '@/lib/format-error'
import { resolveProvinceName } from '@/lib/vietnam-locations'
import { mapProjectToCard } from '@/lib/projects'
import { FLASH_CREATE_PROJECT_KEY } from '@/lib/constants'
import { ensureVerifiedForApplication } from '@/lib/ekyc-gate'
import { getRole, isLoggedIn } from '@/router'
import {
  applyClientFilters,
  EMPTY_HOUSING_SEARCH,
  sortHousingProjects,
  toApiFilter,
  type HousingSearchFilter,
} from '@/lib/housing-search'
import type { CreateHousingProjectRequestDto, HousingProjectDto } from '@/types'

export function ProjectsPage() {
  const [all, setAll] = useState<HousingProjectDto[]>([])
  const [filter, setFilter] = useState<HousingSearchFilter>({ ...EMPTY_HOUSING_SEARCH })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const isApplicant = getRole() === 'Applicant'

  const load = async (nextFilter: HousingSearchFilter) => {
    setLoading(true)
    setError('')
    try {
      const data = await housingProjectsApi.list(toApiFilter(nextFilter))
      const items = sortHousingProjects(
        applyClientFilters(extractProjects(data), nextFilter),
        nextFilter.sort,
      )
      setAll(items)
    } catch (err) {
      setError(formatError(err))
      setAll([])
    } finally {
      setLoading(false)
    }
  }

  const refreshProjects = () => setReloadKey((k) => k + 1)

  useEffect(() => { void load(EMPTY_HOUSING_SEARCH) }, [reloadKey])

  useEffect(() => {
    const name = sessionStorage.getItem(FLASH_CREATE_PROJECT_KEY)
    if (!name) return
    sessionStorage.removeItem(FLASH_CREATE_PROJECT_KEY)
    setFlashSuccess(name)
    const timer = window.setTimeout(() => setFlashSuccess(null), 6000)
    return () => window.clearTimeout(timer)
  }, [])

  const cards = useMemo(() => all.map(mapProjectToCard), [all])

  return (
    <div>
      <PageHeader routeId="projects" />
      <PageCard className="space-y-6 p-6">
        {flashSuccess && (
          <Alert variant="success" className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold">Tạo dự án thành công!</p>
                <p className="mt-0.5 text-green-800 dark:text-green-300">
                  Dự án <strong>{flashSuccess}</strong> đã được thêm vào danh sách.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
              aria-label="Đóng thông báo"
              onClick={() => setFlashSuccess(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{loading ? 'Đang tải...' : `${cards.length} dự án`}</p>
          {!isApplicant && (
            <Button variant="accent" onClick={() => setShowCreateProject(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo dự án mới
            </Button>
          )}
        </div>

        <HousingSearchForm
          value={filter}
          onChange={setFilter}
          loading={loading}
          onSubmit={(next) => { void load(next) }}
        />

        {error && <Alert variant="error">{error}</Alert>}

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        )}

        {!loading && cards.length === 0 && (
          isApplicant ? (
            <EmptyState
              title="Không tìm thấy dự án"
              description="Thử điều chỉnh bộ lọc để xem thêm dự án nhà ở xã hội."
            />
          ) : (
            <EmptyState
              title="Không tìm thấy dự án"
              description="Thử điều chỉnh bộ lọc hoặc tạo dự án mới."
              actionLabel="Tạo dự án mới"
              onAction={() => setShowCreateProject(true)}
            />
          )
        )}

        {!loading && cards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((house) => (
              <HouseCard key={house.id} house={house} />
            ))}
          </div>
        )}
      </PageCard>
      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={refreshProjects}
      />
    </div>
  )
}

function ProjectForm({ projectId, onDone }: { projectId?: string; onDone?: () => void }) {
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(!!projectId)
  const [statuses, setStatuses] = useState<{ id: string; label: string }[]>([])
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [addressDefault, setAddressDefault] = useState('')
  const [addressKey, setAddressKey] = useState('new')
  const [submitting, setSubmitting] = useState(false)
  const [description, setDescription] = useState('')
  const [imagesFiles, setImagesFiles] = useState<File[]>([])

  useEffect(() => {
    void housingProjectStatusesApi.list()
      .then((data) => setStatuses(parseStatuses(data).map((s) => ({
        id: s.id,
        label: s.label,
      }))))
      .catch(() => setStatuses([]))
  }, [])

  useEffect(() => {
    if (!projectId) return
    void housingProjectsApi.getById(projectId).then((data) => {
      const p = extractSingleProject(data)
      if (!p) return
      const form = document.getElementById('project-form') as HTMLFormElement
      if (!form) return
      const set = (n: string, v: string | number) => {
        const el = form.elements.namedItem(n) as HTMLInputElement
        if (el) el.value = String(v)
      }
      setProvince(resolveProvinceName(p.province ?? ''))
      setDistrict(p.ward || p.district || '')
      setAddressDefault(p.address ?? '')
      setAddressKey(`addr-${projectId}`)
      set('projectName', p.projectName || p.name || '')
      setDescription(p.description ?? '')
      set('minPrice', p.minPrice ?? 0)
      set('maxPrice', p.maxPrice ?? 0)
      set('minArea', p.minArea ?? 0)
      set('maxArea', p.maxArea ?? 0)
      set('availableUnits', p.availableUnits ?? 0)
      if (p.housingProjectStatusId) set('housingProjectStatusId', p.housingProjectStatusId)
      // load thêm các field mới
      const formEl = form as HTMLFormElement & Record<string, HTMLInputElement>
      if (formEl.decisionNumber && (p as Record<string, unknown>).decisionNumber)
        formEl.decisionNumber.value = String((p as Record<string, unknown>).decisionNumber)
      if (formEl.approvalDate && (p as Record<string, unknown>).approvalDate)
        formEl.approvalDate.value = String((p as Record<string, unknown>).approvalDate).split('T')[0]
      if (formEl.isConfirmed)
        formEl.isConfirmed.checked = Boolean((p as Record<string, unknown>).isConfirmed)
      if (formEl.depositAmount && (p as Record<string, unknown>).depositAmount)
        formEl.depositAmount.value = String((p as Record<string, unknown>).depositAmount)
      if (formEl.lotteryDate && (p as Record<string, unknown>).lotteryDate)
        formEl.lotteryDate.value = String((p as Record<string, unknown>).lotteryDate).replace('Z', '')
      if (formEl.lotteryLocation && (p as Record<string, unknown>).lotteryLocation)
        formEl.lotteryLocation.value = String((p as Record<string, unknown>).lotteryLocation)
      if (formEl.applicationOpenDate && (p as Record<string, unknown>).applicationOpenDate)
        formEl.applicationOpenDate.value = String((p as Record<string, unknown>).applicationOpenDate).replace('Z', '')
      if (formEl.applicationCloseDate && (p as Record<string, unknown>).applicationCloseDate)
        formEl.applicationCloseDate.value = String((p as Record<string, unknown>).applicationCloseDate).replace('Z', '')
    }).catch((err) => setMsg({ type: 'error', text: formatError(err) })).finally(() => setLoading(false))
  }, [projectId])

  const readBody = (fd: FormData): CreateHousingProjectRequestDto => {
    const thumb = fd.get('thumbnailFile')
    // LocationFields (v2): select phường/xã nằm ở name="district" — đồng bộ District = Ward
    const wardName = String(fd.get('district') || fd.get('ward') || '').trim()
    const provinceName = String(fd.get('province') || '').trim() || 'Thành phố Hồ Chí Minh'
    return {
      projectName: String(fd.get('projectName')),
      description,
      province: provinceName,
      district: wardName,
      street: String(fd.get('street')) || undefined,
      ward: wardName,
      address: String(fd.get('address')),
      minPrice: parseFloat(String(fd.get('minPrice'))) || 0,
      maxPrice: parseFloat(String(fd.get('maxPrice'))) || 0,
      minArea: parseFloat(String(fd.get('minArea'))) || 0,
      maxArea: parseFloat(String(fd.get('maxArea'))) || 0,
      availableUnits: parseInt(String(fd.get('availableUnits')), 10) || 0,
      decisionNumber: String(fd.get('decisionNumber')) || undefined,
      approvalDate: String(fd.get('approvalDate')) || undefined,
      isConfirmed: fd.get('isConfirmed') === 'on',
      depositAmount: parseFloat(String(fd.get('depositAmount'))) || undefined,
      lotteryDate: String(fd.get('lotteryDate')) || undefined,
      lotteryLocation: String(fd.get('lotteryLocation')) || undefined,
      applicationOpenDate: String(fd.get('applicationOpenDate')) || undefined,
      applicationCloseDate: String(fd.get('applicationCloseDate')) || undefined,
      housingProjectStatusId: String(fd.get('housingProjectStatusId')),
      thumbnailFile: thumb instanceof File && thumb.size > 0 ? thumb : undefined,
      imagesFiles: imagesFiles.length > 0 ? imagesFiles : undefined,
    }
  }

  return (
    <form id="project-form" className="mx-auto max-w-2xl space-y-4" onSubmit={async (e) => {
      e.preventDefault()
      setMsg(null)
      if (!description.trim()) {
        setMsg({ type: 'error', text: 'Vui lòng nhập mô tả dự án.' })
        return
      }
      setSubmitting(true)
      try {
        const body = readBody(new FormData(e.currentTarget))
        const data = projectId ? await housingProjectsApi.update(projectId, body) : await housingProjectsApi.create(body)
        if (!projectId) {
          sessionStorage.setItem(FLASH_CREATE_PROJECT_KEY, body.projectName)
          navigate('projects')
          return
        }
        setMsg({ type: 'success', text: formatSuccess(data) || 'Cập nhật dự án thành công!' })
        setImagesFiles([])
        onDone?.()
      } catch (err) {
        setMsg({ type: 'error', text: formatError(err) })
      } finally {
        setSubmitting(false)
      }
    }}>
      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>}
      <FormField label="Tên dự án" htmlFor="projectName"><Input id="projectName" name="projectName" required /></FormField>
      <div className="space-y-1.5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Mô tả <span className="text-red-500">*</span>
        </label>
        <RichEditor value={description} onChange={setDescription} />
        <input type="hidden" name="description" value={description} />
      </div>
      <LocationFields
        province={province}
        district={district}
        onProvinceChange={setProvince}
        onDistrictChange={setDistrict}
        addressDefaultValue={addressDefault}
        addressKey={addressKey}
      />
      <FormField label="Đường/Số nhà" htmlFor="street">
        <Input id="street" name="street" placeholder="VD: 123 Nguyễn Trãi" />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Giá tối thiểu (VNĐ)" htmlFor="minPrice"><Input id="minPrice" name="minPrice" type="number" required /></FormField>
        <FormField label="Giá tối đa (VNĐ)" htmlFor="maxPrice"><Input id="maxPrice" name="maxPrice" type="number" required /></FormField>
        <FormField label="Diện tích min (m²)" htmlFor="minArea"><Input id="minArea" name="minArea" type="number" required /></FormField>
        <FormField label="Diện tích max (m²)" htmlFor="maxArea"><Input id="maxArea" name="maxArea" type="number" required /></FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Số căn còn trống" htmlFor="availableUnits"><Input id="availableUnits" name="availableUnits" type="number" required /></FormField>
        <FormField label="Tiền đặt cọc (VNĐ)" htmlFor="depositAmount"><Input id="depositAmount" name="depositAmount" type="number" /></FormField>
      </div>
      <FormField label="Trạng thái dự án" htmlFor="housingProjectStatusId">
        <Select id="housingProjectStatusId" name="housingProjectStatusId" required>
          <option value="">{statuses.length ? 'Chọn trạng thái' : 'Đang tải...'}</option>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </FormField>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Số quyết định" htmlFor="decisionNumber">
          <Input id="decisionNumber" name="decisionNumber" placeholder="VD: 1234/QĐ-UBND" />
        </FormField>
        <FormField label="Ngày phê duyệt" htmlFor="approvalDate">
          <Input id="approvalDate" name="approvalDate" type="date" />
        </FormField>
        <FormField label="Đã phê duyệt?" htmlFor="isConfirmed">
          <div className="flex items-center h-full">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input id="isConfirmed" name="isConfirmed" type="checkbox" className="accent-blue-600" />
              Đã phê duyệt
            </label>
          </div>
        </FormField>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Ngày mở đăng ký" htmlFor="applicationOpenDate">
          <Input id="applicationOpenDate" name="applicationOpenDate" type="datetime-local" />
        </FormField>
        <FormField label="Ngày đóng đăng ký" htmlFor="applicationCloseDate">
          <Input id="applicationCloseDate" name="applicationCloseDate" type="datetime-local" />
        </FormField>
        <FormField label="Ngày bốc thăm" htmlFor="lotteryDate">
          <Input id="lotteryDate" name="lotteryDate" type="datetime-local" />
        </FormField>
        <FormField label="Địa điểm bốc thăm" htmlFor="lotteryLocation">
          <Input id="lotteryLocation" name="lotteryLocation" placeholder="VD: Hội trường TTTM Bình Dương" />
        </FormField>
      </div>
      <FormField label="Ảnh thumbnail (tùy chọn)" htmlFor="thumbnailFile">
        <Input id="thumbnailFile" name="thumbnailFile" type="file" accept="image/jpeg,image/png,image/webp" />
      </FormField>
      <FormField label="Ảnh chi tiết dự án (có thể chọn nhiều ảnh)" htmlFor="imagesFiles">
        <Input
          id="imagesFiles"
          name="imagesFiles"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const list = e.target.files
            if (!list || list.length === 0) {
              setImagesFiles([])
              return
            }
            setImagesFiles(Array.from(list))
          }}
        />
      </FormField>
      {imagesFiles.length > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Đã chọn {imagesFiles.length} ảnh chi tiết.</p>
      )}
      {msg && <Alert variant={msg.type === 'error' ? 'error' : 'success'}>{msg.text}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="accent" disabled={submitting || loading}>
          {submitting ? 'Đang lưu...' : projectId ? 'Cập nhật' : 'Tạo dự án'}
        </Button>
        {projectId && (
          <Button type="button" variant="outline" className="text-red-600" onClick={async () => {
            if (!confirm('Bạn có chắc chắn muốn xóa dự án này?')) return
            try {
              await housingProjectsApi.delete(projectId)
              navigate('projects')
            } catch (err) { setMsg({ type: 'error', text: formatError(err) }) }
          }}>Xóa</Button>
        )}
      </div>
    </form>
  )
}

export function CreateProjectPage() {
  return (
    <div>
      <PageHeader routeId="create-project" />
      <PageCard className="p-6"><ProjectForm /></PageCard>
    </div>
  )
}

export function ProjectDetailPage() {
  const [projectId] = useState(() => sessionStorage.getItem('projectId') ?? '')
  const role = getRole()
  const logged = isLoggedIn()
  const isApplicant = role === 'Applicant'
  const isDeveloper = role === 'Housing Developer'
  const isAdmin = role === 'System Administrator'
  const isStaffEditor = logged && (isDeveloper || isAdmin || role === 'Department Of Construction')
  const showPublicView = !logged || isApplicant || !isStaffEditor

  return (
    <div>
      <PageHeader routeId="project-detail" />
      <PageCard className="p-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(logged ? 'projects' : 'tim-nha')}
        >
          ← {logged ? 'Danh sách dự án' : 'Tìm nhà ở'}
        </Button>
        {!projectId ? (
          <Alert variant="error">
            Không tìm thấy dự án. Quay lại danh sách và chọn lại dự án.
          </Alert>
        ) : showPublicView ? (
          <ProjectDetailView projectId={projectId} />
        ) : (
          <>
            <ProjectForm projectId={projectId} />
            {(isDeveloper || isAdmin) && (
              <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <DeveloperDecisionPanel projectId={projectId} />
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  )
}

function ProjectDetailView({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState<HousingProjectDto | null>(null)
  const { isWishlisted, toggle } = useWishlist()
  const [wishlistBusy, setWishlistBusy] = useState(false)
  const logged = isLoggedIn()
  const isApplicant = getRole() === 'Applicant'

  useEffect(() => {
    let cancelled = false
    void housingProjectsApi
      .getById(projectId)
      .then((data) => {
        if (cancelled) return
        const p = extractSingleProject(data)
        setProject(p)
      })
      .catch((err) => {
        if (cancelled) return
        setError(formatError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
  if (error) return <Alert variant="error">{error}</Alert>
  if (!project) return <Alert variant="error">Không tìm thấy dự án</Alert>

  const wishlisted = isWishlisted(projectId)
  const openDate = project.applicationOpenDate
  const closeDate = project.applicationCloseDate
  const statusCode = String(project.status || '').toUpperCase()
  const canApply = /OPEN|REGISTRATION/.test(statusCode) || !project.status

  const handleWishlist = async () => {
    if (!logged) {
      navigate('login')
      return
    }
    setWishlistBusy(true)
    try {
      await toggle(projectId)
    } finally {
      setWishlistBusy(false)
    }
  }

  const handleApply = async () => {
    if (!logged) {
      navigate('login')
      return
    }
    if (!isApplicant) {
      setError('Chỉ tài khoản người dân mới nộp hồ sơ được.')
      return
    }
    const ok = await ensureVerifiedForApplication({ projectId })
    if (!ok) return
    navigate('create-application')
  }

  const formatPrice = (v?: number) => {
    if (!v) return '—'
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} tỷ`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`
    return v.toLocaleString('vi-VN')
  }

  const formatWhen = (v?: string) => {
    if (!v) return '—'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString('vi-VN')
  }

  return (
    <div className="space-y-6">
      {project.thumbnailUrl && (
        <img
          src={project.thumbnailUrl}
          alt={project.projectName || project.name || 'Dự án'}
          className="h-64 w-full rounded-xl object-cover"
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {project.projectName || project.name}
          </h2>
          {project.status && (
            <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {project.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {logged && isApplicant && (
            <Button variant="outline" disabled={wishlistBusy} onClick={handleWishlist}>
              <Heart className={wishlisted ? 'mr-2 h-4 w-4 fill-current text-rose-500' : 'mr-2 h-4 w-4'} />
              {wishlisted ? 'Đã quan tâm' : 'Quan tâm'}
            </Button>
          )}
          <Button
            variant="accent"
            disabled={!canApply && logged && isApplicant}
            onClick={() => void handleApply()}
            title={!logged ? 'Đăng nhập tài khoản người dân để nộp hồ sơ' : undefined}
          >
            {!logged ? 'Đăng nhập để nộp hồ sơ' : 'Nộp hồ sơ ngay'}
          </Button>
        </div>
      </div>

      {(project.address || project.district || project.province) && (
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">
            {[project.address, project.district, project.province].filter(Boolean).join(', ')}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem label="Giá đề xuất (tối thiểu)" value={formatPrice(project.minPrice)} />
        <InfoItem label="Giá đề xuất (tối đa)" value={formatPrice(project.maxPrice)} />
        <InfoItem label="Diện tích" value={`${project.minArea ?? 0} – ${project.maxArea ?? 0} m²`} />
        <InfoItem label="Số căn hộ trống" value={`${project.availableUnits ?? 0} căn`} />
        <InfoItem label="Mở thu nhận hồ sơ" value={formatWhen(openDate)} />
        <InfoItem label="Kết thúc thu nhận" value={formatWhen(closeDate)} />
      </div>

      {project.description && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Mô tả dự án
          </h3>
          <div
            className="prose prose-slate max-w-none rounded-xl bg-slate-50 p-4 text-sm leading-relaxed dark:prose-invert dark:bg-slate-800/50"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </div>
      )}

      {project.images && project.images.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hình ảnh dự án
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.images.map((img) => (
              <img
                key={img.id}
                src={img.imageUrl}
                alt=""
                className="aspect-video w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
