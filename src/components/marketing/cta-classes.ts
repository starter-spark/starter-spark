import { cn } from '@/lib/utils'

const ctaBase =
  'font-mono whitespace-normal break-words text-center leading-snug h-auto flex-wrap'
const ctaBaseSm = `${ctaBase} py-2`
const ctaBaseMd = `${ctaBase} py-3`
const ctaGhostBase =
  'font-mono whitespace-normal break-words text-left h-auto py-2 flex-wrap'
const ctaAutoWidth = 'w-full sm:w-auto'

export const ctaPrimary = cn(
  ctaBaseMd,
  'bg-cyan-700 hover:bg-cyan-600 text-white',
)
export const ctaPrimarySm = cn(
  ctaBaseSm,
  'bg-cyan-700 hover:bg-cyan-600 text-white',
)
export const ctaPrimaryAuto = cn(ctaPrimary, ctaAutoWidth)
export const ctaPrimaryCompact =
  'bg-cyan-700 hover:bg-cyan-600 text-white font-mono'

export const ctaOutline = cn(
  ctaBaseMd,
  'border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700',
)
export const ctaOutlineAuto = cn(ctaOutline, ctaAutoWidth)
export const ctaOutlineSm = cn(
  ctaBaseSm,
  'border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700',
)

export const ctaGhost = cn(
  ctaGhostBase,
  'text-cyan-700 hover:text-cyan-600',
)
