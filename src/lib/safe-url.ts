export type MarkdownUrlKey = "href" | "src"

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if ((code >= 0 && code < 0x20) || code === 0x7f) return true
  }
  return false
}

function hasUnsafeChars(value: string): boolean {
  return value.includes("\\") || hasControlChars(value)
}

function normalizeUrlInput(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Reject control chars and backslashes (common obfuscation / parsing differences)
  if (hasUnsafeChars(trimmed)) return null
  return trimmed
}

function isRelativeUrl(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("#") ||
    value.startsWith("?")
  )
}

function hasScheme(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)
}

function isSafeImageDataUrl(value: string): boolean {
  // Only allow base64-encoded raster images (no SVG).
  return /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(value)
}

function allowlistedSchemeUrl(url: string, key: MarkdownUrlKey): string | null {
  const lower = url.toLowerCase()

  if (key === "href" && (lower.startsWith("mailto:") || lower.startsWith("tel:"))) {
    return url
  }

  if (lower.startsWith("http:") || lower.startsWith("https:")) return url

  if (key !== "src") return null
  if (lower.startsWith("blob:")) return url
  if (lower.startsWith("data:")) {
    return isSafeImageDataUrl(url) ? url : null
  }

  return null
}

export function sanitizeMarkdownUrl(value: unknown, key: MarkdownUrlKey): string | null {
  const url = normalizeUrlInput(value)
  if (!url) return null

  // Disallow protocol-relative URLs (`//example.com`) to avoid ambiguity.
  if (url.startsWith("//")) return null

  // Allow site-relative and in-page links.
  if (isRelativeUrl(url)) return url
  // If it has a scheme, allowlist explicitly.
  if (hasScheme(url)) return allowlistedSchemeUrl(url, key)

  // Scheme-less URLs like `www.example.com` are treated as relative by the browser.
  // Keep them (non-executable) rather than guessing protocols.
  return url
}

export function safeMarkdownUrlTransform(url: string, key: string): string {
  const urlKey: MarkdownUrlKey = key === "src" ? "src" : "href"
  return sanitizeMarkdownUrl(url, urlKey) ?? ""
}

export function isExternalHref(href: string): boolean {
  const lower = href.toLowerCase()
  return lower.startsWith("http:") || lower.startsWith("https:")
}
