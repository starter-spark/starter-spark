import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { verifyVercelSignature } from '@/lib/vercel/drains'

const DEFAULT_MAX_BYTES = 5_000_000
const DEFAULT_AUTH_HEADER_NAME = 'x-starterspark-drains-token'

function isTruthy(value: string | undefined | null): boolean {
  if (!value) return false
  return (
    value === '1' ||
    value.toLowerCase() === 'true' ||
    value.toLowerCase() === 'yes'
  )
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export function shouldEnableVercelDrainsIngest(): boolean {
  const vercelEnv = process.env.VERCEL_ENV
  if (!vercelEnv) return true
  if (vercelEnv === 'production') return true
  return isTruthy(process.env.VERCEL_DRAINS_ALLOW_NON_PROD)
}

function getDrainAuthHeaderName(): string {
  return process.env.VERCEL_DRAINS_AUTH_HEADER_NAME ?? DEFAULT_AUTH_HEADER_NAME
}

type GuardResult =
  | { ok: true; body: Buffer; contentType: string }
  | { ok: false; response: NextResponse }

export async function guardVercelDrainRequest(
  request: Request,
  options: {
    secret: string | undefined
    allowedContentType?: RegExp
    maxBytes?: number
    requireAuthHeader?: boolean
  },
): Promise<GuardResult> {
  if (!shouldEnableVercelDrainsIngest()) {
    return { ok: false, response: new NextResponse(null, { status: 404 }) }
  }

  const secret = options.secret
  if (!secret) {
    return { ok: false, response: new NextResponse(null, { status: 404 }) }
  }

  if (options.requireAuthHeader) {
    const token = process.env.VERCEL_DRAINS_AUTH_TOKEN
    if (!token) {
      return { ok: false, response: new NextResponse(null, { status: 404 }) }
    }

    const headerName = getDrainAuthHeaderName()
    const provided = request.headers.get(headerName)?.trim() ?? ''
    if (!provided || !timingSafeEqualString(provided, token)) {
      return { ok: false, response: new NextResponse(null, { status: 404 }) }
    }
  }

  const signatureHeader = request.headers.get('x-vercel-signature')
  if (!signatureHeader) {
    return { ok: false, response: new NextResponse(null, { status: 401 }) }
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const contentType = request.headers.get('content-type') ?? ''

  if (
    options.allowedContentType &&
    contentType &&
    !options.allowedContentType.test(contentType)
  ) {
    return { ok: false, response: new NextResponse(null, { status: 415 }) }
  }

  const lengthHeader = request.headers.get('content-length')
  if (lengthHeader) {
    const length = Number(lengthHeader)
    if (Number.isFinite(length) && length > maxBytes) {
      return { ok: false, response: new NextResponse(null, { status: 413 }) }
    }
  }

  const body = Buffer.from(await request.arrayBuffer())
  if (body.length > maxBytes) {
    return { ok: false, response: new NextResponse(null, { status: 413 }) }
  }

  const ok = verifyVercelSignature({ body, signatureHeader, secret })
  if (!ok) {
    return { ok: false, response: new NextResponse(null, { status: 401 }) }
  }

  return { ok: true, body, contentType }
}
