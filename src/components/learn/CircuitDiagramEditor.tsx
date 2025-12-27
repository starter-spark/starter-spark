'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Connection,
  type Node,
  type Edge,
  type OnSelectionChangeParams,
  useEdgesState,
  useNodesState,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  Trash2,
  Battery,
  Lightbulb,
  CircuitBoard,
  RotateCcw,
  Cpu,
  Radio,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { randomId } from '@/lib/random-id'

// Circuit component types
type CircuitComponentType =
  | 'arduino'
  | 'led'
  | 'resistor'
  | 'capacitor'
  | 'button'
  | 'servo'
  | 'sensor'
  | 'power'
  | 'ground'
  | 'breadboard'
  | 'wire_junction'

interface CircuitNodeData extends Record<string, unknown> {
  label: string
  componentType: CircuitComponentType
  params?: Record<string, unknown>
}

type CircuitNode = Node<CircuitNodeData>

export interface CircuitDiagramState {
  nodes: CircuitNode[]
  edges: Edge[]
}

interface CircuitDiagramEditorProps {
  value?: CircuitDiagramState
  onChange?: (state: CircuitDiagramState) => void
  readOnly?: boolean
  className?: string
  height?: number
}

// Helper to safely get param value as string
function getParamString(
  params: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  if (!params) return fallback
  // eslint-disable-next-line security/detect-object-injection -- key is controlled by caller
  const val = params[key]
  if (typeof val === 'string' || typeof val === 'number') return String(val)
  return fallback
}

// Component palette
const circuitPalette: {
  type: CircuitComponentType
  label: string
  icon: React.ReactNode
}[] = [
  { type: 'arduino', label: 'Arduino', icon: <Cpu className="w-4 h-4" /> },
  { type: 'led', label: 'LED', icon: <Lightbulb className="w-4 h-4" /> },
  {
    type: 'resistor',
    label: 'Resistor',
    icon: <span className="font-mono text-xs">Ω</span>,
  },
  {
    type: 'capacitor',
    label: 'Capacitor',
    icon: <span className="font-mono text-xs">||</span>,
  },
  { type: 'button', label: 'Button', icon: <Radio className="w-4 h-4" /> },
  { type: 'servo', label: 'Servo', icon: <RotateCcw className="w-4 h-4" /> },
  { type: 'sensor', label: 'Sensor', icon: <Gauge className="w-4 h-4" /> },
  { type: 'power', label: 'VCC (+)', icon: <Battery className="w-4 h-4" /> },
  {
    type: 'ground',
    label: 'GND (-)',
    icon: <span className="font-mono text-xs">⏚</span>,
  },
  {
    type: 'breadboard',
    label: 'Breadboard',
    icon: <CircuitBoard className="w-4 h-4" />,
  },
  {
    type: 'wire_junction',
    label: 'Junction',
    icon: <span className="font-mono text-xs">●</span>,
  },
]

// Custom node components for circuit symbols
function ArduinoNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative bg-cyan-600 text-white rounded-lg p-3 min-w-[120px] border-2 border-cyan-700 shadow-md">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-yellow-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-yellow-400 !w-3 !h-3"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-yellow-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-yellow-400 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <Cpu className="w-5 h-5" />
        <span className="font-mono text-sm font-semibold">{data.label}</span>
      </div>
      <div className="text-[10px] opacity-80 mt-1 font-mono">
        Pins: {getParamString(data.params, 'pins', '13 digital, 6 analog')}
      </div>
    </div>
  )
}

function LEDNode({ data }: { data: CircuitNodeData }) {
  const color = getParamString(data.params, 'color', 'red')
  const colorClass =
    color === 'green'
      ? 'bg-green-500'
      : color === 'blue'
        ? 'bg-blue-500'
        : color === 'yellow'
          ? 'bg-yellow-400'
          : 'bg-red-500'

  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 border-slate-400 shadow-lg',
          colorClass,
        )}
      />
      <div className="text-[10px] mt-1 font-mono text-slate-600">
        {data.label}
      </div>
    </div>
  )
}

function ResistorNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <div className="flex items-center">
        <div className="w-2 h-0.5 bg-slate-600" />
        <div className="w-10 h-4 bg-amber-100 border border-slate-400 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-amber-600" />
            <div className="w-1 h-3 bg-violet-600" />
            <div className="w-1 h-3 bg-red-600" />
            <div className="w-1 h-3 bg-yellow-500" />
          </div>
        </div>
        <div className="w-2 h-0.5 bg-slate-600" />
      </div>
      <div className="text-[10px] mt-1 font-mono text-slate-600">
        {data.label} ({getParamString(data.params, 'value', '220')}Ω)
      </div>
    </div>
  )
}

function CapacitorNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <div className="flex items-center gap-1">
        <div className="w-2 h-0.5 bg-slate-600" />
        <div className="w-1 h-5 bg-slate-600" />
        <div className="w-1 h-5 bg-slate-600" />
        <div className="w-2 h-0.5 bg-slate-600" />
      </div>
      <div className="text-[10px] mt-1 font-mono text-slate-600">
        {data.label} ({getParamString(data.params, 'value', '100')}μF)
      </div>
    </div>
  )
}

function ButtonNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <div className="w-8 h-8 rounded bg-slate-200 border-2 border-slate-400 flex items-center justify-center shadow-md">
        <div className="w-4 h-4 rounded-full bg-slate-600" />
      </div>
      <div className="text-[10px] mt-1 font-mono text-slate-600">
        {data.label}
      </div>
    </div>
  )
}

function ServoNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative bg-blue-100 border-2 border-blue-400 rounded p-2">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-orange-500 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="vcc"
        style={{ top: '30%' }}
        className="!bg-red-500 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="gnd"
        style={{ top: '70%' }}
        className="!bg-black !w-2 !h-2"
      />
      <div className="flex items-center gap-2">
        <RotateCcw className="w-4 h-4 text-blue-600" />
        <span className="font-mono text-xs text-blue-800">{data.label}</span>
      </div>
    </div>
  )
}

function SensorNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative bg-green-100 border-2 border-green-400 rounded p-2">
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-yellow-500 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="vcc"
        className="!bg-red-500 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="gnd"
        style={{ top: '70%' }}
        className="!bg-black !w-2 !h-2"
      />
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-green-600" />
        <span className="font-mono text-xs text-green-800">{data.label}</span>
      </div>
    </div>
  )
}

function PowerNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-red-500 !w-3 !h-3"
      />
      <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
        <span className="font-mono text-xs font-bold text-red-600">+</span>
      </div>
      <div className="text-[10px] mt-1 font-mono text-red-600">
        {data.label}
      </div>
    </div>
  )
}

function GroundNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-black !w-3 !h-3"
      />
      <div className="flex flex-col items-center">
        <div className="w-6 h-0.5 bg-black" />
        <div className="w-4 h-0.5 bg-black mt-0.5" />
        <div className="w-2 h-0.5 bg-black mt-0.5" />
      </div>
      <div className="text-[10px] mt-1 font-mono text-slate-600">
        {data.label}
      </div>
    </div>
  )
}

function BreadboardNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative bg-white border-2 border-slate-300 rounded p-2 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        id="power"
        className="!bg-red-500 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="ground"
        style={{ left: '60%' }}
        className="!bg-black !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-2 !h-2"
      />
      <div className="grid grid-cols-10 gap-1 mb-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300"
          />
        ))}
      </div>
      <div className="text-center">
        <span className="font-mono text-xs text-slate-600">{data.label}</span>
      </div>
    </div>
  )
}

function WireJunctionNode({ data }: { data: CircuitNodeData }) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-600 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-600 !w-2 !h-2"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-slate-600 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-slate-600 !w-2 !h-2"
      />
      <div className="w-3 h-3 rounded-full bg-slate-600" />
      {data.label !== 'Junction' && (
        <div className="text-[8px] absolute -bottom-3 left-1/2 -translate-x-1/2 font-mono text-slate-500">
          {data.label}
        </div>
      )}
    </div>
  )
}

// Node type mappings
const nodeTypes: NodeTypes = {
  arduino: ArduinoNode,
  led: LEDNode,
  resistor: ResistorNode,
  capacitor: CapacitorNode,
  button: ButtonNode,
  servo: ServoNode,
  sensor: SensorNode,
  power: PowerNode,
  ground: GroundNode,
  breadboard: BreadboardNode,
  wire_junction: WireJunctionNode,
}

function createCircuitNode(componentType: CircuitComponentType): CircuitNode {
  const id = randomId()

  const labels: Record<CircuitComponentType, string> = {
    arduino: 'Arduino Uno',
    led: 'LED',
    resistor: 'R1',
    capacitor: 'C1',
    button: 'BTN',
    servo: 'Servo',
    sensor: 'Sensor',
    power: 'VCC',
    ground: 'GND',
    breadboard: 'Breadboard',
    wire_junction: 'Junction',
  }

  const defaultParams: Record<CircuitComponentType, Record<string, unknown>> = {
    arduino: { pins: '13 digital, 6 analog' },
    led: { color: 'red', pin: 13 },
    resistor: { value: 220 },
    capacitor: { value: 100 },
    button: { pin: 2 },
    servo: { pin: 9 },
    sensor: { type: 'photoresistor', pin: 'A0' },
    power: { voltage: 5 },
    ground: {},
    breadboard: { rows: 30 },
    wire_junction: {},
  }

  // eslint-disable-next-line security/detect-object-injection -- componentType is from controlled CircuitComponentType enum
  const label = labels[componentType]
  // eslint-disable-next-line security/detect-object-injection -- componentType is from controlled CircuitComponentType enum
  const params = defaultParams[componentType]

  return {
    id,
    type: componentType,
    position: { x: 250, y: 150 },
    data: {
      label,
      componentType,
      params,
    },
  }
}

function parseCircuitState(value: unknown): CircuitDiagramState {
  if (!value || typeof value !== 'object') return { nodes: [], edges: [] }
  const v = value as Partial<CircuitDiagramState>
  return {
    nodes: Array.isArray(v.nodes) ? v.nodes : [],
    edges: Array.isArray(v.edges) ? v.edges : [],
  }
}

export function CircuitDiagramEditor({
  value,
  onChange,
  readOnly = false,
  className,
  height = 500,
}: CircuitDiagramEditorProps) {
  const initial = useMemo(() => parseCircuitState(value), [value])

  const [nodes, setNodes, onNodesChange] = useNodesState<CircuitNode>(
    initial.nodes,
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedNode = selectedId
    ? nodes.find((n) => n.id === selectedId)
    : undefined

  // Use ref to avoid infinite loops when parent doesn't memoize onChange
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (onChangeRef.current) {
      onChangeRef.current({ nodes, edges })
    }
  }, [edges, nodes])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            style: { stroke: '#475569', strokeWidth: 2 },
            type: 'smoothstep',
          },
          eds,
        ),
      )
    },
    [readOnly, setEdges],
  )

  const addNode = (componentType: CircuitComponentType) => {
    if (readOnly) return
    setNodes((prev) => [...prev, createCircuitNode(componentType)])
  }

  const updateNodeLabel = (label: string) => {
    if (!selectedId || readOnly) return
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedId) return n
        return { ...n, data: { ...n.data, label } }
      }),
    )
  }

  const updateNodeParams = (patch: Record<string, unknown>) => {
    if (!selectedId || readOnly) return
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedId) return n
        return {
          ...n,
          data: {
            ...n.data,
            params: { ...n.data.params, ...patch },
          },
        }
      }),
    )
  }

  const deleteSelected = () => {
    if (!selectedId || readOnly) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedId))
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedId && e.target !== selectedId),
    )
    setSelectedId(null)
  }

  const exportSVG = () => {
    // Export circuit as JSON for now (SVG export would require more work)
    const data = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'circuit-diagram.json'
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
      <div className="grid lg:grid-cols-[200px_1fr_280px]">
        {/* Component Palette */}
        {!readOnly && (
          <div className="border-b lg:border-b-0 lg:border-r border-slate-200 p-4 space-y-4">
            <div>
              <p className="font-mono text-sm font-semibold text-slate-900">
                Components
              </p>
              <p className="text-xs text-slate-500">
                Drag components to the canvas
              </p>
            </div>

            <div className="space-y-1.5">
              {circuitPalette.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 font-mono text-xs h-8"
                  onClick={() => {
                    addNode(item.type)
                  }}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          className={cn(
            'border-b lg:border-b-0 border-slate-200',
            !readOnly && 'lg:border-r',
          )}
          style={{ height }}
        >
          <ReactFlow<CircuitNode>
            nodes={nodes}
            edges={edges}
            onNodesChange={readOnly ? undefined : onNodesChange}
            onEdgesChange={readOnly ? undefined : onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={(s: OnSelectionChangeParams<CircuitNode>) => {
              const node = s.nodes[0]
              setSelectedId(node ? node.id : null)
            }}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
            defaultEdgeOptions={{
              style: { stroke: '#475569', strokeWidth: 2 },
              type: 'smoothstep',
            }}
          >
            <Background gap={16} size={1} color="#e2e8f0" />
            <Controls />
            {!readOnly && <MiniMap zoomable pannable nodeColor="#0e7490" />}
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {!readOnly && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-semibold text-slate-900">
                Properties
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteSelected}
                  disabled={!selectedNode}
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={exportSVG}
                  className="h-7 w-7 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      updateNodeLabel(e.target.value)
                    }}
                    className="h-8 text-sm"
                  />
                </div>

                <Separator />

                <ComponentParamsEditor
                  node={selectedNode}
                  onChange={updateNodeParams}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a component to edit its properties.
              </p>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="font-mono text-xs font-semibold text-slate-700">
                Tips
              </p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Connect handles by dragging</li>
                <li>• Hold Shift to select multiple</li>
                <li>• Use scroll to zoom</li>
                <li>• Components snap to grid</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component-specific parameter editors
function ComponentParamsEditor({
  node,
  onChange,
}: {
  node: CircuitNode
  onChange: (patch: Record<string, unknown>) => void
}) {
  const { componentType, params } = node.data

  if (componentType === 'led') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Color</Label>
          <select
            value={getParamString(params, 'color', 'red')}
            onChange={(e) => {
              onChange({ color: e.target.value })
            }}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
          >
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Pin</Label>
          <Input
            type="number"
            value={getParamString(params, 'pin', '13')}
            onChange={(e) => {
              onChange({ pin: Number(e.target.value) })
            }}
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>
    )
  }

  if (componentType === 'resistor') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Resistance (Ω)</Label>
        <select
          value={getParamString(params, 'value', '220')}
          onChange={(e) => {
            onChange({ value: Number(e.target.value) })
          }}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
        >
          <option value={100}>100Ω</option>
          <option value={220}>220Ω</option>
          <option value={330}>330Ω</option>
          <option value={470}>470Ω</option>
          <option value={1000}>1kΩ</option>
          <option value={10_000}>10kΩ</option>
        </select>
      </div>
    )
  }

  if (componentType === 'capacitor') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Capacitance (μF)</Label>
        <select
          value={getParamString(params, 'value', '100')}
          onChange={(e) => {
            onChange({ value: Number(e.target.value) })
          }}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
        >
          <option value={10}>10μF</option>
          <option value={22}>22μF</option>
          <option value={47}>47μF</option>
          <option value={100}>100μF</option>
          <option value={220}>220μF</option>
          <option value={470}>470μF</option>
        </select>
      </div>
    )
  }

  if (componentType === 'button') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Pin</Label>
        <Input
          type="number"
          value={getParamString(params, 'pin', '2')}
          onChange={(e) => {
            onChange({ pin: Number(e.target.value) })
          }}
          className="h-8 text-sm font-mono"
        />
      </div>
    )
  }

  if (componentType === 'servo') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Signal Pin</Label>
        <Input
          type="number"
          value={getParamString(params, 'pin', '9')}
          onChange={(e) => {
            onChange({ pin: Number(e.target.value) })
          }}
          className="h-8 text-sm font-mono"
        />
      </div>
    )
  }

  if (componentType === 'sensor') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Type</Label>
          <select
            value={getParamString(params, 'type', 'photoresistor')}
            onChange={(e) => {
              onChange({ type: e.target.value })
            }}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
          >
            <option value="photoresistor">Photoresistor</option>
            <option value="temperature">Temperature</option>
            <option value="ultrasonic">Ultrasonic</option>
            <option value="ir">IR Sensor</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Pin</Label>
          <Input
            value={getParamString(params, 'pin', 'A0')}
            onChange={(e) => {
              onChange({ pin: e.target.value })
            }}
            className="h-8 text-sm font-mono"
          />
        </div>
      </div>
    )
  }

  if (componentType === 'power') {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Voltage (V)</Label>
        <select
          value={getParamString(params, 'voltage', '5')}
          onChange={(e) => {
            onChange({ voltage: Number(e.target.value) })
          }}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
        >
          <option value={3.3}>3.3V</option>
          <option value={5}>5V</option>
          <option value={9}>9V</option>
          <option value={12}>12V</option>
        </select>
      </div>
    )
  }

  return <p className="text-xs text-slate-500">No editable parameters.</p>
}
