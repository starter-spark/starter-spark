import type { CSSProperties } from 'react'

const baseNodeStyle: CSSProperties = {
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '12px',
  borderRadius: '0px',
}

export const reactFlowTokens = {
  primaryNode: {
    ...baseNodeStyle,
    background: '#ffffff',
    color: '#0e7490',
    border: '1px solid #0e7490',
    width: 180,
  } as CSSProperties,

  secondaryNode: {
    ...baseNodeStyle,
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    width: 160,
  } as CSSProperties,

  powerNode: {
    ...baseNodeStyle,
    background: '#ffffff',
    color: '#f59e0b',
    border: '1px solid #f59e0b',
    width: 140,
  } as CSSProperties,

  componentNode: {
    ...baseNodeStyle,
    background: '#f8fafc',
    color: '#64748b',
    border: '1px dashed #cbd5e1',
    width: 140,
  } as CSSProperties,

  primaryEdge: {
    stroke: '#0e7490',
    strokeWidth: 2,
  } as CSSProperties,

  powerEdge: {
    stroke: '#f59e0b',
    strokeWidth: 2,
  } as CSSProperties,

  defaultEdge: {
    stroke: '#94a3b8',
  } as CSSProperties,

  gridColor: '#cbd5e1',
  gridGap: 24,
  gridSize: 1,
}
