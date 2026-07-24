import { useCallback, useState, type DragEvent, type ReactNode } from 'react'
import { Upload } from 'lucide-react'
import { validateDocumentFile } from '@/lib/ekyc-helpers'

export function FileDropzone({
  onFile,
  disabled,
  accept = 'application/pdf,.pdf',
  label = 'Kéo thả file PDF vào đây, hoặc bấm để chọn',
  hint = 'Chỉ chấp nhận PDF, tối đa 10 MB',
  error,
}: {
  onFile: (file: File) => void
  disabled?: boolean
  accept?: string
  label?: string
  hint?: string
  error?: string | null
}) {
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      const err = validateDocumentFile(file)
      if (err) {
        setLocalError(err)
        return
      }
      setLocalError(null)
      onFile(file)
    },
    [onFile],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-2">
      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800/40'
        }`}
      >
        <Upload className={`h-8 w-8 ${dragOver ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
        <input
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {(error || localError) && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error || localError}</p>
      )}
    </div>
  )
}

export function DropzoneHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-500 dark:text-slate-400">{children}</p>
}
