import type { Edge, Node } from '@xyflow/react'

export type VisualBlockType =
  | 'setup'
  | 'loop'
  | 'variable'
  | 'variable_set'
  | 'variable_change'
  | 'math_set'
  | 'math_random'
  | 'comment'
  | 'servo_attach'
  | 'servo_write'
  | 'delay'
  | 'pin_mode'
  | 'digital_write'
  | 'analog_write'
  | 'analog_read'
  | 'digital_read'
  | 'serial_begin'
  | 'serial_print'
  | 'serial_print_value'
  // Control flow blocks
  | 'if_condition'
  | 'if_else'
  | 'for_loop'
  | 'while_loop'
  | 'end_block'

export interface VisualNodeData {
  blockType?: VisualBlockType
  label?: string
  params?: Record<string, unknown>
  // For nested blocks, track which block this ends
  endsBlockId?: string
  [key: string]: unknown
}

export type VisualEdgeKind = 'next' | 'body' | 'else'

export interface VisualEdgeData {
  kind?: VisualEdgeKind
  [key: string]: unknown
}

export interface FlowState {
  version?: 2
  nodes: Node<VisualNodeData>[]
  edges: Edge<VisualEdgeData>[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

type ParseMode = 'auto' | 'diagram' | 'visual'

function looksLikeVisualBlocksFlow(nodes: Node<VisualNodeData>[]) {
  return (
    nodes.some((n) => typeof n.data?.blockType === 'string') ||
    nodes.some((n) => n.id === 'setup' || n.id === 'loop')
  )
}

function getEdgeKind(
  edge: Edge<VisualEdgeData>,
  nodesById: Map<string, Node<VisualNodeData>>,
) {
  const fromData = edge.data?.kind
  if (fromData === 'next' || fromData === 'body' || fromData === 'else')
    return fromData

  const fromHandle = edge.sourceHandle
  if (fromHandle === 'next' || fromHandle === 'body' || fromHandle === 'else')
    return fromHandle

  const sourceNode = nodesById.get(edge.source)
  const blockType = sourceNode?.data?.blockType
  if (blockType === 'setup' || blockType === 'loop') return 'body'

  return 'next'
}

function createTypedEdge(options: {
  source: string
  target: string
  kind: VisualEdgeKind
}): Edge<VisualEdgeData> {
  const { source, target, kind } = options
  return {
    id: `v2_${kind}_${source}_${target}`,
    source,
    target,
    sourceHandle: kind,
    targetHandle: 'in',
    data: { kind },
  }
}

function ensureRootVisualNodes(
  nodes: Node<VisualNodeData>[],
): Node<VisualNodeData>[] {
  const hasSetup = nodes.some((n) => n.data?.blockType === 'setup')
  const hasLoop = nodes.some((n) => n.data?.blockType === 'loop')
  if (hasSetup && hasLoop) return nodes

  const next = [...nodes]
  const usedIds = new Set(nodes.map((n) => n.id))

  if (!hasSetup) {
    const id = usedIds.has('setup') ? 'setup_root' : 'setup'
    usedIds.add(id)
    next.push({
      id,
      type: 'visualBlock',
      position: { x: 60, y: 60 },
      data: { label: 'setup()', blockType: 'setup' },
    })
  }

  if (!hasLoop) {
    const id = usedIds.has('loop') ? 'loop_root' : 'loop'
    next.push({
      id,
      type: 'visualBlock',
      position: { x: 60, y: 160 },
      data: { label: 'loop()', blockType: 'loop' },
    })
  }

  return next
}

function normalizeVisualNodeTypes(
  nodes: Node<VisualNodeData>[],
): Node<VisualNodeData>[] {
  return nodes.map((n) => {
    if (typeof n.data?.blockType !== 'string') return n
    if (n.type === 'visualBlock') return n
    return { ...n, type: 'visualBlock' }
  })
}

function isContainerType(type: VisualBlockType | undefined) {
  return (
    type === 'if_condition' ||
    type === 'if_else' ||
    type === 'for_loop' ||
    type === 'while_loop'
  )
}

function migrateLinearEdgesToV2(options: {
  nodes: Node<VisualNodeData>[]
  edges: Edge<VisualEdgeData>[]
}): FlowState {
  const originalNodes = options.nodes
  const originalEdges = options.edges

  const nodesWithRoots = ensureRootVisualNodes(
    normalizeVisualNodeTypes(originalNodes),
  )
  const nodesForResult = nodesWithRoots.filter(
    (n) => n.data?.blockType !== 'end_block',
  )

  const nodesById = new Map(nodesWithRoots.map((n) => [n.id, n]))

  const outgoing = new Map<string, string[]>()
  for (const edge of originalEdges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
    outgoing.get(edge.source)?.push(edge.target)
  }
  const nextFrom = (id: string) => outgoing.get(id)?.[0]

  const newEdges: Edge<VisualEdgeData>[] = []
  const created = new Set<string>()
  const pushEdge = (source: string, target: string, kind: VisualEdgeKind) => {
    if (source === target) return
    const id = `v2_${kind}_${source}_${target}`
    if (created.has(id)) return
    created.add(id)
    newEdges.push(createTypedEdge({ source, target, kind }))
  }

  const rootIds = nodesWithRoots
    .filter(
      (n) => n.data?.blockType === 'setup' || n.data?.blockType === 'loop',
    )
    .map((n) => n.id)

  for (const rootId of rootIds) {
    let first = nextFrom(rootId)
    while (first) {
      const node = nodesById.get(first)
      if (!node) break
      if (node.data?.blockType !== 'end_block') break
      first = nextFrom(first)
    }
    if (!first || !nodesById.has(first)) continue

    pushEdge(rootId, first, 'body')

    type Context = { ownerId: string; lastStatementId: string | null }
    const stack: Context[] = [{ ownerId: rootId, lastStatementId: null }]

    let currentId: string | undefined = first
    const visited = new Set<string>()

    while (currentId) {
      if (visited.has(currentId)) break
      visited.add(currentId)

      const node = nodesById.get(currentId)
      if (!node) break

      const type = node.data?.blockType
      if (type === 'end_block') {
        if (stack.length > 1) stack.pop()
        currentId = nextFrom(currentId)
        continue
      }

      const ctx = stack[stack.length - 1]
      if (ctx?.lastStatementId) {
        pushEdge(ctx.lastStatementId, currentId, 'next')
      }
      if (ctx) ctx.lastStatementId = currentId

      const nextId = nextFrom(currentId)
      if (isContainerType(type) && nextId && nodesById.has(nextId)) {
        const nextNode = nodesById.get(nextId)
        if (nextNode && nextNode.data?.blockType !== 'end_block') {
          pushEdge(currentId, nextId, 'body')
          stack.push({ ownerId: currentId, lastStatementId: null })
        }
      }

      currentId = nextFrom(currentId)
    }
  }

  return { version: 2, nodes: nodesForResult, edges: newEdges }
}

export function parseFlowState(
  value: unknown,
  options?: { mode?: ParseMode },
): FlowState {
  if (!isRecord(value)) return { version: 2, nodes: [], edges: [] }
  const nodesRaw = value.nodes
  const edgesRaw = value.edges
  const nodes: FlowState['nodes'] = []
  const edges: FlowState['edges'] = []

  if (isUnknownArray(nodesRaw)) {
    for (const item of nodesRaw) {
      if (!isRecord(item)) continue
      if (typeof item.id !== 'string') continue
      nodes.push(item as unknown as Node<VisualNodeData>)
    }
  }

  if (isUnknownArray(edgesRaw)) {
    for (const item of edgesRaw) {
      if (!isRecord(item)) continue
      if (typeof item.id !== 'string') continue
      if (typeof item.source !== 'string' || typeof item.target !== 'string')
        continue
      edges.push(item as unknown as Edge<VisualEdgeData>)
    }
  }

  const parseMode = options?.mode ?? 'auto'
  const visual =
    parseMode === 'visual' ||
    (parseMode === 'auto' && looksLikeVisualBlocksFlow(nodes))

  const version = value.version === 2 ? 2 : undefined
  if (!visual) return { version, nodes, edges }
  const hasTypedEdges = edges.some((edge) => {
    const kind = edge.data?.kind
    if (kind === 'next' || kind === 'body' || kind === 'else') return true
    const handle = edge.sourceHandle
    return handle === 'next' || handle === 'body' || handle === 'else'
  })

  if (version === 2 || hasTypedEdges) {
    const nodesWithRoots = ensureRootVisualNodes(
      normalizeVisualNodeTypes(nodes),
    )
    const nodesById = new Map(nodesWithRoots.map((n) => [n.id, n]))
    const normalizedEdges = edges.map((edge) => {
      const kind = getEdgeKind(edge, nodesById)
      const next = { ...edge }
      if (!next.sourceHandle) next.sourceHandle = kind
      if (!next.targetHandle) next.targetHandle = 'in'
      next.data = { ...(isRecord(next.data) ? next.data : {}), kind }
      return next
    })
    return { version: 2, nodes: nodesWithRoots, edges: normalizedEdges }
  }

  return migrateLinearEdgesToV2({ nodes, edges })
}

// Helper to get a numeric param
function getNumParam(
  params: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const raw: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && Number.isFinite(Number(raw)))
    return Number(raw)
  return fallback
}

// Helper to get a string param
function getStrParam(
  params: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const raw: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  return typeof raw === 'string' ? raw : fallback
}

export type VisualBlocksStmt =
  | { kind: 'comment'; text: string }
  | { kind: 'delay'; ms: number }
  | { kind: 'digital_write'; pin: number; value: string }
  | { kind: 'digital_read'; pin: number; variable: string }
  | { kind: 'analog_write'; pin: number; value: string }
  | { kind: 'analog_read'; pin: string; variable: string }
  | { kind: 'servo_attach'; variable: string; pin: number }
  | { kind: 'servo_write'; variable: string; angle: string }
  | { kind: 'variable_set'; name: string; value: string }
  | { kind: 'variable_change'; name: string; delta: number }
  | {
      kind: 'math_set'
      target: string
      left: string
      op: string
      right: string
    }
  | { kind: 'math_random'; target: string; min: number; max: number }
  | { kind: 'serial_begin'; baud: number }
  | { kind: 'serial_print'; message: string }
  | { kind: 'serial_print_value'; value: string; newline: boolean }
  | {
      kind: 'if'
      condition: string
      then: VisualBlocksStmt[]
      else: VisualBlocksStmt[]
    }
  | {
      kind: 'for'
      variable: string
      start: number
      end: number
      step: number
      body: VisualBlocksStmt[]
    }
  | { kind: 'while'; condition: string; body: VisualBlocksStmt[] }
  | { kind: 'unknown'; blockType: VisualBlockType }

export type ArduinoProgramAst = {
  globals: Array<{ name: string; varType: string; value: string }>
  servoVariables: string[]
  usesSerial: boolean
  hasSerialBegin: boolean
  pinModes: Array<{ pin: number; mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP' }>
  setup: VisualBlocksStmt[]
  loop: VisualBlocksStmt[]
  errors: string[]
  warnings: string[]
}

function walkStatements(
  stmts: VisualBlocksStmt[],
  visit: (stmt: VisualBlocksStmt) => void,
) {
  for (const stmt of stmts) {
    visit(stmt)
    if (stmt.kind === 'if') {
      walkStatements(stmt.then, visit)
      walkStatements(stmt.else, visit)
    } else if (stmt.kind === 'for' || stmt.kind === 'while') {
      walkStatements(stmt.body, visit)
    }
  }
}

function emitStatements(
  stmts: VisualBlocksStmt[],
  indentLevel: number,
): string[] {
  const lines: string[] = []
  const pad = (level: number) => '  '.repeat(level)

  for (const stmt of stmts) {
    if (stmt.kind === 'comment') {
      const text = stmt.text.trim()
      lines.push(`${pad(indentLevel)}// ${text || '...'}`)
      continue
    }
    if (stmt.kind === 'delay') {
      lines.push(`${pad(indentLevel)}delay(${stmt.ms});`)
      continue
    }
    if (stmt.kind === 'digital_write') {
      lines.push(`${pad(indentLevel)}digitalWrite(${stmt.pin}, ${stmt.value});`)
      continue
    }
    if (stmt.kind === 'digital_read') {
      lines.push(
        `${pad(indentLevel)}${stmt.variable} = digitalRead(${stmt.pin});`,
      )
      continue
    }
    if (stmt.kind === 'analog_write') {
      lines.push(`${pad(indentLevel)}analogWrite(${stmt.pin}, ${stmt.value});`)
      continue
    }
    if (stmt.kind === 'analog_read') {
      lines.push(
        `${pad(indentLevel)}${stmt.variable} = analogRead(${stmt.pin});`,
      )
      continue
    }
    if (stmt.kind === 'servo_attach') {
      lines.push(`${pad(indentLevel)}${stmt.variable}.attach(${stmt.pin});`)
      continue
    }
    if (stmt.kind === 'servo_write') {
      lines.push(`${pad(indentLevel)}${stmt.variable}.write(${stmt.angle});`)
      continue
    }
    if (stmt.kind === 'variable_set') {
      lines.push(`${pad(indentLevel)}${stmt.name} = ${stmt.value};`)
      continue
    }
    if (stmt.kind === 'variable_change') {
      lines.push(`${pad(indentLevel)}${stmt.name} += ${stmt.delta};`)
      continue
    }
    if (stmt.kind === 'math_set') {
      lines.push(
        `${pad(indentLevel)}${stmt.target} = ${stmt.left} ${stmt.op} ${stmt.right};`,
      )
      continue
    }
    if (stmt.kind === 'math_random') {
      lines.push(
        `${pad(indentLevel)}${stmt.target} = random(${stmt.min}, ${stmt.max});`,
      )
      continue
    }
    if (stmt.kind === 'serial_begin') {
      lines.push(`${pad(indentLevel)}Serial.begin(${stmt.baud});`)
      continue
    }
    if (stmt.kind === 'serial_print') {
      lines.push(
        `${pad(indentLevel)}Serial.println(${JSON.stringify(stmt.message)});`,
      )
      continue
    }
    if (stmt.kind === 'serial_print_value') {
      const method = stmt.newline ? 'println' : 'print'
      lines.push(`${pad(indentLevel)}Serial.${method}(${stmt.value});`)
      continue
    }
    if (stmt.kind === 'if') {
      lines.push(`${pad(indentLevel)}if (${stmt.condition}) {`)
      lines.push(...emitStatements(stmt.then, indentLevel + 1))
      if (stmt.else.length > 0) {
        lines.push(`${pad(indentLevel)}} else {`)
        lines.push(...emitStatements(stmt.else, indentLevel + 1))
      }
      lines.push(`${pad(indentLevel)}}`)
      continue
    }
    if (stmt.kind === 'for') {
      lines.push(
        `${pad(indentLevel)}for (int ${stmt.variable} = ${stmt.start}; ${stmt.variable} < ${stmt.end}; ${stmt.variable} += ${stmt.step}) {`,
      )
      lines.push(...emitStatements(stmt.body, indentLevel + 1))
      lines.push(`${pad(indentLevel)}}`)
      continue
    }
    if (stmt.kind === 'while') {
      lines.push(`${pad(indentLevel)}while (${stmt.condition}) {`)
      lines.push(...emitStatements(stmt.body, indentLevel + 1))
      lines.push(`${pad(indentLevel)}}`)
      continue
    }

    lines.push(`${pad(indentLevel)}// Unsupported block: ${stmt.blockType}`)
  }

  return lines
}

function isValidBlockType(type: unknown): type is VisualBlockType {
  if (typeof type !== 'string') return false
  return (
    type === 'setup' ||
    type === 'loop' ||
    type === 'variable' ||
    type === 'variable_set' ||
    type === 'variable_change' ||
    type === 'math_set' ||
    type === 'math_random' ||
    type === 'comment' ||
    type === 'servo_attach' ||
    type === 'servo_write' ||
    type === 'delay' ||
    type === 'pin_mode' ||
    type === 'digital_write' ||
    type === 'analog_write' ||
    type === 'analog_read' ||
    type === 'digital_read' ||
    type === 'serial_begin' ||
    type === 'serial_print' ||
    type === 'serial_print_value' ||
    type === 'if_condition' ||
    type === 'if_else' ||
    type === 'for_loop' ||
    type === 'while_loop' ||
    type === 'end_block'
  )
}

function getExprParam(
  params: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const raw: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return fallback
}

export function buildArduinoProgramAstFromFlow(options: {
  nodes: Node<VisualNodeData>[]
  edges: Edge<VisualEdgeData>[]
}): ArduinoProgramAst {
  const nodes = options.nodes
  const edges = options.edges

  const nodesById = new Map(nodes.map((n) => [n.id, n]))
  const outgoing = new Map<string, Map<VisualEdgeKind, string>>()
  const duplicateOutputErrors = new Set<string>()

  for (const edge of edges) {
    if (!nodesById.has(edge.source) || !nodesById.has(edge.target)) continue
    const kind = getEdgeKind(edge, nodesById)
    const existing =
      outgoing.get(edge.source) ?? new Map<VisualEdgeKind, string>()
    if (existing.has(kind)) {
      const msg = `Block ${edge.source} has multiple '${kind}' outputs.`
      if (!duplicateOutputErrors.has(msg)) {
        duplicateOutputErrors.add(msg)
      }
    } else {
      existing.set(kind, edge.target)
    }
    outgoing.set(edge.source, existing)
  }

  const next = (id: string, kind: VisualEdgeKind) => outgoing.get(id)?.get(kind)
  const startFrom = (id: string) => next(id, 'body') ?? next(id, 'next')

  const setupRoot = nodes.find((n) => n.data?.blockType === 'setup')
  const loopRoot = nodes.find((n) => n.data?.blockType === 'loop')

  const errors: string[] = []
  const warnings: string[] = []
  for (const msg of duplicateOutputErrors) errors.push(msg)

  if (!loopRoot) errors.push('Missing loop() root block.')
  if (!setupRoot) warnings.push('Missing setup() root block; using defaults.')

  const explicitGlobals = new Map<
    string,
    { name: string; varType: string; value: string }
  >()
  for (const node of nodes) {
    if (node.data?.blockType !== 'variable') continue
    const params: Record<string, unknown> = node.data.params ?? {}
    const name = getStrParam(params, 'name', 'value').trim() || 'value'
    const varType = getStrParam(params, 'varType', 'int').trim() || 'int'
    const value =
      typeof params.value === 'string' || typeof params.value === 'number'
        ? String(params.value)
        : '0'

    if (!explicitGlobals.has(name)) {
      explicitGlobals.set(name, { name, varType, value })
    }
  }

  const pinModes = new Map<number, 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'>()
  for (const node of nodes) {
    if (node.data?.blockType !== 'pin_mode') continue
    const params: Record<string, unknown> = node.data.params ?? {}
    const pin = getNumParam(params, 'pin', NaN)
    if (!Number.isFinite(pin)) continue
    const mode = getStrParam(params, 'mode', 'INPUT')
    if (mode === 'INPUT_PULLUP' || mode === 'INPUT' || mode === 'OUTPUT') {
      pinModes.set(pin, mode)
    }
  }

  const usedStatementNodes = new Set<string>()
  const missingBodyWarnings = new Set<string>()

  const nodeTitle = (node: Node<VisualNodeData>) => {
    const label = typeof node.data?.label === 'string' ? node.data.label : null
    const blockType = node.data?.blockType
    return label || (typeof blockType === 'string' ? blockType : node.id)
  }

  const buildChain = (
    startId: string | undefined,
    context: string,
  ): VisualBlocksStmt[] => {
    const stmts: VisualBlocksStmt[] = []
    let currentId = startId
    const chainVisited = new Set<string>()

    while (currentId) {
      const stmtId = currentId
      if (chainVisited.has(currentId)) {
        errors.push(`Cycle detected in ${context} chain at node ${currentId}.`)
        break
      }
      chainVisited.add(currentId)

      const node = nodesById.get(currentId)
      if (!node) {
        warnings.push(
          `Missing node ${currentId} referenced in ${context} chain.`,
        )
        break
      }

      const blockType = node.data?.blockType
      if (!isValidBlockType(blockType)) {
        warnings.push(`Unknown block type at node ${currentId}.`)
        currentId = next(stmtId, 'next')
        continue
      }

      if (blockType === 'setup' || blockType === 'loop') {
        currentId = next(stmtId, 'next')
        continue
      }

      const params: Record<string, unknown> = node.data?.params ?? {}

      if (blockType === 'variable') {
        currentId = next(stmtId, 'next')
        continue
      }

      if (blockType === 'pin_mode') {
        currentId = next(stmtId, 'next')
        continue
      }

      if (blockType === 'end_block') {
        // V1 leftover: ignore.
        currentId = next(stmtId, 'next')
        continue
      }

      if (usedStatementNodes.has(stmtId)) {
        errors.push(
          `Node ${currentId} is reachable from multiple paths (shared nodes).`,
        )
        break
      }
      usedStatementNodes.add(stmtId)

      const toStmt = (): VisualBlocksStmt => {
        if (blockType === 'comment') {
          return { kind: 'comment', text: getStrParam(params, 'text', '') }
        }
        if (blockType === 'delay') {
          return { kind: 'delay', ms: getNumParam(params, 'ms', 500) }
        }
        if (blockType === 'digital_write') {
          return {
            kind: 'digital_write',
            pin: getNumParam(params, 'pin', 13),
            value: getStrParam(params, 'value', 'HIGH'),
          }
        }
        if (blockType === 'digital_read') {
          return {
            kind: 'digital_read',
            pin: getNumParam(params, 'pin', 2),
            variable: getStrParam(params, 'variable', 'buttonState'),
          }
        }
        if (blockType === 'analog_write') {
          return {
            kind: 'analog_write',
            pin: getNumParam(params, 'pin', 9),
            value: getExprParam(params, 'value', '128'),
          }
        }
        if (blockType === 'analog_read') {
          return {
            kind: 'analog_read',
            pin: getStrParam(params, 'pin', 'A0'),
            variable: getStrParam(params, 'variable', 'sensorValue'),
          }
        }
        if (blockType === 'servo_attach') {
          return {
            kind: 'servo_attach',
            variable: getStrParam(params, 'variable', 'servo'),
            pin: getNumParam(params, 'pin', 9),
          }
        }
        if (blockType === 'servo_write') {
          return {
            kind: 'servo_write',
            variable: getStrParam(params, 'variable', 'servo'),
            angle: getExprParam(params, 'angle', '90'),
          }
        }
        if (blockType === 'variable_set') {
          return {
            kind: 'variable_set',
            name: getStrParam(params, 'name', 'value'),
            value: getExprParam(params, 'value', '0'),
          }
        }
        if (blockType === 'variable_change') {
          return {
            kind: 'variable_change',
            name: getStrParam(params, 'name', 'value'),
            delta: getNumParam(params, 'delta', 1),
          }
        }
        if (blockType === 'math_set') {
          return {
            kind: 'math_set',
            target: getStrParam(params, 'target', 'value'),
            left: getExprParam(params, 'left', '0'),
            op: getStrParam(params, 'op', '+'),
            right: getExprParam(params, 'right', '1'),
          }
        }
        if (blockType === 'math_random') {
          return {
            kind: 'math_random',
            target: getStrParam(params, 'target', 'value'),
            min: getNumParam(params, 'min', 0),
            max: getNumParam(params, 'max', 10),
          }
        }
        if (blockType === 'serial_begin') {
          return {
            kind: 'serial_begin',
            baud: getNumParam(params, 'baud', 9600),
          }
        }
        if (blockType === 'serial_print') {
          return {
            kind: 'serial_print',
            message: getStrParam(params, 'message', 'Hello'),
          }
        }
        if (blockType === 'serial_print_value') {
          const newline = params.newline !== false
          return {
            kind: 'serial_print_value',
            value: getExprParam(params, 'value', 'value'),
            newline,
          }
        }
        if (blockType === 'if_condition' || blockType === 'if_else') {
          const thenStart = next(stmtId, 'body')
          const elseStart = next(stmtId, 'else')
          if (!thenStart) {
            missingBodyWarnings.add(
              `"${nodeTitle(node)}" has no body connected.`,
            )
          }
          return {
            kind: 'if',
            condition: getStrParam(params, 'condition', 'true'),
            then: buildChain(thenStart, `if-body(${stmtId})`),
            else: buildChain(elseStart, `if-else(${stmtId})`),
          }
        }
        if (blockType === 'for_loop') {
          const bodyStart = next(stmtId, 'body')
          if (!bodyStart) {
            missingBodyWarnings.add(
              `"${nodeTitle(node)}" has no body connected.`,
            )
          }
          return {
            kind: 'for',
            variable: getStrParam(params, 'variable', 'i'),
            start: getNumParam(params, 'start', 0),
            end: getNumParam(params, 'end', 10),
            step: getNumParam(params, 'step', 1),
            body: buildChain(bodyStart, `for-body(${stmtId})`),
          }
        }
        if (blockType === 'while_loop') {
          const bodyStart = next(stmtId, 'body')
          if (!bodyStart) {
            missingBodyWarnings.add(
              `"${nodeTitle(node)}" has no body connected.`,
            )
          }
          return {
            kind: 'while',
            condition: getStrParam(params, 'condition', 'true'),
            body: buildChain(bodyStart, `while-body(${stmtId})`),
          }
        }

        return { kind: 'unknown', blockType }
      }

      stmts.push(toStmt())
      currentId = next(stmtId, 'next')
    }

    return stmts
  }

  const setup = buildChain(
    setupRoot ? startFrom(setupRoot.id) : undefined,
    'setup',
  )
  const loop = buildChain(loopRoot ? startFrom(loopRoot.id) : undefined, 'loop')

  for (const msg of missingBodyWarnings) warnings.push(msg)

  const unreachableWarnings = new Set<string>()
  for (const node of nodes) {
    const blockType = node.data?.blockType
    if (
      blockType === 'setup' ||
      blockType === 'loop' ||
      blockType === 'variable' ||
      blockType === 'pin_mode'
    )
      continue
    if (usedStatementNodes.has(node.id)) continue
    unreachableWarnings.add(
      `"${nodeTitle(node)}" is not connected to setup() or loop().`,
    )
  }
  for (const msg of unreachableWarnings) warnings.push(msg)

  const declared = new Set(explicitGlobals.keys())
  const autoGlobals = new Map<
    string,
    { name: string; varType: string; value: string }
  >()

  const servoVars = new Set<string>()
  const usesSerial = { value: false }
  const hasSerialBegin = { value: false }

  const observe = (stmt: VisualBlocksStmt) => {
    if (stmt.kind === 'servo_attach' || stmt.kind === 'servo_write')
      servoVars.add(stmt.variable)
    if (stmt.kind === 'serial_print' || stmt.kind === 'serial_print_value')
      usesSerial.value = true
    if (stmt.kind === 'serial_begin') {
      usesSerial.value = true
      hasSerialBegin.value = true
    }
    if (stmt.kind === 'digital_write') pinModes.set(stmt.pin, 'OUTPUT')
    if (stmt.kind === 'analog_write') pinModes.set(stmt.pin, 'OUTPUT')
    if (stmt.kind === 'digital_read') {
      if (!pinModes.has(stmt.pin)) pinModes.set(stmt.pin, 'INPUT')
      const name = stmt.variable.trim()
      if (name && !declared.has(name) && !autoGlobals.has(name)) {
        autoGlobals.set(name, { name, varType: 'int', value: '0' })
      }
    }
    if (stmt.kind === 'analog_read') {
      const name = stmt.variable.trim()
      if (name && !declared.has(name) && !autoGlobals.has(name)) {
        autoGlobals.set(name, { name, varType: 'int', value: '0' })
      }
    }
    if (stmt.kind === 'variable_set' || stmt.kind === 'variable_change') {
      const name = stmt.name.trim()
      if (name && !declared.has(name) && !autoGlobals.has(name)) {
        autoGlobals.set(name, { name, varType: 'int', value: '0' })
      }
    }
    if (stmt.kind === 'math_set' || stmt.kind === 'math_random') {
      const name = stmt.target.trim()
      if (name && !declared.has(name) && !autoGlobals.has(name)) {
        autoGlobals.set(name, { name, varType: 'int', value: '0' })
      }
    }
  }

  walkStatements(setup, observe)
  walkStatements(loop, observe)

  const globals = [...explicitGlobals.values(), ...autoGlobals.values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  )

  const pinModesList = Array.from(pinModes.entries())
    .map(([pin, mode]) => ({ pin, mode }))
    .sort((a, b) => a.pin - b.pin)

  return {
    globals,
    servoVariables: Array.from(servoVars).sort(),
    usesSerial: usesSerial.value,
    hasSerialBegin: hasSerialBegin.value,
    pinModes: pinModesList,
    setup,
    loop,
    errors,
    warnings,
  }
}

export function emitArduinoFromAst(ast: ArduinoProgramAst): string {
  const header: string[] = []
  if (ast.servoVariables.length > 0) header.push('#include <Servo.h>')
  if (header.length) header.push('')

  const globals: string[] = []
  for (const name of ast.servoVariables) globals.push(`Servo ${name};`)
  for (const decl of ast.globals)
    globals.push(`${decl.varType} ${decl.name} = ${decl.value};`)

  const body: string[] = []
  body.push(...header)
  if (globals.length) body.push(...globals, '')

  body.push('void setup() {')
  const setupLines: string[] = []
  if (ast.usesSerial && !ast.hasSerialBegin)
    setupLines.push('Serial.begin(9600);')
  for (const pinMode of ast.pinModes)
    setupLines.push(`pinMode(${pinMode.pin}, ${pinMode.mode});`)
  setupLines.push(...emitStatements(ast.setup, 1))
  if (setupLines.length === 0) body.push('  // setup')
  else body.push(...setupLines.map((l) => (l.startsWith('  ') ? l : `  ${l}`)))
  body.push('}', '', 'void loop() {')

  const loopLines = emitStatements(ast.loop, 1)
  if (loopLines.length === 0) body.push('  // loop')
  else body.push(...loopLines.map((l) => (l.startsWith('  ') ? l : `  ${l}`)))

  body.push('}', '')
  return body.join('\n')
}

export function generateArduinoCode(
  nodes: Node<VisualNodeData>[],
  edges: Edge<VisualEdgeData>[],
): string {
  const ast = buildArduinoProgramAstFromFlow({ nodes, edges })
  return emitArduinoFromAst(ast)
}

/**
 * Parse Arduino code back into visual blocks (best-effort)
 * This handles common patterns but won't work for complex code
 */
export function parseArduinoToBlocks(code: string): FlowState {
  const nodes: FlowState['nodes'] = []
  const edges: FlowState['edges'] = []

  // Default setup/loop nodes
  const setupId = 'setup'
  const loopId = 'loop'
  nodes.push({
    id: setupId,
    position: { x: 60, y: 60 },
    data: { label: 'setup()', blockType: 'setup' },
  })
  nodes.push({
    id: loopId,
    position: { x: 60, y: 180 },
    data: { label: 'loop()', blockType: 'loop' },
  })

  let nodeId = 1
  let yPos = 300
  let lastNodeId = loopId

  // Simple regex patterns for common Arduino statements
  const patterns: {
    regex: RegExp
    handler: (match: RegExpMatchArray) => VisualNodeData | null
  }[] = [
    {
      regex: /delay\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({
        blockType: 'delay',
        label: 'Delay',
        params: { ms: parseInt(m[1]) },
      }),
    },
    {
      regex: /digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW)\s*\)/,
      handler: (m) => ({
        blockType: 'digital_write',
        label: 'Digital Write',
        params: { pin: parseInt(m[1]), value: m[2] },
      }),
    },
    {
      regex: /analogWrite\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
      handler: (m) => ({
        blockType: 'analog_write',
        label: 'Analog Write',
        params: { pin: parseInt(m[1]), value: parseInt(m[2]) },
      }),
    },
    {
      regex: /(\w+)\.write\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({
        blockType: 'servo_write',
        label: 'Servo Write',
        params: { variable: m[1], angle: parseInt(m[2]) },
      }),
    },
    {
      regex: /(\w+)\.attach\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({
        blockType: 'servo_attach',
        label: 'Servo Attach',
        params: { variable: m[1], pin: parseInt(m[2]) },
      }),
    },
    {
      regex: /Serial\.println\s*\(\s*"([^"]*)"\s*\)/,
      handler: (m) => ({
        blockType: 'serial_print',
        label: 'Serial Print',
        params: { message: m[1] },
      }),
    },
    {
      regex: /for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*<\s*(\d+)\s*;/,
      handler: (m) => ({
        blockType: 'for_loop',
        label: 'For Loop',
        params: {
          variable: m[1],
          start: parseInt(m[2]),
          end: parseInt(m[3]),
          step: 1,
        },
      }),
    },
    {
      regex: /if\s*\(\s*([^)]+)\s*\)\s*\{/,
      handler: (m) => ({
        blockType: 'if_condition',
        label: 'If',
        params: { condition: m[1].trim() },
      }),
    },
    {
      regex: /while\s*\(\s*([^)]+)\s*\)\s*\{/,
      handler: (m) => ({
        blockType: 'while_loop',
        label: 'While',
        params: { condition: m[1].trim() },
      }),
    },
  ]

  // Extract code from loop() function
  const loopMatch = /void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\n\}/m.exec(code)
  if (loopMatch) {
    const loopCode = loopMatch[1]
    const lines = loopCode
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    for (const line of lines) {
      for (const { regex, handler } of patterns) {
        const match = regex.exec(line)
        if (match) {
          const data = handler(match)
          if (data) {
            const id = `node_${nodeId++}`
            nodes.push({
              id,
              position: { x: 200, y: yPos },
              data,
            })
            edges.push({
              id: `edge_${lastNodeId}_${id}`,
              source: lastNodeId,
              target: id,
            })
            lastNodeId = id
            yPos += 80
          }
          break
        }
      }

      // Handle closing braces
      if (line === '}') {
        const id = `node_${nodeId++}`
        nodes.push({
          id,
          position: { x: 200, y: yPos },
          data: { blockType: 'end_block', label: 'End' },
        })
        edges.push({
          id: `edge_${lastNodeId}_${id}`,
          source: lastNodeId,
          target: id,
        })
        lastNodeId = id
        yPos += 80
      }
    }
  }

  return { nodes, edges }
}
