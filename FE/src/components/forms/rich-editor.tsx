import { useEffect, useState } from 'react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { mediaApi } from '@/api/media'

class MediaUploadAdapter {
  private loader: { file: Promise<File>; abort: () => void }

  constructor(loader: { file: Promise<File> }) {
    this.loader = {
      file: Promise.resolve(loader.file),
      abort: () => {
        /* no-op */
      },
    }
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then(async (file) => {
      const { url } = await mediaApi.uploadImage(file)
      return { default: url }
    })
  }

  abort(): void {
    this.loader.abort()
  }
}

function MediaUploadAdapterPlugin(editor: unknown) {
  const e = editor as {
    plugins: { get(name: string): { createUploadAdapter: (loader: { file: Promise<File> }) => MediaUploadAdapter } }
  }
  e.plugins.get('FileRepository').createUploadAdapter = (loader) => new MediaUploadAdapter(loader)
}

export function RichEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (html: string) => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="min-h-[260px] rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500">
        Đang tải trình soạn thảo...
      </div>
    )
  }

  const Editor = ClassicEditor as unknown as React.ComponentType<{
    config?: Record<string, unknown>
    data?: string
    onReady?: (editor: unknown) => void
    onChange?: (event: unknown, editor: { getData: () => string }) => void
  }>

  return (
    <div className="ckeditor-shell overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 [&_.ck-editor__main]:!min-h-[260px] [&_.ck-editor__main]:!max-h-[480px] [&_.ck.ck-editor]:!border-0 [&_.ck.ck-editor]:!shadow-none [&_.ck-content]:!min-h-[260px]">
      <Editor
        config={{
          extraPlugins: [MediaUploadAdapterPlugin],
          language: 'vi',
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            '|',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bulletedList',
            'numberedList',
            'todoList',
            '|',
            'alignment',
            'outdent',
            'indent',
            '|',
            'link',
            'blockQuote',
            'codeBlock',
            'insertTable',
            '|',
            'imageUpload',
            'mediaEmbed',
            'horizontalLine',
            '|',
            'undo',
            'redo',
          ],
          image: {
            toolbar: [
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
              '|',
              'toggleImageCaption',
              'imageTextAlternative',
              '|',
              'linkImage',
            ],
          },
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
          },
        }}
        data={value}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  )
}