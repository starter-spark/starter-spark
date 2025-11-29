"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useState } from "react"

const thumbnails = [
  { id: "knolling", label: "Knolling Photo", description: "All components laid flat" },
  { id: "assembled", label: "Assembled", description: "Complete build" },
  { id: "electronics", label: "Electronics", description: "Wiring detail" },
  { id: "action", label: "In Action", description: "Working demo" },
]

// Default specs shown when product.specs is not available
const defaultSpecs = [
  { label: "Microcontroller", value: "Arduino Nano (ATmega328P)" },
  { label: "Servos", value: "2× SG90, 3× MG996R" },
  { label: "Degrees of Freedom", value: "4 (Base, Shoulder, Elbow, Gripper)" },
  { label: "Power", value: "4× AA Battery Pack" },
  { label: "Build Time", value: "~3 hours" },
  { label: "Skill Level", value: "Beginner friendly" },
]

interface ProductSpotlightProps {
  product: {
    name: string
    slug: string
    description: string | null
    priceCents: number
    specs: Record<string, string> | null
  }
}

export function ProductSpotlightSection({ product }: ProductSpotlightProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const currentThumb = thumbnails[selectedImage]

  // Convert specs object to array format, or use defaults
  const specs = product.specs
    ? Object.entries(product.specs).map(([label, value]) => ({ label, value }))
    : defaultSpecs

  const priceDisplay = (product.priceCents / 100).toFixed(2)

  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-cyan-700 mb-2">Featured Kit</p>
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900">
            {product.name}
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Left - Image (60%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-3/5"
          >
            <div className="relative aspect-[4/3] bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
              {/* Dynamic placeholder based on selection */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-50 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-cyan-700"
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
                  <p className="text-slate-500 font-mono text-sm">
                    {currentThumb.label}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {currentThumb.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Thumbnail strip - clickable */}
            <div className="flex gap-2 mt-4">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={thumb.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-1 aspect-square rounded border flex items-center justify-center transition-all cursor-pointer ${
                    selectedImage === idx
                      ? "bg-cyan-50 border-cyan-700 ring-2 ring-cyan-700/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono ${
                      selectedImage === idx ? "text-cyan-700" : "text-slate-500"
                    }`}
                  >
                    {thumb.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right - Content (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/5"
          >
            <h3 className="font-mono text-xl text-slate-900 mb-4">
              Your First Real Robot
            </h3>

            <div className="space-y-4 text-slate-600 mb-8">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <>
                  <p>
                    Build a fully functional robotic arm from scratch. Learn mechanical
                    assembly, electronics wiring, and Arduino programming—skills that
                    transfer directly to real engineering projects.
                  </p>
                  <p>
                    Each kit includes everything you need: pre-cut acrylic parts,
                    high-torque servos, an Arduino Nano, and our step-by-step digital
                    curriculum with interactive wiring diagrams.
                  </p>
                </>
              )}
            </div>

            {/* Specs Table */}
            <div className="bg-white rounded border border-slate-200 p-4 mb-8">
              <h4 className="font-mono text-sm text-slate-500 mb-3 uppercase tracking-wide">
                Specifications
              </h4>
              <div className="space-y-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-500">{spec.label}</span>
                    <span className="text-slate-900 font-mono">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Starting at</p>
                <p className="text-3xl font-mono text-amber-600">${priceDisplay}</p>
              </div>
              <Link href={`/shop/${product.slug}`}>
                <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
