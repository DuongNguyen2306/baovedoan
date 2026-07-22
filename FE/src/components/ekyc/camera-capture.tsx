import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Square, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Mode = 'photo' | 'video'

export function CameraCapture({
  mode,
  maxVideoSeconds = 4,
  onPhoto,
  onVideo,
  className,
}: {
  mode: Mode
  maxVideoSeconds?: number
  onPhoto?: (file: File) => void
  onVideo?: (file: File) => void
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [active, setActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [videoReady, setVideoReady] = useState(false)

  // Gắn stream vào video element khi stream sẵn sàng và video element đã mount.
  // Dọn srcObject khi active=false để tránh frame cũ hiển thị.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!active || !videoReady) {
      video.srcObject = null
      return
    }
    if (!streamRef.current) return
    video.srcObject = streamRef.current
    video.setAttribute('playsinline', 'true')
    video.muted = true
    video.play().catch((err) => console.warn('video.play() rejected:', err))
  }, [active, videoReady])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setActive(false)
    setRecording(false)
    setCountdown(0)
    setVideoReady(false)
  }, [])

  useEffect(() => () => stopStream(), [stopStream])

  const startCamera = async () => {
    setError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Trình duyệt không hỗ trợ camera. Vui lòng dùng upload file.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video',
      })
      streamRef.current = stream
      // useEffect sẽ tự gắn stream vào video và play.
      setActive(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      let detail = 'Không mở được camera. Hãy cho phép quyền camera hoặc dùng upload file.'
      if (/Permission|NotAllowed|denied/i.test(msg)) {
        detail = 'Bạn đã chặn quyền truy cập camera. Nhấp vào biểu tượng camera/khóa trong thanh URL để cho phép, hoặc dùng upload file.'
      } else if (/NotFound|DevicesNotFound|NotFoundError/i.test(msg)) {
        detail = 'Không tìm thấy thiết bị camera. Vui lòng kiểm tra kết nối hoặc dùng upload file.'
      } else if (/NotReadable|InUse|GenericError/i.test(msg)) {
        detail = 'Camera đang được ứng dụng khác sử dụng. Hãy đóng các ứng dụng đó rồi thử lại, hoặc dùng upload file.'
      } else if (/Secure|HTTPS|localhost/i.test(msg)) {
        detail = 'Camera yêu cầu HTTPS. Hãy chạy app trên localhost (http://localhost:xxxx) hoặc dùng upload file.'
      } else if (/Overconstrained|Constraint/i.test(msg)) {
        detail = 'Camera không hỗ trợ độ phân giải yêu cầu. Thử dùng upload file.'
      }
      setError(detail)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob || !onPhoto) return
      onPhoto(new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream || !onVideo) return
    chunksRef.current = []
    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
      onVideo(new File([blob], `liveness-${Date.now()}.${ext}`, { type: blob.type }))
      setRecording(false)
      setCountdown(0)
    }
    recorder.start()
    setRecording(true)
    setCountdown(maxVideoSeconds)
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer)
          if (recorder.state === 'recording') recorder.stop()
          return 0
        }
        return c - 1
      })
    }, 1000)
    window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, maxVideoSeconds * 1000)
  }

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-slate-700">
        {active ? (
          <video
            ref={(el) => {
              videoRef.current = el
              if (el) setVideoReady(true)
            }}
            className="aspect-video w-full bg-black object-cover"
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              v.play().catch((err) => console.warn('autoplay play() rejected:', err))
            }}
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">
            Camera chưa bật
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!active ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void startCamera()}>
            <Camera className="mr-1.5 h-4 w-4" /> Bật camera
          </Button>
        ) : (
          <>
            {mode === 'photo' && (
              <Button type="button" variant="accent" size="sm" onClick={capturePhoto}>
                <Camera className="mr-1.5 h-4 w-4" /> Chụp selfie
              </Button>
            )}
            {mode === 'video' && (
              <Button type="button" variant="accent" size="sm" disabled={recording} onClick={startRecording}>
                <Video className="mr-1.5 h-4 w-4" />
                {recording ? `Đang quay ${countdown}s...` : `Quay video ${maxVideoSeconds}s`}
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={stopStream}>
              <Square className="mr-1.5 h-4 w-4" /> Tắt camera
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function pickMimeType(): string {
  const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}
