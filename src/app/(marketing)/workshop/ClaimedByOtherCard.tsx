'use client'

import { Package, UserX } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { maskLicenseCode } from '@/lib/masks'

const cardClassName =
  'border border-slate-200 bg-slate-50 rounded-lg p-4 opacity-75'
const layoutClassName = 'flex items-start gap-4'
const iconWrapClassName =
  'w-12 h-12 rounded bg-slate-200 flex items-center justify-center flex-shrink-0'
const contentClassName = 'flex-1 min-w-0'
const headerRowClassName = 'flex items-start justify-between gap-4'
const titleClassName = 'font-mono font-semibold text-slate-600 line-through'
const metaRowClassName = 'flex items-center gap-3 mt-2 text-xs text-slate-500'
const badgeClassName =
  'flex items-center gap-1.5 px-2 py-1 rounded bg-slate-200 text-slate-600 text-xs font-mono'

interface ClaimedByOtherCardProps {
  code: string
  productName: string
  purchasedAt: string
}

function LicenseMeta({
  code,
  purchaseDate,
}: {
  code: string
  purchaseDate: string
}) {
  return (
    <div className={metaRowClassName}>
      <span className="font-mono">{code}</span>
      <span>Purchased {purchaseDate}</span>
    </div>
  )
}

function LicenseStatusBadge() {
  return (
    <div className={badgeClassName}>
      <UserX className="w-3.5 h-3.5" />
      <span>Claimed by another</span>
    </div>
  )
}

export function ClaimedByOtherCard({
  code,
  productName,
  purchasedAt,
}: ClaimedByOtherCardProps) {
  // Mask the code for display (show first and last 4 chars)
  const maskedCode = maskLicenseCode(code, { preserveShort: true })

  const purchaseDate = formatShortDate(purchasedAt)

  return (
    <div className={cardClassName}>
      <div className={layoutClassName}>
        {/* Icon */}
        <div className={iconWrapClassName}>
          <Package className="w-6 h-6 text-slate-500" />
        </div>

        {/* Content */}
        <div className={contentClassName}>
          <div className={headerRowClassName}>
            <div>
              <h4 className={titleClassName}>{productName}</h4>
              <LicenseMeta code={maskedCode} purchaseDate={purchaseDate} />
            </div>

            {/* Status badge */}
            <LicenseStatusBadge />
          </div>
        </div>
      </div>
    </div>
  )
}
