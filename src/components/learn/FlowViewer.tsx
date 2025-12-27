'use client'

import { useMemo } from 'react'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { reactFlowTokens } from '@/styles/reactflow-tokens'
import { cn } from '@/lib/utils'
import { parseFlowState } from './visual-programming'

interface FlowViewerProps {
  value: unknown
  className?: string
  height?: number
}

export function FlowViewer({
  value,
  className,
  height = 360,
}: FlowViewerProps) {
  const flow = useMemo(() => parseFlowState(value), [value])
  const { nodes, edges } = flow

  return (
    <div
      className={cn(
        'rounded border border-slate-200 bg-white overflow-hidden',
        className,
      )}
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        zoomOnPinch
        proOptions={{ hideAttribution: true }}
      >
        <Background
          gap={reactFlowTokens.gridGap}
          size={reactFlowTokens.gridSize}
          color={reactFlowTokens.gridColor}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
