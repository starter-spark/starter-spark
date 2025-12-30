/**
 * Health check endpoint for load balancers and monitoring.
 *
 * This endpoint returns a simple JSON response without streaming,
 * which avoids the Node.js TransformStream bug that can occur when
 * health checkers close connections mid-stream.
 *
 * @see https://github.com/vercel/next.js/discussions/75995
 */
export function GET() {
  return Response.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  )
}

// Force static to avoid streaming
export const dynamic = 'force-static'
