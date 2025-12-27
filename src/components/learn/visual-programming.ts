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
  | 'serial_print'

export interface VisualNodeData {
  blockType?: VisualBlockType
  label?: string
  params?: Record<string, unknown>
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

  for (const id of orderedIds) {
    const node = byId.get(id)
    if (!node) continue
    const data = node.data
    const type = data.blockType
    const params: Record<string, unknown> = data.params ?? {}

    if (!type || type === 'setup' || type === 'loop') continue

    if (type === 'variable') {
      const name = typeof params.name === 'string' ? params.name : 'value'
      const varType =
        typeof params.varType === 'string' ? params.varType : 'int'
      const value =
        typeof params.value === 'string' || typeof params.value === 'number'
          ? String(params.value)
          : '0'
      if (!declaredVars.has(name)) {
        declaredVars.add(name)
        globals.push(`${varType} ${name} = ${value};`)
      }
      continue
    }

    if (type === 'servo_attach') {
      const variable =
        typeof params.variable === 'string' ? params.variable : 'servo'
      const rawPin = params.pin
      const pin =
        typeof rawPin === 'number' && Number.isFinite(rawPin)
          ? rawPin
          : typeof rawPin === 'string' && Number.isFinite(Number(rawPin))
            ? Number(rawPin)
            : 9
      servoVars.add(variable)
      setupLines.push(`${variable}.attach(${pin});`)
      continue
    }

    if (type === 'servo_write') {
      const variable =
        typeof params.variable === 'string' ? params.variable : 'servo'
      const rawAngle = params.angle
      const angle =
        typeof rawAngle === 'number' && Number.isFinite(rawAngle)
          ? rawAngle
          : typeof rawAngle === 'string' && Number.isFinite(Number(rawAngle))
            ? Number(rawAngle)
            : 90
      loopLines.push(`${variable}.write(${angle});`)
      continue
    }

    if (type === 'delay') {
      const rawMs = params.ms
      const ms =
        typeof rawMs === 'number' && Number.isFinite(rawMs)
          ? rawMs
          : typeof rawMs === 'string' && Number.isFinite(Number(rawMs))
            ? Number(rawMs)
            : 500
      loopLines.push(`delay(${ms});`)
      continue
    }

    if (type === 'digital_write') {
      const rawPin = params.pin
      const pin =
        typeof rawPin === 'number' && Number.isFinite(rawPin)
          ? rawPin
          : typeof rawPin === 'string' && Number.isFinite(Number(rawPin))
            ? Number(rawPin)
            : 13
      const value = typeof params.value === 'string' ? params.value : 'HIGH'
      setupLines.push(`pinMode(${pin}, OUTPUT);`)
      loopLines.push(`digitalWrite(${pin}, ${value});`)
      continue
    }

    if (type === 'analog_write') {
      const rawPin = params.pin
      const pin =
        typeof rawPin === 'number' && Number.isFinite(rawPin)
          ? rawPin
          : typeof rawPin === 'string' && Number.isFinite(Number(rawPin))
            ? Number(rawPin)
            : 9
      const rawValue = params.value
      const value =
        typeof rawValue === 'number' && Number.isFinite(rawValue)
          ? rawValue
          : typeof rawValue === 'string' && Number.isFinite(Number(rawValue))
            ? Number(rawValue)
            : 128
      loopLines.push(`analogWrite(${pin}, ${value});`)
      continue
    }

    if (type === 'serial_print') {
      const message =
        typeof params.message === 'string' ? params.message : 'Hello'
      setupLines.push('Serial.begin(9600);')
      loopLines.push(`Serial.println(${JSON.stringify(message)});`)
      continue
    }
  }

  const header: string[] = []
  if (servoVars.size > 0) header.push('#include <Servo.h>')
  if (header.length) header.push('')

  for (const v of servoVars) {
    globals.unshift(`Servo ${v};`)
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
