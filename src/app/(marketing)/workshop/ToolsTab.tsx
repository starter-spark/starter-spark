"use client"

import { useState } from "react"
import { Calculator, Cpu, BookOpen, FileText, Code, Zap } from "lucide-react"
import Link from "next/link"
import { ServoCalculator } from "./ServoCalculator"
import { ArduinoPinout } from "./ArduinoPinout"

export function ToolsTab() {
  const [showServoCalc, setShowServoCalc] = useState(false)
  const [showPinout, setShowPinout] = useState(false)

  const tools = [
    {
      id: "servo-calc",
      icon: Calculator,
      title: "Servo Calculator",
      description: "Convert angles to pulse widths for precise servo control",
      onClick: () => setShowServoCalc(true),
    },
    {
      id: "pinout",
      icon: Cpu,
      title: "Arduino Pinout",
      description: "Quick reference for Arduino Uno/Nano pin assignments",
      onClick: () => setShowPinout(true),
    },
  ]

  const resources = [
    {
      href: "/docs",
      icon: BookOpen,
      title: "Documentation",
      description: "Comprehensive guides and API references",
    },
    {
      href: "/support",
      icon: FileText,
      title: "Troubleshooting",
      description: "Common issues and solutions",
    },
    {
      href: "/community",
      icon: Code,
      title: "Community",
      description: "Ask questions and share projects",
    },
  ]

  return (
    <>
      <div className="space-y-8">
        {/* Interactive Tools */}
        <div>
          <h3 className="font-mono text-lg text-slate-900 mb-4">Interactive Tools</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={tool.onClick}
                className="cursor-pointer bg-white p-6 rounded border border-slate-200 hover:border-cyan-700 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center mb-4 group-hover:bg-cyan-100 transition-colors">
                  <tool.icon className="w-6 h-6 text-cyan-700" />
                </div>
                <h4 className="font-mono text-slate-900 mb-1">{tool.title}</h4>
                <p className="text-sm text-slate-600">{tool.description}</p>
              </button>
            ))}

            {/* Coming Soon Placeholder */}
            <div className="bg-slate-50 p-6 rounded border border-dashed border-slate-300 text-center">
              <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="font-mono text-slate-500 mb-1">More Coming Soon</h4>
              <p className="text-sm text-slate-400">Resistance calculator, LED wizard, and more</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-mono text-lg text-slate-900 mb-4">Resources</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="bg-white p-6 rounded border border-slate-200 hover:border-cyan-700 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-cyan-50 transition-colors">
                  <resource.icon className="w-6 h-6 text-slate-600 group-hover:text-cyan-700 transition-colors" />
                </div>
                <h4 className="font-mono text-slate-900 mb-1">{resource.title}</h4>
                <p className="text-sm text-slate-600">{resource.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Reference Cards */}
        <div>
          <h3 className="font-mono text-lg text-slate-900 mb-4">Quick Reference</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Common Pin Types */}
            <div className="bg-white p-6 rounded border border-slate-200">
              <h4 className="font-mono text-slate-900 mb-4">Arduino Pin Types</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Digital I/O</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">D0-D13</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">PWM Output</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">D3, D5, D6, D9, D10, D11</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Analog Input</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">A0-A5</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Serial</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">D0 (RX), D1 (TX)</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">I2C</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">A4 (SDA), A5 (SCL)</code>
                </div>
              </div>
            </div>

            {/* Servo Values */}
            <div className="bg-white p-6 rounded border border-slate-200">
              <h4 className="font-mono text-slate-900 mb-4">Standard Servo Values</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Min angle (0&deg;)</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">544 &mu;s</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Center (90&deg;)</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">1500 &mu;s</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Max angle (180&deg;)</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">2400 &mu;s</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">PWM frequency</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">50 Hz (20 ms)</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Operating voltage</span>
                  <code className="text-cyan-700 bg-slate-50 px-2 rounded">4.8-6V</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ServoCalculator isOpen={showServoCalc} onClose={() => setShowServoCalc(false)} />
      <ArduinoPinout isOpen={showPinout} onClose={() => setShowPinout(false)} />
    </>
  )
}
