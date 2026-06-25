'use client'

import Image from 'next/image'
import { motion, useInView } from 'motion/react'
import { useRef, useEffect, useState } from 'react'
import { SectionIntro } from './SectionIntro'

export interface Stat {
  key: string
  value: number
  label: string
  suffix: string
}

export interface MissionContentProps {
  title?: string
  subtitle?: string
  story1?: string
  story2?: string
  commitmentTitle?: string
  commitmentText?: string
  commitmentSubtext?: string
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)

      return () => {
        clearInterval(timer)
      }
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  )
}

interface MissionImpactSectionProps extends MissionContentProps {
  stats: Stat[]
}

export function MissionImpactSection({
  stats,
  title = 'More Than a Kit',
  subtitle = 'We built this because we wanted it to exist. Everything we make is designed for students who are just starting out.',
  story1 = 'StarterSpark started as a little project to help our old local elementary school FLL team. We realized there was nothing good for beginners, so we started making it ourselves. A lot of testing, a lot of broken parts, and eventually something that actually works.',
  story2 = 'Every kit we ship has been tested by real students. Not just us. We bring the kits to schools and run workshops to figure out what breaks and what works. The stuff that makes it into the kit is what actually survived that process.',
  commitmentTitle = 'Open Source',
  commitmentText = 'Hardware schematics, 3D print files, and curriculum are all open source. Everything is on GitHub. You do not need to buy the kit to use what we built.',
  commitmentSubtext = 'If you want to build it yourself, go for it.',
}: MissionImpactSectionProps) {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <SectionIntro title={title} description={subtitle} />

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5 space-y-8 min-w-0"
          >
            {/* Story */}
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p className="break-words">{story1}</p>
              <p className="break-words">{story2}</p>
            </div>

            {/* 70/30 model */}
            <div className="bg-white rounded border-l-4 border-cyan-700 p-6 shadow-sm">
              <h3 className="font-mono text-lg text-slate-900 mb-2 break-words">
                {commitmentTitle}
              </h3>
              <p className="text-slate-600 break-words">{commitmentText}</p>
              <p className="text-slate-500 text-sm mt-3 break-words">
                {commitmentSubtext}
              </p>
            </div>

            {/* Stats (DB) */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.key} className="text-center">
                  <div className="text-4xl font-mono text-cyan-700 mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-500 break-words">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/5"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Placeholders */}
              {[
                { label: 'Elementary Outreach', caption: 'Running a workshop at a local elementary school' },
                { label: 'Hands-on Workshop', caption: 'Students wiring their first circuits' },
                { label: 'Student Collaboration', caption: 'Working through the build together' },
              ].map(({ label, caption }, idx) => (
                <div
                  key={label}
                  className={`
                    relative group bg-white rounded border border-slate-200 overflow-hidden
                    ${idx === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}
                  `}
                >
                  <Image
                    src={`/assets/images/outreach-${idx + 1}.jpg`}
                    alt={label}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div>
                      <p className="text-white font-medium text-sm">{label}</p>
                      <p className="text-white/70 text-xs">{caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
