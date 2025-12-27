'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
  type OnSelectionChangeParams,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, Copy, Download } from 'lucide-react'
import { reactFlowTokens } from '@/styles/reactflow-tokens'
import { cn } from '@/lib/utils'
import { randomId } from '@/lib/random-id'
import {
  type FlowState,
  type VisualBlockType,
  type VisualNodeData,
  generateArduinoCode,
  parseFlowState,
} from './visual-programming'
import { CodeEditor } from './CodeEditor'

type EditorMode = 'diagram' | 'visual'

interface FlowEditorProps {
  mode: EditorMode
  value: unknown
  onChange: (next: FlowState) => void
  className?: string
  height?: number
}

function flowSignature(flow: FlowState): string {
  try {
    return JSON.stringify(flow)
  } catch {
    return ''
  }
}

function getDefaultVisualNodes(): FlowState['nodes'] {
  return [
    {
      id: 'setup',
      position: { x: 60, y: 60 },
      data: { label: 'setup()', blockType: 'setup' },
      style: reactFlowTokens.primaryNode,
    },
    {
      id: 'loop',
      position: { x: 60, y: 220 },
      data: { label: 'loop()', blockType: 'loop' },
      style: reactFlowTokens.primaryNode,
    },
  ]
}

const visualPalette: { type: VisualBlockType; label: string }[] = [
  { type: 'variable', label: 'Variable' },
  { type: 'servo_attach', label: 'Servo Attach' },
  { type: 'servo_write', label: 'Servo Write' },
  { type: 'delay', label: 'Delay' },
  { type: 'digital_write', label: 'Digital Write' },
  { type: 'analog_write', label: 'Analog Write' },
  { type: 'serial_print', label: 'Serial Print' },
]

function createVisualNode(
  blockType: VisualBlockType,
): FlowState['nodes'][number] {
  const id = randomId()

  const params: Record<string, unknown> =
    blockType === 'variable'
      ? { name: 'value', varType: 'int', value: 0 }
      : blockType === 'servo_attach'
        ? { variable: 'servo', pin: 9 }
        : blockType === 'servo_write'
          ? { variable: 'servo', angle: 90 }
          : blockType === 'delay'
            ? { ms: 500 }
            : blockType === 'digital_write'
              ? { pin: 13, value: 'HIGH' }
              : blockType === 'analog_write'
                ? { pin: 9, value: 128 }
                : blockType === 'serial_print'
                  ? { message: 'Hello' }
                  : {}

  const label =
    blockType === 'variable'
      ? 'Variable'
      : blockType === 'servo_attach'
        ? 'Servo Attach'
        : blockType === 'servo_write'
          ? 'Servo Write'
          : blockType === 'delay'
            ? 'Delay'
            : blockType === 'digital_write'
              ? 'Digital Write'
              : blockType === 'analog_write'
                ? 'Analog Write'
                : blockType === 'serial_print'
                  ? 'Serial Print'
                  : 'Block'

  return {
    id,
    type: 'default',
    position: { x: 320, y: 120 },
    data: { label, blockType, params },
    style: reactFlowTokens.secondaryNode,
  }
}

type DiagramStyleKey = 'primary' | 'secondary' | 'power' | 'component'

function diagramStyleFor(key: DiagramStyleKey) {
  if (key === 'primary') return reactFlowTokens.primaryNode
  if (key === 'secondary') return reactFlowTokens.secondaryNode
  if (key === 'power') return reactFlowTokens.powerNode
  return reactFlowTokens.componentNode
}

function createDiagramNode(
  styleKey: DiagramStyleKey,
): FlowState['nodes'][number] {
  const id = randomId()
  const style = diagramStyleFor(styleKey)
  const label =
    styleKey === 'primary'
      ? 'Primary'
      : styleKey === 'secondary'
        ? 'Component'
        : styleKey === 'power'
          ? 'Power'
          : 'Note'

  return {
    id,
    type: 'default',
    position: { x: 260, y: 120 },
    data: { label },
    style,
  }
}

export function FlowEditor({
  mode,
  value,
  onChange,
  className,
  height = 420,
}: FlowEditorProps) {
  const parsed = useMemo(() => parseFlowState(value), [value])
  const parsedNodes = useMemo(() => {
    if (mode === 'visual') {
      return parsed.nodes.length ? parsed.nodes : getDefaultVisualNodes()
    }
    return parsed.nodes
  }, [mode, parsed.nodes])

  const parsedFlow = useMemo(
    () => ({ nodes: parsedNodes, edges: parsed.edges }),
    [parsed.edges, parsedNodes],
  )
  const parsedSig = useMemo(() => flowSignature(parsedFlow), [parsedFlow])

  const [nodes, setNodes, onNodesChange] =
    useNodesState<FlowState['nodes'][number]>(parsedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsed.edges)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedNode = selectedId
    ? nodes.find((n) => n.id === selectedId)
    : undefined

  // Support external edits (e.g. admin "raw JSON" editor) by syncing local state to `value`.
  const suppressNextEmitRef = useRef(false)
  const lastAppliedSigRef = useRef(parsedSig)
  const lastSentSigRef = useRef(parsedSig)

  // Use ref to avoid infinite loops when parent doesn't memoize onChange
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (parsedSig === lastAppliedSigRef.current) return

    lastAppliedSigRef.current = parsedSig
    lastSentSigRef.current = parsedSig
    suppressNextEmitRef.current = true

    setNodes(parsedFlow.nodes)
    setEdges(parsedFlow.edges)
  }, [parsedFlow, parsedSig, setEdges, setNodes])

  useEffect(() => {
    if (suppressNextEmitRef.current) {
      suppressNextEmitRef.current = false
      return
    }

    const sig = flowSignature({ nodes, edges })
    if (sig === lastSentSigRef.current) return
    lastSentSigRef.current = sig

    onChangeRef.current({ nodes, edges })
  }, [edges, nodes])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: mode === 'diagram' ? true : false,
            style: mode === 'diagram' ? reactFlowTokens.defaultEdge : undefined,
          },
          eds,
        ),
      )
    },
    [mode, setEdges],
  )

  const addNode = (type: VisualBlockType | DiagramStyleKey) => {
    if (mode === 'visual') {
      setNodes((prev) => [...prev, createVisualNode(type as VisualBlockType)])
      return
    }
    setNodes((prev) => [...prev, createDiagramNode(type as DiagramStyleKey)])
  }

  const setSelectedLabel = (label: string) => {
    if (!selectedId) return
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedId) return n
        return { ...n, data: { ...n.data, label } }
      }),
    )
  }

  const updateSelectedParams = (patch: Record<string, unknown>) => {
    if (!selectedId) return
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedId) return n
        const params: Record<string, unknown> = n.data?.params ?? {}
        return { ...n, data: { ...n.data, params: { ...params, ...patch } } }
      }),
    )
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedId))
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedId && e.target !== selectedId),
    )
    setSelectedId(null)
  }

  const generatedCode = useMemo(() => {
    if (mode !== 'visual') return null
    return generateArduinoCode(nodes, edges)
  }, [edges, mode, nodes])

  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    if (!generatedCode) return
    navigator.clipboard
      .writeText(generatedCode)
      .then(() => {
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 2000)
      })
      .catch(() => {
        // Fallback or silent fail
      })
  }

  const downloadCode = () => {
    if (!generatedCode) return
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sketch.ino'
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        'rounded border border-slate-200 bg-white overflow-hidden',
        className,
      )}
    >
      <div className="grid lg:grid-cols-[240px_1fr_320px]">
        {/* Palette */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-200 p-4 space-y-4">
          <div>
            <p className="font-mono text-sm font-semibold text-slate-900">
              {mode === 'visual' ? 'Blocks' : 'Diagram'}
            </p>
            <p className="text-xs text-slate-500">
              {mode === 'visual'
                ? 'Add blocks, connect them, and preview code.'
                : 'Add nodes and connect them to create a diagram.'}
            </p>
          </div>

          <div className="space-y-2">
            {mode === 'visual' ? (
              visualPalette.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    addNode(item.type)
                  }}
                >
                  + {item.label}
                </Button>
              ))
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    addNode('primary')
                  }}
                >
                  + Primary node
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    addNode('secondary')
                  }}
                >
                  + Component node
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    addNode('power')
                  }}
                >
                  + Power node
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start font-mono"
                  onClick={() => {
                    addNode('component')
                  }}
                >
                  + Dashed node
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="border-b lg:border-b-0 lg:border-r border-slate-200"
          style={{ height }}
        >
          <ReactFlow<FlowState['nodes'][number]>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={(
              s: OnSelectionChangeParams<FlowState['nodes'][number]>,
            ) => {
              const node = s.nodes[0]
              setSelectedId(node ? node.id : null)
            }}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              gap={reactFlowTokens.gridGap}
              size={reactFlowTokens.gridSize}
              color={reactFlowTokens.gridColor}
            />
            <Controls />
            <MiniMap zoomable pannable />
          </ReactFlow>
        </div>

        {/* Properties / Preview */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold text-slate-900">
              Inspector
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deleteSelected}
              disabled={!selectedNode}
            >
              Delete
            </Button>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={
                    typeof selectedNode.data?.label === 'string'
                      ? selectedNode.data.label
                      : ''
                  }
                  onChange={(e) => {
                    setSelectedLabel(e.target.value)
                  }}
                />
              </div>

              {mode === 'visual' && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-mono">Params</p>
                    <p className="text-[11px] text-slate-500">
                      These parameters are used for code generation.
                    </p>
                  </div>

                  <VisualParamsEditor
                    node={selectedNode}
                    onChange={updateSelectedParams}
                  />
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a node to edit its properties.
            </p>
          )}

          {mode === 'visual' && generatedCode && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    Generated Code
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyCode}
                      className="h-7 px-2 text-xs"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadCode}
                      className="h-7 px-2 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="ml-1">.ino</span>
                    </Button>
                  </div>
                </div>
                <CodeEditor
                  initialCode={generatedCode}
                  language="cpp"
                  readOnly
                  hideReset
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function VisualParamsEditor({
  node,
  onChange,
}: {
  node: Node<VisualNodeData>
  onChange: (patch: Record<string, unknown>) => void
}) {
  const data = node.data
  const blockType = data.blockType ?? ''
  const params: Record<string, unknown> = data.params ?? {}

  if (blockType === 'variable') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={typeof params.name === 'string' ? params.name : ''}
            onChange={(e) => {
              onChange({ name: e.target.value })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <select
            value={typeof params.varType === 'string' ? params.varType : 'int'}
            onChange={(e) => {
              onChange({ varType: e.target.value })
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          >
            <option value="int">int</option>
            <option value="float">float</option>
            <option value="bool">bool</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            value={
              typeof params.value === 'string' ||
              typeof params.value === 'number'
                ? String(params.value)
                : '0'
            }
            onChange={(e) => {
              onChange({ value: e.target.value })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'servo_attach') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Variable</Label>
          <Input
            value={
              typeof params.variable === 'string' ? params.variable : 'servo'
            }
            onChange={(e) => {
              onChange({ variable: e.target.value })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Pin</Label>
          <Input
            type="number"
            value={typeof params.pin === 'number' ? params.pin : 9}
            onChange={(e) => {
              onChange({ pin: Number(e.target.value) })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'servo_write') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Variable</Label>
          <Input
            value={
              typeof params.variable === 'string' ? params.variable : 'servo'
            }
            onChange={(e) => {
              onChange({ variable: e.target.value })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Angle</Label>
          <Input
            type="number"
            value={typeof params.angle === 'number' ? params.angle : 90}
            onChange={(e) => {
              onChange({ angle: Number(e.target.value) })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'delay') {
    return (
      <div className="space-y-2">
        <Label>Milliseconds</Label>
        <Input
          type="number"
          value={typeof params.ms === 'number' ? params.ms : 500}
          onChange={(e) => {
            onChange({ ms: Number(e.target.value) })
          }}
        />
      </div>
    )
  }

  if (blockType === 'digital_write') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Pin</Label>
          <Input
            type="number"
            value={typeof params.pin === 'number' ? params.pin : 13}
            onChange={(e) => {
              onChange({ pin: Number(e.target.value) })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Value</Label>
          <select
            value={typeof params.value === 'string' ? params.value : 'HIGH'}
            onChange={(e) => {
              onChange({ value: e.target.value })
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          >
            <option value="HIGH">HIGH</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>
    )
  }

  if (blockType === 'analog_write') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Pin</Label>
          <Input
            type="number"
            value={typeof params.pin === 'number' ? params.pin : 9}
            onChange={(e) => {
              onChange({ pin: Number(e.target.value) })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            type="number"
            value={typeof params.value === 'number' ? params.value : 128}
            onChange={(e) => {
              onChange({ value: Number(e.target.value) })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'serial_print') {
    return (
      <div className="space-y-2">
        <Label>Message</Label>
        <Input
          value={typeof params.message === 'string' ? params.message : ''}
          onChange={(e) => {
            onChange({ message: e.target.value })
          }}
        />
      </div>
    )
  }

  return <p className="text-sm text-slate-500">No parameters for this block.</p>
}
