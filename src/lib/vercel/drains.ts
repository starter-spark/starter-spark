import crypto from 'crypto'

function extractSha1HexCandidates(signatureHeader: string | null): string[] {
  const raw = signatureHeader?.trim()
  if (!raw) return []

  const matches = raw.match(/[a-f0-9]{40}/gi) ?? []
  const candidates = new Set(matches.map((m) => m.toLowerCase()))
  if (/^[a-f0-9]{40}$/i.test(raw)) candidates.add(raw.toLowerCase())

  return Array.from(candidates)
}

export function verifyVercelSignature(options: {
  body: Buffer
  signatureHeader: string | null
  secret: string
}): boolean {
  const expected = crypto
    .createHmac('sha1', options.secret)
    .update(options.body)
    .digest('hex')

  const expectedBuf = Buffer.from(expected, 'utf8')

  for (const candidate of extractSha1HexCandidates(options.signatureHeader)) {
    const signatureBuf = Buffer.from(candidate, 'utf8')
    if (signatureBuf.length !== expectedBuf.length) continue
    if (crypto.timingSafeEqual(signatureBuf, expectedBuf)) return true
  }

  return false
}

export function parseJsonOrNdjson(text: string): unknown[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  try {
    const parsed: unknown = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    // Fall through to NDJSON.
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  const events: unknown[] = []
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as unknown)
    } catch {
      // Ignore invalid lines.
    }
  }
  return events
}

export function stableEventId(parts: Array<string | number | null | undefined>) {
  const input = parts.map((p) => (p === null || p === undefined ? '' : String(p))).join('|')
  return crypto.createHash('sha256').update(input).digest('hex')
}
