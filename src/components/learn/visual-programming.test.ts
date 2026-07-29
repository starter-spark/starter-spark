import { describe, expect, it } from 'vitest'
import { generateArduinoCode, parseFlowState } from './visual-programming'

describe('visual-programming (Visual Blocks)', () => {
  it('generates code for a simple loop chain', () => {
    const flow = {
      nodes: [
        {
          id: 'setup',
          type: 'visualBlock',
          position: { x: 0, y: 0 },
          data: { label: 'setup()', blockType: 'setup' },
        },
        {
          id: 'loop',
          type: 'visualBlock',
          position: { x: 0, y: 100 },
          data: { label: 'loop()', blockType: 'loop' },
        },
        {
          id: 'delay1',
          type: 'visualBlock',
          position: { x: 200, y: 100 },
          data: { label: 'Delay', blockType: 'delay', params: { ms: 1000 } },
        },
        {
          id: 'dw1',
          type: 'visualBlock',
          position: { x: 200, y: 200 },
          data: {
            label: 'Digital Write',
            blockType: 'digital_write',
            params: { pin: 13, value: 'HIGH' },
          },
        },
      ],
      edges: [
        {
          id: 'e_loop_body_delay',
          source: 'loop',
          target: 'delay1',
          sourceHandle: 'body',
          targetHandle: 'in',
          data: { kind: 'body' },
        },
        {
          id: 'e_delay_next_dw',
          source: 'delay1',
          target: 'dw1',
          sourceHandle: 'next',
          targetHandle: 'in',
          data: { kind: 'next' },
        },
      ],
    }

    const parsed = parseFlowState(flow, { mode: 'visual' })
    const code = generateArduinoCode(parsed.nodes, parsed.edges)

    expect(code).toContain('void setup()')
    expect(code).toContain('pinMode(13, OUTPUT);')
    expect(code).toContain('void loop()')
    expect(code).toContain('delay(1000);')
    expect(code).toContain('digitalWrite(13, HIGH);')
  })

  it('generates nested control flow from body edges', () => {
    const flow = {
      nodes: [
        {
          id: 'setup',
          type: 'visualBlock',
          position: { x: 0, y: 0 },
          data: { label: 'setup()', blockType: 'setup' },
        },
        {
          id: 'loop',
          type: 'visualBlock',
          position: { x: 0, y: 100 },
          data: { label: 'loop()', blockType: 'loop' },
        },
        {
          id: 'if1',
          type: 'visualBlock',
          position: { x: 200, y: 100 },
          data: {
            label: 'If',
            blockType: 'if_condition',
            params: { condition: 'buttonState == HIGH' },
          },
        },
        {
          id: 'delay1',
          type: 'visualBlock',
          position: { x: 400, y: 100 },
          data: { label: 'Delay', blockType: 'delay', params: { ms: 250 } },
        },
        {
          id: 'serial1',
          type: 'visualBlock',
          position: { x: 200, y: 220 },
          data: {
            label: 'Serial Print',
            blockType: 'serial_print',
            params: { message: 'Hello' },
          },
        },
      ],
      edges: [
        {
          id: 'e_loop_body_if',
          source: 'loop',
          target: 'if1',
          sourceHandle: 'body',
          targetHandle: 'in',
          data: { kind: 'body' },
        },
        {
          id: 'e_if_body_delay',
          source: 'if1',
          target: 'delay1',
          sourceHandle: 'body',
          targetHandle: 'in',
          data: { kind: 'body' },
        },
        {
          id: 'e_if_next_serial',
          source: 'if1',
          target: 'serial1',
          sourceHandle: 'next',
          targetHandle: 'in',
          data: { kind: 'next' },
        },
      ],
    }

    const parsed = parseFlowState(flow, { mode: 'visual' })
    const code = generateArduinoCode(parsed.nodes, parsed.edges)

    expect(code).toContain('Serial.begin(9600);')
    expect(code).toContain('if (buttonState == HIGH) {')
    expect(code).toContain('delay(250);')
    expect(code).toContain('Serial.println("Hello");')
  })

  it('migrates V1 end_block sequences into container body/next edges', () => {
    const flowV1 = {
      nodes: [
        {
          id: 'loop',
          position: { x: 0, y: 0 },
          data: { label: 'loop()', blockType: 'loop' },
        },
        {
          id: 'if1',
          position: { x: 200, y: 0 },
          data: {
            label: 'If',
            blockType: 'if_condition',
            params: { condition: 'true' },
          },
        },
        {
          id: 'delay1',
          position: { x: 400, y: 0 },
          data: { label: 'Delay', blockType: 'delay', params: { ms: 10 } },
        },
        {
          id: 'end1',
          position: { x: 600, y: 0 },
          data: { label: 'End', blockType: 'end_block' },
        },
        {
          id: 'serial1',
          position: { x: 800, y: 0 },
          data: {
            label: 'Serial Print',
            blockType: 'serial_print',
            params: { message: 'Hi' },
          },
        },
      ],
      edges: [
        { id: 'e0', source: 'loop', target: 'if1' },
        { id: 'e1', source: 'if1', target: 'delay1' },
        { id: 'e2', source: 'delay1', target: 'end1' },
        { id: 'e3', source: 'end1', target: 'serial1' },
      ],
    }

    const migrated = parseFlowState(flowV1, { mode: 'visual' })

    expect(migrated.version).toBe(2)
    expect(migrated.nodes.some((n) => n.id === 'end1')).toBe(false)
    expect(
      migrated.edges.some(
        (e) =>
          e.source === 'if1' &&
          e.target === 'delay1' &&
          e.data?.kind === 'body',
      ),
    ).toBe(true)
    expect(
      migrated.edges.some(
        (e) =>
          e.source === 'if1' &&
          e.target === 'serial1' &&
          e.data?.kind === 'next',
      ),
    ).toBe(true)
  })
})
