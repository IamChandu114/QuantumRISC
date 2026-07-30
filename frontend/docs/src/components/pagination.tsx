import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  previous?: {
    label: string
    href: string
  }
  next?: {
    label: string
    href: string
  }
}

export function Pagination({ previous, next }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
      {previous ? (
        <Link
          href={previous.href}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">{previous.label}</span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={next.href}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
        >
          <span className="hidden sm:inline">{next.label}</span>
          <ChevronRight size={16} />
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
