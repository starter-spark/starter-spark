'use client'

import { Handle, Position } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { VisualNodeData } from '../visual-programming'
import { visualBlockScheme } from './registry'

function getParam(
  params: Record<string, unknown>,
  key: string,
  fallback: string | number,
): string {
  const value: unknown = Object.getOwnPropertyDescriptor(params, key)?.value
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  return String(fallback)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}...`
}

export function VisualBlockNode({ data }: { data: VisualNodeData }) {
  const blockType = data.blockType
  const params: Record<string, unknown> = data.params ?? {}

  const scheme = visualBlockScheme(blockType)

  const displayValue = (() => {
    switch (blockType) {
      case 'delay':
        return `${getParam(params, 'ms', 500)}ms`
      case 'pin_mode':
        return `Pin ${getParam(params, 'pin', 2)} → ${getParam(params, 'mode', 'INPUT')}`
      case 'digital_write':
        return `Pin ${getParam(params, 'pin', 13)} → ${getParam(params, 'value', 'HIGH')}`
      case 'digital_read':
        return `Pin ${getParam(params, 'pin', 2)} → ${getParam(params, 'variable', 'val')}`
      case 'analog_write':
        return `Pin ${getParam(params, 'pin', 9)} → ${getParam(params, 'value', 128)}`
      case 'analog_read':
        return `${getParam(params, 'pin', 'A0')} → ${getParam(params, 'variable', 'val')}`
      case 'servo_write':
        return `${getParam(params, 'variable', 'servo')} → ${getParam(params, 'angle', 90)}°`
      case 'servo_attach':
        return `${getParam(params, 'variable', 'servo')} @ Pin ${getParam(params, 'pin', 9)}`
      case 'serial_begin':
        return `${getParam(params, 'baud', 9600)} baud`
      case 'serial_print': {
        const msg =
          typeof params.message === 'string' ? params.message : 'Hello'
        return `"${truncate(msg, 12)}"`
      }
      case 'serial_print_value': {
        const value = getParam(params, 'value', 'value')
        const newline = params.newline !== false
        return `${newline ? 'println' : 'print'}(${truncate(value, 14)})`
      }
      case 'comment': {
        const text = typeof params.text === 'string' ? params.text : ''
        if (!text.trim()) return '// ...'
        return `// ${truncate(text.trim(), 16)}`
      }
      case 'variable':
        return `${getParam(params, 'varType', 'int')} ${getParam(params, 'name', 'x')} = ${getParam(params, 'value', 0)}`
      case 'variable_set':
        return `${getParam(params, 'name', 'value')} = ${truncate(getParam(params, 'value', 0), 16)}`
      case 'variable_change':
        return `${getParam(params, 'name', 'value')} += ${getParam(params, 'delta', 1)}`
      case 'math_set': {
        const left = getParam(params, 'left', '0')
        const op = getParam(params, 'op', '+')
        const right = getParam(params, 'right', '1')
        return `${getParam(params, 'target', 'value')} = ${truncate(`${left} ${op} ${right}`, 18)}`
      }
      case 'math_random':
        return `${getParam(params, 'target', 'value')} = random(${getParam(params, 'min', 0)}, ${getParam(params, 'max', 10)})`
      case 'if_condition':
      case 'if_else': {
        const cond =
          typeof params.condition === 'string' ? params.condition : 'true'
        return `(${truncate(cond, 18)})`
      }
      case 'for_loop':
        return `${getParam(params, 'variable', 'i')}: ${getParam(params, 'start', 0)} → ${getParam(params, 'end', 10)}`
      case 'while_loop': {
        const cond =
          typeof params.condition === 'string' ? params.condition : 'true'
        return `(${truncate(cond, 16)})`
      }
      default:
        return null
    }
  })()

  const isControlFlow = [
    'if_condition',
    'if_else',
    'for_loop',
    'while_loop',
  ].includes(String(blockType))
  const isEndBlock = blockType === 'end_block'
  const isRoot = blockType === 'setup' || blockType === 'loop'
  const showsBodySlot = isControlFlow || isRoot
  const showsElseSlot = blockType === 'if_condition' || blockType === 'if_else'

  return (
    <div
      className={cn(
        'relative rounded border-2 transition-shadow hover:shadow-sm',
        scheme.bg,
        scheme.border,
        isControlFlow ? 'min-w-[160px]' : 'min-w-[132px]',
        isEndBlock && 'min-w-[60px]',
      )}
    >
      {!isRoot && (
        <Handle
          id="in"
          type="target"
          position={Position.Top}
          className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white"
        />
      )}

      {showsBodySlot && (
        <Handle
          id="body"
          type="source"
          position={isRoot ? Position.Bottom : Position.Right}
          className="!bg-cyan-600 !w-2.5 !h-2.5 !border-2 !border-white"
        />
      )}

      {showsElseSlot && (
        <Handle
          id="else"
          type="source"
          position={Position.Left}
          className="!bg-amber-500 !w-2.5 !h-2.5 !border-2 !border-white"
        />
      )}

      {!isRoot && (
        <Handle
          id="next"
          type="source"
          position={Position.Bottom}
          className="!bg-slate-400 !w-2.5 !h-2.5 !border-2 !border-white"
        />
      )}

      <div className={cn('px-3 py-2', isEndBlock && 'px-2 py-1')}>
        <div className={cn('flex items-center gap-1.5', scheme.text)}>
          {scheme.icon}
          <span className="font-mono text-xs font-semibold">{data.label}</span>
        </div>
        {displayValue && (
          <div
            className={cn(
              'font-mono text-[10px] mt-0.5 opacity-75',
              scheme.text,
            )}
          >
            {displayValue}
          </div>
        )}

        {(isControlFlow || isRoot) && (
          <div
            className={cn(
              'mt-1 flex items-center justify-between text-[9px] font-mono opacity-75',
              scheme.text,
            )}
          >
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              body
            </span>
            {showsElseSlot && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                else
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
