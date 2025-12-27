import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * RFC 2324, Hyper Text Coffee Pot Control Protocol (HTCPCP/1.0)
 *
 * Any attempt to brew coffee with a teapot should result in the error code
 * "418 I'm a teapot". The resulting entity body MAY be short and stout.
 *
 * API calls are tracked in teapot_stats table (separate from site_stats).
 */

async function trackApiCall(): Promise<number> {
  try {
    const supabase = await createClient()

    // Increment API call counter and return new count
    const { data, error } = await supabase.rpc('increment_teapot_api_calls')

    if (error) {
      // Fallback: just get current count
      const { data: statsData } = await supabase
        .from('teapot_stats')
        .select('value')
        .eq('key', 'api_calls')
        .single()
      return statsData?.value ?? 0
    }

    return data ?? 0
  } catch {
    return 0
  }
}

export async function GET(request: Request) {
  // Rate limit to prevent spam
  const rateLimitResponse = await rateLimit(request, 'teapot')
  if (rateLimitResponse) return rateLimitResponse

  // Track this API call
  const apiCalls = await trackApiCall()

  return NextResponse.json(
    {
      error: "I'm a teapot",
      status: 418,
      message:
        'The server refuses to brew coffee because it is, permanently, a teapot.',
      tip: 'Try tipping me over and pouring me out instead.',
      rfc: 'https://datatracker.ietf.org/doc/html/rfc2324',
      api_calls: apiCalls,
    },
    {
      status: 418,
      statusText: "I'm a teapot",
      headers: {
        'X-Teapot': 'short-and-stout',
        'X-Teapot-API-Calls': apiCalls.toString(),
      },
    },
  )
}

export async function POST(request: Request) {
  // Rate limit to prevent spam
  const rateLimitResponse = await rateLimit(request, 'teapot')
  if (rateLimitResponse) return rateLimitResponse

  // Track this API call
  const apiCalls = await trackApiCall()

  return NextResponse.json(
    {
      error: "I'm a teapot",
      status: 418,
      message:
        'You cannot BREW coffee with a teapot. This is not a HTCPCP compliant coffee pot.',
      api_calls: apiCalls,
    },
    {
      status: 418,
      statusText: "I'm a teapot",
      headers: {
        'X-Teapot-API-Calls': apiCalls.toString(),
      },
    },
  )
}
