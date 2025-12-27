import type { ComponentPropsWithoutRef } from 'react'
import type { Components } from 'react-markdown'
import { isExternalHref, sanitizeMarkdownUrl } from '@/lib/safe-url'
import { cn } from '@/lib/utils'

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

  const H2 = ({ children, className }: ComponentPropsWithoutRef<'h2'>) => (
    <h3 className={cn(styles.h2, className)}>{children}</h3>
  )

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

  return {
    a: Link,
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
