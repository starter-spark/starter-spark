'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { maskLicenseCode } from '@/lib/masks'

interface CompactLicenseCardProps {
  licenseId: string
  code: string
  productName: string
  productDescription: string | null
  purchasedAt: string
  isSelected: boolean
  onToggleSelect: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  disabled?: boolean
}

export function CompactLicenseCard({
  code,
  productName,
  productDescription,
  purchasedAt,
  isSelected,
  onToggleSelect,
  isExpanded,
  onToggleExpand,
  disabled = false,
}: CompactLicenseCardProps) {
  const maskedCode = maskLicenseCode(code, { preserveShort: true })
  const purchaseDate = formatShortDate(purchasedAt)

  return (
    <div
      className={`border rounded-lg transition-colors ${
        isSelected
          ? 'border-cyan-300 bg-cyan-50/50'
          : 'border-amber-200 bg-amber-50/50'
      }`}
    >
      {/* Compact Row */}
      <div className="flex items-center gap-3 p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          disabled={disabled}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="font-mono text-sm text-slate-600 flex-shrink-0">
            {maskedCode}
          </span>
          <span className="text-slate-400">•</span>
          <span className="font-medium text-slate-900 truncate">
            {productName}
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 hidden sm:inline flex-shrink-0">
            {purchaseDate}
          </span>
        </div>

        {/* Expand/Collapse Button */}
        {productDescription && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors flex-shrink-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Expanded Description */}
      {isExpanded && productDescription && (
        <div className="px-3 pb-3 pt-0">
          <div className="pl-8 border-l-2 border-amber-200 ml-2">
            <p className="text-sm text-slate-600">{productDescription}</p>
            <p className="text-xs text-slate-500 mt-1 sm:hidden">
              Purchased {purchaseDate}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
