"use client"

import { motion } from "motion/react"

interface AboutHeroProps {
  headline?: string
  description?: string
}

export function AboutHero({
  headline = "Making Robotics Education Accessible to Everyone",
  description = "We believe every student deserves the chance to build, code, and create—regardless of their background or resources. That's why we donate 70% of every dollar to local STEM programs.",
}: AboutHeroProps) {
  // Split headline to highlight the second part in cyan
  // Look for text after a colon or newline, otherwise use the whole thing
  const headlineParts = headline.includes(":")
    ? headline.split(":").map((s) => s.trim())
    : [headline]

  return (
    <section className="pt-32 pb-20 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-mono text-cyan-700 mb-4 tracking-wide">
            Our Mission
          </p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-8 leading-tight">
            {headlineParts.length > 1 ? (
              <>
                {headlineParts[0]}:
                <br />
                <span className="text-cyan-700">{headlineParts[1]}</span>
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
