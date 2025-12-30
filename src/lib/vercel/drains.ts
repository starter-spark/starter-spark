import crypto from 'crypto'

export function verifyVercelSignature(options: {
  body: Buffer
  signatureHeader: string | null
  secret: string
}): boolean {
  const signature = options.signatureHeader?.trim()
  if (!signature) return false

  const expected = crypto
    .createHmac('sha1', options.secret)
    .update(options.body)
    .digest('hex')

  const signatureBuf = Buffer.from(signature, 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  if (signatureBuf.length !== expectedBuf.length) return false

  return crypto.timingSafeEqual(signatureBuf, expectedBuf)
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

