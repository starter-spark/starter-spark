'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  type NodeTypes,
  type OnSelectionChangeParams,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Check,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Undo2,
  Redo2,
  Upload,
  Play,
  Repeat,
  GitBranch,
  Clock,
  Zap,
  Settings,
  Terminal,
  Radio,
  Gauge,
} from 'lucide-react'
import { reactFlowTokens } from '@/styles/reactflow-tokens'
import { cn } from '@/lib/utils'
import { randomId } from '@/lib/random-id'
import {
  type FlowState,
  type VisualBlockType,
  type VisualNodeData,
  generateArduinoCode,
  parseFlowState,
  parseArduinoToBlocks,
} from './visual-programming'
import { CodeEditor } from './CodeEditor'

type EditorMode = 'diagram' | 'visual'

interface FlowEditorProps {
  mode: EditorMode
  value: unknown
  onChange: (next: FlowState) => void
  className?: string
  height?: number | string
}

// Custom node component for better visual blocks
function VisualBlockNode({ data }: { data: VisualNodeData }) {
  const blockType = data.blockType || 'default'
  const params = data.params || {}

  // Color schemes for different block types
  const colorSchemes: Record<
    string,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    setup: {
      bg: 'bg-cyan-100',
      border: 'border-cyan-400',
      text: 'text-cyan-800',
      icon: <Play className="w-3.5 h-3.5" />,
    },
    loop: {
      bg: 'bg-cyan-100',
      border: 'border-cyan-400',
      text: 'text-cyan-800',
      icon: <Repeat className="w-3.5 h-3.5" />,
    },
    variable: {
      bg: 'bg-violet-100',
      border: 'border-violet-400',
      text: 'text-violet-800',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
    servo_attach: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
    servo_write: {
      bg: 'bg-blue-100',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: <Gauge className="w-3.5 h-3.5" />,
    },
    delay: {
      bg: 'bg-amber-100',
      border: 'border-amber-400',
      text: 'text-amber-800',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    digital_write: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    digital_read: {
      bg: 'bg-green-100',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: <Radio className="w-3.5 h-3.5" />,
    },
    analog_write: {
      bg: 'bg-orange-100',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    analog_read: {
      bg: 'bg-orange-100',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: <Gauge className="w-3.5 h-3.5" />,
    },
    serial_print: {
      bg: 'bg-slate-100',
      border: 'border-slate-400',
      text: 'text-slate-800',
      icon: <Terminal className="w-3.5 h-3.5" />,
    },
    if_condition: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: <GitBranch className="w-3.5 h-3.5" />,
    },
    if_else: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-800',
      icon: <GitBranch className="w-3.5 h-3.5" />,
    },
    for_loop: {
      bg: 'bg-purple-100',
      border: 'border-purple-500',
      text: 'text-purple-800',
      icon: <Repeat className="w-3.5 h-3.5" />,
    },
    while_loop: {
      bg: 'bg-purple-100',
      border: 'border-purple-500',
      text: 'text-purple-800',
      icon: <Repeat className="w-3.5 h-3.5" />,
    },
    end_block: {
      bg: 'bg-slate-200',
      border: 'border-slate-400',
      text: 'text-slate-600',
      icon: null,
    },
  }

  const scheme =
    (Object.getOwnPropertyDescriptor(colorSchemes, blockType)?.value as
      | {
          bg: string
          border: string
          text: string
          icon: React.ReactNode
        }
      | undefined) || {
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      text: 'text-slate-700',
      icon: null,
    }

  // Helper to safely get string/number param
  const getParam = (key: string, fallback: string | number): string => {
    const val: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
    if (typeof val === 'string' || typeof val === 'number') return String(val)
    return String(fallback)
  }

  // Get display value based on block type
  const getDisplayValue = () => {
    switch (blockType) {
      case 'delay':
        return `${getParam('ms', 500)}ms`
      case 'digital_write':
        return `Pin ${getParam('pin', 13)} → ${getParam('value', 'HIGH')}`
      case 'digital_read':
        return `Pin ${getParam('pin', 2)} → ${getParam('variable', 'val')}`
      case 'analog_write':
        return `Pin ${getParam('pin', 9)} → ${getParam('value', 128)}`
      case 'analog_read':
        return `${getParam('pin', 'A0')} → ${getParam('variable', 'val')}`
      case 'servo_write':
        return `${getParam('variable', 'servo')} → ${getParam('angle', 90)}°`
      case 'servo_attach':
        return `${getParam('variable', 'servo')} @ Pin ${getParam('pin', 9)}`
      case 'serial_print': {
        const msg = typeof params.message === 'string' ? params.message : 'Hello'
        return `"${msg.slice(0, 12)}${msg.length > 12 ? '...' : ''}"`
      }
      case 'variable':
        return `${getParam('varType', 'int')} ${getParam('name', 'x')} = ${getParam('value', 0)}`
      case 'if_condition':
      case 'if_else': {
        const cond = typeof params.condition === 'string' ? params.condition : 'true'
        return `(${cond.slice(0, 15)}${cond.length > 15 ? '...' : ''})`
      }
      case 'for_loop':
        return `${getParam('variable', 'i')}: ${getParam('start', 0)} → ${getParam('end', 10)}`
      case 'while_loop': {
        const cond = typeof params.condition === 'string' ? params.condition : 'true'
        return `(${cond.slice(0, 12)}${cond.length > 12 ? '...' : ''})`
      }
      default:
        return null
    }
  }

  const displayValue = getDisplayValue()
  const isControlFlow = ['if_condition', 'if_else', 'for_loop', 'while_loop'].includes(blockType)
  const isEndBlock = blockType === 'end_block'

  return (
    <div
      className={cn(
        'relative rounded border-2 transition-shadow hover:shadow-sm',
        scheme.bg,
        scheme.border,
        isControlFlow ? 'min-w-[140px]' : 'min-w-[120px]',
        isEndBlock && 'min-w-[60px]',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white"
      />
      <div className={cn('px-3 py-2', isEndBlock && 'px-2 py-1')}>
        <div className={cn('flex items-center gap-1.5', scheme.text)}>
          {scheme.icon}
          <span className="font-mono text-xs font-semibold">{data.label}</span>
        </div>
        {displayValue && (
          <div className={cn('font-mono text-[10px] mt-0.5 opacity-75', scheme.text)}>
            {displayValue}
          </div>
        )}
      </div>
    </div>
  )
}

// Node types for visual mode
const visualNodeTypes: NodeTypes = {
  visualBlock: VisualBlockNode,
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
      type: 'visualBlock',
      position: { x: 60, y: 60 },
      data: { label: 'setup()', blockType: 'setup' },
    },
    {
      id: 'loop',
      type: 'visualBlock',
      position: { x: 60, y: 160 },
      data: { label: 'loop()', blockType: 'loop' },
    },
  ]
}

// Palette organized by category
const visualPalette: { category: string; blocks: { type: VisualBlockType; label: string; icon: React.ReactNode }[] }[] = [
  {
    category: 'Variables',
    blocks: [
      { type: 'variable', label: 'Variable', icon: <Settings className="w-3 h-3" /> },
    ],
  },
  {
    category: 'Control Flow',
    blocks: [
      { type: 'if_condition', label: 'If', icon: <GitBranch className="w-3 h-3" /> },
      { type: 'for_loop', label: 'For Loop', icon: <Repeat className="w-3 h-3" /> },
      { type: 'while_loop', label: 'While', icon: <Repeat className="w-3 h-3" /> },
      { type: 'end_block', label: 'End Block', icon: null },
    ],
  },
  {
    category: 'Timing',
    blocks: [
      { type: 'delay', label: 'Delay', icon: <Clock className="w-3 h-3" /> },
    ],
  },
  {
    category: 'Digital I/O',
    blocks: [
      { type: 'digital_write', label: 'Digital Write', icon: <Zap className="w-3 h-3" /> },
      { type: 'digital_read', label: 'Digital Read', icon: <Radio className="w-3 h-3" /> },
    ],
  },
  {
    category: 'Analog I/O',
    blocks: [
      { type: 'analog_write', label: 'PWM Write', icon: <Zap className="w-3 h-3" /> },
      { type: 'analog_read', label: 'Analog Read', icon: <Gauge className="w-3 h-3" /> },
    ],
  },
  {
    category: 'Servo',
    blocks: [
      { type: 'servo_attach', label: 'Servo Attach', icon: <Settings className="w-3 h-3" /> },
      { type: 'servo_write', label: 'Servo Write', icon: <Gauge className="w-3 h-3" /> },
    ],
  },
  {
    category: 'Serial',
    blocks: [
      { type: 'serial_print', label: 'Serial Print', icon: <Terminal className="w-3 h-3" /> },
    ],
  },
]

function createVisualNode(
  blockType: VisualBlockType,
): FlowState['nodes'][number] {
  const id = randomId()

  const blockConfigs: Record<
    VisualBlockType,
    { label: string; params: Record<string, unknown> }
  > = {
    setup: { label: 'setup()', params: {} },
    loop: { label: 'loop()', params: {} },
    variable: { label: 'Variable', params: { name: 'value', varType: 'int', value: 0 } },
    servo_attach: { label: 'Servo Attach', params: { variable: 'servo', pin: 9 } },
    servo_write: { label: 'Servo Write', params: { variable: 'servo', angle: 90 } },
    delay: { label: 'Delay', params: { ms: 500 } },
    digital_write: { label: 'Digital Write', params: { pin: 13, value: 'HIGH' } },
    digital_read: { label: 'Digital Read', params: { pin: 2, variable: 'buttonState' } },
    analog_write: { label: 'PWM Write', params: { pin: 9, value: 128 } },
    analog_read: { label: 'Analog Read', params: { pin: 'A0', variable: 'sensorValue' } },
    serial_print: { label: 'Serial Print', params: { message: 'Hello' } },
    if_condition: { label: 'If', params: { condition: 'buttonState == HIGH' } },
    if_else: { label: 'If/Else', params: { condition: 'buttonState == HIGH' } },
    for_loop: { label: 'For Loop', params: { variable: 'i', start: 0, end: 10, step: 1 } },
    while_loop: { label: 'While', params: { condition: 'true' } },
    end_block: { label: 'End', params: {} },
  }

  const config =
    (Object.getOwnPropertyDescriptor(blockConfigs, blockType)?.value as
      | {
          label: string
          params: Record<string, unknown>
        }
      | undefined) || { label: 'Block', params: {} }

  return {
    id,
    type: 'visualBlock',
    position: { x: 280, y: 140 },
    data: { label: config.label, blockType, params: config.params },
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

  // Undo/redo state
  const [history, setHistory] = useState<{ past: FlowState[]; future: FlowState[] }>({
    past: [],
    future: [],
  })
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importCode, setImportCode] = useState('')

  // Layout state
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [paletteWidth, setPaletteWidth] = useState(208)
  const [inspectorWidth, setInspectorWidth] = useState(300)
  const [codeOpen, setCodeOpen] = useState(true)

  type ResizeTarget = 'palette' | 'inspector'
  const [resizeTarget, setResizeTarget] = useState<ResizeTarget | null>(null)
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  )

  useEffect(() => {
    if (!resizeTarget) return

    const onMove = (e: PointerEvent) => {
      const start = resizeStartRef.current
      if (!start) return

      const deltaX = e.clientX - start.startX
      if (resizeTarget === 'palette') {
        setPaletteWidth(clampNumber(start.startWidth + deltaX, 160, 360))
        return
      }

      setInspectorWidth(clampNumber(start.startWidth - deltaX, 240, 480))
    }

    const onUp = () => {
      setResizeTarget(null)
      resizeStartRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizeTarget])

  // Push to history (call before state changes)
  const pushToHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past.slice(-19), { nodes, edges }],
      future: [],
    }))
  }, [nodes, edges])

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return
    const previous = history.past[history.past.length - 1]
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      future: [{ nodes, edges }, ...h.future],
    }))
    setNodes(previous.nodes)
    setEdges(previous.edges)
  }, [history.past, nodes, edges, setNodes, setEdges])

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return
    const next = history.future[0]
    setHistory((h) => ({
      past: [...h.past, { nodes, edges }],
      future: h.future.slice(1),
    }))
    setNodes(next.nodes)
    setEdges(next.edges)
  }, [history.future, nodes, edges, setNodes, setEdges])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // Handle import code
  const handleImportCode = () => {
    if (!importCode.trim()) return
    pushToHistory()
    const imported = parseArduinoToBlocks(importCode)
    setNodes(imported.nodes)
    setEdges(imported.edges)
    setShowImportDialog(false)
    setImportCode('')
  }

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
    pushToHistory()
    if (mode === 'visual') {
      setNodes((prev) => [...prev, createVisualNode(type as VisualBlockType)])
      return
    }
    setNodes((prev) => [...prev, createDiagramNode(type as DiagramStyleKey)])
  }

  const setSelectedLabel = (label: string) => {
    if (!selectedId) return
    pushToHistory()
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== selectedId) return n
        return { ...n, data: { ...n.data, label } }
      }),
    )
  }

  const updateSelectedParams = (patch: Record<string, unknown>) => {
    if (!selectedId) return
    pushToHistory()
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
    pushToHistory()
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

  const exportAsImage = async () => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewport) return

    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        filter: (node: Element) => {
          const className = (node as HTMLElement).className
          if (typeof className === 'string') {
            if (className.includes('react-flow__controls')) return false
            if (className.includes('react-flow__minimap')) return false
          }
          return true
        },
      })

      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'visual-blocks.png'
      document.body.append(a)
      a.click()
      a.remove()
    } catch (error) {
      console.error('Failed to export image:', error)
    }
  }

  return (
    <div
      className={cn(
        'rounded border border-slate-200 bg-white overflow-hidden',
        className,
      )}
    >
      <div
        className="grid lg:grid-cols-[var(--flow-editor-palette)_minmax(0,1fr)_var(--flow-editor-inspector)]"
        style={
          {
            '--flow-editor-palette': paletteOpen ? `${paletteWidth}px` : '44px',
            '--flow-editor-inspector': inspectorOpen
              ? `${inspectorWidth}px`
              : '44px',
          } as React.CSSProperties
        }
      >
        {/* Palette */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-200 relative">
          {paletteOpen ? (
            <div className="h-full p-4 flex flex-col min-h-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {mode === 'visual' ? 'Blocks' : 'Diagram'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {mode === 'visual'
                      ? 'Add blocks, connect them, and preview code.'
                      : 'Add nodes and connect them to create a diagram.'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaletteOpen(false)}
                  className="h-7 w-7 p-0"
                  title="Hide blocks"
                  aria-label="Hide blocks"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                {mode === 'visual' ? (
                  visualPalette.map((category) => (
                    <div key={category.category}>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                        {category.category}
                      </p>
                      <div className="space-y-1">
                        {category.blocks.map((block) => (
                          <Button
                            key={block.type}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full justify-start font-mono text-xs h-7 gap-1.5"
                            onClick={() => {
                              addNode(block.type)
                            }}
                          >
                            {block.icon}
                            {block.label}
                          </Button>
                        ))}
                      </div>
                    </div>
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

              <div
                className="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none hover:bg-slate-100 hidden lg:block"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize blocks panel"
                onPointerDown={(e) => {
                  e.preventDefault()
                  setResizeTarget('palette')
                  resizeStartRef.current = {
                    startX: e.clientX,
                    startWidth: paletteWidth,
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-full p-2 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                className="h-8 w-8 p-0"
                title="Show blocks"
                aria-label="Show blocks"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-mono text-slate-500 lg:[writing-mode:vertical-rl]">
                Blocks
              </span>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div
          className="border-b lg:border-b-0 lg:border-r border-slate-200 relative"
          style={{ height }}
        >
          {/* Toolbar */}
          {mode === 'visual' && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-white rounded border border-slate-200 p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo}
                className="h-7 w-7 p-0"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo}
                className="h-7 w-7 p-0"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="h-7 px-2 text-xs gap-1"
                title="Import Arduino code"
              >
                <Upload className="h-3.5 w-3.5" />
                Import
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void exportAsImage()}
                className="h-7 px-2 text-xs gap-1"
                title="Export as image"
              >
                <Download className="h-3.5 w-3.5" />
                PNG
              </Button>
            </div>
          )}
          <ReactFlow<FlowState['nodes'][number]>
            nodes={nodes}
            edges={edges}
            nodeTypes={mode === 'visual' ? visualNodeTypes : undefined}
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
            className="h-full"
            defaultEdgeOptions={{
              style: { stroke: '#64748b', strokeWidth: 2 },
              type: 'smoothstep',
            }}
          >
            <Background
              gap={16}
              size={1}
              color="#e2e8f0"
            />
            <Controls />
            <MiniMap zoomable pannable nodeColor="#0e7490" />
          </ReactFlow>
        </div>

        {/* Properties / Preview */}
        <div className="relative">
          {inspectorOpen ? (
            <div className="h-full p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-slate-900">
                  Inspector
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deleteSelected}
                    disabled={!selectedNode}
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectorOpen(false)}
                    className="h-7 w-7 p-0"
                    title="Hide inspector"
                    aria-label="Hide inspector"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
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
                          <p className="text-xs text-slate-500 font-mono">
                            Params
                          </p>
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
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCodeOpen((prev) => !prev)
                          }}
                          className="flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-900 hover:text-slate-900"
                          aria-expanded={codeOpen}
                          aria-label={
                            codeOpen
                              ? 'Collapse generated code'
                              : 'Expand generated code'
                          }
                        >
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              codeOpen ? 'rotate-0' : '-rotate-90',
                            )}
                          />
                          Generated Code
                        </button>
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
                            <span className="ml-1">
                              {copied ? 'Copied' : 'Copy'}
                            </span>
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
                      {codeOpen && (
                        <CodeEditor
                          initialCode={generatedCode}
                          language="cpp"
                          readOnly
                          hideReset
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              <div
                className="absolute top-0 left-0 h-full w-1 cursor-col-resize touch-none hover:bg-slate-100 hidden lg:block"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize inspector panel"
                onPointerDown={(e) => {
                  e.preventDefault()
                  setResizeTarget('inspector')
                  resizeStartRef.current = {
                    startX: e.clientX,
                    startWidth: inspectorWidth,
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-full p-2 flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInspectorOpen(true)}
                className="h-8 w-8 p-0"
                title="Show inspector"
                aria-label="Show inspector"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-mono text-slate-500 lg:[writing-mode:vertical-rl]">
                Inspector
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Import Code Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-mono text-lg font-semibold text-slate-900">
                  Import Arduino Code
                </h3>
                <p className="text-sm text-slate-500">
                  Paste your Arduino code to convert it to visual blocks
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportCode('')
                }}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder={`void setup() {
  // setup code here
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`}
                className="w-full h-64 font-mono text-sm p-3 rounded border border-slate-200 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Supported: delay(), digitalWrite(), analogWrite(), servo commands, for loops, if statements
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportCode('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImportCode}
                disabled={!importCode.trim()}
                className="bg-cyan-700 hover:bg-cyan-600 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Code
              </Button>
            </div>
          </div>
        </div>
      )}
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

  if (blockType === 'digital_read') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Pin</Label>
          <Input
            type="number"
            value={typeof params.pin === 'number' ? params.pin : 2}
            onChange={(e) => {
              onChange({ pin: Number(e.target.value) })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Store in variable</Label>
          <Input
            value={typeof params.variable === 'string' ? params.variable : 'buttonState'}
            onChange={(e) => {
              onChange({ variable: e.target.value })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'analog_read') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Pin</Label>
          <Input
            value={typeof params.pin === 'string' ? params.pin : 'A0'}
            onChange={(e) => {
              onChange({ pin: e.target.value })
            }}
            placeholder="A0, A1, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Store in variable</Label>
          <Input
            value={typeof params.variable === 'string' ? params.variable : 'sensorValue'}
            onChange={(e) => {
              onChange({ variable: e.target.value })
            }}
          />
        </div>
      </div>
    )
  }

  if (blockType === 'if_condition' || blockType === 'if_else') {
    return (
      <div className="space-y-2">
        <Label>Condition</Label>
        <Input
          value={typeof params.condition === 'string' ? params.condition : 'true'}
          onChange={(e) => {
            onChange({ condition: e.target.value })
          }}
          placeholder="e.g., buttonState == HIGH"
        />
        <p className="text-[10px] text-slate-500">
          Examples: buttonState == HIGH, sensorValue &gt; 500, i &lt; 10
        </p>
      </div>
    )
  }

  if (blockType === 'for_loop') {
    return (
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Variable</Label>
          <Input
            value={typeof params.variable === 'string' ? params.variable : 'i'}
            onChange={(e) => {
              onChange({ variable: e.target.value })
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Start</Label>
            <Input
              type="number"
              value={typeof params.start === 'number' ? params.start : 0}
              onChange={(e) => {
                onChange({ start: Number(e.target.value) })
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">End</Label>
            <Input
              type="number"
              value={typeof params.end === 'number' ? params.end : 10}
              onChange={(e) => {
                onChange({ end: Number(e.target.value) })
              }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Step</Label>
            <Input
              type="number"
              value={typeof params.step === 'number' ? params.step : 1}
              onChange={(e) => {
                onChange({ step: Number(e.target.value) })
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (blockType === 'while_loop') {
    return (
      <div className="space-y-2">
        <Label>Condition</Label>
        <Input
          value={typeof params.condition === 'string' ? params.condition : 'true'}
          onChange={(e) => {
            onChange({ condition: e.target.value })
          }}
          placeholder="e.g., sensorValue < 500"
        />
        <p className="text-[10px] text-slate-500">
          Loop runs while condition is true
        </p>
      </div>
    )
  }

  if (blockType === 'setup' || blockType === 'loop' || blockType === 'end_block') {
    return <p className="text-sm text-slate-500">This block has no configurable parameters.</p>
  }

  return <p className="text-sm text-slate-500">No parameters for this block.</p>
}
