'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface SectionIntroProps {
  title: string
  description?: string
  eyebrow?: string
  align?: 'center' | 'left'
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  eyebrowClassName?: string
}

export function SectionIntro({
  title,
  description,
  eyebrow,
  align = 'center',
  className,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
}: SectionIntroProps) {
  const isCentered = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(isCentered ? 'text-center' : 'text-left', 'mb-16', className)}
    >
      {eyebrow && (
        <p
          className={cn(
            'text-sm font-mono text-cyan-700 mb-2 break-words',
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'font-mono text-3xl lg:text-4xl text-slate-900 mb-4 break-words',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'text-slate-600 max-w-2xl break-words',
            isCentered && 'mx-auto',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  )
}
