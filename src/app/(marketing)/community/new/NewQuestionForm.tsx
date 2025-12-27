'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createPost } from '@/app/(marketing)/community/actions'
import { useRouter } from 'next/navigation'
import {
  Send,
  Code,
  Bold,
  Italic,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
}

interface NewQuestionFormProps {
  products: Product[]
}

// Common tags for suggestions
const SUGGESTED_TAGS = [
  'hardware',
  'code',
  'assembly',
  'troubleshooting',
  'servos',
  'arduino',
  'wiring',
  'calibration',
  'showcase',
  'tips',
]

export function NewQuestionForm({ products }: NewQuestionFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [productId, setProductId] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Please enter a title for your question.')
      return
    }

    if (title.trim().length < 10) {
      setError('Title should be at least 10 characters long.')
      return
    }

    if (!content.trim()) {
      setError('Please describe your question in detail.')
      return
    }

    if (content.trim().length < 30) {
      setError(
        'Please provide more detail about your question (at least 30 characters).',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createPost({
        title,
        content,
        productId,
        tags: selectedTags,
      })

      if (!result.success) {
        setError(
          result.error || 'Failed to post your question. Please try again.',
        )
        return
      }

      router.push(`/community/${result.postId}`)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // Insert formatting helpers
  const insertFormatting = (before: string, after: string) => {
    const textarea = document.getElementById(
      'question-content',
    ) as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end)
    const newContent =
      content.slice(0, start) +
      before +
      selectedText +
      after +
      content.slice(end)

    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      )
    }, 0)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-mono text-slate-700 mb-2"
        >
          Title
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
          placeholder="What's your question? Be specific."
          className="bg-white border-slate-200 focus:border-cyan-700"
          maxLength={200}
        />
        <p className="mt-1 text-xs text-slate-500">
          {title.length}/200 characters
        </p>
      </div>

      {/* Product */}
      <div>
        <label
          htmlFor="product"
          className="block text-sm font-mono text-slate-700 mb-2"
        >
          Related Product (optional)
        </label>
        <select
          id="product"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value)
          }}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm text-slate-700 focus:border-cyan-700 focus:outline-none"
        >
          <option value="">Select a product...</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-mono text-slate-700 mb-2">
          Tags (select up to 5)
        </label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                toggleTag(tag)
              }}
              className={`cursor-pointer px-3 py-1 text-sm font-mono rounded transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-cyan-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-cyan-100 hover:text-cyan-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="question-content"
          className="block text-sm font-mono text-slate-700 mb-2"
        >
          Details
        </label>

        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 border border-b-0 border-slate-200 rounded-t">
          <button
            type="button"
            onClick={() => {
              insertFormatting('**', '**')
            }}
            className="cursor-pointer p-2 text-slate-500 hover:text-cyan-700 hover:bg-white rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              insertFormatting('*', '*')
            }}
            className="cursor-pointer p-2 text-slate-500 hover:text-cyan-700 hover:bg-white rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              insertFormatting('`', '`')
            }}
            className="cursor-pointer p-2 text-slate-500 hover:text-cyan-700 hover:bg-white rounded transition-colors"
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              insertFormatting('\n```cpp\n', '\n```\n')
            }}
            className="cursor-pointer p-2 text-slate-500 hover:text-cyan-700 hover:bg-white rounded transition-colors text-xs font-mono"
            title="Code Block"
          >
            {'</>'}
          </button>
          <button
            type="button"
            onClick={() => {
              insertFormatting('[', '](url)')
            }}
            className="cursor-pointer p-2 text-slate-500 hover:text-cyan-700 hover:bg-white rounded transition-colors"
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        <textarea
          id="question-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
          }}
          placeholder="Describe your question in detail...

Include:
• What you're trying to do
• What you've already tried
• Any error messages you're seeing
• Relevant code snippets

The more detail you provide, the better we can help!"
          rows={12}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-b text-slate-700 placeholder:text-slate-500 focus:outline-none focus:border-cyan-700 resize-y min-h-[250px]"
        />

        <p className="mt-1 text-xs text-slate-500">
          Supports Markdown: **bold**, *italic*, `code`, ```code blocks```,
          [links](url)
        </p>
      </div>

      {/* Tips */}
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-cyan-700 mt-0.5" />
          <div className="text-sm text-cyan-900">
            <p className="font-medium mb-2">Tips for a great question:</p>
            <ul className="space-y-1 text-cyan-800">
              <li>• Search first to see if your question has been answered</li>
              <li>• Use a clear, specific title</li>
              <li>• Include relevant code snippets with proper formatting</li>
              <li>• Describe what you expected vs. what happened</li>
              <li>• Add relevant tags to help others find your question</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            router.back()
          }}
          className="border-slate-200 text-slate-600 hover:text-slate-900"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono disabled:opacity-50"
        >
          {isSubmitting ? (
            'Posting...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post Question
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
