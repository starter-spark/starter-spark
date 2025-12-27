'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createAnswer } from '@/app/(marketing)/community/actions'
import { useRouter } from 'next/navigation'
import { Send, Code, Bold, Italic, Link as LinkIcon } from 'lucide-react'

interface AnswerFormProps {
  postId: string
}

export function AnswerForm({ postId }: AnswerFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('Please write an answer before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createAnswer({ postId, content })

      if (!result.success) {
        setError(
          result.error || 'Failed to post your answer. Please try again.',
        )
        return
      }

      setContent('')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Insert formatting helpers
  const insertFormatting = (before: string, after: string) => {
    const textarea = document.getElementById(
      'answer-content',
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

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length,
      )
    }, 0)
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-white border border-slate-200 rounded p-6"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            insertFormatting('**', '**')
          }}
          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-50 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            insertFormatting('*', '*')
          }}
          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-50 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            insertFormatting('`', '`')
          }}
          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-50 rounded transition-colors"
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            insertFormatting('\n```cpp\n', '\n```\n')
          }}
          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-50 rounded transition-colors text-xs font-mono"
          title="Code Block"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={() => {
            insertFormatting('[', '](url)')
          }}
          className="p-2 text-slate-500 hover:text-cyan-700 hover:bg-slate-50 rounded transition-colors"
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        id="answer-content"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
        }}
        placeholder="Write your answer..."
        rows={8}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-slate-700 placeholder:text-slate-500 focus:outline-none focus:border-cyan-700 focus:bg-white resize-y min-h-[150px]"
      />

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Hint */}
      <p className="mt-3 text-xs text-slate-500">
        Supports Markdown: **bold**, *italic*, `code`, ```code blocks```,
        [links](url)
      </p>

      {/* Submit */}
      <div className="flex justify-end mt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono disabled:opacity-50"
        >
          {isSubmitting ? (
            'Posting...'
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post Answer
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
