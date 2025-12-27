import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isUuid } from '@/lib/uuid'
import { rateLimit } from '@/lib/rate-limit'

const ALLOWED_BUCKETS = new Set(['learn-assets'])
const ALLOWED_PREFIXES = new Set(['video', 'image', 'download'])

function cleanPath(value: string): string {
  return value.replace(/^\/+/, '').replaceAll('\\', '/')
}

function parseLessonIdFromPath(path: string): string | null {
  const parts = path.split('/')
  if (parts.length < 3) return null
  if (parts[0] !== 'lessons') return null
  const lessonId = parts[1]
  if (!isUuid(lessonId)) return null
  const assetType = parts[2]
  if (!ALLOWED_PREFIXES.has(assetType)) return null
  return lessonId
}

function isSafeStoragePath(path: string): boolean {
  if (!path) return false
  if (path.length > 800) return false
  if (path.includes('..')) return false
  if (path.includes('\u0000')) return false
  if (path.startsWith('/')) return false
  return Boolean(parseLessonIdFromPath(path))
}

async function signLearnAsset(
  bucket: string,
  path: string,
): Promise<NextResponse> {
  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60) // 1 hour

  if (signError || !signedData) {
    console.error('Learn asset signing error:', signError)
    return NextResponse.json({ error: 'Failed to sign asset' }, { status: 500 })
  }

  const response = NextResponse.redirect(signedData.signedUrl, 307)
  response.headers.set('Cache-Control', 'private, max-age=300')
  response.headers.set('Vary', 'Cookie')
  return response
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, 'learnAsset')
  if (rateLimitResponse) return rateLimitResponse

  const url = new URL(request.url)
  const bucket = url.searchParams.get('bucket')
  const rawPath = url.searchParams.get('path')

  if (!bucket || !rawPath) {
    return NextResponse.json(
      { error: 'Missing bucket or path' },
      { status: 400 },
    )
  }

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const path = cleanPath(rawPath)
  if (!isSafeStoragePath(path)) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 })
  }

  const lessonId = parseLessonIdFromPath(path)
  if (!lessonId) {
    return NextResponse.json(
      { error: 'Invalid lesson asset path' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Learn asset profile lookup error:', profileError)
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 },
    )
  }

  const role = (profile as { role?: string } | null)?.role
  const isStaff = role === 'admin' || role === 'staff'

  if (isStaff) {
    return signLearnAsset(bucket, path)
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(
      `
      id,
      is_published,
      module:modules (
        is_published,
        course:courses (
          id,
          is_published,
          product_id
        )
      )
    `,
    )
    .eq('id', lessonId)
    .maybeSingle()

  if (lessonError) {
    console.error('Learn asset lesson lookup error:', lessonError)
    return NextResponse.json(
      { error: 'Failed to load lesson' },
      { status: 500 },
    )
  }

  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const moduleRow = lesson.module as unknown as {
    is_published: boolean | null
    course: {
      id: string
      is_published: boolean | null
      product_id: string
    } | null
  } | null

  const courseRow = moduleRow?.course
  if (!courseRow) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (!isStaff) {
    if (
      lesson.is_published !== true ||
      moduleRow?.is_published !== true ||
      courseRow.is_published !== true
    ) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: licenses, error: licenseError } = await supabase
      .from('licenses')
      .select('id')
      .eq('owner_id', user.id)
      .eq('product_id', courseRow.product_id)
      .limit(1)

    if (licenseError) {
      console.error('Learn asset license check error:', licenseError)
      return NextResponse.json(
        { error: 'Failed to verify access' },
        { status: 500 },
      )
    }

    if (!licenses || licenses.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return signLearnAsset(bucket, path)
}
