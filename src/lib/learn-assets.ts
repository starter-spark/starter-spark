export type LearnAssetRef = {
  bucket: string
  path: string
}

const STORAGE_PROTOCOL = "storage:"
const LEARN_ASSET_BUCKET = "learn-assets"

export function toLearnAssetRef(bucket: string, path: string): string {
  const cleanBucket = bucket.trim()
  const cleanPath = path.replace(/^\/+/, "")
  return `storage://${cleanBucket}/${cleanPath}`
}

export function parseLearnAssetRef(value: string): LearnAssetRef | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== STORAGE_PROTOCOL) return null
    const bucket = url.hostname
    const path = url.pathname.replace(/^\/+/, "")
    if (!bucket || !path) return null
    return { bucket, path }
  } catch {
    return null
  }
}

function parseSupabaseLearnAssetUrl(value: string): LearnAssetRef | null {
  try {
    const url = new URL(value)
    const match = /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/.exec(
      url.pathname
    )
    if (!match) return null
    const bucket = match[1]
    if (bucket !== LEARN_ASSET_BUCKET) return null
    const path = match[2]
    return { bucket, path }
  } catch {
    return null
  }
}

export function normalizeLearnAssetValue(value: string): string {
  if (!value) return value

  if (value.startsWith("/api/learn/assets?")) return value

  const ref = parseLearnAssetRef(value)
  if (ref) return value

  const cleaned = value.replace(/^\/+/, "")
  if (cleaned.startsWith("lessons/")) {
    return toLearnAssetRef(LEARN_ASSET_BUCKET, cleaned)
  }

  const parsed = parseSupabaseLearnAssetUrl(value)
  if (parsed) {
    return toLearnAssetRef(parsed.bucket, parsed.path)
  }

  return value
}

export function resolveLearnAssetUrl(value: string): string {
  const normalized = normalizeLearnAssetValue(value)
  if (normalized.startsWith("/api/learn/assets?")) return normalized

  const ref = parseLearnAssetRef(normalized)
  if (!ref) return value
  const params = new URLSearchParams({
    bucket: ref.bucket,
    path: ref.path,
  })
  return `/api/learn/assets?${params.toString()}`
}
