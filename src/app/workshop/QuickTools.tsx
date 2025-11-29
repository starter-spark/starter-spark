"use client"

import { useState } from "react"
import { Calculator, Cpu, BookOpen } from "lucide-react"
import Link from "next/link"
import { ServoCalculator } from "./ServoCalculator"
import { ArduinoPinout } from "./ArduinoPinout"

export function QuickTools() {
  const [showServoCalc, setShowServoCalc] = useState(false)
  const [showPinout, setShowPinout] = useState(false)

  return (
    <>
      <div className="bg-white rounded border border-slate-200 p-6">
        <h3 className="font-mono text-lg text-slate-900 mb-4">Quick Tools</h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowServoCalc(true)}
            className="cursor-pointer w-full flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Calculator className="w-5 h-5 text-cyan-700" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Servo Calculator
              </p>
              <p className="text-xs text-slate-500">Angle to pulse width</p>
            </div>
          </button>
          <button
            onClick={() => setShowPinout(true)}
            className="cursor-pointer w-full flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Cpu className="w-5 h-5 text-cyan-700" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Arduino Pinout
              </p>
              <p className="text-xs text-slate-500">Quick reference</p>
            </div>
          </button>
          <Link
            href="/learn"
            className="w-full flex items-center gap-3 p-3 rounded border border-slate-200 hover:border-cyan-700 hover:bg-slate-50 transition-colors text-left"
          >
            <BookOpen className="w-5 h-5 text-cyan-700" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Documentation
              </p>
              <p className="text-xs text-slate-500">Guides & tutorials</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <ServoCalculator isOpen={showServoCalc} onClose={() => setShowServoCalc(false)} />
      <ArduinoPinout isOpen={showPinout} onClose={() => setShowPinout(false)} />
    </>
  )
}
