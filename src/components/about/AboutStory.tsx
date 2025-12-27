'use client'

import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { safeMarkdownUrlTransform } from '@/lib/safe-url'
import { createMarkdownComponents } from '@/components/markdown/markdown-components'

const placeholderClassName = 'space-y-6'
const markdownClassName =
  'prose prose-slate prose-lg max-w-none prose-headings:font-mono prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-cyan-700 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-cyan-700 prose-blockquote:bg-slate-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:text-slate-600'
const linkClassName = 'text-cyan-700 hover:underline'
const headingOneClassName = 'text-2xl font-mono text-slate-900 mt-6 mb-4'
const headingTwoClassName = 'text-xl font-mono text-slate-900 mt-5 mb-3'

const markdownComponents = createMarkdownComponents({
  link: linkClassName,
  h1: headingOneClassName,
  h2: headingTwoClassName,
})

interface AboutStoryProps {
  content?: string
  isPlaceholder?: boolean
}

export function AboutStory({
  content = '',
  isPlaceholder = false,
}: AboutStoryProps) {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-mono text-3xl text-slate-900 mb-2">Our Story</h2>
          <div className="w-16 h-1 bg-cyan-700" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className={isPlaceholder ? placeholderClassName : markdownClassName}
        >
          {isPlaceholder ? (
            // Render placeholder paragraphs
            content.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className="p-4 bg-slate-50 rounded border border-slate-200 font-mono text-sm text-slate-500"
              >
                PLACEHOLDER: {paragraph}
              </p>
            ))
          ) : (
            // Render markdown content
            <ReactMarkdown
              urlTransform={safeMarkdownUrlTransform}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          )}
        </motion.div>
      </div>
    </section>
  )
}
