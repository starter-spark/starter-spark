'use client'

import type { Node } from '@xyflow/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { VisualNodeData } from '../visual-programming'

export function VisualParamsEditor({
  node,
  onChange,
  variableNames,
  variableNameDatalistId,
}: {
  node: Node<VisualNodeData>
  onChange: (patch: Record<string, unknown>) => void
  variableNames: string[]
  variableNameDatalistId: string
}) {
  const data = node.data
  const blockType = data.blockType ?? ''
  const params: Record<string, unknown> = data.params ?? {}

  const variableListProps = {
    list: variableNameDatalistId,
    autoComplete: 'off',
  } as const

  const modeOptions = ['INPUT', 'OUTPUT', 'INPUT_PULLUP'] as const

  return (
    <div className="grid gap-3">
      {variableNames.length > 0 && (
        <datalist id={variableNameDatalistId}>
          {variableNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}

      {blockType === 'variable' && (
        <>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={typeof params.name === 'string' ? params.name : ''}
              onChange={(e) => {
                onChange({ name: e.target.value })
              }}
              {...variableListProps}
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={
                typeof params.varType === 'string' ? params.varType : 'int'
              }
              onChange={(e) => {
                onChange({ varType: e.target.value })
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            >
              <option value="int">int</option>
              <option value="float">float</option>
              <option value="bool">bool</option>
              <option value="long">long</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Initial Value</Label>
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
              placeholder="0"
            />
            <p className="text-[10px] text-slate-500">
              Supports expressions (e.g. 0, 42, true).
            </p>
          </div>
        </>
      )}

      {blockType === 'variable_set' && (
        <>
          <div className="space-y-2">
            <Label>Variable</Label>
            <Input
              value={typeof params.name === 'string' ? params.name : 'value'}
              onChange={(e) => {
                onChange({ name: e.target.value })
              }}
              {...variableListProps}
            />
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
              placeholder="0"
            />
          </div>
        </>
      )}

      {blockType === 'variable_change' && (
        <>
          <div className="space-y-2">
            <Label>Variable</Label>
            <Input
              value={typeof params.name === 'string' ? params.name : 'value'}
              onChange={(e) => {
                onChange({ name: e.target.value })
              }}
              {...variableListProps}
            />
          </div>
          <div className="space-y-2">
            <Label>Change By</Label>
            <Input
              type="number"
              value={typeof params.delta === 'number' ? params.delta : 1}
              onChange={(e) => {
                onChange({ delta: Number(e.target.value) })
              }}
            />
          </div>
        </>
      )}

      {blockType === 'math_set' && (
        <>
          <div className="space-y-2">
            <Label>Store result in</Label>
            <Input
              value={
                typeof params.target === 'string' ? params.target : 'value'
              }
              onChange={(e) => {
                onChange({ target: e.target.value })
              }}
              {...variableListProps}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div className="space-y-2">
              <Label>Left</Label>
              <Input
                value={
                  typeof params.left === 'string' ||
                  typeof params.left === 'number'
                    ? String(params.left)
                    : '0'
                }
                onChange={(e) => {
                  onChange({ left: e.target.value })
                }}
                placeholder="value"
              />
            </div>

            <div className="space-y-2">
              <Label>Op</Label>
              <select
                value={typeof params.op === 'string' ? params.op : '+'}
                onChange={(e) => {
                  onChange({ op: e.target.value })
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm font-mono"
              >
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="*">*</option>
                <option value="/">/</option>
                <option value="%">%</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Right</Label>
              <Input
                value={
                  typeof params.right === 'string' ||
                  typeof params.right === 'number'
                    ? String(params.right)
                    : '1'
                }
                onChange={(e) => {
                  onChange({ right: e.target.value })
                }}
                placeholder="1"
              />
            </div>
          </div>
        </>
      )}

      {blockType === 'math_random' && (
        <>
          <div className="space-y-2">
            <Label>Store in</Label>
            <Input
              value={
                typeof params.target === 'string' ? params.target : 'value'
              }
              onChange={(e) => {
                onChange({ target: e.target.value })
              }}
              {...variableListProps}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Min</Label>
              <Input
                type="number"
                value={typeof params.min === 'number' ? params.min : 0}
                onChange={(e) => {
                  onChange({ min: Number(e.target.value) })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Max</Label>
              <Input
                type="number"
                value={typeof params.max === 'number' ? params.max : 10}
                onChange={(e) => {
                  onChange({ max: Number(e.target.value) })
                }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Emits <span className="font-mono">random(min, max)</span>.
          </p>
        </>
      )}

      {blockType === 'comment' && (
        <>
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              value={typeof params.text === 'string' ? params.text : ''}
              onChange={(e) => {
                onChange({ text: e.target.value })
              }}
              rows={3}
              className="font-mono text-sm"
              placeholder="Explain what's happening..."
            />
          </div>
        </>
      )}

      {blockType === 'pin_mode' && (
        <>
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
              <Label>Mode</Label>
              <select
                value={typeof params.mode === 'string' ? params.mode : 'INPUT'}
                onChange={(e) => {
                  onChange({ mode: e.target.value })
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              >
                {modeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">
            Pin modes are always emitted in{' '}
            <span className="font-mono">setup()</span>.
          </p>
        </>
      )}

      {blockType === 'servo_attach' && (
        <>
          <div className="space-y-2">
            <Label>Servo variable</Label>
            <Input
              value={
                typeof params.variable === 'string' ? params.variable : 'servo'
              }
              onChange={(e) => {
                onChange({ variable: e.target.value })
              }}
              {...variableListProps}
              placeholder="servo"
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
        </>
      )}

      {blockType === 'servo_write' && (
        <>
          <div className="space-y-2">
            <Label>Servo variable</Label>
            <Input
              value={
                typeof params.variable === 'string' ? params.variable : 'servo'
              }
              onChange={(e) => {
                onChange({ variable: e.target.value })
              }}
              {...variableListProps}
              placeholder="servo"
            />
          </div>
          <div className="space-y-2">
            <Label>Angle</Label>
            <Input
              value={
                typeof params.angle === 'string' ||
                typeof params.angle === 'number'
                  ? String(params.angle)
                  : '90'
              }
              onChange={(e) => {
                onChange({ angle: e.target.value })
              }}
              placeholder="90"
            />
            <p className="text-[10px] text-slate-500">
              Supports expressions (e.g.{' '}
              <span className="font-mono">map(x,0,1023,0,180)</span>).
            </p>
          </div>
        </>
      )}

      {blockType === 'delay' && (
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
      )}

      {blockType === 'digital_write' && (
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
      )}

      {blockType === 'analog_write' && (
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Pin (PWM)</Label>
            <Input
              type="number"
              value={typeof params.pin === 'number' ? params.pin : 9}
              onChange={(e) => {
                onChange({ pin: Number(e.target.value) })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Value (0–255)</Label>
            <Input
              value={
                typeof params.value === 'string' ||
                typeof params.value === 'number'
                  ? String(params.value)
                  : '128'
              }
              onChange={(e) => {
                onChange({ value: e.target.value })
              }}
              placeholder="128"
            />
          </div>
        </div>
      )}

      {blockType === 'serial_begin' && (
        <div className="space-y-2">
          <Label>Baud</Label>
          <Input
            type="number"
            value={typeof params.baud === 'number' ? params.baud : 9600}
            onChange={(e) => {
              onChange({ baud: Number(e.target.value) })
            }}
          />
        </div>
      )}

      {blockType === 'serial_print' && (
        <div className="space-y-2">
          <Label>Message</Label>
          <Input
            value={typeof params.message === 'string' ? params.message : ''}
            onChange={(e) => {
              onChange({ message: e.target.value })
            }}
          />
        </div>
      )}

      {blockType === 'serial_print_value' && (
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={
                typeof params.value === 'string' ||
                typeof params.value === 'number'
                  ? String(params.value)
                  : 'value'
              }
              onChange={(e) => {
                onChange({ value: e.target.value })
              }}
              placeholder="sensorValue"
            />
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <select
              value={params.newline === false ? 'print' : 'println'}
              onChange={(e) => {
                onChange({ newline: e.target.value === 'println' })
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            >
              <option value="println">println (with newline)</option>
              <option value="print">print (no newline)</option>
            </select>
          </div>
        </div>
      )}

      {blockType === 'digital_read' && (
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
              value={
                typeof params.variable === 'string'
                  ? params.variable
                  : 'buttonState'
              }
              onChange={(e) => {
                onChange({ variable: e.target.value })
              }}
              {...variableListProps}
            />
          </div>
        </div>
      )}

      {blockType === 'analog_read' && (
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
              value={
                typeof params.variable === 'string'
                  ? params.variable
                  : 'sensorValue'
              }
              onChange={(e) => {
                onChange({ variable: e.target.value })
              }}
              {...variableListProps}
            />
          </div>
        </div>
      )}

      {(blockType === 'if_condition' || blockType === 'if_else') && (
        <div className="space-y-2">
          <Label>Condition</Label>
          <Input
            value={
              typeof params.condition === 'string' ? params.condition : 'true'
            }
            onChange={(e) => {
              onChange({ condition: e.target.value })
            }}
            placeholder="e.g., buttonState == HIGH"
          />
          <p className="text-[10px] text-slate-500">
            Examples: buttonState == HIGH, sensorValue &gt; 500, i &lt; 10
          </p>
        </div>
      )}

      {blockType === 'for_loop' && (
        <>
          <div className="space-y-2">
            <Label>Variable</Label>
            <Input
              value={
                typeof params.variable === 'string' ? params.variable : 'i'
              }
              onChange={(e) => {
                onChange({ variable: e.target.value })
              }}
              {...variableListProps}
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
        </>
      )}

      {blockType === 'while_loop' && (
        <div className="space-y-2">
          <Label>Condition</Label>
          <Input
            value={
              typeof params.condition === 'string' ? params.condition : 'true'
            }
            onChange={(e) => {
              onChange({ condition: e.target.value })
            }}
            placeholder="e.g., sensorValue < 500"
          />
          <p className="text-[10px] text-slate-500">
            Loop runs while condition is true
          </p>
        </div>
      )}

      {(blockType === 'setup' ||
        blockType === 'loop' ||
        blockType === 'end_block') && (
        <p className="text-sm text-slate-500">
          This block has no configurable parameters.
        </p>
      )}

      {blockType === '' && (
        <p className="text-sm text-slate-500">No parameters for this block.</p>
      )}
    </div>
  )
}
