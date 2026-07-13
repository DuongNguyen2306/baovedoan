import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  IdCard,
  Info,
  Loader2,
  ScanFace,
  Upload,
  UserCheck,
  X,
} from 'lucide-react'
import { housingApplicationsApi } from '@/api/housing-applications'
import { housingProjectsApi } from '@/api/housing-projects'
import { ekycApi, parseFaceMatch, parseLiveness, parseOcr } from '@/api/ekyc'
import { CameraCapture } from '@/components/ekyc/camera-capture'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/label'
import { Input, Select } from '@/components/ui/input'
import { navigate } from '@/hooks/useHashRoute'
import { DOC_TYPE_LABELS, HOUSING_STATUS_LABELS } from '@/lib/constants'
import {
  formatCooldown,
  formatEkycError,
  getOcrCooldownRemainingMs,
  isValidCitizenId,
  setOcrCooldown,
  validateDocumentFile,
  validateIdImage,
  validateLivenessVideo,
  validateSelfieImage,
  DOC_TYPE_KEYS,
  type DocTypeKey,
} from '@/lib/ekyc-helpers'
import { extractApplicationId, extractProjects } from '@/lib/parsers'
import { formatError } from '@/lib/format-error'
import type { OcrResultDto } from '@/types'

type Step = 1 | 2 | 3 | 4

interface EkycState {
  ocr: boolean
  citizenOk: boolean
  face: boolean
  liveness: boolean
}

interface DocUpload {
  type: DocTypeKey
  file: File
  documentId?: string
  state: 'pending' | 'uploading' | 'uploaded' | 'error'
  error?: string
}

function formatSimilarity(value?: number): string {
  if (value == null || Number.isNaN(value)) return '—'
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct)}%`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const STEPS: { id: Step; label: string; icon: typeof IdCard }[] = [
  { id: 1, label: 'CCCD', icon: IdCard },
  { id: 2, label: 'Khuôn mặt', icon: ScanFace },
  { id: 3, label: 'Thông tin', icon: UserCheck },
  { id: 4, label: 'Tài liệu & nộp', icon: FileCheck2 },
]

function Stepper({ step, ekyc, hasDraft, submitted }: { step: Step; ekyc: EkycState; hasDraft: boolean; submitted: boolean }) {
  const done: Record<Step, boolean> = {
    1: ekyc.citizenOk,
    2: ekyc.face,
    3: hasDraft,
    4: submitted,
  }
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2">
      {STEPS.map((s) => {
        const isActive = s.id === step
        const isDone = done[s.id] && s.id !== step
        const Icon = s.icon
        return (
          <li
            key={s.id}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition ${
              isActive
                ? 'border-primary bg-primary/10 text-primary dark:bg-accent/10'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isActive
                  ? 'bg-primary text-white'
                  : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <span className="leading-tight">Bước {s.id}</span>
            <span className="text-[10px] font-medium opacity-80">{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function CreateApplicationWizard() {
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string; minPrice?: number; maxPrice?: number; availableUnits?: number }[]>([])
  const [cooldownMs, setCooldownMs] = useState(0)
  const [manualEntry, setManualEntry] = useState(false)

  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<OcrResultDto | null>(null)

  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [faceSimilarity, setFaceSimilarity] = useState<number | null>(null)
  const [pendingSelfie, setPendingSelfie] = useState<File | null>(null)

  const [livenessVideo, setLivenessVideo] = useState<File | null>(null)

  const [ekyc, setEkyc] = useState<EkycState>({ ocr: false, citizenOk: false, face: false, liveness: false })

  const [form, setForm] = useState({
    projectId: '',
    fullName: '',
    citizenId: '',
    occupation: '',
    workPlace: '',
    currentResidence: '',
    permanentAddress: '',
    housingStatus: 'NO_HOUSE' as 'NO_HOUSE' | 'SMALL_HOUSE',
    estimatedMonthlyIncome: '',
  })

  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftStatus, setDraftStatus] = useState<string>('DRAFT')
  const [docs, setDocs] = useState<Record<DocTypeKey, DocUpload | null>>({
    HOUSING_CONDITION_PROOF: null,
    POVERTY_HOUSEHOLD_CERTIFICATE: null,
  })

  const isBusy = busy.length > 0

  useEffect(() => {
    void housingProjectsApi.list().then((data) => {
      const items = extractProjects(data)
        .filter((p) => p.id)
        .map((p) => ({
          id: p.id!,
          name: p.projectName || p.name || 'Dự án',
          minPrice: p.minPrice,
          maxPrice: p.maxPrice,
          availableUnits: p.availableUnits,
        }))
      setProjects(items)
      const presetId = sessionStorage.getItem('createApplicationProjectId')
      if (presetId && items.some((p) => p.id === presetId)) {
        setForm((f) => ({ ...f, projectId: presetId }))
        sessionStorage.removeItem('createApplicationProjectId')
      } else if (items.length === 1) {
        setForm((f) => ({ ...f, projectId: items[0].id }))
      }
    }).catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    const tick = () => setCooldownMs(getOcrCooldownRemainingMs())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => () => {
    if (idCardPreview) URL.revokeObjectURL(idCardPreview)
    if (selfiePreview) URL.revokeObjectURL(selfiePreview)
  }, [idCardPreview, selfiePreview])

  const applyOcrToForm = (ocr: OcrResultDto) => {
    const addr = ocr.address || ocr.home || ''
    setForm((f) => ({
      ...f,
      fullName: ocr.name || f.fullName,
      citizenId: ocr.id || f.citizenId,
      currentResidence: addr || f.currentResidence,
      permanentAddress: addr || f.permanentAddress,
    }))
  }

  const selectIdCard = (file: File) => {
    const err = validateIdImage(file)
    if (err) {
      setMsg({ type: 'error', text: err })
      return
    }
    setMsg(null)
    setManualEntry(false)
    setIdCardFile(file)
    const preview = URL.createObjectURL(file)
    setIdCardPreview((old) => { if (old) URL.revokeObjectURL(old); return preview })
    setOcrResult(null)
    setEkyc((s) => ({ ...s, ocr: false, citizenOk: false, face: false, liveness: false }))
    setFaceSimilarity(null)
    setSelfieFile(null)
    setPendingSelfie(null)
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview)
      setSelfiePreview(null)
    }
  }

  const checkCitizenId = async (citizenId: string): Promise<boolean> => {
    const value = citizenId.trim()
    if (!isValidCitizenId(value)) {
      setMsg({ type: 'error', text: 'Số CCCD phải có 9 hoặc 12 chữ số.' })
      setEkyc((s) => ({ ...s, citizenOk: false }))
      return false
    }
    try {
      await ekycApi.checkCitizenId(value)
      setEkyc((s) => ({ ...s, citizenOk: true }))
      return true
    } catch (err) {
      setEkyc((s) => ({ ...s, citizenOk: false }))
      setMsg({ type: 'error', text: formatEkycError(err) })
      return false
    }
  }

  const runOcr = async () => {
    if (!idCardFile) {
      setMsg({ type: 'error', text: 'Chọn ảnh CCCD trước.' })
      return
    }
    if (cooldownMs > 0) {
      setMsg({ type: 'warning', text: `OCR tạm khóa. Thử lại sau ${formatCooldown(cooldownMs)} hoặc dùng nhập tay.` })
      return
    }

    setBusy('ocr')
    setMsg(null)
    setOcrResult(null)
    setEkyc((s) => ({ ...s, ocr: false, citizenOk: false, face: false }))
    setFaceSimilarity(null)

    try {
      const data = await ekycApi.ocr(idCardFile)
      const ocr = parseOcr(data)
      if (!ocr?.id && !ocr?.name) {
        setMsg({ type: 'error', text: 'Không trích xuất được thông tin. Dùng ảnh mặt trước CCCD rõ nét, không bị lóa hoặc mờ.' })
        return
      }
      setOcrResult(ocr)
      applyOcrToForm(ocr)
      setEkyc((s) => ({ ...s, ocr: true }))
      setManualEntry(false)

      if (ocr.id) {
        const ok = await checkCitizenId(ocr.id)
        if (!ok) return
      }

      setMsg({ type: 'success', text: 'Đọc CCCD thành công. Sang bước xác thực khuôn mặt.' })
    } catch (err) {
      setMsg({ type: 'error', text: formatEkycError(err) })
      if (String(formatEkycError(err)).includes('429')) {
        setOcrCooldown(30)
        setCooldownMs(getOcrCooldownRemainingMs())
      }
    } finally {
      setBusy('')
    }
  }

  const enableManualEntry = () => {
    if (!idCardFile) {
      setMsg({ type: 'error', text: 'Vẫn cần upload ảnh CCCD (để so khớp khuôn mặt ở bước 2).' })
      return
    }
    setManualEntry(true)
    setEkyc((s) => ({ ...s, ocr: false, citizenOk: false }))
    setOcrResult(null)
    setMsg({ type: 'info', text: 'Nhập thông tin CCCD bên dưới, sau đó bấm "Kiểm tra số CCCD".' })
  }

  const verifyManualCitizen = async () => {
    if (!form.fullName.trim()) {
      setMsg({ type: 'error', text: 'Nhập họ và tên trước.' })
      return
    }
    if (!form.currentResidence.trim()) {
      setMsg({ type: 'error', text: 'Nhập nơi ở / thường trú trước.' })
      return
    }
    const ok = await checkCitizenId(form.citizenId)
    if (ok) {
      setForm((f) => ({
        ...f,
        permanentAddress: f.permanentAddress || f.currentResidence,
      }))
      setEkyc((s) => ({ ...s, ocr: true }))
      setMsg({ type: 'success', text: 'CCCD hợp lệ. Sang bước xác thực khuôn mặt.' })
    }
  }

  const queueSelfie = (file: File) => {
    const err = validateSelfieImage(file)
    if (err) {
      setMsg({ type: 'error', text: err })
      return
    }
    setPendingSelfie(file)
    if (selfiePreview) URL.revokeObjectURL(selfiePreview)
    setSelfiePreview(URL.createObjectURL(file))
    setMsg({ type: 'info', text: 'Đã chọn ảnh selfie. Bấm "Xác thực khuôn mặt" để gửi lên hệ thống.' })
  }

  const runFaceMatch = async () => {
    const faceFile = pendingSelfie
    if (!idCardFile) {
      setMsg({ type: 'error', text: 'Cần ảnh CCCD từ bước 1.' })
      return
    }
    if (!faceFile) {
      setMsg({ type: 'error', text: 'Chụp hoặc chọn ảnh selfie trước.' })
      return
    }

    setBusy('face')
    setMsg(null)

    try {
      const data = await ekycApi.faceMatch(faceFile, idCardFile)
      const result = parseFaceMatch(data)
      setFaceSimilarity(result?.similarity ?? null)
      if (!result?.isMatch) {
        setEkyc((s) => ({ ...s, face: false }))
        setMsg({
          type: 'error',
          text: `Khuôn mặt chưa khớp (${formatSimilarity(result?.similarity)}). Chụp lại selfie cùng người trên CCCD, ánh sáng đủ, không đeo khẩu trang.`,
        })
        return
      }
      setSelfieFile(faceFile)
      setEkyc((s) => ({ ...s, face: true }))
      setMsg({ type: 'success', text: `Xác thực khuôn mặt thành công — độ khớp ${formatSimilarity(result?.similarity)}.` })
    } catch (err) {
      setEkyc((s) => ({ ...s, face: false }))
      setMsg({ type: 'error', text: formatEkycError(err) })
    } finally {
      setBusy('')
    }
  }

  const runLiveness = async (videoFile: File) => {
    const selfie = selfieFile ?? pendingSelfie
    if (!selfie) {
      setMsg({ type: 'error', text: 'Hoàn thành xác thực khuôn mặt trước khi kiểm tra liveness.' })
      return
    }
    const err = validateLivenessVideo(videoFile)
    if (err) {
      setMsg({ type: 'error', text: err })
      return
    }

    setBusy('liveness')
    setMsg(null)
    setLivenessVideo(videoFile)

    try {
      const data = await ekycApi.liveness(videoFile, selfie)
      const result = parseLiveness(data)
      if (!result?.isLive) {
        setEkyc((s) => ({ ...s, liveness: false }))
        setMsg({ type: 'error', text: result?.livenessMessage || result?.warning || 'Liveness thất bại. Quay lại video 3–5 giây, nhìn thẳng camera.' })
        return
      }
      setEkyc((s) => ({ ...s, liveness: true }))
      setMsg({ type: 'success', text: 'Xác minh liveness thành công.' })
    } catch (err) {
      setEkyc((s) => ({ ...s, liveness: false }))
      setMsg({ type: 'error', text: formatEkycError(err) })
    } finally {
      setBusy('')
    }
  }

  const step1Ready = !!idCardFile && ekyc.citizenOk && (ekyc.ocr || manualEntry) && form.fullName.trim() && isValidCitizenId(form.citizenId)
  const step2Ready = ekyc.face
  const step3Ready =
    !!form.projectId &&
    form.fullName.trim().length > 0 &&
    isValidCitizenId(form.citizenId) &&
    form.currentResidence.trim().length > 0 &&
    form.permanentAddress.trim().length > 0 &&
    Number(form.estimatedMonthlyIncome) >= 0
  const allDocsUploaded = DOC_TYPE_KEYS.every((k) => docs[k]?.state === 'uploaded')

  const createDraft = async (): Promise<string | null> => {
    setBusy('create')
    setMsg(null)
    try {
      const data = await housingApplicationsApi.create({
        projectId: form.projectId,
        fullName: form.fullName.trim(),
        citizenId: form.citizenId.trim(),
        occupation: form.occupation.trim() || null,
        workPlace: form.workPlace.trim() || null,
        currentResidence: form.currentResidence.trim(),
        permanentAddress: form.permanentAddress.trim(),
        housingStatus: form.housingStatus,
        estimatedMonthlyIncome: parseFloat(form.estimatedMonthlyIncome) || 0,
      })
      const appId = extractApplicationId(data)
      if (!appId) {
        setMsg({ type: 'error', text: 'BE không trả về mã hồ sơ. Vui lòng thử lại.' })
        return null
      }
      setDraftId(appId)
      setDraftStatus('DRAFT')
      return appId
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
      return null
    } finally {
      setBusy('')
    }
  }

  const handleSaveDraft = async () => {
    const id = await createDraft()
    if (id) {
      setMsg({ type: 'success', text: 'Lưu hồ sơ nháp thành công. Bạn có thể quay lại sau để upload tài liệu và nộp.' })
    }
  }

  const uploadOneDoc = async (key: DocTypeKey, file: File): Promise<boolean> => {
    if (!draftId) {
      setMsg({ type: 'error', text: 'Bạn cần lưu nháp hồ sơ trước khi upload tài liệu.' })
      return false
    }
    setDocs((d) => ({ ...d, [key]: { type: key, file, state: 'uploading' } }))
    try {
      const res = await housingApplicationsApi.uploadDocument(draftId, key, file)
      const detail = (res as { documentId?: string; DocumentId?: string } | null) ?? null
      const documentId = String(detail?.documentId ?? detail?.DocumentId ?? '')
      setDocs((d) => ({ ...d, [key]: { type: key, file, documentId, state: 'uploaded' } }))
      return true
    } catch (err) {
      setDocs((d) => ({ ...d, [key]: { type: key, file, state: 'error', error: formatError(err) } }))
      return false
    }
  }

  const handleFilePick = (key: DocTypeKey, file: File | null) => {
    if (!file) return
    const err = validateDocumentFile(file)
    if (err) {
      setMsg({ type: 'error', text: err })
      return
    }
    setDocs((d) => ({ ...d, [key]: { type: key, file, state: draftId ? 'pending' : 'pending' } }))
    setMsg({ type: 'info', text: `Đã chọn ${DOC_TYPE_LABELS[key]}. Bấm "Upload" để gửi lên máy chủ.` })
  }

  const handleUploadAll = async () => {
    if (!draftId) {
      const id = await createDraft()
      if (!id) return
    }
    setBusy('upload-all')
    let ok = true
    for (const key of DOC_TYPE_KEYS) {
      const entry = docs[key]
      if (!entry) continue
      if (entry.state === 'uploaded') continue
      const res = await uploadOneDoc(key, entry.file)
      if (!res) ok = false
    }
    setBusy('')
    if (ok) {
      setMsg({ type: 'success', text: 'Upload tài liệu thành công. Có thể nộp hồ sơ ngay.' })
    } else {
      setMsg({ type: 'error', text: 'Một số tài liệu upload thất bại. Kiểm tra lại và thử lại.' })
    }
  }

  const handleSubmit = async () => {
    if (!draftId) {
      setMsg({ type: 'error', text: 'Bạn cần lưu nháp và upload đầy đủ tài liệu trước khi nộp.' })
      return
    }
    if (!allDocsUploaded) {
      setMsg({ type: 'error', text: 'Vui lòng upload đủ 2 tài liệu PDF trước khi nộp hồ sơ.' })
      return
    }
    setBusy('submit')
    setMsg(null)
    try {
      await housingApplicationsApi.submit(draftId)
      setDraftStatus('SUBMITTED')
      setMsg({ type: 'success', text: 'Nộp hồ sơ thành công. Hệ thống sẽ chuyển sang trang chi tiết.' })
      setTimeout(() => {
        sessionStorage.setItem('applicationId', draftId)
        navigate('application-detail')
      }, 900)
    } catch (err) {
      setMsg({ type: 'error', text: formatError(err) })
    } finally {
      setBusy('')
    }
  }

  const goToStep4 = async () => {
    if (!draftId) {
      const id = await createDraft()
      if (!id) return
    }
    setStep(4)
  }

  const summary = useMemo(
    () => (
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 dark:border-accent/30 dark:bg-accent/10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-accent">Thông tin đã xác thực</p>
        <div className="mt-2 grid gap-1 text-sm dark:text-slate-200">
          <p><span className="text-slate-500 dark:text-slate-400">Họ tên:</span> {form.fullName || '—'}</p>
          <p><span className="text-slate-500 dark:text-slate-400">CCCD:</span> {form.citizenId || '—'}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Khuôn mặt:</span> {ekyc.face ? '✓ Khớp' : '—'}{faceSimilarity != null ? ` (${formatSimilarity(faceSimilarity)})` : ''}</p>
        </div>
      </div>
    ),
    [form.fullName, form.citizenId, ekyc.face, faceSimilarity],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-slate-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-slate-300">
        <p className="flex items-start gap-2 font-semibold text-[#003D7A] dark:text-white">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Quy trình 4 bước
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed">
          <li>Bước 1: Xác thực CCCD (bắt buộc).</li>
          <li>Bước 2: So khớp khuôn mặt với CCCD.</li>
          <li>Bước 3: Điền thông tin đăng ký và chọn dự án.</li>
          <li>Bước 4: Upload 2 tài liệu PDF rồi nộp hồ sơ.</li>
        </ul>
      </div>

      <Stepper step={step} ekyc={ekyc} hasDraft={!!draftId} submitted={draftStatus === 'SUBMITTED'} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section
            key="s1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IdCard className="h-5 w-5 text-primary" />
                  Bước 1 — Xác thực CCCD
                </CardTitle>
                <CardDescription>Upload ảnh CCCD mặt trước rõ nét (≤ 5 MB).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Chọn ảnh CCCD" htmlFor="cccd-file">
                  <input
                    ref={idInputRef}
                    id="cccd-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 dark:file:bg-accent/20 dark:file:text-accent"
                    disabled={isBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) selectIdCard(f)
                      e.target.value = ''
                    }}
                  />
                </FormField>

                {idCardPreview && (
                  <img src={idCardPreview} alt="Ảnh CCCD" className="max-h-56 w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-slate-700" />
                )}

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="accent" disabled={!idCardFile || isBusy || cooldownMs > 0} onClick={() => void runOcr()}>
                    {busy === 'ocr' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đọc CCCD…</> : 'Đọc thông tin CCCD (OCR)'}
                  </Button>
                  <Button type="button" variant="outline" disabled={!idCardFile || isBusy} onClick={enableManualEntry}>
                    Nhập tay thông tin
                  </Button>
                </div>

                {cooldownMs > 0 && (
                  <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    OCR tạm khóa — thử lại sau {formatCooldown(cooldownMs)} hoặc nhập tay.
                  </p>
                )}

                {ocrResult && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Kết quả OCR</p>
                    <ul className="mt-2 grid gap-1 text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                      <li><span className="text-slate-500 dark:text-slate-400">Họ tên:</span> {ocrResult.name || '—'}</li>
                      <li><span className="text-slate-500 dark:text-slate-400">Số CCCD:</span> {ocrResult.id || '—'}</li>
                      <li><span className="text-slate-500 dark:text-slate-400">Ngày sinh:</span> {ocrResult.dob || '—'}</li>
                      <li className="sm:col-span-2"><span className="text-slate-500 dark:text-slate-400">Địa chỉ:</span> {ocrResult.address || ocrResult.home || '—'}</li>
                    </ul>
                  </div>
                )}

                {(manualEntry || ocrResult) && (
                  <div className="space-y-3 rounded-xl border-t border-slate-200 pt-4 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Thông tin từ CCCD {manualEntry && !ocrResult ? '(nhập tay — vui lòng kiểm tra)' : ''}
                    </p>
                    <FormField label="Họ và tên" htmlFor="s1-fullName">
                      <Input
                        id="s1-fullName"
                        value={form.fullName}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, fullName: e.target.value }))
                          if (ekyc.citizenOk) setEkyc((s) => ({ ...s, citizenOk: false }))
                        }}
                      />
                    </FormField>
                    <FormField label="Số CCCD (9 hoặc 12 số)" htmlFor="s1-citizenId">
                      <Input
                        id="s1-citizenId"
                        value={form.citizenId}
                        maxLength={12}
                        inputMode="numeric"
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '')
                          setForm((f) => ({ ...f, citizenId: v }))
                          if (ekyc.citizenOk) setEkyc((s) => ({ ...s, citizenOk: false }))
                        }}
                      />
                    </FormField>
                    <FormField label="Nơi ở / thường trú" htmlFor="s1-address">
                      <Input
                        id="s1-address"
                        value={form.currentResidence}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          currentResidence: e.target.value,
                          permanentAddress: f.permanentAddress || e.target.value,
                        }))}
                      />
                    </FormField>
                    {manualEntry && (
                      <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={() => void verifyManualCitizen()}>
                        Kiểm tra số CCCD
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="button" variant="accent" disabled={!step1Ready || isBusy} onClick={() => { setMsg(null); setStep(2) }}>
                    Tiếp tục xác thực khuôn mặt <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="s2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ScanFace className="h-5 w-5 text-primary" />
                  Bước 2 — Xác thực khuôn mặt
                </CardTitle>
                <CardDescription>Chụp selfie hoặc upload ảnh. Hệ thống sẽ so khớp với ảnh CCCD ở bước 1.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CameraCapture mode="photo" onPhoto={(file) => queueSelfie(file)} />

                <div className="text-center text-xs text-slate-400">hoặc upload ảnh selfie</div>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 dark:file:bg-accent/20 dark:file:text-accent"
                  disabled={isBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) queueSelfie(f)
                    e.target.value = ''
                  }}
                />

                {selfiePreview && (
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                    <img src={selfiePreview} alt="Selfie" className="h-20 w-20 rounded-full border-2 border-white object-cover shadow dark:border-slate-800" />
                    <div className="text-sm">
                      <p className={`font-semibold ${ekyc.face ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {ekyc.face ? '✓ Đã xác thực' : 'Chưa xác thực'}
                      </p>
                      {faceSimilarity != null && <p className="text-slate-500 dark:text-slate-400">Độ khớp: {formatSimilarity(faceSimilarity)}</p>}
                    </div>
                  </div>
                )}

                <Button type="button" variant="accent" disabled={!pendingSelfie || isBusy} onClick={() => void runFaceMatch()}>
                  {busy === 'face' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xác thực…</> : 'Xác thực khuôn mặt'}
                </Button>

                <details className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                  <summary className="cursor-pointer text-sm font-medium dark:text-slate-300">Liveness (tùy chọn)</summary>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Quay video selfie 4 giây sau khi face match thành công.</p>
                  <div className="mt-3">
                    <CameraCapture mode="video" maxVideoSeconds={4} onVideo={(video) => void runLiveness(video)} />
                  </div>
                  {livenessVideo && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {livenessVideo.name} · {ekyc.liveness ? '✓ Đạt' : 'Chưa đạt'}
                    </p>
                  )}
                </details>

                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  <Button type="button" variant="outline" disabled={isBusy} onClick={() => setStep(1)}>← Quay lại</Button>
                  <Button type="button" variant="accent" disabled={!step2Ready || isBusy} onClick={() => { setMsg(null); setStep(3) }}>
                    Điền thông tin hồ sơ <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section
            key="s3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Bước 3 — Thông tin đăng ký
                </CardTitle>
                <CardDescription>Chọn dự án và bổ sung thông tin còn thiếu. Họ tên & CCCD đã xác thực.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary}

                <FormField label="Dự án nhà ở *" htmlFor="projectId">
                  <Select id="projectId" value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} required>
                    <option value="">{projects.length ? 'Chọn dự án' : 'Chưa có dự án'}</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.availableUnits != null ? ` — còn ${p.availableUnits} căn` : ''}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Họ và tên *" htmlFor="fullName">
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      maxLength={100}
                      required
                    />
                  </FormField>
                  <FormField label="Số CCCD *" htmlFor="citizenId">
                    <Input
                      id="citizenId"
                      value={form.citizenId}
                      readOnly
                      className="bg-slate-50 font-mono dark:bg-slate-800/50"
                    />
                  </FormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Nghề nghiệp" htmlFor="occupation">
                    <Input id="occupation" value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} maxLength={200} />
                  </FormField>
                  <FormField label="Nơi làm việc" htmlFor="workPlace">
                    <Input id="workPlace" value={form.workPlace} onChange={(e) => setForm((f) => ({ ...f, workPlace: e.target.value }))} maxLength={500} />
                  </FormField>
                </div>

                <FormField label="Nơi ở hiện tại *" htmlFor="currentResidence">
                  <Input
                    id="currentResidence"
                    value={form.currentResidence}
                    onChange={(e) => setForm((f) => ({ ...f, currentResidence: e.target.value }))}
                    maxLength={500}
                    required
                  />
                </FormField>

                <FormField label="Địa chỉ thường trú / tạm trú *" htmlFor="permanentAddress">
                  <Input
                    id="permanentAddress"
                    value={form.permanentAddress}
                    onChange={(e) => setForm((f) => ({ ...f, permanentAddress: e.target.value }))}
                    maxLength={500}
                    required
                  />
                </FormField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Thực trạng nhà ở *" htmlFor="housingStatus">
                    <Select
                      id="housingStatus"
                      value={form.housingStatus}
                      onChange={(e) => setForm((f) => ({ ...f, housingStatus: e.target.value as typeof form.housingStatus }))}
                      required
                    >
                      {Object.entries(HOUSING_STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Thu nhập hàng tháng (VNĐ) *" htmlFor="estimatedMonthlyIncome">
                    <Input
                      id="estimatedMonthlyIncome"
                      type="number"
                      min={0}
                      step={1000}
                      value={form.estimatedMonthlyIncome}
                      onChange={(e) => setForm((f) => ({ ...f, estimatedMonthlyIncome: e.target.value }))}
                      placeholder="Ví dụ: 12000000"
                      required
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap justify-between gap-2 pt-2">
                  <Button type="button" variant="outline" disabled={isBusy} onClick={() => setStep(2)}>← Quay lại</Button>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={isBusy} onClick={() => void handleSaveDraft()}>
                      {busy === 'create' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang lưu…</> : 'Lưu nháp'}
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      disabled={!step3Ready || isBusy}
                      onClick={() => void goToStep4()}
                    >
                      Tiếp tục upload tài liệu <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {step === 4 && (
          <motion.section
            key="s4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                  Bước 4 — Tài liệu đính kèm
                </CardTitle>
                <CardDescription>Upload 2 tài liệu PDF (tối đa 10 MB / file). Bắt buộc trước khi nộp hồ sơ.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary}
                {!draftId && (
                  <Alert variant="warning">
                    Bạn cần lưu nháp hồ sơ trước khi upload tài liệu.
                  </Alert>
                )}

                <div className="space-y-3">
                  {DOC_TYPE_KEYS.map((key) => {
                    const doc = docs[key]
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40"
                      >
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {DOC_TYPE_LABELS[key]}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            id={`doc-${key}`}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 dark:file:bg-accent/20 dark:file:text-accent"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null
                              handleFilePick(key, f)
                              e.target.value = ''
                            }}
                            disabled={isBusy || !draftId}
                          />
                          {doc && (
                            <button
                              type="button"
                              onClick={() => setDocs((d) => ({ ...d, [key]: null }))}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-red-500 dark:hover:bg-slate-700"
                              aria-label="Xóa file"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {doc && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{doc.file.name}</span>
                            <span className="text-slate-500 dark:text-slate-400">({formatBytes(doc.file.size)})</span>
                            {doc.state === 'uploading' && (
                              <span className="inline-flex items-center gap-1 text-primary dark:text-accent">
                                <Loader2 className="h-3 w-3 animate-spin" /> Đang tải lên…
                              </span>
                            )}
                            {doc.state === 'uploaded' && (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Đã tải lên
                              </span>
                            )}
                            {doc.state === 'error' && (
                              <span className="text-red-600 dark:text-red-400">{doc.error || 'Lỗi upload'}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={isBusy} onClick={() => void handleUploadAll()}>
                    {busy === 'upload-all' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tải lên…</> : (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Tải lên tất cả
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <Button type="button" variant="outline" disabled={isBusy} onClick={() => setStep(3)}>← Quay lại</Button>
                  <Button
                    type="button"
                    variant="accent"
                    disabled={!allDocsUploaded || draftStatus === 'SUBMITTED' || isBusy}
                    onClick={() => void handleSubmit()}
                  >
                    {busy === 'submit' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang nộp…</> : 'Nộp hồ sơ'}
                  </Button>
                </div>

                {draftId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mã hồ sơ: <span className="font-mono">{draftId}</span> · Trạng thái hiện tại: <strong>{draftStatus}</strong>
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      {msg && (
        <Alert variant={msg.type === 'error' ? 'error' : msg.type === 'warning' ? 'warning' : msg.type === 'info' ? 'info' : 'success'}>
          {msg.text}
        </Alert>
      )}
    </div>
  )
}
