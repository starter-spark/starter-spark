import type { Edge, Node } from '@xyflow/react'

export type VisualBlockType =
  | 'setup'
  | 'loop'
  | 'variable'
  | 'servo_attach'
  | 'servo_write'
  | 'delay'
  | 'digital_write'
  | 'analog_write'
  | 'analog_read'
  | 'digital_read'
  | 'serial_print'
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

export interface FlowState {
  nodes: Node<VisualNodeData>[]
  edges: Edge[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function parseFlowState(value: unknown): FlowState {
  if (!isRecord(value)) return { nodes: [], edges: [] }
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
      edges.push(item as unknown as Edge)
    }
  }

  return { nodes, edges }
}

function topoSort(nodes: Node[], edges: Edge[]): string[] {
  const ids = new Set(nodes.map((n) => n.id))
  const outgoing = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  for (const id of ids) {
    outgoing.set(id, [])
    indegree.set(id, 0)
  }

  for (const e of edges) {
    if (!e.source || !e.target) continue
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    outgoing.get(e.source)?.push(e.target)
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, deg] of indegree.entries()) {
    if (deg === 0) queue.push(id)
  }

  const sorted: string[] = []
  while (queue.length) {
    const id = queue.shift()
    if (!id) break
    sorted.push(id)
    for (const next of outgoing.get(id) ?? []) {
      const deg = (indegree.get(next) ?? 0) - 1
      indegree.set(next, deg)
      if (deg === 0) queue.push(next)
    }
  }

  // If there are cycles/unreachable nodes, append remaining in stable order.
  for (const id of ids) {
    if (!sorted.includes(id)) sorted.push(id)
  }

  return sorted
}

// Helper to get a numeric param
function getNumParam(params: Record<string, unknown>, key: string, fallback: number): number {
  const raw: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && Number.isFinite(Number(raw))) return Number(raw)
  return fallback
}

// Helper to get a string param
function getStrParam(params: Record<string, unknown>, key: string, fallback: string): string {
  const raw: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  return typeof raw === 'string' ? raw : fallback
}

export function generateArduinoCode(
  nodes: Node<VisualNodeData>[],
  edges: Edge[],
): string {
  const orderedIds = topoSort(nodes, edges)
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const globals: string[] = []
  const setupLines: string[] = []
  const loopLines: string[] = []

  const servoVars = new Set<string>()
  const declaredVars = new Set<string>()
  const usesSerial = { value: false }

  // Track indentation for nested blocks
  let indent = 0
  const addLoopLine = (line: string) => {
    loopLines.push('  '.repeat(indent) + line)
  }

  for (const id of orderedIds) {
    const node = byId.get(id)
    if (!node) continue
    const data = node.data
    const type = data.blockType
    const params: Record<string, unknown> = data.params ?? {}

    if (!type || type === 'setup' || type === 'loop') continue

    if (type === 'variable') {
      const name = getStrParam(params, 'name', 'value')
      const varType = getStrParam(params, 'varType', 'int')
      const value = typeof params.value === 'string' || typeof params.value === 'number'
        ? String(params.value)
        : '0'
      if (!declaredVars.has(name)) {
        declaredVars.add(name)
        globals.push(`${varType} ${name} = ${value};`)
      }
      continue
    }

    if (type === 'servo_attach') {
      const variable = getStrParam(params, 'variable', 'servo')
      const pin = getNumParam(params, 'pin', 9)
      servoVars.add(variable)
      setupLines.push(`${variable}.attach(${pin});`)
      continue
    }

    if (type === 'servo_write') {
      const variable = getStrParam(params, 'variable', 'servo')
      const angle = getNumParam(params, 'angle', 90)
      addLoopLine(`${variable}.write(${angle});`)
      continue
    }

    if (type === 'delay') {
      const ms = getNumParam(params, 'ms', 500)
      addLoopLine(`delay(${ms});`)
      continue
    }

    if (type === 'digital_write') {
      const pin = getNumParam(params, 'pin', 13)
      const value = getStrParam(params, 'value', 'HIGH')
      setupLines.push(`pinMode(${pin}, OUTPUT);`)
      addLoopLine(`digitalWrite(${pin}, ${value});`)
      continue
    }

    if (type === 'digital_read') {
      const pin = getNumParam(params, 'pin', 2)
      const variable = getStrParam(params, 'variable', 'buttonState')
      setupLines.push(`pinMode(${pin}, INPUT);`)
      if (!declaredVars.has(variable)) {
        declaredVars.add(variable)
        globals.push(`int ${variable} = 0;`)
      }
      addLoopLine(`${variable} = digitalRead(${pin});`)
      continue
    }

    if (type === 'analog_write') {
      const pin = getNumParam(params, 'pin', 9)
      const value = getNumParam(params, 'value', 128)
      addLoopLine(`analogWrite(${pin}, ${value});`)
      continue
    }

    if (type === 'analog_read') {
      const pin = getStrParam(params, 'pin', 'A0')
      const variable = getStrParam(params, 'variable', 'sensorValue')
      if (!declaredVars.has(variable)) {
        declaredVars.add(variable)
        globals.push(`int ${variable} = 0;`)
      }
      addLoopLine(`${variable} = analogRead(${pin});`)
      continue
    }

    if (type === 'serial_print') {
      const message = getStrParam(params, 'message', 'Hello')
      usesSerial.value = true
      addLoopLine(`Serial.println(${JSON.stringify(message)});`)
      continue
    }

    // Control flow blocks
    if (type === 'if_condition') {
      const condition = getStrParam(params, 'condition', 'true')
      addLoopLine(`if (${condition}) {`)
      indent++
      continue
    }

    if (type === 'if_else') {
      const condition = getStrParam(params, 'condition', 'true')
      addLoopLine(`if (${condition}) {`)
      indent++
      // Note: The else part would be added by connecting to an end_block then another block
      continue
    }

    if (type === 'for_loop') {
      const variable = getStrParam(params, 'variable', 'i')
      const start = getNumParam(params, 'start', 0)
      const end = getNumParam(params, 'end', 10)
      const step = getNumParam(params, 'step', 1)
      if (!declaredVars.has(variable)) {
        declaredVars.add(variable)
      }
      addLoopLine(`for (int ${variable} = ${start}; ${variable} < ${end}; ${variable} += ${step}) {`)
      indent++
      continue
    }

    if (type === 'while_loop') {
      const condition = getStrParam(params, 'condition', 'true')
      addLoopLine(`while (${condition}) {`)
      indent++
      continue
    }

    if (type === 'end_block') {
      if (indent > 0) indent--
      addLoopLine('}')
      continue
    }
  }

  // Close any unclosed blocks
  while (indent > 0) {
    indent--
    loopLines.push('  '.repeat(indent) + '}')
  }

  const header: string[] = []
  if (servoVars.size > 0) header.push('#include <Servo.h>')
  if (header.length) header.push('')

  for (const v of servoVars) {
    globals.unshift(`Servo ${v};`)
  }

  if (usesSerial.value) {
    setupLines.unshift('Serial.begin(9600);')
  }

  const body: string[] = []
  body.push(...header)
  if (globals.length) {
    body.push(...globals, '')
  }

  body.push('void setup() {')
  if (setupLines.length === 0) body.push('  // setup')
  else body.push(...setupLines.map((l) => `  ${l}`))
  body.push('}', '', 'void loop() {')
  if (loopLines.length === 0) body.push('  // loop')
  else body.push(...loopLines.map((l) => `  ${l}`))
  body.push('}', '')

  return body.join('\n')
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
  const patterns: { regex: RegExp; handler: (match: RegExpMatchArray) => VisualNodeData | null }[] = [
    {
      regex: /delay\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({ blockType: 'delay', label: 'Delay', params: { ms: parseInt(m[1]) } }),
    },
    {
      regex: /digitalWrite\s*\(\s*(\d+)\s*,\s*(HIGH|LOW)\s*\)/,
      handler: (m) => ({ blockType: 'digital_write', label: 'Digital Write', params: { pin: parseInt(m[1]), value: m[2] } }),
    },
    {
      regex: /analogWrite\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
      handler: (m) => ({ blockType: 'analog_write', label: 'Analog Write', params: { pin: parseInt(m[1]), value: parseInt(m[2]) } }),
    },
    {
      regex: /(\w+)\.write\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({ blockType: 'servo_write', label: 'Servo Write', params: { variable: m[1], angle: parseInt(m[2]) } }),
    },
    {
      regex: /(\w+)\.attach\s*\(\s*(\d+)\s*\)/,
      handler: (m) => ({ blockType: 'servo_attach', label: 'Servo Attach', params: { variable: m[1], pin: parseInt(m[2]) } }),
    },
    {
      regex: /Serial\.println\s*\(\s*"([^"]*)"\s*\)/,
      handler: (m) => ({ blockType: 'serial_print', label: 'Serial Print', params: { message: m[1] } }),
    },
    {
      regex: /for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*<\s*(\d+)\s*;/,
      handler: (m) => ({ blockType: 'for_loop', label: 'For Loop', params: { variable: m[1], start: parseInt(m[2]), end: parseInt(m[3]), step: 1 } }),
    },
    {
      regex: /if\s*\(\s*([^)]+)\s*\)\s*\{/,
      handler: (m) => ({ blockType: 'if_condition', label: 'If', params: { condition: m[1].trim() } }),
    },
    {
      regex: /while\s*\(\s*([^)]+)\s*\)\s*\{/,
      handler: (m) => ({ blockType: 'while_loop', label: 'While', params: { condition: m[1].trim() } }),
    },
  ]

  // Extract code from loop() function
  const loopMatch = /void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\n\}/m.exec(code)
  if (loopMatch) {
    const loopCode = loopMatch[1]
    const lines = loopCode.split('\n').map(l => l.trim()).filter(Boolean)

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
