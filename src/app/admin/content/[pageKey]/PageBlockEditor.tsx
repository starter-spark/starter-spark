'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  Type,
  Heading,
  Image,
  AlertCircle,
  Code,
  Video,
  HelpCircle,
  MousePointerClick,
  Minus,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AdminTextArea,
  adminLabelClass,
} from '@/components/admin/form-controls'
import type {
  PageBlock,
  PageBlockType,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  CalloutBlock,
  CodeBlock,
  VideoBlock,
  FAQBlock,
  CTAButtonBlock,
  DividerBlock,
  StatCounterBlock,
  CalloutVariant,
  DividerStyle,
  ButtonVariant,
  ButtonAlignment,
} from '@/types/page-blocks'
import { createBlock, generateBlockId } from '@/types/page-blocks'

const BLOCK_TYPE_CONFIG: Record<
  PageBlockType,
  { label: string; icon: React.ReactNode }
> = {
  heading: { label: 'Heading', icon: <Heading className="w-4 h-4" /> },
  text: { label: 'Text', icon: <Type className="w-4 h-4" /> },
  image: { label: 'Image', icon: <Image className="w-4 h-4" /> },
  callout: { label: 'Callout', icon: <AlertCircle className="w-4 h-4" /> },
  code: { label: 'Code', icon: <Code className="w-4 h-4" /> },
  video: { label: 'Video', icon: <Video className="w-4 h-4" /> },
  faq: { label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
  cta_button: {
    label: 'CTA Button',
    icon: <MousePointerClick className="w-4 h-4" />,
  },
  divider: { label: 'Divider', icon: <Minus className="w-4 h-4" /> },
  stat_counter: {
    label: 'Stats Counter',
    icon: <BarChart3 className="w-4 h-4" />,
  },
}

interface PageBlockEditorProps {
  blocks: PageBlock[]
  onChange: (blocks: PageBlock[]) => void
}

export function PageBlockEditor({ blocks, onChange }: PageBlockEditorProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const addBlock = (type: PageBlockType) => {
    const newBlock = createBlock(type)
    onChange([...blocks, newBlock])
    setExpandedBlocks((prev) => new Set(prev).add(newBlock.id))
  }

  const updateBlock = (index: number, updates: Partial<PageBlock>) => {
    const newBlocks = [...blocks]
    newBlocks[index] = { ...newBlocks[index], ...updates } as PageBlock
    onChange(newBlocks)
  }

  const deleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index)
    onChange(newBlocks)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    const [removed] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, removed)
    onChange(newBlocks)
  }

  const renderBlockEditor = (block: PageBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        return <HeadingBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'text':
        return <TextBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'image':
        return <ImageBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'callout':
        return <CalloutBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'code':
        return <CodeBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'video':
        return <VideoBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'faq':
        return <FAQBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'cta_button':
        return <CTAButtonBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'divider':
        return <DividerBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      case 'stat_counter':
        return <StatCounterBlockEditor block={block} onUpdate={(u) => updateBlock(index, u)} />
      default:
        return <div className="text-sm text-slate-500">Unknown block type</div>
    }
  }

  const getBlockPreview = (block: PageBlock): string => {
    switch (block.type) {
      case 'heading':
        return (block as HeadingBlock).content || 'Empty heading'
      case 'text':
        return ((block as TextBlock).content || 'Empty text').slice(0, 50) + '...'
      case 'image':
        return (block as ImageBlock).alt || 'Image'
      case 'callout':
        return `${(block as CalloutBlock).variant}: ${((block as CalloutBlock).content || '').slice(0, 30)}...`
      case 'code':
        return (block as CodeBlock).filename || (block as CodeBlock).language || 'Code'
      case 'video':
        return 'Video embed'
      case 'faq':
        return `${(block as FAQBlock).items.length} questions`
      case 'cta_button':
        return (block as CTAButtonBlock).text || 'Button'
      case 'divider':
        return `${(block as DividerBlock).style || 'line'} divider`
      case 'stat_counter':
        return `${(block as StatCounterBlock).stats.length} stats`
      default:
        return 'Block'
    }
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-center py-8 text-slate-500 border border-dashed border-slate-200 rounded">
          No blocks yet. Add your first block below.
        </div>
      )}

      {blocks.map((block, index) => {
        const config = BLOCK_TYPE_CONFIG[block.type]
        const isExpanded = expandedBlocks.has(block.id)

        return (
          <div
            key={block.id}
            className="border border-slate-200 rounded bg-white"
          >
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(block.id)}>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
                  {config.icon}
                  <span className="text-sm font-medium text-slate-700">
                    {config.label}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {getBlockPreview(block)}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </CollapsibleTrigger>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'up')}
                    disabled={index === 0}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBlock(index, 'down')}
                    disabled={index === blocks.length - 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(index)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CollapsibleContent>
                <div className="p-4 space-y-4">
                  {renderBlockEditor(block, index)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Block
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          {(Object.keys(BLOCK_TYPE_CONFIG) as PageBlockType[]).map((type) => {
            const config = BLOCK_TYPE_CONFIG[type]
            return (
              <DropdownMenuItem
                key={type}
                onClick={() => addBlock(type)}
                className="cursor-pointer"
              >
                {config.icon}
                <span className="ml-2">{config.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Individual block editors

function HeadingBlockEditor({
  block,
  onUpdate,
}: {
  block: HeadingBlock
  onUpdate: (updates: Partial<HeadingBlock>) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <label className={adminLabelClass}>Level</label>
        <Select
          value={String(block.level)}
          onValueChange={(v) => onUpdate({ level: Number(v) as 1 | 2 | 3 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1 - Large</SelectItem>
            <SelectItem value="2">H2 - Medium</SelectItem>
            <SelectItem value="3">H3 - Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Content</label>
        <Input
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Heading text..."
        />
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Anchor (optional)</label>
        <Input
          value={block.anchor || ''}
          onChange={(e) => onUpdate({ anchor: e.target.value || undefined })}
          placeholder="custom-anchor-id"
        />
        <p className="text-xs text-slate-500">
          Custom ID for linking. Leave empty to auto-generate from heading text.
        </p>
      </div>
    </>
  )
}

function TextBlockEditor({
  block,
  onUpdate,
}: {
  block: TextBlock
  onUpdate: (updates: Partial<TextBlock>) => void
}) {
  return (
    <div className="space-y-2">
      <label className={adminLabelClass}>Content (Markdown)</label>
      <AdminTextArea
        value={block.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Enter markdown content..."
        className="h-40 font-mono"
      />
    </div>
  )
}

function ImageBlockEditor({
  block,
  onUpdate,
}: {
  block: ImageBlock
  onUpdate: (updates: Partial<ImageBlock>) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <label className={adminLabelClass}>Image URL</label>
        <Input
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Alt Text</label>
        <Input
          value={block.alt}
          onChange={(e) => onUpdate({ alt: e.target.value })}
          placeholder="Describe the image..."
        />
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Caption (optional)</label>
        <Input
          value={block.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
          placeholder="Image caption..."
        />
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Width</label>
        <Select
          value={block.width || 'large'}
          onValueChange={(v) =>
            onUpdate({ width: v as 'small' | 'medium' | 'large' | 'full' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large (default)</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}

function CalloutBlockEditor({
  block,
  onUpdate,
}: {
  block: CalloutBlock
  onUpdate: (updates: Partial<CalloutBlock>) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <label className={adminLabelClass}>Variant</label>
        <Select
          value={block.variant}
          onValueChange={(v) => onUpdate({ variant: v as CalloutVariant })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info (blue)</SelectItem>
            <SelectItem value="tip">Tip (cyan)</SelectItem>
            <SelectItem value="warning">Warning (amber)</SelectItem>
            <SelectItem value="danger">Danger (red)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Title (optional)</label>
        <Input
          value={block.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value || undefined })}
          placeholder="Custom title..."
        />
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Content (Markdown)</label>
        <AdminTextArea
          value={block.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Callout content..."
          className="h-24 font-mono"
        />
      </div>
    </>
  )
}

function CodeBlockEditor({
  block,
  onUpdate,
}: {
  block: CodeBlock
  onUpdate: (updates: Partial<CodeBlock>) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={adminLabelClass}>Language</label>
          <Input
            value={block.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            placeholder="javascript, python, etc."
          />
        </div>
        <div className="space-y-2">
          <label className={adminLabelClass}>Filename (optional)</label>
          <Input
            value={block.filename || ''}
            onChange={(e) => onUpdate({ filename: e.target.value || undefined })}
            placeholder="example.js"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Code</label>
        <AdminTextArea
          value={block.code}
          onChange={(e) => onUpdate({ code: e.target.value })}
          placeholder="Enter code..."
          className="h-48 font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`line-numbers-${block.id}`}
          checked={block.showLineNumbers ?? true}
          onChange={(e) => onUpdate({ showLineNumbers: e.target.checked })}
          className="rounded border-slate-300"
        />
        <label htmlFor={`line-numbers-${block.id}`} className="text-sm text-slate-600">
          Show line numbers
        </label>
      </div>
    </>
  )
}

function VideoBlockEditor({
  block,
  onUpdate,
}: {
  block: VideoBlock
  onUpdate: (updates: Partial<VideoBlock>) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <label className={adminLabelClass}>Video URL</label>
        <Input
          value={block.url}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="YouTube, Vimeo, or direct video URL..."
        />
        <p className="text-xs text-slate-500">
          Supports YouTube, Vimeo, and direct .mp4/.webm/.ogg links
        </p>
      </div>
      <div className="space-y-2">
        <label className={adminLabelClass}>Caption (optional)</label>
        <Input
          value={block.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value || undefined })}
          placeholder="Video caption..."
        />
      </div>
    </>
  )
}

function FAQBlockEditor({
  block,
  onUpdate,
}: {
  block: FAQBlock
  onUpdate: (updates: Partial<FAQBlock>) => void
}) {
  const addItem = () => {
    onUpdate({ items: [...block.items, { question: '', answer: '' }] })
  }

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...block.items]
    newItems[index] = { ...newItems[index], [field]: value }
    onUpdate({ items: newItems })
  }

  const removeItem = (index: number) => {
    onUpdate({ items: block.items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {block.items.map((item, index) => (
        <div key={index} className="border border-slate-200 rounded p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <label className={adminLabelClass}>Question {index + 1}</label>
              <Input
                value={item.question}
                onChange={(e) => updateItem(index, 'question', e.target.value)}
                placeholder="Enter question..."
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <label className={adminLabelClass}>Answer (Markdown)</label>
            <AdminTextArea
              value={item.answer}
              onChange={(e) => updateItem(index, 'answer', e.target.value)}
              placeholder="Enter answer..."
              className="h-20 font-mono"
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus className="w-4 h-4 mr-2" />
        Add Question
      </Button>
    </div>
  )
}

function CTAButtonBlockEditor({
  block,
  onUpdate,
}: {
  block: CTAButtonBlock
  onUpdate: (updates: Partial<CTAButtonBlock>) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={adminLabelClass}>Button Text</label>
          <Input
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Click me"
          />
        </div>
        <div className="space-y-2">
          <label className={adminLabelClass}>URL</label>
          <Input
            value={block.url}
            onChange={(e) => onUpdate({ url: e.target.value })}
            placeholder="/page or https://..."
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={adminLabelClass}>Style</label>
          <Select
            value={block.variant || 'primary'}
            onValueChange={(v) => onUpdate({ variant: v as ButtonVariant })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className={adminLabelClass}>Alignment</label>
          <Select
            value={block.alignment || 'left'}
            onValueChange={(v) => onUpdate({ alignment: v as ButtonAlignment })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )
}

function DividerBlockEditor({
  block,
  onUpdate,
}: {
  block: DividerBlock
  onUpdate: (updates: Partial<DividerBlock>) => void
}) {
  return (
    <div className="space-y-2">
      <label className={adminLabelClass}>Style</label>
      <Select
        value={block.style || 'line'}
        onValueChange={(v) => onUpdate({ style: v as DividerStyle })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line</SelectItem>
          <SelectItem value="dots">Dots</SelectItem>
          <SelectItem value="space">Space (invisible)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function StatCounterBlockEditor({
  block,
  onUpdate,
}: {
  block: StatCounterBlock
  onUpdate: (updates: Partial<StatCounterBlock>) => void
}) {
  const addStat = () => {
    onUpdate({ stats: [...block.stats, { value: '', label: '' }] })
  }

  const updateStat = (index: number, field: 'value' | 'label', value: string) => {
    const newStats = [...block.stats]
    newStats[index] = { ...newStats[index], [field]: value }
    onUpdate({ stats: newStats })
  }

  const removeStat = (index: number) => {
    onUpdate({ stats: block.stats.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      {block.stats.map((stat, index) => (
        <div key={index} className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <label className={adminLabelClass}>Value</label>
            <Input
              value={stat.value}
              onChange={(e) => updateStat(index, 'value', e.target.value)}
              placeholder="100+"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className={adminLabelClass}>Label</label>
            <Input
              value={stat.label}
              onChange={(e) => updateStat(index, 'label', e.target.value)}
              placeholder="Happy customers"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeStat(index)}
            className="text-red-500 hover:text-red-600 mb-0.5"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addStat}>
        <Plus className="w-4 h-4 mr-2" />
        Add Stat
      </Button>
    </div>
  )
}
