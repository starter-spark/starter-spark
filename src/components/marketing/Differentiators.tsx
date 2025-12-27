'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package, GraduationCap, Users, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { SectionIntro } from './SectionIntro'

interface DifferentiatorCard {
  icon: LucideIcon
  title: string
  description: string
}

export interface DifferentiatorsSectionProps {
  title?: string
  description?: string
  card1Title?: string
  card1Description?: string
  card2Title?: string
  card2Description?: string
  card3Title?: string
  card3Description?: string
  card4Title?: string
  card4Description?: string
}

export function DifferentiatorsSection({
  title = 'Why StarterSpark?',
  description = 'We built the kit we wished existed when we started learning robotics.',
  card1Title = 'Complete Package',
  card1Description = 'Everything you need in one box: pre-cut parts, electronics, fasteners, and our step-by-step digital curriculum. No hunting for components or compatibility issues.',
  card2Title = 'Interactive Curriculum',
  card2Description = 'Learn by doing with our web-based platform featuring interactive wiring diagrams, code editors with real-time feedback, and progress tracking across lessons.',
  card3Title = 'Support for Schools and Clubs',
  card3Description = "We offer bulk discounts and classroom-ready kits to help educators bring hands-on STEM learning to their students. Whether you're running a robotics club, teaching a STEM unit, or hosting a workshop, StarterSpark provides guidance, resources, and affordable tools to make it happen.",
  card4Title = 'Hawaii Roots',
  card4Description = 'Founded by students from Hawaii who wanted to give back. Every kit sold directly supports local STEM education programs and school robotics teams across the islands.',
}: DifferentiatorsSectionProps) {
  const differentiators: DifferentiatorCard[] = [
    { icon: Package, title: card1Title, description: card1Description },
    { icon: GraduationCap, title: card2Title, description: card2Description },
    { icon: Users, title: card3Title, description: card3Description },
    { icon: MapPin, title: card4Title, description: card4Description },
  ]

  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionIntro title={title} description={description} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {differentiators.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all duration-200">
                <CardContent className="p-6 min-w-0">
                  <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-cyan-700" />
                  </div>
                  <h3 className="font-mono text-lg text-slate-900 mb-2 break-words">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed break-words">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
