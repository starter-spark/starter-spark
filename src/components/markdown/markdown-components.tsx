import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import type { Components } from 'react-markdown'
import { isExternalHref, sanitizeMarkdownUrl } from '@/lib/safe-url'
import { cn } from '@/lib/utils'

// Extract text content from React children for generating IDs
function getTextContent(children: ReactNode): string {
  let text = ''
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += child
    } else if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      text += getTextContent(child.props.children)
    }
  })
  return text
}

// Generate anchor ID from text
function generateAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

type MarkdownComponentStyles = {
  link?: string
  h1?: string
  h2?: string
  h3?: string
  p?: string
  ul?: string
  ol?: string
  li?: string
  strong?: string
  blockquote?: string
}

export function createMarkdownComponents(
  styles: MarkdownComponentStyles,
  overrides: Components = {},
): Components {
  const Link = ({
    href,
    children,
    className,
    ...rest
  }: ComponentPropsWithoutRef<'a'>) => {
    const safeHref = sanitizeMarkdownUrl(href, 'href')
    if (!safeHref) return <span>{children}</span>
    const external = isExternalHref(safeHref)
    return (
      <a
        href={safeHref}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={cn(styles.link, className)}
        {...rest}
      >
        {children}
      </a>
    )
  }

  const H1 = ({ children, className }: ComponentPropsWithoutRef<'h1'>) => (
    <h2 className={cn(styles.h1, className)}>{children}</h2>
  )

  const H2 = ({ children, className }: ComponentPropsWithoutRef<'h2'>) => {
    const text = getTextContent(children)
    const id = generateAnchor(text)
    return (
      <h3 id={id} className={cn(styles.h2, 'scroll-mt-24', className)}>
        {children}
      </h3>
    )
  }

  const H3 = ({ children, className }: ComponentPropsWithoutRef<'h3'>) => (
    <h4 className={cn(styles.h3, className)}>{children}</h4>
  )

  const P = ({ children, className }: ComponentPropsWithoutRef<'p'>) => (
    <p className={cn(styles.p, className)}>{children}</p>
  )

  const Ul = ({ children, className }: ComponentPropsWithoutRef<'ul'>) => (
    <ul className={cn(styles.ul, className)}>{children}</ul>
  )

  const Ol = ({ children, className }: ComponentPropsWithoutRef<'ol'>) => (
    <ol className={cn(styles.ol, className)}>{children}</ol>
  )

  const Li = ({ children, className }: ComponentPropsWithoutRef<'li'>) => (
    <li className={cn(styles.li, className)}>{children}</li>
  )

  const Strong = ({
    children,
    className,
  }: ComponentPropsWithoutRef<'strong'>) => (
    <strong className={cn(styles.strong, className)}>{children}</strong>
  )

  const Blockquote = ({
    children,
    className,
  }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className={cn(styles.blockquote, className)}>
      {children}
    </blockquote>
  )

  // GFM tables, scrollable on narrow screens
  const Table = ({ children, className }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 overflow-x-auto rounded border border-slate-200">
      <table className={cn('w-full border-collapse text-sm [&_tr:last-child_td]:border-b-0', className)}>
        {children}
      </table>
    </div>
  )

  const Th = ({ children, className, style }: ComponentPropsWithoutRef<'th'>) => (
    <th
      style={style}
      className={cn(
        'border-b border-slate-200 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-900',
        className,
      )}
    >
      {children}
    </th>
  )

  const Td = ({ children, className, style }: ComponentPropsWithoutRef<'td'>) => (
    <td
      style={style}
      className={cn(
        'border-b border-slate-100 px-4 py-2 align-top text-slate-700',
        className,
      )}
    >
      {children}
    </td>
  )

  return {
    a: Link,
    table: Table,
    th: Th,
    td: Td,
    h1: H1,
    h2: H2,
    h3: H3,
    p: P,
    ul: Ul,
    ol: Ol,
    li: Li,
    strong: Strong,
    blockquote: Blockquote,
    ...overrides,
  }
}
