"use client"

import { Button } from "@/components/ui/button"
import { Code, MessageCircle, ArrowRight } from "lucide-react"
import { motion, useInView } from "motion/react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"

export interface LearningPreviewSectionProps {
  title?: string
  description?: string
  block1Title?: string
  block1Description1?: string
  block1Description2?: string
  block1Cta?: string
  block2Title?: string
  block2Description1?: string
  block2Description2?: string
  block2Cta?: string
}

// Typing animation component
function TypeWriter({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const timeout = setTimeout(() => {
      setIsTyping(true)
      let i = 0
      const typeChar = () => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1))
          i++
          // Natural typing: variable delay based on character
          const char = text[i - 1]
          let delay = 30 + Math.random() * 50 // Base delay 30-80ms
          if (char === " ") delay = 20 + Math.random() * 30 // Faster for spaces
          if (char === "." || char === ";" || char === "{" || char === "}") {
            delay = 100 + Math.random() * 100 // Pause after punctuation
          }
          setTimeout(typeChar, delay)
        } else {
          setIsTyping(false)
        }
      }
      typeChar()
    }, startDelay)

    return () => { clearTimeout(timeout); }
  }, [isInView, text, startDelay])

  return (
    <span ref={ref}>
      {displayText}
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  )
}

export function LearningPreviewSection({
  title = "Learn by Doing",
  description = "Our interactive platform guides you from unboxing to your first programmed movement.",
  block1Title = "Step-by-Step Digital Guides",
  block1Description1 = "Each lesson builds on the last, taking you from basic assembly through advanced programming. Our interactive diagrams show exactly where each wire connects, and you can hover over components to learn what they do.",
  block1Description2 = "The built-in code editor lets you write, test, and upload your programs directly from the browser. Real-time syntax highlighting and error checking help you learn proper coding practices from day one.",
  block1Cta = "Start Learning",
  block2Title = "Expert Support When You Need It",
  block2Description1 = "Stuck on a step? Our community forum, The Lab, connects you with fellow builders and our support team. Most questions get answered within hours, not days.",
  block2Description2 = "Staff members actively monitor discussions and provide verified solutions. Every question helps build our knowledge base for future builders.",
  block2Cta = "Visit The Lab",
}: LearningPreviewSectionProps) {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
            {title}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>

        {/* Block 1: Image Left, Text Right */}
        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            {/* Platform Screenshot Placeholder */}
            <div className="relative aspect-[4/3] bg-slate-900 rounded-lg border border-slate-700 shadow-xl overflow-hidden">
              {/* Fake IDE Header */}
              <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-3 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-4 text-xs text-slate-500 font-mono">
                  lesson-03-servo-control.ino
                </span>
              </div>
              {/* Animated Code Content */}
              <div className="p-4 font-mono text-xs text-slate-300">
                <pre className="whitespace-pre-wrap">
                  <TypeWriter
                    text={`#include <Servo.h>

// Create servo object
Servo baseServo;

void setup() {
  baseServo.attach(9);
}

void loop() {
  baseServo.write(90);
  delay(1000);
}`}
                    startDelay={500}
                  />
                </pre>
              </div>
              {/* Overlay label */}
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-cyan-700/90 text-white text-xs font-mono rounded">
                Interactive Code Editor
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-cyan-700" />
            </div>
            <h3 className="font-mono text-2xl text-slate-900 mb-4">
              {block1Title}
            </h3>
            <p className="text-slate-600 mb-4 leading-relaxed">
              {block1Description1}
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              {block1Description2}
            </p>
            <Button asChild className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
              <Link href="/learn">
                {block1Cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Block 2: Text Left, Image Right */}
        <div className="flex flex-col-reverse lg:flex-row gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-cyan-700" />
            </div>
            <h3 className="font-mono text-2xl text-slate-900 mb-4">
              {block2Title}
            </h3>
            <p className="text-slate-600 mb-4 leading-relaxed">
              {block2Description1}
            </p>
            <p className="text-slate-600 mb-6 leading-relaxed">
              {block2Description2}
            </p>
            <Button
              asChild
              variant="outline"
              className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
            >
              <Link href="/community">
                {block2Cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            {/* Community Screenshot Placeholder */}
            <div className="relative bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
              {/* Fake Forum Header */}
              <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
                <span className="text-sm font-mono text-slate-600">
                  The Lab - Community Q&A
                </span>
              </div>
              {/* Fake Question */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        @robotenthusiast
                      </span>
                      <span className="text-xs text-slate-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">
                      My servo keeps jittering when it holds a position. I&apos;m
                      using the code from lesson 3...
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        #hardware
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        #servo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Verified Answer */}
              <div className="p-4 bg-green-50/50 border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-cyan-700">SS</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">
                        @username
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded font-mono">
                        Staff
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        ✓ Verified
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      This is usually a power issue. Try using a separate 5V supply
                      for the servos instead of the Arduino&apos;s 5V pin...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
