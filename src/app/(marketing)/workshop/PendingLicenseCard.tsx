'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Package, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  ActionStatusBanner,
  type ActionStatus,
} from '@/components/ui/action-status'
import { formatShortDate } from '@/lib/utils'
import { maskLicenseCode } from '@/lib/masks'

const cardClassName = 'border border-amber-200 bg-amber-50/50 rounded-lg p-4'
const layoutClassName = 'flex items-start gap-4'
const iconWrapClassName =
  'w-12 h-12 rounded bg-amber-100 flex items-center justify-center flex-shrink-0'
const contentClassName = 'flex-1 min-w-0'
const headerRowClassName = 'flex items-start justify-between gap-4'
const titleClassName = 'font-mono font-semibold text-slate-900'
const descriptionClassName = 'text-sm text-slate-600 mt-1 line-clamp-1'
const metaRowClassName = 'flex items-center gap-3 mt-2 text-xs text-slate-500'
const rejectButtonClassName =
  'border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
const claimButtonClassName = 'bg-cyan-700 hover:bg-cyan-600 text-white'

interface ClaimResponse {
  error?: string
  success?: boolean
}

interface PendingLicenseCardProps {
  licenseId: string
  code: string
  productName: string
  productDescription: string | null
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

function PendingActions({
  pendingAction,
  status,
  onReject,
  onClaim,
}: {
  pendingAction: 'claim' | 'reject' | null
  status: ActionStatus
  onReject: () => void
  onClaim: () => void
}) {
  const isDisabled = status !== 'idle' && status !== 'error'

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        disabled={isDisabled}
        className={rejectButtonClassName}
      >
        {pendingAction === 'reject' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <X className="w-4 h-4 mr-1" />
            Reject
          </>
        )}
      </Button>
      <Button
        size="sm"
        onClick={onClaim}
        disabled={isDisabled}
        className={claimButtonClassName}
      >
        {pendingAction === 'claim' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-1" />
            Claim
          </>
        )}
      </Button>
    </div>
  )
}

export function PendingLicenseCard({
  licenseId,
  code,
  productName,
  productDescription,
  purchasedAt,
}: PendingLicenseCardProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'claim' | 'reject' | null>(
    null,
  )
  const [status, setStatus] = useState<ActionStatus>('idle')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current)
      }
    }
  }, [])

  // Mask the code for display (show first and last 4 chars)
  const maskedCode = maskLicenseCode(code, { preserveShort: true })

  const handleAction = (action: 'claim' | 'reject') => {
    setPendingAction(action)
    setStatus('pending')
    setMessage(action === 'claim' ? 'Claiming license…' : 'Rejecting license…')

    fetch('/api/workshop/claim-pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseId, action }),
    })
      .then((res) => res.json() as Promise<ClaimResponse>)
      .then((data) => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
          return
        }

        setStatus('success')
        setMessage(
          action === 'claim'
            ? 'License claimed. Updating your kits…'
            : 'License rejected.',
        )

        if (refreshTimer.current) {
          clearTimeout(refreshTimer.current)
        }
        refreshTimer.current = setTimeout(() => {
          router.refresh()
        }, 900)
      })
      .catch(() => {
        setStatus('error')
        setMessage('Network error. Please try again.')
      })
      .finally(() => {
        setPendingAction(null)
      })
  }

  const purchaseDate = formatShortDate(purchasedAt)

  return (
    <div className={cardClassName}>
      <div className={layoutClassName}>
        {/* Icon */}
        <div className={iconWrapClassName}>
          <Package className="w-6 h-6 text-amber-700" />
        </div>

        {/* Content */}
        <div className={contentClassName}>
          <div className={headerRowClassName}>
            <div>
              <h4 className={titleClassName}>{productName}</h4>
              {productDescription && (
                <p className={descriptionClassName}>{productDescription}</p>
              )}
              <LicenseMeta code={maskedCode} purchaseDate={purchaseDate} />
            </div>

            {/* Actions */}
            <PendingActions
              pendingAction={pendingAction}
              status={status}
              onReject={() => handleAction('reject')}
              onClaim={() => handleAction('claim')}
            />
          </div>

          <ActionStatusBanner
            status={status}
            message={message}
            className="mt-3"
          />
        </div>
      </div>
    </div>
  )
}
