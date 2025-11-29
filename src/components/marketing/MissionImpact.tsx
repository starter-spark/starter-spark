"use client"

import { motion, useInView } from "motion/react"
import { useRef, useEffect, useState } from "react"

export interface Stat {
  key: string
  value: number
  label: string
  suffix: string
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

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  )
}

interface MissionImpactSectionProps {
  stats: Stat[]
}

export function MissionImpactSection({ stats }: MissionImpactSectionProps) {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
            More Than a Kit
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We&apos;re building the next generation of Hawaii&apos;s engineers.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left - Mission Content (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5 space-y-8"
          >
            {/* The Story */}
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Description
              </p>
              <p>
                Description
              </p>
            </div>

            {/* The 70/30 Model Callout */}
            <div className="bg-white rounded border-l-4 border-amber-500 p-6 shadow-sm">
              <h3 className="font-mono text-lg text-slate-900 mb-2">
                Our Commitment
              </h3>
              <p className="text-slate-600">
                <span className="font-mono text-amber-600 font-semibold">
                  70%
                </span>{" "}
                of every dollar goes directly to local STEM charities and school
                robotics programs.{" "}
                <span className="font-mono text-slate-500">30%</span> funds new kit
                development and operations.
              </p>
              <p className="text-slate-500 text-sm mt-3">
                Your purchase directly impacts Hawaii&apos;s next generation of
                engineers.
              </p>
            </div>

            {/* Impact Stats - Dynamic from database */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.key} className="text-center">
                  <div className="text-4xl font-mono text-cyan-700 mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right - Photo Gallery (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/5"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* Photo placeholders - replace with actual images */}
              {[
                "FTC Competition",
                "Workshop",
                "Team Photo",
                "Student Building",
                "Presentation",
              ].map((label, idx) => (
                <div
                  key={label}
                  className={`
                    relative bg-white rounded border border-slate-200 overflow-hidden
                    ${idx === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"}
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center p-2">
                      <div className="w-8 h-8 mx-auto mb-1 rounded bg-slate-200 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-[10px] font-mono">
                        {label}
                      </p>
                    </div>
                  </div>
                  {/* Uncomment when we have actual images */}
                  {/* <Image
                    src={`/assets/images/outreach-${idx + 1}.jpg`}
                    alt={label}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  /> */}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
