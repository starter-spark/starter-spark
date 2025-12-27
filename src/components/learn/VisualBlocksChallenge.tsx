'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlowEditor } from '@/components/learn/FlowEditor'
import {
  generateArduinoCode,
  parseFlowState,
  type FlowState,
} from '@/components/learn/visual-programming'

interface VisualBlocksChallengeProps {
  starterFlow: unknown
  solutionFlow?: unknown
}

export function VisualBlocksChallenge({
  starterFlow,
  solutionFlow,
}: VisualBlocksChallengeProps) {
  const initial = useMemo(() => parseFlowState(starterFlow), [starterFlow])
  const [flow, setFlow] = useState<FlowState>(initial)
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)

  const expected = useMemo(() => {
    if (!solutionFlow) return null
    const parsed = parseFlowState(solutionFlow)
    if (parsed.nodes.length === 0 && parsed.edges.length === 0) return null
    return generateArduinoCode(parsed.nodes, parsed.edges).trim()
  }, [solutionFlow])

  const check = () => {
    if (!expected) return
    const actual = generateArduinoCode(flow.nodes, flow.edges).trim()
    setResult(actual === expected ? 'correct' : 'incorrect')
  }

  return (
    <div className="my-8 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-mono text-lg font-semibold text-slate-900">
              Visual Blocks Challenge
            </h3>
            <p className="text-sm text-slate-600">
              Build a program by connecting blocks, then preview the generated
              Arduino code.
            </p>
          </div>

          {expected && (
            <Button
              type="button"
              onClick={check}
              className="bg-cyan-700 hover:bg-cyan-600 font-mono"
            >
              Check Answer
            </Button>
          )}
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 rounded border px-3 py-2 text-sm mb-4 ${
              result === 'correct'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {result === 'correct' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="font-mono">
              {result === 'correct' ? 'Correct!' : 'Not quite — keep trying.'}
            </span>
          </div>
        )}

        <FlowEditor
          mode="visual"
          value={flow}
          onChange={setFlow}
          className="mt-2"
          height={520}
        />
      </div>
    </div>
  )
}
