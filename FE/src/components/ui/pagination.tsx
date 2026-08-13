import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  pageIndex: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ pageIndex, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (pageIndex > 3) pages.push('...')
    for (let i = Math.max(2, pageIndex - 1); i <= Math.min(totalPages - 1, pageIndex + 1); i++) {
      pages.push(i)
    }
    if (pageIndex < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Phân trang">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex - 1)}
        disabled={pageIndex <= 1}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === pageIndex ? 'accent' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pageIndex + 1)}
        disabled={pageIndex >= totalPages}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
