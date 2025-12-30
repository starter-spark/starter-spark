'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CompactLicenseCard } from './CompactLicenseCard'
import { ClaimedByOtherCard } from './ClaimedByOtherCard'

interface PendingLicense {
  id: string
  code: string
  productName: string
  productDescription: string | null
  purchasedAt: string
}

interface ClaimedByOtherLicense {
  code: string
  productName: string
  purchasedAt: string
}

interface PendingLicensesSectionProps {
  pendingLicenses: PendingLicense[]
  claimedByOtherLicenses: ClaimedByOtherLicense[]
  title: string
  description: string
}

interface BatchResponse {
  success: boolean
  results: {
    licenseId: string
    success: boolean
    error?: string
  }[]
  successCount: number
  errorCount: number
}

const INITIAL_DISPLAY_COUNT = 5

export function PendingLicensesSection({
  pendingLicenses,
  claimedByOtherLicenses,
  title,
  description,
}: PendingLicensesSectionProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)
  const [bulkAction, setBulkAction] = useState<'claim' | 'reject' | null>(null)
  const [bulkStatus, setBulkStatus] = useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle')
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)

  const hasAny =
    pendingLicenses.length > 0 || claimedByOtherLicenses.length > 0

  const displayedLicenses = showAll
    ? pendingLicenses
    : pendingLicenses.slice(0, INITIAL_DISPLAY_COUNT)
  const hiddenCount = pendingLicenses.length - INITIAL_DISPLAY_COUNT
  const allSelected =
    pendingLicenses.length > 0 &&
    pendingLicenses.every((l) => selectedIds.has(l.id))
  const someSelected = selectedIds.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingLicenses.map((l) => l.id)))
    }
  }, [allSelected, pendingLicenses])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  if (!hasAny) return null

  const handleBulkAction = async (action: 'claim' | 'reject') => {
    if (selectedIds.size === 0) return

    setBulkAction(action)
    setBulkStatus('pending')
    setBulkMessage(
      action === 'claim'
        ? `Claiming ${selectedIds.size} license${selectedIds.size > 1 ? 's' : ''}…`
        : `Rejecting ${selectedIds.size} license${selectedIds.size > 1 ? 's' : ''}…`,
    )

    try {
      const response = await fetch('/api/workshop/claim-pending/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseIds: Array.from(selectedIds),
          action,
        }),
      })

      const data = (await response.json()) as BatchResponse

      if (!response.ok) {
        setBulkStatus('error')
        setBulkMessage((data as { error?: string }).error || 'Request failed')
        return
      }

      if (data.errorCount > 0) {
        setBulkStatus('error')
        setBulkMessage(
          `${data.successCount} succeeded, ${data.errorCount} failed`,
        )
      } else {
        setBulkStatus('success')
        setBulkMessage(
          action === 'claim'
            ? `Successfully claimed ${data.successCount} license${data.successCount > 1 ? 's' : ''}!`
            : `Rejected ${data.successCount} license${data.successCount > 1 ? 's' : ''}.`,
        )
      }

      // Refresh after a brief delay (state will reset on re-render with new props)
      setTimeout(() => {
        router.refresh()
      }, 1200)
    } catch {
      setBulkStatus('error')
      setBulkMessage('Network error. Please try again.')
    }
  }

  const isBusy = bulkStatus === 'pending'

  return (
    <div className="bg-amber-50 rounded border border-amber-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h2 className="font-mono text-xl text-slate-900">{title}</h2>
          {pendingLicenses.length > 0 && (
            <span className="text-sm font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              {pendingLicenses.length} pending
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">{description}</p>

      {/* Bulk Actions Toolbar */}
      {pendingLicenses.length > 0 && (
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-amber-200">
          <div className="flex items-center gap-3">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
              disabled={isBusy}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium text-slate-700 cursor-pointer select-none"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </label>
            {someSelected && (
              <span className="text-sm text-slate-500">
                ({selectedIds.size} selected)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleBulkAction('reject')}
              disabled={!someSelected || isBusy}
              className="border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              {bulkAction === 'reject' && isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Reject Selected
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleBulkAction('claim')}
              disabled={!someSelected || isBusy}
              className="bg-cyan-700 hover:bg-cyan-600 text-white"
            >
              {bulkAction === 'claim' && isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Claim Selected
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Status Message */}
      {bulkMessage && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            bulkStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : bulkStatus === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          {bulkMessage}
        </div>
      )}

      {/* License Cards */}
      <div className="space-y-2">
        {displayedLicenses.map((license) => (
          <CompactLicenseCard
            key={license.id}
            licenseId={license.id}
            code={license.code}
            productName={license.productName}
            productDescription={license.productDescription}
            purchasedAt={license.purchasedAt}
            isSelected={selectedIds.has(license.id)}
            onToggleSelect={() => toggleSelect(license.id)}
            isExpanded={expandedIds.has(license.id)}
            onToggleExpand={() => toggleExpanded(license.id)}
            disabled={isBusy}
          />
        ))}

        {/* Show More / Show Less */}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show all {pendingLicenses.length} pending licenses
              </>
            )}
          </button>
        )}

        {/* Claimed by Other */}
        {claimedByOtherLicenses.length > 0 && (
          <div className="pt-4 border-t border-amber-200 mt-4 space-y-2">
            <p className="text-xs text-slate-500 mb-2">
              Claimed by another account:
            </p>
            {claimedByOtherLicenses.map((license) => (
              <ClaimedByOtherCard
                key={license.code}
                code={license.code}
                productName={license.productName}
                purchasedAt={license.purchasedAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
