'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  showItemCount?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemCount = false,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * (itemsPerPage ?? 0) + 1
  const endItem = Math.min(currentPage * (itemsPerPage ?? 0), totalItems ?? 0)

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-slate-600">
        {showItemCount && totalItems && itemsPerPage ? (
          <>
            Showing {startItem}-{endItem} of {totalItems}
          </>
        ) : (
          <>
            Page {currentPage} of {totalPages}
          </>
        )}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// Server-side pagination helper that uses URL search params
interface UrlPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  baseUrl: string
  pageParamName?: string
  showItemCount?: boolean
  className?: string
}

export function UrlPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  baseUrl,
  pageParamName = 'page',
  showItemCount = false,
  className = '',
}: UrlPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const startItem = (currentPage - 1) * (itemsPerPage ?? 0) + 1
  const endItem = Math.min(currentPage * (itemsPerPage ?? 0), totalItems ?? 0)

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, 'http://localhost')
    if (page > 1) {
      url.searchParams.set(pageParamName, String(page))
    } else {
      url.searchParams.delete(pageParamName)
    }
    return `${url.pathname}${url.search}`
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-slate-600">
        {showItemCount && totalItems && itemsPerPage ? (
          <>
            Showing {startItem}-{endItem} of {totalItems}
          </>
        ) : (
          <>
            Page {currentPage} of {totalPages}
          </>
        )}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <a href={getPageUrl(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
        )}
        {currentPage < totalPages ? (
          <Button variant="outline" size="sm" asChild>
            <a href={getPageUrl(currentPage + 1)}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
