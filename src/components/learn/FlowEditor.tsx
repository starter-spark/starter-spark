'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type NodeTypes,
  type OnSelectionChangeParams,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Upload,
} from 'lucide-react'
import { reactFlowTokens } from '@/styles/reactflow-tokens'
import { cn } from '@/lib/utils'
import { randomId } from '@/lib/random-id'
import {
  type FlowState,
  type VisualBlockType,
  type VisualEdgeKind,
  buildArduinoProgramAstFromFlow,
  emitArduinoFromAst,
  parseFlowState,
  parseArduinoToBlocks,
} from './visual-programming'
import { CodeEditor } from './CodeEditor'
import { VisualBlockNode } from './visual-blocks/VisualBlockNode'
import { VisualParamsEditor } from './visual-blocks/VisualParamsEditor'
import {
  getVisualBlockDefaults,
  visualBlockPalette,
} from './visual-blocks/registry'

type EditorMode = 'diagram' | 'visual'

interface FlowEditorProps {
  mode: EditorMode
  value: unknown
  onChange: (next: FlowState) => void
  className?: string
  height?: number | string
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

function createVisualNode(
  blockType: VisualBlockType,
): FlowState['nodes'][number] {
  const id = randomId()
  const config = getVisualBlockDefaults(blockType)

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
  const parsed = useMemo(() => parseFlowState(value, { mode }), [mode, value])
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

  const variableNameDatalistId = useId()
  const variableNames = useMemo(() => {
    if (mode !== 'visual') return []
    const names = new Set<string>()
    for (const node of nodes) {
      if (node.data?.blockType !== 'variable') continue
      const params = node.data.params
      const raw = typeof params?.name === 'string' ? params.name : null
      const name = raw?.trim()
      if (name) names.add(name)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [mode, nodes])

  // Undo/redo state
  const [history, setHistory] = useState<{
    past: FlowState[]
    future: FlowState[]
  }>({
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
  const [fullscreen, setFullscreen] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')

  const filteredVisualPalette = useMemo(() => {
    const query = paletteSearch.trim().toLowerCase()
    if (!query) return visualBlockPalette

    return visualBlockPalette
      .map((category) => ({
        ...category,
        blocks: category.blocks.filter((block) => {
          const label = block.label.toLowerCase()
          const type = block.type.toLowerCase()
          return label.includes(query) || type.includes(query)
        }),
      }))
      .filter((category) => category.blocks.length > 0)
  }, [paletteSearch])

  const [openPaletteCategories, setOpenPaletteCategories] = useState<string[]>([
    'variables',
    'control',
    'io',
  ])
  const openPaletteCategoriesRef = useRef(openPaletteCategories)
  const openPaletteSnapshotRef = useRef<string[] | null>(null)

  useEffect(() => {
    openPaletteCategoriesRef.current = openPaletteCategories
  }, [openPaletteCategories])

  useEffect(() => {
    const query = paletteSearch.trim()
    if (!query) {
      if (openPaletteSnapshotRef.current) {
        setOpenPaletteCategories(openPaletteSnapshotRef.current)
        openPaletteSnapshotRef.current = null
      }
      return
    }

    if (!openPaletteSnapshotRef.current) {
      openPaletteSnapshotRef.current = openPaletteCategoriesRef.current
    }
    setOpenPaletteCategories(filteredVisualPalette.map((c) => c.id))
  }, [filteredVisualPalette, paletteSearch])

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
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
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
    const migrated = parseFlowState(imported, { mode: 'visual' })
    setNodes(migrated.nodes)
    setEdges(migrated.edges)
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

    onChangeRef.current(
      mode === 'visual' ? { version: 2, nodes, edges } : { nodes, edges },
    )
  }, [edges, mode, nodes])

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (mode !== 'visual') return true
      if (!connection.source || !connection.target) return false
      if (connection.source === connection.target) return false
      if (connection.targetHandle !== 'in') return false
      const sourceHandle = connection.sourceHandle
      return (
        sourceHandle === 'next' ||
        sourceHandle === 'body' ||
        sourceHandle === 'else'
      )
    },
    [mode],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (mode === 'visual') {
        if (!connection.source || !connection.target) return
        if (connection.targetHandle !== 'in') return
        const sourceHandle = connection.sourceHandle
        if (
          sourceHandle !== 'next' &&
          sourceHandle !== 'body' &&
          sourceHandle !== 'else'
        )
          return
        if (connection.source === connection.target) return

        const kind = sourceHandle as VisualEdgeKind
        const style =
          kind === 'body'
            ? { stroke: '#0891b2', strokeWidth: 2, strokeDasharray: '6 3' }
            : kind === 'else'
              ? { stroke: '#d97706', strokeWidth: 2, strokeDasharray: '6 3' }
              : { stroke: '#64748b', strokeWidth: 2 }

        pushToHistory()
        setEdges((eds) => {
          const filtered = eds.filter((e) => {
            if (
              e.source === connection.source &&
              e.sourceHandle === sourceHandle
            )
              return false
            if (e.target === connection.target && e.targetHandle === 'in')
              return false
            return true
          })
          return addEdge(
            {
              ...connection,
              id: randomId(),
              data: { kind },
              style,
              type: 'smoothstep',
            },
            filtered,
          )
        })
        return
      }

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
    [mode, pushToHistory, setEdges],
  )

  const styleForVisualEdgeKind = (kind: VisualEdgeKind) => {
    if (kind === 'body') {
      return { stroke: '#0891b2', strokeWidth: 2, strokeDasharray: '6 3' }
    }
    if (kind === 'else') {
      return { stroke: '#d97706', strokeWidth: 2, strokeDasharray: '6 3' }
    }
    return { stroke: '#64748b', strokeWidth: 2 }
  }

  const createVisualEdge = (options: {
    source: string
    target: string
    kind: VisualEdgeKind
  }): Edge => {
    return {
      id: randomId(),
      source: options.source,
      target: options.target,
      sourceHandle: options.kind,
      targetHandle: 'in',
      data: { kind: options.kind },
      style: styleForVisualEdgeKind(options.kind),
      type: 'smoothstep',
    }
  }

  const addNode = (type: VisualBlockType | DiagramStyleKey) => {
    pushToHistory()
    if (mode === 'visual') {
      const blockType = type as VisualBlockType
      const baseNode = createVisualNode(blockType)

      const selectedBlockType = selectedNode?.data?.blockType
      const isSelectedContainer =
        selectedBlockType === 'if_condition' ||
        selectedBlockType === 'if_else' ||
        selectedBlockType === 'for_loop' ||
        selectedBlockType === 'while_loop'

      const canAutoConnect =
        selectedId &&
        selectedNode &&
        selectedBlockType !== 'variable' &&
        selectedBlockType !== 'pin_mode'

      const existingBody =
        canAutoConnect && isSelectedContainer
          ? edges.some(
              (e) =>
                e.source === selectedId &&
                (e.sourceHandle === 'body' || e.data?.kind === 'body'),
            )
          : false

      const preferredKind: VisualEdgeKind | null = (() => {
        if (!canAutoConnect) return null
        if (selectedBlockType === 'setup' || selectedBlockType === 'loop')
          return 'body'
        if (isSelectedContainer && !existingBody) return 'body'
        return 'next'
      })()

      const position = (() => {
        if (!selectedNode) return baseNode.position
        if (preferredKind === 'body' && isSelectedContainer) {
          return {
            x: selectedNode.position.x + 240,
            y: selectedNode.position.y,
          }
        }
        return { x: selectedNode.position.x, y: selectedNode.position.y + 96 }
      })()

      const node = { ...baseNode, position }
      setNodes((prev) => [...prev, node])
      setSelectedId(node.id)

      if (canAutoConnect && preferredKind) {
        setEdges((prevEdges) => {
          const existingOut = prevEdges.find(
            (e) =>
              e.source === selectedId &&
              (e.sourceHandle === preferredKind ||
                e.data?.kind === preferredKind),
          )

          const existingTarget = existingOut?.target
          const filtered = prevEdges.filter((e) => {
            if (e.source !== selectedId) return true
            const kind = e.data?.kind ?? e.sourceHandle
            if (kind === preferredKind) return false
            return true
          })

          const nextEdges = [
            ...filtered,
            createVisualEdge({
              source: selectedId,
              target: node.id,
              kind: preferredKind,
            }),
          ]

          if (!existingTarget) return nextEdges
          return [
            ...nextEdges,
            createVisualEdge({
              source: node.id,
              target: existingTarget,
              kind: 'next',
            }),
          ]
        })
      }
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
    if (
      selectedNode?.data?.blockType === 'setup' ||
      selectedNode?.data?.blockType === 'loop'
    )
      return
    pushToHistory()
    setNodes((prev) => prev.filter((n) => n.id !== selectedId))
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedId && e.target !== selectedId),
    )
    setSelectedId(null)
  }

  const generatedAst = useMemo(() => {
    if (mode !== 'visual') return null
    return buildArduinoProgramAstFromFlow({ nodes, edges })
  }, [edges, mode, nodes])

  const generatedCode = useMemo(() => {
    if (!generatedAst) return null
    return emitArduinoFromAst(generatedAst)
  }, [generatedAst])

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
    const viewport = document.querySelector(
      '.react-flow__viewport',
    ) as HTMLElement
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

  useEffect(() => {
    if (!fullscreen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fullscreen])

  const canvasHeight = fullscreen ? '100vh' : height

  return (
    <div
      className={cn(
        'bg-white overflow-hidden',
        fullscreen
          ? 'fixed inset-0 z-50 border-0 rounded-none'
          : 'rounded border border-slate-200',
        !fullscreen && className,
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
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500">
                        Search
                      </Label>
                      <Input
                        value={paletteSearch}
                        onChange={(e) => {
                          setPaletteSearch(e.target.value)
                        }}
                        placeholder="Find a block…"
                        className="h-8 font-mono text-xs"
                      />
                    </div>

                    {filteredVisualPalette.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No blocks match{' '}
                        <span className="font-mono">
                          {paletteSearch.trim()}
                        </span>
                        .
                      </p>
                    ) : (
                      <Accordion
                        type="multiple"
                        value={openPaletteCategories}
                        onValueChange={setOpenPaletteCategories}
                        className="w-full"
                      >
                        {filteredVisualPalette.map((category) => (
                          <AccordionItem
                            key={category.id}
                            value={category.id}
                            className="border-b border-slate-200"
                          >
                            <AccordionTrigger
                              className={cn(
                                'py-2 text-[10px] uppercase tracking-wide font-semibold hover:no-underline',
                                category.accentClassName,
                              )}
                            >
                              {category.label}
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
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
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
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
          style={{ height: canvasHeight }}
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
              <Separator orientation="vertical" className="h-5 mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFullscreen((prev) => !prev)}
                className="h-7 w-7 p-0"
                title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {fullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
          <ReactFlow<FlowState['nodes'][number]>
            nodes={nodes}
            edges={edges}
            nodeTypes={mode === 'visual' ? visualNodeTypes : undefined}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            isValidConnection={isValidConnection}
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
            <Background gap={16} size={1} color="#e2e8f0" />
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
                          variableNames={variableNames}
                          variableNameDatalistId={variableNameDatalistId}
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
                    {generatedAst &&
                      (generatedAst.errors.length > 0 ||
                        generatedAst.warnings.length > 0) && (
                        <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-sm font-semibold text-slate-900">
                              Problems
                            </p>
                            <p className="text-xs text-slate-500">
                              {generatedAst.errors.length} error
                              {generatedAst.errors.length === 1
                                ? ''
                                : 's'}, {generatedAst.warnings.length} warning
                              {generatedAst.warnings.length === 1 ? '' : 's'}
                            </p>
                          </div>

                          {generatedAst.errors.length > 0 && (
                            <div>
                              <p className="text-[11px] font-mono text-red-700">
                                Errors
                              </p>
                              <ul className="mt-1 space-y-1 text-[11px] text-red-700">
                                {generatedAst.errors.slice(0, 6).map((msg) => (
                                  <li key={msg} className="flex gap-2">
                                    <span aria-hidden="true">•</span>
                                    <span className="min-w-0">{msg}</span>
                                  </li>
                                ))}
                                {generatedAst.errors.length > 6 && (
                                  <li className="text-[11px] text-red-700">
                                    …and {generatedAst.errors.length - 6} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {generatedAst.warnings.length > 0 && (
                            <div>
                              <p className="text-[11px] font-mono text-amber-700">
                                Warnings
                              </p>
                              <ul className="mt-1 space-y-1 text-[11px] text-amber-700">
                                {generatedAst.warnings
                                  .slice(0, 6)
                                  .map((msg) => (
                                    <li key={msg} className="flex gap-2">
                                      <span aria-hidden="true">•</span>
                                      <span className="min-w-0">{msg}</span>
                                    </li>
                                  ))}
                                {generatedAst.warnings.length > 6 && (
                                  <li className="text-[11px] text-amber-700">
                                    …and {generatedAst.warnings.length - 6} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
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
                          value={generatedCode}
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
                Supported: delay(), digitalWrite(), analogWrite(), servo
                commands, for loops, if statements
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
