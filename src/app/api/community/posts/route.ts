import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function formatUpstreamError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : (() => {
              try {
                return JSON.stringify(error)
              } catch {
                return String(error)
              }
            })()

  const message = raw.replace(/\s+/g, ' ').trim()
  if (!message) return 'Unknown error'
  if (/(<!doctype html|<html)/i.test(message)) return 'Upstream returned HTML'
  return message.length > 300 ? message.slice(0, 300) + '...' : message
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10),
  )
  const status = searchParams.get('status')
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')

  const supabase = await createClient()

  // Validate filters
  const allowedStatuses = new Set(['open', 'solved'])
  const statusFilter =
    status && allowedStatuses.has(status) ? status : undefined

  const tagFilter = (() => {
    if (!tag) return undefined
    const trimmed = tag.trim()
    if (!trimmed || trimmed.length > 40) return undefined
    return /^[\w\s-]+$/.test(trimmed) ? trimmed : undefined
  })()

  const searchQuery = q?.trim().slice(0, 120)

  try {
    // Build count query
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('status.eq.open,status.eq.solved')

    if (statusFilter) {
      countQuery = countQuery.eq('status', statusFilter)
    }
    if (tagFilter) {
      countQuery = countQuery.contains('tags', [tagFilter])
    }
    if (searchQuery) {
      countQuery = countQuery.ilike('title', `%${searchQuery}%`)
    }

    // Build data query
    let query = supabase
      .from('posts')
      .select(
        `
        id,
        slug,
        title,
        status,
        tags,
        upvotes,
        view_count,
        created_at,
        author:profiles!posts_author_id_fkey (
          id,
          full_name,
          email,
          role,
          avatar_url,
          avatar_seed
        ),
        product:products (
          id,
          name,
          slug
        ),
        comments (id)
      `,
      )
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (tagFilter) {
      query = query.contains('tags', [tagFilter])
    }
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`)
    }

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      query.range((page - 1) * limit, page * limit - 1),
    ])

    const totalCount = countResult.count || 0
    const posts = dataResult.data || []

    return NextResponse.json({
      posts,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    console.error('Error fetching posts:', formatUpstreamError(error))
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 },
    )
  }
}
