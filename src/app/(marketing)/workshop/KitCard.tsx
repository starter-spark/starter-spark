import { Package, ExternalLink, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatShortDate } from '@/lib/utils'

interface KitCardProps {
  name: string
  slug: string
  description: string
  claimedAt: string | null
  quantity?: number
  compact?: boolean
}

export function KitCard({
  name,
  slug,
  description,
  claimedAt,
  quantity = 1,
  compact = false,
}: KitCardProps) {
  const formattedDate = claimedAt ? formatShortDate(claimedAt) : 'Unknown'

  if (compact) {
    return (
      <Link
        href={`/learn/${slug}`}
        className="flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-700 transition-colors bg-white"
      >
        <div className="relative w-10 h-10 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-cyan-700" />
          {quantity > 1 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-700 text-white text-[10px] font-mono font-bold flex items-center justify-center">
              {quantity}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm text-slate-900 truncate">{name}</h3>
          <p className="text-xs text-slate-500">Claimed {formattedDate}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </Link>
    )
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded border border-slate-200 hover:border-cyan-700 transition-colors bg-white">
      <div className="relative w-12 h-12 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Package className="w-6 h-6 text-cyan-700" />
        {quantity > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-700 text-white text-xs font-mono font-bold flex items-center justify-center">
            {quantity}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-mono text-lg text-slate-900 mb-1">
          {name}
          {quantity > 1 && (
            <span className="text-sm text-slate-500 font-normal ml-2">
              ×{quantity}
            </span>
          )}
        </h3>
        {description && (
          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>Claimed {formattedDate}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        {slug && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono text-xs"
          >
            <Link href={`/learn/${slug}`}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Learn
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
