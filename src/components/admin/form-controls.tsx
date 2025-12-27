import * as React from 'react'
import { cn } from '@/lib/utils'

export const adminLabelClass = 'text-sm font-medium text-slate-900'
export const adminInputClass =
  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2'
export const adminHelperTextClass = 'text-xs text-slate-500'

export function AdminLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn(adminLabelClass, className)} {...props} />
}

export function AdminSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(adminInputClass, className)} {...props} />
}

export function AdminTextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(adminInputClass, className)} {...props} />
}
