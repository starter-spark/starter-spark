'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  GraduationCap,
  Heart,
  MapPin,
  Package,
  Shield,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from './SectionIntro'

// Icon vocabulary for differentiator_card entries; keep in sync with the
// registry's icon options.
const ICONS: Record<string, LucideIcon> = {
  package: Package,
  'graduation-cap': GraduationCap,
  users: Users,
  'map-pin': MapPin,
  wrench: Wrench,
  heart: Heart,
  zap: Zap,
  shield: Shield,
}

export interface DifferentiatorCard {
  key: string
  title: string
  description: string
  icon: string
}

export interface DifferentiatorsSectionProps {
  title: string
  description: string
  cards: DifferentiatorCard[]
}

export function DifferentiatorsSection({
  title,
  description,
  cards,
}: DifferentiatorsSectionProps) {
  if (cards.length === 0) return null

  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionIntro title={title} description={description} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const Icon = ICONS[card.icon] ?? Package
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all duration-200">
                  <CardContent className="p-6 min-w-0">
                    <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-cyan-700" />
                    </div>
                    <h3 className="font-mono text-lg text-slate-900 mb-2 break-words">
                      {card.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed break-words">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
