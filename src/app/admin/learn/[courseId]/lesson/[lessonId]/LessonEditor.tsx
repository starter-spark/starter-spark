'use client'

import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { Reorder, useDragControls } from 'motion/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Save,
  Trash2,
  FileText,
  Code,
  Blocks,
  HelpCircle,
  Wrench,
  Video,
  GripVertical,
  Plus,
  Download,
  Image as ImageIcon,
  Heading as HeadingIcon,
  AlertTriangle,
  Copy,
  Upload,
} from 'lucide-react'
import { updateLesson, deleteLesson } from '../../../actions'
import { LessonContent } from '@/components/learn/LessonContent'
import { CodeEditor } from '@/components/learn/CodeEditor'
import { FlowEditor } from '@/components/learn/FlowEditor'
import { VideoUploader } from '@/components/learn/VideoUploader'
import { randomId } from '@/lib/random-id'

type LessonBlock = Record<string, unknown> & {
  id: string
  type: string
}

interface Lesson {
  id: string
  title: string
  slug: string
  description: string | null
  lesson_type: string
  difficulty: string
  estimated_minutes: number
  is_published: boolean
  is_optional: boolean
  prerequisites: string[] | null
  sort_order: number
  content: string
  content_blocks: unknown[]
  video_url: string | null
  code_starter: string | null
  code_solution: string | null
  module: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
}

interface LessonEditorProps {
  lesson: Lesson
  courseId: string
  availableLessons: { id: string; title: string }[]
}

const lessonTypeConfig: Record<
  string,
  { icon: typeof FileText; label: string; description: string }
> = {
  content: {
    icon: FileText,
    label: 'Content',
    description: 'Text-based lesson with markdown content',
  },
  code_challenge: {
    icon: Code,
    label: 'Code Challenge',
    description: 'Interactive coding exercise with starter code and solution',
  },
  visual_challenge: {
    icon: Blocks,
    label: 'Visual Challenge',
    description: 'Block-based visual programming challenge',
  },
  quiz: {
    icon: HelpCircle,
    label: 'Quiz',
    description: 'Multiple choice or short answer questions',
  },
  project: {
    icon: Wrench,
    label: 'Project',
    description: 'Hands-on project with instructions and deliverables',
  },
}

const blockTypeOptions: {
  value: string
  label: string
  icon: typeof FileText
  description: string
}[] = [
  {
    value: 'text',
    label: 'Text',
    icon: FileText,
    description: 'Markdown content',
  },
  {
    value: 'heading',
    label: 'Heading',
    icon: HeadingIcon,
    description: 'Section title',
  },
  {
    value: 'image',
    label: 'Image',
    icon: ImageIcon,
    description: 'Image + caption',
  },
  {
    value: 'video',
    label: 'Video',
    icon: Video,
    description: 'YouTube/Vimeo/direct',
  },
  {
    value: 'code',
    label: 'Code',
    icon: Code,
    description: 'Syntax-highlighted code block',
  },
  {
    value: 'callout',
    label: 'Callout',
    icon: AlertTriangle,
    description: 'Info/tip/warn/danger',
  },
  {
    value: 'download',
    label: 'Download',
    icon: Download,
    description: 'Download link + description',
  },
  {
    value: 'quiz',
    label: 'Quiz',
    icon: HelpCircle,
    description: 'Question + options',
  },
  {
    value: 'interactive_code',
    label: 'Interactive Code',
    icon: Code,
    description: 'Starter + solution',
  },
  {
    value: 'diagram',
    label: 'Diagram',
    icon: Blocks,
    description: 'Flow/diagram JSON',
  },
  {
    value: 'visual_blocks',
    label: 'Visual Blocks',
    icon: Blocks,
    description: 'Visual blocks JSON',
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isBlockLike(
  value: unknown,
): value is Record<string, unknown> & { type: string } {
  return isRecord(value) && typeof value.type === 'string'
}

function normalizeBlocks(raw: unknown, lesson: Lesson): LessonBlock[] {
  const fromDb: LessonBlock[] = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!isRecord(item)) continue
      const type = typeof item.type === 'string' ? item.type : 'text'
      const id = typeof item.id === 'string' ? item.id : randomId()
      fromDb.push({ id, type, ...item })
    }
  }

  if (fromDb.length > 0) return fromDb

  const seeded: LessonBlock[] = []
  if (lesson.video_url) {
    seeded.push({ id: randomId(), type: 'video', url: lesson.video_url })
  }
  if (lesson.content?.trim()) {
    seeded.push({ id: randomId(), type: 'text', content: lesson.content })
  }
  if (lesson.lesson_type === 'code_challenge' && lesson.code_starter) {
    seeded.push({
      id: randomId(),
      type: 'interactive_code',
      language: 'cpp',
      starterCode: lesson.code_starter,
      solutionCode: lesson.code_solution || '',
    })
  }
  return seeded
}

function escapeMarkdown(text: string): string {
  return text.replaceAll('\r\n', '\n').trim()
}

function blocksToLegacyFields(blocks: LessonBlock[]): {
  content: string
  videoUrl: string
  codeStarter: string
  codeSolution: string
} {
  let videoUrl = ''
  let codeStarter = ''
  let codeSolution = ''

  const parts: string[] = []

  for (const block of blocks) {
    const type = block.type

    if (type === 'video' && !videoUrl && typeof block.url === 'string') {
      videoUrl = block.url
      parts.push(`Video: ${block.url}`)
      continue
    }

    if (
      type === 'interactive_code' &&
      !codeStarter &&
      typeof block.starterCode === 'string'
    ) {
      codeStarter = block.starterCode
      if (typeof block.solutionCode === 'string')
        codeSolution = block.solutionCode
      const lang = typeof block.language === 'string' ? block.language : 'cpp'
      parts.push('```' + lang)
      parts.push(escapeMarkdown(codeStarter), '```')
      continue
    }

    if (type === 'heading') {
      const level = typeof block.level === 'number' ? block.level : 2
      const heading = typeof block.content === 'string' ? block.content : ''
      const prefix = level === 1 ? '##' : level === 2 ? '###' : '####'
      parts.push(`${prefix} ${heading}`.trim())
      continue
    }

    if (type === 'text' && typeof block.content === 'string') {
      parts.push(escapeMarkdown(block.content))
      continue
    }

    if (type === 'code' && typeof block.code === 'string') {
      const lang = typeof block.language === 'string' ? block.language : 'text'
      parts.push('```' + lang)
      parts.push(escapeMarkdown(block.code), '```')
      continue
    }

    if (type === 'callout' && typeof block.content === 'string') {
      const variant = typeof block.variant === 'string' ? block.variant : 'info'
      parts.push(`:::${variant}`)
      parts.push(escapeMarkdown(block.content), ':::')
      continue
    }

    if (type === 'image' && typeof block.url === 'string') {
      const alt = typeof block.alt === 'string' ? block.alt : ''
      parts.push(`![${alt}](${block.url})`)
      continue
    }

    if (type === 'download' && typeof block.url === 'string') {
      const filename =
        typeof block.filename === 'string' ? block.filename : 'Download'
      parts.push(`[${filename}](${block.url})`)
      if (typeof block.description === 'string' && block.description.trim()) {
        parts.push(block.description)
      }
      continue
    }
  }

  return {
    content: parts.filter(Boolean).join('\n\n').trim(),
    videoUrl,
    codeStarter,
    codeSolution,
  }
}

const builtInTemplates: { id: string; label: string; blocks: LessonBlock[] }[] =
  [
    {
      id: 'basic-text',
      label: 'Basic Text Lesson',
      blocks: [
        { id: randomId(), type: 'heading', level: 1, content: 'Overview' },
        {
          id: randomId(),
          type: 'text',
          content: 'Write your lesson content here (Markdown supported).',
        },
      ],
    },
    {
      id: 'code-tutorial',
      label: 'Code Tutorial',
      blocks: [
        {
          id: randomId(),
          type: 'heading',
          level: 1,
          content: 'What You’ll Build',
        },
        {
          id: randomId(),
          type: 'text',
          content: 'Explain the goal, then walk through the code.',
        },
        {
          id: randomId(),
          type: 'code',
          language: 'cpp',
          filename: 'main.ino',
          code: '// your code here',
        },
      ],
    },
    {
      id: 'quiz',
      label: 'Quiz',
      blocks: [
        { id: randomId(), type: 'heading', level: 1, content: 'Quick Check' },
        {
          id: randomId(),
          type: 'quiz',
          question: 'Question?',
          options: ['A', 'B', 'C'],
          correct: 0,
          explanation: '',
        },
      ],
    },
    {
      id: 'project',
      label: 'Project Build',
      blocks: [
        { id: randomId(), type: 'heading', level: 1, content: 'Project' },
        {
          id: randomId(),
          type: 'callout',
          variant: 'tip',
          content: 'Call out important constraints or tips.',
        },
        {
          id: randomId(),
          type: 'text',
          content: 'Describe steps, deliverables, and evaluation criteria.',
        },
      ],
    },
  ]

export function LessonEditor({
  lesson,
  courseId,
  availableLessons,
}: LessonEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleting, setDeleting] = useState(false)

  const [lessonType, setLessonType] = useState(lesson.lesson_type || 'content')
  const [difficulty, setDifficulty] = useState(lesson.difficulty || 'beginner')
  const [published, setPublished] = useState(lesson.is_published)
  const [optional, setOptional] = useState(lesson.is_optional)

  const [blocks, setBlocks] = useState<LessonBlock[]>(() =>
    normalizeBlocks(lesson.content_blocks, lesson),
  )

  const [prerequisites, setPrerequisites] = useState<string[]>(
    () => lesson.prerequisites || [],
  )
  const [prereqQuery, setPrereqQuery] = useState('')

  const [newBlockType, setNewBlockType] = useState('text')
  const [templateId, setTemplateId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Track initial state for unsaved changes detection
  const [initialBlocksSnapshot, setInitialBlocksSnapshot] = useState(() =>
    JSON.stringify(normalizeBlocks(lesson.content_blocks, lesson)),
  )
  const [initialPrereqsSnapshot, setInitialPrereqsSnapshot] = useState(() =>
    JSON.stringify(lesson.prerequisites || []),
  )

  // Compute if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const blocksChanged = JSON.stringify(blocks) !== initialBlocksSnapshot
    const prereqsChanged =
      JSON.stringify(prerequisites) !== initialPrereqsSnapshot
    return blocksChanged || prereqsChanged
  }, [blocks, initialBlocksSnapshot, initialPrereqsSnapshot, prerequisites])

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isPending && !deleting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, isPending, deleting])

  // Keyboard shortcut: Cmd/Ctrl+S to save
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (!isPending && formRef.current) {
          formRef.current.requestSubmit()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPending])

  // Reset dirty state after successful save
  const markAsSaved = useCallback(() => {
    setInitialBlocksSnapshot(JSON.stringify(blocks))
    setInitialPrereqsSnapshot(JSON.stringify(prerequisites))
  }, [blocks, prerequisites])

  const derived = useMemo(() => blocksToLegacyFields(blocks), [blocks])

  const filteredPrereqLessons = useMemo(() => {
    const q = prereqQuery.trim().toLowerCase()
    const list = availableLessons.filter((l) => l.id !== lesson.id)
    if (!q) return list
    return list.filter((l) => l.title.toLowerCase().includes(q))
  }, [availableLessons, lesson.id, prereqQuery])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateLesson(lesson.id, courseId, formData)
      if (result.error) {
        toast.error('Failed to save lesson', { description: result.error })
      } else {
        markAsSaved()
        toast.success('Lesson saved successfully')
        router.refresh()
      }
    })
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteLesson(lesson.id, courseId)
    if (result.error) {
      setDeleting(false)
      toast.error('Failed to delete lesson', { description: result.error })
    } else {
      toast.success('Lesson deleted')
      router.push(`/admin/learn/${courseId}`)
    }
  }

  const addBlock = () => {
    const type = newBlockType
    const id = randomId()

    const base = { id, type }
    const block: LessonBlock =
      type === 'text'
        ? { ...base, content: '' }
        : type === 'heading'
          ? { ...base, level: 1, content: '' }
          : type === 'image'
            ? { ...base, url: '', alt: '', caption: '' }
            : type === 'video'
              ? { ...base, url: '' }
              : type === 'code'
                ? { ...base, language: 'cpp', filename: '', code: '' }
                : type === 'callout'
                  ? { ...base, variant: 'info', content: '' }
                  : type === 'download'
                    ? { ...base, url: '', filename: '', description: '' }
                    : type === 'quiz'
                      ? {
                          ...base,
                          question: '',
                          options: [''],
                          correct: 0,
                          explanation: '',
                        }
                      : type === 'interactive_code'
                        ? {
                            ...base,
                            language: 'cpp',
                            starterCode: '',
                            solutionCode: '',
                          }
                        : type === 'diagram'
                          ? { ...base, flowData: { nodes: [], edges: [] } }
                          : type === 'visual_blocks'
                            ? {
                                ...base,
                                flowData: { nodes: [], edges: [] },
                                solutionFlowData: { nodes: [], edges: [] },
                              }
                            : { ...base, content: '' }

    setBlocks((prev) => [...prev, block])
  }

  const updateBlock = (id: string, patch: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as LessonBlock) : b)),
    )
  }

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const handleBlocksReorder = (nextIds: string[]) => {
    const lookup = new Map(blocks.map((b) => [b.id, b]))
    setBlocks(
      nextIds.map((id) => lookup.get(id)).filter(Boolean) as LessonBlock[],
    )
  }

  const togglePrereq = (lessonId: string) => {
    setPrerequisites((prev) => {
      if (prev.includes(lessonId)) return prev.filter((id) => id !== lessonId)
      return [...prev, lessonId]
    })
  }

  const applyTemplate = () => {
    const tpl = builtInTemplates.find((t) => t.id === templateId)
    if (!tpl) return
    if (
      blocks.length > 0 &&
      !confirm('Replace current blocks with this template?')
    )
      return
    // Re-create IDs to avoid collisions across applies
    const next = tpl.blocks.map((b) => ({ ...b, id: randomId() }))
    setBlocks(next)
    setTemplateId('')
    toast.success('Template applied', {
      description: `Applied "${tpl.label}" template`,
    })
  }

  const exportTemplate = () => {
    const payload = {
      version: 1,
      blocks,
      lesson_type: lessonType,
      difficulty,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lesson-template.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template exported', {
      description: 'lesson-template.json downloaded',
    })
  }

  const importTemplate = async (file: File) => {
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isRecord(parsed)) {
        toast.error('Invalid template file', {
          description: 'File must be a valid JSON object',
        })
        return
      }
      const rawBlocks = parsed.blocks
      if (!isUnknownArray(rawBlocks)) {
        toast.error('Invalid template file', {
          description: "Template must contain a 'blocks' array",
        })
        return
      }

      const imported: LessonBlock[] = rawBlocks
        .filter(isBlockLike)
        .map((b) => ({ ...b, id: randomId(), type: b.type }))
      setBlocks(imported)
      toast.success('Template imported', {
        description: `Imported ${imported.length} blocks`,
      })
    } catch {
      toast.error('Failed to import template', {
        description: 'Invalid JSON file',
      })
    }
  }

  const TypeIcon =
    lessonType === 'content'
      ? lessonTypeConfig.content.icon
      : lessonType === 'code_challenge'
        ? lessonTypeConfig.code_challenge.icon
        : lessonType === 'visual_challenge'
          ? lessonTypeConfig.visual_challenge.icon
          : lessonType === 'quiz'
            ? lessonTypeConfig.quiz.icon
            : lessonType === 'project'
              ? lessonTypeConfig.project.icon
              : FileText

  const lessonTypeDescription =
    lessonType === 'content'
      ? lessonTypeConfig.content.description
      : lessonType === 'code_challenge'
        ? lessonTypeConfig.code_challenge.description
        : lessonType === 'visual_challenge'
          ? lessonTypeConfig.visual_challenge.description
          : lessonType === 'quiz'
            ? lessonTypeConfig.quiz.description
            : lessonType === 'project'
              ? lessonTypeConfig.project.description
              : undefined

  return (
    <form ref={formRef} onSubmit={handleSave} className="space-y-6">
      {/* Hidden fields that back Radix inputs + block model */}
      <input type="hidden" name="lesson_type" value={lessonType} />
      <input type="hidden" name="difficulty" value={difficulty} />
      <input
        type="hidden"
        name="is_published"
        value={published ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="is_optional"
        value={optional ? 'true' : 'false'}
      />
      <input
        type="hidden"
        name="content_blocks"
        value={JSON.stringify(blocks)}
      />
      <input
        type="hidden"
        name="prerequisites"
        value={JSON.stringify(prerequisites)}
      />

      {/* Derived legacy fields (kept for backward compatibility) */}
      <input type="hidden" name="content" value={derived.content} />
      <input type="hidden" name="video_url" value={derived.videoUrl} />
      <input type="hidden" name="code_starter" value={derived.codeStarter} />
      <input type="hidden" name="code_solution" value={derived.codeSolution} />

      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <TypeIcon className="h-5 w-5 text-cyan-600" />
          <span className="font-mono text-sm font-semibold text-slate-900">
            Unified Lesson Editor
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={exportTemplate}>
            <Copy className="mr-2 h-4 w-4" />
            Export Template
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Template
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void importTemplate(file)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Editor */}
        <div className="lg:col-span-3 space-y-6">
          {/* Lesson Settings */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <TypeIcon className="h-5 w-5 text-cyan-600" />
                <h2 className="font-mono text-lg font-semibold text-slate-900">
                  Lesson Settings
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={lesson.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson_type_ui">Lesson Type</Label>
                  <Select value={lessonType} onValueChange={setLessonType}>
                    <SelectTrigger id="lesson_type_ui">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(lessonTypeConfig).map(
                        ([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {lessonTypeDescription}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={lesson.description || ''}
                  rows={2}
                  placeholder="Brief description of what this lesson covers..."
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="difficulty_ui">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty_ui">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_minutes">Duration (min)</Label>
                  <Input
                    id="estimated_minutes"
                    name="estimated_minutes"
                    type="number"
                    min={1}
                    defaultValue={lesson.estimated_minutes}
                  />
                </div>
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_published_ui"
                      checked={published}
                      onCheckedChange={setPublished}
                    />
                    <Label htmlFor="is_published_ui" className="cursor-pointer">
                      Published
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_optional_ui"
                      checked={optional}
                      onCheckedChange={setOptional}
                    />
                    <Label htmlFor="is_optional_ui" className="cursor-pointer">
                      Optional
                    </Label>
                  </div>
                </div>
              </div>

              {/* Prerequisites */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <Label>Prerequisites</Label>
                  <span className="text-xs text-slate-500 font-mono">
                    {prerequisites.length} selected
                  </span>
                </div>
                <Input
                  value={prereqQuery}
                  onChange={(e) => {
                    setPrereqQuery(e.target.value)
                  }}
                  placeholder="Search lessons..."
                />
                <div className="mt-3 max-h-48 overflow-auto rounded border border-slate-200">
                  {filteredPrereqLessons.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">
                      No lessons found.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {filteredPrereqLessons.map((l) => {
                        const checked = prerequisites.includes(l.id)
                        return (
                          <li
                            key={l.id}
                            className="flex items-center gap-3 p-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                togglePrereq(l.id)
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-sm text-slate-700">
                              {l.title}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Blocks */}
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="font-mono text-lg font-semibold text-slate-900">
                Content Blocks
              </h2>
              <div className="flex items-center gap-2">
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Apply template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {builtInTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyTemplate}
                  disabled={!templateId}
                >
                  Apply
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {blocks.length === 0 ? (
                <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No blocks yet. Add one below.
                </div>
              ) : (
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={blocks.map((b) => b.id)}
                  onReorder={handleBlocksReorder}
                  className="space-y-3"
                >
                  {blocks.map((block) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      lessonId={lesson.id}
                      onChange={(patch) => {
                        updateBlock(block.id, patch)
                      }}
                      onDelete={() => {
                        removeBlock(block.id)
                      }}
                    />
                  ))}
                </Reorder.Group>
              )}

              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label htmlFor="new-block-type">Add Block</Label>
                  <Select value={newBlockType} onValueChange={setNewBlockType}>
                    <SelectTrigger id="new-block-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blockTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    {
                      blockTypeOptions.find((o) => o.value === newBlockType)
                        ?.description
                    }
                  </p>
                </div>
                <Button
                  type="button"
                  className="bg-cyan-700 hover:bg-cyan-600"
                  onClick={addBlock}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Block
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white px-6 py-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete Lesson'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lesson? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => void handleDelete()}
                  >
                    Delete Lesson
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="submit"
              className="bg-cyan-700 hover:bg-cyan-600"
              disabled={isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6 rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-mono text-lg font-semibold text-slate-900">
                Live Preview
              </h2>
              <p className="text-xs text-slate-500">
                Renders exactly like the learner view.
              </p>
            </div>
            <div className="p-6 max-h-[70vh] overflow-auto">
              <LessonContent
                content={derived.content}
                contentBlocks={blocks}
                lessonType={lessonType}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

function BlockCard({
  block,
  lessonId,
  onChange,
  onDelete,
}: {
  block: LessonBlock
  lessonId: string
  onChange: (patch: Record<string, unknown>) => void
  onDelete: () => void
}) {
  const dragControls = useDragControls()
  const type = block.type
  const typeMeta = blockTypeOptions.find((o) => o.value === type)
  const Icon = typeMeta?.icon || FileText

  return (
    <Reorder.Item
      as="div"
      value={block.id}
      dragListener={false}
      dragControls={dragControls}
      className="rounded-lg border border-slate-200 bg-white"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onPointerDown={(e) => {
            dragControls.start(e)
          }}
          className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
          aria-label="Reorder block"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 text-cyan-700" />
        <span className="font-mono text-sm font-semibold text-slate-900">
          {typeMeta?.label || type}
        </span>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
              aria-label="Delete block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete block</TooltipContent>
        </Tooltip>
      </div>

      <div className="p-4 space-y-4">
        {type === 'text' && (
          <div className="space-y-2">
            <Label>Markdown</Label>
            <Textarea
              value={typeof block.content === 'string' ? block.content : ''}
              onChange={(e) => {
                onChange({ content: e.target.value })
              }}
              rows={10}
              className="font-mono text-sm"
              placeholder="Write markdown..."
            />
          </div>
        )}

        {type === 'heading' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <select
                value={
                  typeof block.level === 'number' ? String(block.level) : '1'
                }
                onChange={(e) => {
                  onChange({ level: Number(e.target.value) })
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              >
                <option value="1">H2</option>
                <option value="2">H3</option>
                <option value="3">H4</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Text</Label>
              <Input
                value={typeof block.content === 'string' ? block.content : ''}
                onChange={(e) => {
                  onChange({ content: e.target.value })
                }}
                placeholder="Heading text..."
              />
            </div>
          </div>
        )}

        {type === 'image' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Image URL</Label>
              <Input
                value={typeof block.url === 'string' ? block.url : ''}
                onChange={(e) => {
                  onChange({ url: e.target.value })
                }}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Input
                value={typeof block.alt === 'string' ? block.alt : ''}
                onChange={(e) => {
                  onChange({ alt: e.target.value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Caption (optional)</Label>
              <Input
                value={typeof block.caption === 'string' ? block.caption : ''}
                onChange={(e) => {
                  onChange({ caption: e.target.value })
                }}
              />
            </div>
          </div>
        )}

        {type === 'video' && (
          <VideoUploader
            lessonId={lessonId}
            value={typeof block.url === 'string' ? block.url : ''}
            onChange={(url) => {
              onChange({ url })
            }}
          />
        )}

        {type === 'code' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={
                    typeof block.language === 'string' ? block.language : 'cpp'
                  }
                  onChange={(e) => {
                    onChange({ language: e.target.value })
                  }}
                  placeholder="cpp / js / ts / ..."
                />
              </div>
              <div className="space-y-2">
                <Label>Filename (optional)</Label>
                <Input
                  value={
                    typeof block.filename === 'string' ? block.filename : ''
                  }
                  onChange={(e) => {
                    onChange({ filename: e.target.value })
                  }}
                  placeholder="main.ino"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <CodeEditor
                initialCode={typeof block.code === 'string' ? block.code : ''}
                value={typeof block.code === 'string' ? block.code : ''}
                language={
                  typeof block.language === 'string' ? block.language : 'cpp'
                }
                filename={
                  typeof block.filename === 'string'
                    ? block.filename
                    : undefined
                }
                hideReset
                onChange={(next) => {
                  onChange({ code: next })
                }}
              />
            </div>
          </div>
        )}

        {type === 'callout' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variant</Label>
              <select
                value={
                  typeof block.variant === 'string' ? block.variant : 'info'
                }
                onChange={(e) => {
                  onChange({ variant: e.target.value })
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              >
                <option value="info">Info</option>
                <option value="tip">Tip</option>
                <option value="warning">Warning</option>
                <option value="danger">Danger</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Textarea
                value={typeof block.content === 'string' ? block.content : ''}
                onChange={(e) => {
                  onChange({ content: e.target.value })
                }}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </div>
        )}

        {type === 'download' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>URL</Label>
              <Input
                value={typeof block.url === 'string' ? block.url : ''}
                onChange={(e) => {
                  onChange({ url: e.target.value })
                }}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Filename</Label>
              <Input
                value={typeof block.filename === 'string' ? block.filename : ''}
                onChange={(e) => {
                  onChange({ filename: e.target.value })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={
                  typeof block.description === 'string' ? block.description : ''
                }
                onChange={(e) => {
                  onChange({ description: e.target.value })
                }}
              />
            </div>
          </div>
        )}

        {type === 'quiz' && <QuizEditor block={block} onChange={onChange} />}

        {type === 'interactive_code' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Input
                  value={
                    typeof block.language === 'string' ? block.language : 'cpp'
                  }
                  onChange={(e) => {
                    onChange({ language: e.target.value })
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Starter Code</Label>
              <CodeEditor
                initialCode={
                  typeof block.starterCode === 'string' ? block.starterCode : ''
                }
                value={
                  typeof block.starterCode === 'string' ? block.starterCode : ''
                }
                language={
                  typeof block.language === 'string' ? block.language : 'cpp'
                }
                filename="starter"
                hideReset
                onChange={(next) => {
                  onChange({ starterCode: next })
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Solution Code (optional)</Label>
              <CodeEditor
                initialCode={
                  typeof block.solutionCode === 'string'
                    ? block.solutionCode
                    : ''
                }
                value={
                  typeof block.solutionCode === 'string'
                    ? block.solutionCode
                    : ''
                }
                language={
                  typeof block.language === 'string' ? block.language : 'cpp'
                }
                filename="solution"
                hideReset
                onChange={(next) => {
                  onChange({ solutionCode: next })
                }}
              />
            </div>
          </div>
        )}

        {type === 'diagram' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Diagram blocks are stored as ReactFlow JSON in{' '}
              <span className="font-mono">flowData</span>.
            </p>
            <FlowEditor
              mode="diagram"
              value={isRecord(block.flowData) ? block.flowData : {}}
              onChange={(next) => {
                onChange({ flowData: next })
              }}
              height={420}
            />
            <details className="rounded border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer font-mono text-xs text-slate-600">
                Advanced: edit raw JSON
              </summary>
              <div className="mt-3 space-y-2">
                <Label>flowData</Label>
                <Textarea
                  value={JSON.stringify(
                    isRecord(block.flowData) ? block.flowData : {},
                    null,
                    2,
                  )}
                  onChange={(e) => {
                    try {
                      const parsed: unknown = JSON.parse(e.target.value)
                      if (typeof parsed === 'object' && parsed !== null) {
                        onChange({
                          flowData: parsed as Record<string, unknown>,
                        })
                      }
                    } catch {
                      // Ignore invalid JSON while typing.
                    }
                  }}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </details>
          </div>
        )}

        {type === 'visual_blocks' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Visual blocks challenges use a starter{' '}
              <span className="font-mono">flowData</span> and optional{' '}
              <span className="font-mono">solutionFlowData</span>.
            </p>
            <div className="space-y-2">
              <p className="font-mono text-xs text-slate-700">Starter Flow</p>
              <FlowEditor
                mode="visual"
                value={isRecord(block.flowData) ? block.flowData : {}}
                onChange={(next) => {
                  onChange({ flowData: next })
                }}
                height={520}
              />
            </div>

            <details className="rounded border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer font-mono text-xs text-slate-600">
                Solution (optional)
              </summary>
              <div className="mt-3 space-y-2">
                <p className="font-mono text-xs text-slate-700">
                  Solution Flow
                </p>
                <FlowEditor
                  mode="visual"
                  value={
                    isRecord(block.solutionFlowData)
                      ? block.solutionFlowData
                      : {}
                  }
                  onChange={(next) => {
                    onChange({ solutionFlowData: next })
                  }}
                  height={520}
                />
              </div>
            </details>
          </div>
        )}
      </div>
    </Reorder.Item>
  )
}

function QuizEditor({
  block,
  onChange,
}: {
  block: LessonBlock
  onChange: (patch: Record<string, unknown>) => void
}) {
  const question = typeof block.question === 'string' ? block.question : ''
  const options = Array.isArray(block.options)
    ? block.options.filter((o): o is string => typeof o === 'string')
    : ['']
  const correct = typeof block.correct === 'number' ? block.correct : 0
  const explanation =
    typeof block.explanation === 'string' ? block.explanation : ''

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Question</Label>
        <Input
          value={question}
          onChange={(e) => {
            onChange({ question: e.target.value })
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onChange({ options: [...options, ''] })
            }}
          >
            <Plus className="mr-2 h-3 w-3" />
            Add option
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const next = options.map((value, i) =>
                    i === idx ? e.target.value : value,
                  )
                  onChange({ options: next })
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onChange({ options: options.filter((_, i) => i !== idx) })
                    }}
                    aria-label="Remove option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove option</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Correct option</Label>
          <select
            value={String(correct)}
            onChange={(e) => {
              onChange({ correct: Number(e.target.value) })
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          >
            {options.map((_, i) => (
              <option key={i} value={String(i)}>
                Option {i + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Explanation (optional)</Label>
          <Input
            value={explanation}
            onChange={(e) => {
              onChange({ explanation: e.target.value })
            }}
          />
        </div>
      </div>
    </div>
  )
}
