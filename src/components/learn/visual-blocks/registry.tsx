'use client'

import type React from 'react'
import {
  Calculator,
  Clock,
  Dices,
  Gauge,
  GitBranch,
  MessageSquareText,
  Play,
  PlugZap,
  Plus,
  Radio,
  Repeat,
  Settings,
  Terminal,
  Zap,
} from 'lucide-react'
import type { VisualBlockType } from '../visual-programming'

export type VisualBlockPaletteBlock = {
  type: VisualBlockType
  label: string
  icon: React.ReactNode
}

export type VisualBlockPaletteCategory = {
  id:
    | 'variables'
    | 'operators'
    | 'control'
    | 'timing'
    | 'io'
    | 'serial'
    | 'servo'
    | 'text'
  label: string
  accentClassName: string
  blocks: VisualBlockPaletteBlock[]
}

export const visualBlockPalette: VisualBlockPaletteCategory[] = [
  {
    id: 'variables',
    label: 'Variables',
    accentClassName: 'text-violet-700',
    blocks: [
      {
        type: 'variable',
        label: 'Global Variable',
        icon: <Settings className="h-3 w-3" />,
      },
      {
        type: 'variable_set',
        label: 'Set Variable',
        icon: <Settings className="h-3 w-3" />,
      },
      {
        type: 'variable_change',
        label: 'Change Variable',
        icon: <Plus className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'operators',
    label: 'Operators',
    accentClassName: 'text-indigo-700',
    blocks: [
      {
        type: 'math_set',
        label: 'Math Operation',
        icon: <Calculator className="h-3 w-3" />,
      },
      {
        type: 'math_random',
        label: 'Random',
        icon: <Dices className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'control',
    label: 'Control',
    accentClassName: 'text-yellow-700',
    blocks: [
      {
        type: 'if_condition',
        label: 'If',
        icon: <GitBranch className="h-3 w-3" />,
      },
      {
        type: 'for_loop',
        label: 'For Loop',
        icon: <Repeat className="h-3 w-3" />,
      },
      {
        type: 'while_loop',
        label: 'While',
        icon: <Repeat className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'timing',
    label: 'Timing',
    accentClassName: 'text-amber-700',
    blocks: [
      {
        type: 'delay',
        label: 'Delay',
        icon: <Clock className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'io',
    label: 'I/O',
    accentClassName: 'text-emerald-700',
    blocks: [
      {
        type: 'pin_mode',
        label: 'Pin Mode',
        icon: <PlugZap className="h-3 w-3" />,
      },
      {
        type: 'digital_write',
        label: 'Digital Write',
        icon: <Zap className="h-3 w-3" />,
      },
      {
        type: 'digital_read',
        label: 'Digital Read',
        icon: <Radio className="h-3 w-3" />,
      },
      {
        type: 'analog_write',
        label: 'PWM Write',
        icon: <Zap className="h-3 w-3" />,
      },
      {
        type: 'analog_read',
        label: 'Analog Read',
        icon: <Gauge className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'servo',
    label: 'Servo',
    accentClassName: 'text-blue-700',
    blocks: [
      {
        type: 'servo_attach',
        label: 'Servo Attach',
        icon: <Settings className="h-3 w-3" />,
      },
      {
        type: 'servo_write',
        label: 'Servo Write',
        icon: <Gauge className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'serial',
    label: 'Serial',
    accentClassName: 'text-slate-700',
    blocks: [
      {
        type: 'serial_begin',
        label: 'Serial Begin',
        icon: <Terminal className="h-3 w-3" />,
      },
      {
        type: 'serial_print',
        label: 'Serial Print',
        icon: <Terminal className="h-3 w-3" />,
      },
      {
        type: 'serial_print_value',
        label: 'Serial Print Value',
        icon: <Terminal className="h-3 w-3" />,
      },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    accentClassName: 'text-slate-700',
    blocks: [
      {
        type: 'comment',
        label: 'Comment',
        icon: <MessageSquareText className="h-3 w-3" />,
      },
    ],
  },
]

export type VisualBlockDefaults = {
  label: string
  params: Record<string, unknown>
}

const DEFAULTS: Partial<Record<VisualBlockType, VisualBlockDefaults>> = {
  setup: { label: 'setup()', params: {} },
  loop: { label: 'loop()', params: {} },

  variable: {
    label: 'Global Variable',
    params: { name: 'value', varType: 'int', value: 0 },
  },
  variable_set: {
    label: 'Set Variable',
    params: { name: 'value', value: '0' },
  },
  variable_change: {
    label: 'Change Variable',
    params: { name: 'value', delta: 1 },
  },

  math_set: {
    label: 'Math Operation',
    params: { target: 'value', left: 'value', op: '+', right: '1' },
  },
  math_random: {
    label: 'Random',
    params: { target: 'value', min: 0, max: 10 },
  },

  comment: { label: 'Comment', params: { text: '' } },

  pin_mode: { label: 'Pin Mode', params: { pin: 2, mode: 'INPUT' } },

  servo_attach: {
    label: 'Servo Attach',
    params: { variable: 'servo', pin: 9 },
  },
  servo_write: {
    label: 'Servo Write',
    params: { variable: 'servo', angle: '90' },
  },

  delay: { label: 'Delay', params: { ms: 500 } },

  digital_write: { label: 'Digital Write', params: { pin: 13, value: 'HIGH' } },
  digital_read: {
    label: 'Digital Read',
    params: { pin: 2, variable: 'buttonState' },
  },
  analog_write: { label: 'PWM Write', params: { pin: 9, value: '128' } },
  analog_read: {
    label: 'Analog Read',
    params: { pin: 'A0', variable: 'sensorValue' },
  },

  serial_begin: { label: 'Serial Begin', params: { baud: 9600 } },
  serial_print: { label: 'Serial Print', params: { message: 'Hello' } },
  serial_print_value: {
    label: 'Serial Print Value',
    params: { value: 'value', newline: true },
  },

  if_condition: { label: 'If', params: { condition: 'true' } },
  if_else: { label: 'If', params: { condition: 'true' } },
  for_loop: {
    label: 'For Loop',
    params: { variable: 'i', start: 0, end: 10, step: 1 },
  },
  while_loop: { label: 'While', params: { condition: 'true' } },

  end_block: { label: 'End', params: {} },
}

export function getVisualBlockDefaults(
  blockType: VisualBlockType,
): VisualBlockDefaults {
  // eslint-disable-next-line security/detect-object-injection -- blockType is a closed union key
  const config = DEFAULTS[blockType]
  if (config) return config
  return { label: 'Block', params: {} }
}

export type VisualBlockColorScheme = {
  bg: string
  border: string
  text: string
  icon: React.ReactNode
}

const FALLBACK_SCHEME: VisualBlockColorScheme = {
  bg: 'bg-slate-100',
  border: 'border-slate-300',
  text: 'text-slate-700',
  icon: null,
}

const COLOR_SCHEMES: Partial<Record<VisualBlockType, VisualBlockColorScheme>> =
  {
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
    variable_set: {
      bg: 'bg-violet-100',
      border: 'border-violet-400',
      text: 'text-violet-800',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
    variable_change: {
      bg: 'bg-violet-100',
      border: 'border-violet-400',
      text: 'text-violet-800',
      icon: <Plus className="w-3.5 h-3.5" />,
    },
    math_set: {
      bg: 'bg-indigo-100',
      border: 'border-indigo-400',
      text: 'text-indigo-800',
      icon: <Calculator className="w-3.5 h-3.5" />,
    },
    math_random: {
      bg: 'bg-indigo-100',
      border: 'border-indigo-400',
      text: 'text-indigo-800',
      icon: <Dices className="w-3.5 h-3.5" />,
    },
    comment: {
      bg: 'bg-slate-100',
      border: 'border-slate-400',
      text: 'text-slate-800',
      icon: <MessageSquareText className="w-3.5 h-3.5" />,
    },
    pin_mode: {
      bg: 'bg-emerald-100',
      border: 'border-emerald-400',
      text: 'text-emerald-800',
      icon: <PlugZap className="w-3.5 h-3.5" />,
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
    serial_begin: {
      bg: 'bg-slate-100',
      border: 'border-slate-400',
      text: 'text-slate-800',
      icon: <Terminal className="w-3.5 h-3.5" />,
    },
    serial_print: {
      bg: 'bg-slate-100',
      border: 'border-slate-400',
      text: 'text-slate-800',
      icon: <Terminal className="w-3.5 h-3.5" />,
    },
    serial_print_value: {
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

export function visualBlockScheme(
  blockType: VisualBlockType | undefined,
): VisualBlockColorScheme {
  if (!blockType) return FALLBACK_SCHEME
  if (!Object.prototype.hasOwnProperty.call(COLOR_SCHEMES, blockType)) {
    return FALLBACK_SCHEME
  }
  // eslint-disable-next-line security/detect-object-injection -- blockType is a closed union key
  const scheme = COLOR_SCHEMES[blockType]
  return scheme ?? FALLBACK_SCHEME
}
