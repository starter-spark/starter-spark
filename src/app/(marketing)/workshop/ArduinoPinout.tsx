'use client'

import { useEffect, useRef } from 'react'
import { Cpu, X, Zap, Hash, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ArduinoPinoutProps {
  isOpen: boolean
  onClose: () => void
}

// Arduino Uno pin definitions
const digitalPins = [
  { pin: 'D0', name: 'RX', special: 'Serial RX', color: 'text-amber-600' },
  { pin: 'D1', name: 'TX', special: 'Serial TX', color: 'text-amber-600' },
  { pin: 'D2', name: 'INT0', special: 'Interrupt 0', color: 'text-purple-600' },
  {
    pin: 'D3',
    name: 'INT1/PWM',
    special: 'Interrupt 1, PWM',
    color: 'text-cyan-600',
  },
  { pin: 'D4', name: 'Digital', special: '', color: 'text-slate-600' },
  { pin: 'D5', name: 'PWM', special: 'Timer0', color: 'text-cyan-600' },
  { pin: 'D6', name: 'PWM', special: 'Timer0', color: 'text-cyan-600' },
  { pin: 'D7', name: 'Digital', special: '', color: 'text-slate-600' },
  { pin: 'D8', name: 'Digital', special: '', color: 'text-slate-600' },
  { pin: 'D9', name: 'PWM', special: 'Timer1', color: 'text-cyan-600' },
  {
    pin: 'D10',
    name: 'PWM/SS',
    special: 'SPI SS, Timer1',
    color: 'text-cyan-600',
  },
  {
    pin: 'D11',
    name: 'PWM/MOSI',
    special: 'SPI MOSI, Timer2',
    color: 'text-green-600',
  },
  { pin: 'D12', name: 'MISO', special: 'SPI MISO', color: 'text-green-600' },
  {
    pin: 'D13',
    name: 'SCK/LED',
    special: 'SPI SCK, Built-in LED',
    color: 'text-green-600',
  },
]

const analogPins = [
  { pin: 'A0', name: 'Analog In', special: '', color: 'text-blue-600' },
  { pin: 'A1', name: 'Analog In', special: '', color: 'text-blue-600' },
  { pin: 'A2', name: 'Analog In', special: '', color: 'text-blue-600' },
  { pin: 'A3', name: 'Analog In', special: '', color: 'text-blue-600' },
  { pin: 'A4', name: 'SDA', special: 'I2C Data', color: 'text-orange-600' },
  { pin: 'A5', name: 'SCL', special: 'I2C Clock', color: 'text-orange-600' },
]

const powerPins = [
  { pin: 'VIN', name: 'Input Voltage', special: '7-12V recommended' },
  { pin: '5V', name: '5V Output', special: 'Regulated supply' },
  { pin: '3.3V', name: '3.3V Output', special: '50mA max' },
  { pin: 'GND', name: 'Ground', special: 'Multiple available' },
  { pin: 'RESET', name: 'Reset', special: 'Active LOW' },
]

export function ArduinoPinout({ isOpen, onClose }: ArduinoPinoutProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Focus the dialog when opened
    dialogRef.current?.focus()

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="arduino-pinout-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white rounded-lg border border-slate-200 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col outline-none"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-700" />
            <h2
              id="arduino-pinout-title"
              className="font-mono text-lg text-slate-900"
            >
              Arduino Uno Pinout
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors"
            aria-label="Close pinout reference"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-600" />
              <span>PWM</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span>SPI</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-600" />
              <span>I2C</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-600" />
              <span>Serial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span>Interrupt</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Analog</span>
            </div>
          </div>

          {/* Digital Pins */}
          <div>
            <h3 className="flex items-center gap-2 font-mono text-sm text-slate-900 mb-2">
              <Hash className="w-4 h-4" />
              Digital Pins (D0-D13)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {digitalPins.map((pin) => (
                <div
                  key={pin.pin}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                >
                  <span className={`font-mono font-semibold ${pin.color}`}>
                    {pin.pin}
                  </span>
                  <span className="text-slate-600">{pin.name}</span>
                  {pin.special && (
                    <span className="text-xs text-slate-400 ml-auto">
                      {pin.special}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analog Pins */}
          <div>
            <h3 className="flex items-center gap-2 font-mono text-sm text-slate-900 mb-2">
              <Radio className="w-4 h-4" />
              Analog Pins (A0-A5)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {analogPins.map((pin) => (
                <div
                  key={pin.pin}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                >
                  <span className={`font-mono font-semibold ${pin.color}`}>
                    {pin.pin}
                  </span>
                  <span className="text-slate-600">{pin.name}</span>
                  {pin.special && (
                    <span className="text-xs text-slate-400 ml-auto">
                      {pin.special}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Power Pins */}
          <div>
            <h3 className="flex items-center gap-2 font-mono text-sm text-slate-900 mb-2">
              <Zap className="w-4 h-4" />
              Power Pins
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {powerPins.map((pin) => (
                <div
                  key={pin.pin}
                  className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-sm"
                >
                  <span className="font-mono font-semibold text-red-600">
                    {pin.pin}
                  </span>
                  <span className="text-slate-600">{pin.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {pin.special}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-cyan-50 rounded border border-cyan-200 p-4 text-sm">
            <h4 className="font-mono font-semibold text-cyan-800 mb-2">
              Quick Reference
            </h4>
            <ul className="space-y-1 text-cyan-700">
              <li>
                • <strong>PWM pins (D3, D5, D6, D9, D10, D11):</strong> Use for
                servo control with analogWrite()
              </li>
              <li>
                • <strong>I2C (A4/SDA, A5/SCL):</strong> Connect sensors with
                Wire library
              </li>
              <li>
                • <strong>SPI (D10-D13):</strong> High-speed communication with
                SD cards, displays
              </li>
              <li>
                • <strong>Interrupts (D2, D3):</strong> Respond to external
                events instantly
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200">
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
