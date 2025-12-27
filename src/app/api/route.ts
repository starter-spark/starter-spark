import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    {
      headers: {
        'Content-Security-Policy':
          "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      },
    },
  )
}
