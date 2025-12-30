/**
 * Content block types for rich custom pages (/p/[slug])
 * Based on the lesson_content content_blocks pattern
 */

export type PageBlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'callout'
  | 'code'
  | 'video'
  | 'faq'
  | 'cta_button'
  | 'divider'
  | 'stat_counter'

export type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger'
export type DividerStyle = 'line' | 'dots' | 'space'
export type ButtonVariant = 'primary' | 'secondary' | 'outline'
export type ButtonAlignment = 'left' | 'center' | 'right'

interface BaseBlock {
  id: string
  type: PageBlockType
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  level: 1 | 2 | 3
  content: string
  anchor?: string // Optional custom anchor for TOC linking
}

export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string // Markdown content
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
  width?: 'small' | 'medium' | 'large' | 'full' // Default: 'large'
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  variant: CalloutVariant
  title?: string
  content: string // Markdown content
}

export interface CodeBlock extends BaseBlock {
  type: 'code'
  language: string
  code: string
  filename?: string
  showLineNumbers?: boolean
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  url: string // YouTube, Vimeo, or direct video URL
  caption?: string
}

export interface FAQItem {
  question: string
  answer: string // Markdown content
}

export interface FAQBlock extends BaseBlock {
  type: 'faq'
  items: FAQItem[]
}

export interface CTAButtonBlock extends BaseBlock {
  type: 'cta_button'
  text: string
  url: string
  variant?: ButtonVariant // Default: 'primary'
  alignment?: ButtonAlignment // Default: 'left'
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  style?: DividerStyle // Default: 'line'
}

export interface StatItem {
  value: string
  label: string
}

export interface StatCounterBlock extends BaseBlock {
  type: 'stat_counter'
  stats: StatItem[]
}

export type PageBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | CalloutBlock
  | CodeBlock
  | VideoBlock
  | FAQBlock
  | CTAButtonBlock
  | DividerBlock
  | StatCounterBlock

/**
 * Extended page content with rich blocks
 */
export interface PageContentWithBlocks {
  id: string
  page_key: string
  title: string
  content: string // Legacy markdown content (fallback)
  content_blocks: PageBlock[] | null
  toc_enabled: boolean | null
  show_last_updated: boolean | null
  published_at: string | null
  updated_at: string | null
  version: number | null
  is_custom_page: boolean | null
  slug: string | null
  seo_title: string | null
  seo_description: string | null
}

/**
 * Type guard to check if content_blocks has valid blocks
 */
export function hasContentBlocks(
  page: PageContentWithBlocks,
): page is PageContentWithBlocks & { content_blocks: PageBlock[] } {
  return (
    Array.isArray(page.content_blocks) && page.content_blocks.length > 0
  )
}

/**
 * Extract headings from blocks for TOC generation
 */
export function extractHeadings(
  blocks: PageBlock[],
): Array<{ id: string; level: number; content: string; anchor: string }> {
  return blocks
    .filter((block): block is HeadingBlock => block.type === 'heading')
    .map((block) => ({
      id: block.id,
      level: block.level,
      content: block.content,
      anchor: block.anchor || generateAnchor(block.content),
    }))
}

/**
 * Generate an anchor from heading text
 */
export function generateAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(): string {
  return crypto.randomUUID()
}

/**
 * Create a new block with defaults
 */
export function createBlock(type: PageBlockType): PageBlock {
  const id = generateBlockId()

  switch (type) {
    case 'heading':
      return { id, type, level: 2, content: '' }
    case 'text':
      return { id, type, content: '' }
    case 'image':
      return { id, type, url: '', alt: '' }
    case 'callout':
      return { id, type, variant: 'info', content: '' }
    case 'code':
      return { id, type, language: 'plaintext', code: '' }
    case 'video':
      return { id, type, url: '' }
    case 'faq':
      return { id, type, items: [{ question: '', answer: '' }] }
    case 'cta_button':
      return { id, type, text: '', url: '' }
    case 'divider':
      return { id, type, style: 'line' }
    case 'stat_counter':
      return { id, type, stats: [{ value: '', label: '' }] }
  }
}
