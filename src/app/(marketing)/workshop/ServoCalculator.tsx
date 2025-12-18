"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Calculator, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ServoCalculatorProps {
  isOpen: boolean
  onClose: () => void
}

export function ServoCalculator({ isOpen, onClose }: ServoCalculatorProps) {
  const [angle, setAngle] = useState<string>("90")
  const [minPulse, setMinPulse] = useState<string>("500")
  const [maxPulse, setMaxPulse] = useState<string>("2500")
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    // Focus the dialog when opened
    dialogRef.current?.focus()

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const calculatePulseWidth = useCallback(() => {
    const angleNum = parseFloat(angle) || 0
    const minNum = parseFloat(minPulse) || 500
    const maxNum = parseFloat(maxPulse) || 2500

    // Clamp angle between 0 and 180
    const clampedAngle = Math.max(0, Math.min(180, angleNum))

    // Linear interpolation: pulse = min + (angle/180) * (max - min)
    const pulseWidth = minNum + (clampedAngle / 180) * (maxNum - minNum)
    return Math.round(pulseWidth)
  }, [angle, minPulse, maxPulse])

  const calculateDutyCycle = useCallback(() => {
    // For 50Hz PWM (20ms period), duty cycle = (pulse / 20000) * 100
    const pulseWidth = calculatePulseWidth()
    return ((pulseWidth / 20000) * 100).toFixed(2)
  }, [calculatePulseWidth])

  const reset = () => {
    setAngle("90")
    setMinPulse("500")
    setMaxPulse("2500")
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="servo-calculator-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white rounded-lg border border-slate-200 w-full max-w-md shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-700" />
            <h2 id="servo-calculator-title" className="font-mono text-lg text-slate-900">Servo Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Angle Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Servo Angle (0° - 180°)
            </label>
            <Input
              type="number"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              min={0}
              max={180}
              className="font-mono"
              placeholder="90"
            />
          </div>

          {/* Pulse Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Pulse (μs)
              </label>
              <Input
                type="number"
                value={minPulse}
                onChange={(e) => setMinPulse(e.target.value)}
                className="font-mono"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Pulse (μs)
              </label>
              <Input
                type="number"
                value={maxPulse}
                onChange={(e) => setMaxPulse(e.target.value)}
                className="font-mono"
                placeholder="2500"
              />
            </div>
          </div>

          {/* Results */}
          <div className="bg-slate-50 rounded border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pulse Width:</span>
              <span className="font-mono text-lg text-cyan-700 font-semibold">
                {calculatePulseWidth()} μs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Duty Cycle (50Hz):</span>
              <span className="font-mono text-lg text-cyan-700 font-semibold">
                {calculateDutyCycle()}%
              </span>
            </div>
          </div>

          {/* Visual Servo Position */}
          <div className="bg-slate-50 rounded border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-2 text-center">
              Servo Position
            </div>
            <div className="relative h-24 flex items-center justify-center">
              {/* Servo body */}
              <div className="w-12 h-16 bg-slate-300 rounded relative">
                {/* Servo horn */}
                <div
                  className="absolute left-1/2 top-2 origin-bottom"
                  style={{
                    transform: `translateX(-50%) rotate(${(parseFloat(angle) || 90) - 90}deg)`,
                    transition: "transform 0.3s ease-out",
                  }}
                >
                  <div className="w-1.5 h-10 bg-cyan-700 rounded-full" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-700 rounded-full" />
                </div>
              </div>
              {/* Angle markers */}
              <div className="absolute left-4 text-xs text-slate-500 font-mono">0°</div>
              <div className="absolute right-4 text-xs text-slate-500 font-mono">180°</div>
            </div>
          </div>

          {/* Formula Info */}
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
            <p className="font-mono">
              pulse = min + (angle / 180) × (max - min)
            </p>
            <p className="mt-1">
              Standard servos expect 50Hz PWM signals with pulse widths typically between 500-2500μs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={reset}
            className="font-mono text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={onClose}
            className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
