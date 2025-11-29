"use client"

import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "motion/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRef } from "react"

// Lazy load the 3D component
const HeroArm = dynamic(() => import("@/components/3d/HeroArm"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-700 font-mono text-xs space-y-2">
      <div className="w-12 h-12 border border-cyan-700 border-t-cyan-400 animate-spin rounded-full" />
      <span>Loading 3D model...</span>
    </div>
  ),
})

export function HeroSection() {
  const targetRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={targetRef} className="relative min-h-screen flex flex-col lg:flex-row items-center pt-20 lg:pt-0 overflow-hidden bg-slate-50 border-b border-slate-200">

      {/* Left Content */}
      <motion.div 
        style={{ y, opacity }}
        className="w-full lg:w-1/2 px-6 lg:px-20 z-10 flex flex-col justify-center h-full space-y-8 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="pointer-events-auto relative"
        >
          {/* Decorative Line */}
          <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-cyan-700 to-transparent opacity-30 hidden lg:block" />
          
          <p className="text-sm font-mono text-cyan-700 mb-4 tracking-wide">
            Robotics Education from Hawaii
          </p>

          <h1 className="font-mono text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
            Early Access to<br />
            <span className="text-cyan-700">Real Tech Skills</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-lg leading-relaxed font-sans mb-4">
            With components like Arduino and more advanced boards, servos, and code, 
            students get exposure to real tools engineers use every day, 
            all in a way that’s beginner-friendly and rewarding.
          </p>

          <p className="text-sm text-slate-500 font-mono">
            v1.0 • Open Source Hardware • 70% to STEM Charities
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex gap-4 pointer-events-auto"
        >
          <Link href="/shop">
            <Button size="lg" className="h-14 px-8 bg-cyan-700 hover:bg-cyan-600 text-white font-mono tracking-wider rounded-none shadow-sm cursor-pointer">
              Shop Kits
            </Button>
          </Link>
          <Link href="/learn">
            <Button variant="outline" size="lg" className="h-14 px-8 border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono tracking-wider rounded-none cursor-pointer">
              View Documentation
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Right Visual (3D) */}
      <div className="w-full lg:w-1/2 h-[60vh] lg:h-screen relative">
        {/* Gradient to fade model into background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 z-10 pointer-events-none" />
        
        {/* Technical crosshairs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-slate-200 pointer-events-none z-0">
           <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-700/30" />
           <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-700/30" />
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-700/30" />
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-700/30" />
        </div>
        <HeroArm className="w-full h-full" />
      </div>
    </section>
  )
}