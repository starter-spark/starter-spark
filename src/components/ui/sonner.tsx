'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': '#ecfdf5',
          '--success-text': '#065f46',
          '--success-border': '#a7f3d0',
          '--error-bg': '#fef2f2',
          '--error-text': '#991b1b',
          '--error-border': '#fecaca',
          '--warning-bg': '#fffbeb',
          '--warning-text': '#92400e',
          '--warning-border': '#fde68a',
          '--info-bg': '#ecfeff',
          '--info-text': '#155e75',
          '--info-border': '#a5f3fc',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
