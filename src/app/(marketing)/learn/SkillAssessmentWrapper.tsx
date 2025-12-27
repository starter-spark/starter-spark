'use client'

import { useState } from 'react'
import { SkillAssessment } from './SkillAssessment'
import { X } from 'lucide-react'

interface SkillAssessmentWrapperProps {
  userId: string
  hasSkillLevel: boolean
  children: React.ReactNode
}

export function SkillAssessmentWrapper({
  userId,
  hasSkillLevel,
  children,
}: SkillAssessmentWrapperProps) {
  const [showAssessment, setShowAssessment] = useState(!hasSkillLevel)
  const [dismissed, setDismissed] = useState(false)

  const handleComplete = () => {
    setShowAssessment(false)
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowAssessment(false)
  }

  if (!showAssessment || dismissed) {
    return <>{children}</>
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600"
              aria-label="Skip assessment"
            >
              <X className="w-5 h-5" />
            </button>
            <SkillAssessment userId={userId} onComplete={handleComplete} />
            <p className="text-center text-sm text-slate-500 mt-4">
              <button
                onClick={handleDismiss}
                className="text-cyan-700 hover:underline"
              >
                Skip for now
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
