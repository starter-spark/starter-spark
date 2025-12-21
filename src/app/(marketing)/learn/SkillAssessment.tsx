"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { GraduationCap, ArrowRight, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SkillAssessmentProps {
  userId: string
  onComplete: (skillLevel: string) => void
}

const questions = [
  {
    id: "coding",
    question: "How much coding experience do you have?",
    options: [
      { value: "none", label: "I've never written code", points: 0 },
      { value: "some", label: "I've done some tutorials or basic projects", points: 1 },
      { value: "comfortable", label: "I can write simple programs", points: 2 },
      { value: "experienced", label: "I code regularly", points: 3 },
    ],
  },
  {
    id: "electronics",
    question: "What's your experience with electronics/circuits?",
    options: [
      { value: "none", label: "Never worked with electronics", points: 0 },
      { value: "basic", label: "I've done basic projects (LEDs, batteries)", points: 1 },
      { value: "intermediate", label: "I understand circuits and components", points: 2 },
      { value: "advanced", label: "I design and build circuits regularly", points: 3 },
    ],
  },
  {
    id: "arduino",
    question: "Have you used Arduino or similar microcontrollers?",
    options: [
      { value: "never", label: "Never heard of Arduino", points: 0 },
      { value: "heard", label: "I know what it is but haven't used it", points: 1 },
      { value: "tried", label: "I've done a few Arduino projects", points: 2 },
      { value: "experienced", label: "I'm comfortable with Arduino", points: 3 },
    ],
  },
]

export function SkillAssessment({ userId, onComplete }: SkillAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAnswer = (value: string) => {
    // eslint-disable-next-line security/detect-object-injection -- questionId is from trusted questions array
    const questionId = questions[currentQuestion].id
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const calculateSkillLevel = (): string => {
    let totalPoints = 0
    for (const q of questions) {
      const questionId = q.id
      // eslint-disable-next-line security/detect-object-injection -- questionId is from trusted questions array
      const answer = answers[questionId]
      const option = q.options.find((o) => o.value === answer)
      if (option) totalPoints += option.points
    }

    // Max points = 9 (3 questions * 3 max points)
    if (totalPoints <= 2) return "beginner"
    if (totalPoints <= 5) return "intermediate"
    return "advanced"
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      setIsSubmitting(true)
      const skillLevel = calculateSkillLevel()

      // Save to profile - fire and forget, complete regardless
      const supabase = createClient()
      void supabase
        .from("profiles")
        .update({ skill_level: skillLevel })
        .eq("id", userId)

      onComplete(skillLevel)
    }
  }

  // eslint-disable-next-line security/detect-object-injection -- currentQuestion is bounded index
  const currentQ = questions[currentQuestion]
  const currentAnswer = answers[currentQ.id]

  return (
    <div className="bg-white rounded border border-slate-200 p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-cyan-700" />
        </div>
        <div>
          <h3 className="font-mono text-lg font-semibold text-slate-900">
            Quick Skill Assessment
          </h3>
          <p className="text-sm text-slate-500">
            Help us personalize your learning experience
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= currentQuestion ? "bg-cyan-700" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-sm text-slate-500 mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
        <p className="font-medium text-slate-900">{currentQ.question}</p>
      </div>

      {/* Options */}
      <RadioGroup
        value={currentAnswer || ""}
        onValueChange={handleAnswer}
        className="space-y-3 mb-6"
      >
        {currentQ.options.map((option) => (
          <div key={option.value} className="flex items-center space-x-3">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label
              htmlFor={option.value}
              className="text-sm text-slate-700 cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        disabled={!currentAnswer || isSubmitting}
        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
      >
        {isSubmitting ? (
          "Saving..."
        ) : currentQuestion < questions.length - 1 ? (
          <>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            Complete
            <Check className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
