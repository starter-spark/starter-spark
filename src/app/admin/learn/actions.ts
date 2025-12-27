'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Json } from '@/lib/supabase/database.types'
import { requireAdminOrStaff } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit'
import crypto from 'node:crypto'

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '')
}

// Generate unique slug by checking for existing slugs and appending suffix if needed
async function generateUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'lessons' | 'modules' | 'courses',
  parentColumn: string | null,
  parentId: string | null,
  baseSlug: string,
): Promise<string> {
  // First check if base slug is available
  let query = supabase.from(table).select('slug').eq('slug', baseSlug)
  if (parentColumn && parentId) {
    query = query.eq(parentColumn, parentId)
  }

  const { data: existing } = await query.maybeSingle()
  if (!existing) return baseSlug

  // Slug exists, find a unique one by appending numbers
  let suffix = 2
  while (suffix < 100) {
    const candidateSlug = `${baseSlug}-${suffix}`
    let checkQuery = supabase
      .from(table)
      .select('slug')
      .eq('slug', candidateSlug)
    if (parentColumn && parentId) {
      checkQuery = checkQuery.eq(parentColumn, parentId)
    }

    const { data: check } = await checkQuery.maybeSingle()
    if (!check) return candidateSlug
    suffix++
  }

  // Fallback to random suffix if somehow we have 100+ duplicates
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
}

function safeJsonArray(
  value: string,
  label: string,
): { ok: true; value: Json[] } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed))
      return { ok: false, error: `${label} must be a JSON array` }
    return { ok: true, value: parsed as unknown as Json[] }
  } catch {
    return { ok: false, error: `${label} is not valid JSON` }
  }
}

// Course actions
export async function createCourse(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) throw new Error(guard.error)
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const productId = formData.get('product_id') as string
  const difficulty = formData.get('difficulty') as string
  const durationMinutes =
    Number.parseInt(formData.get('duration_minutes') as string) || 0

  if (!title || !productId) {
    throw new Error('Title and product are required')
  }

  const baseSlug = generateSlug(title)
  if (!baseSlug) {
    throw new Error('Course title must contain letters or numbers')
  }

  // Generate unique slug (courses have global unique constraint on slug)
  const slug = await generateUniqueSlug(
    supabase,
    'courses',
    null,
    null,
    baseSlug,
  )

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      slug,
      description,
      product_id: productId,
      difficulty: difficulty || 'beginner',
      duration_minutes: durationMinutes,
      is_published: false,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error creating course:', error)
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Failed to create course')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'course.created',
    resourceType: 'course',
    resourceId: data.id,
    details: {
      title,
      slug,
      product_id: productId,
      difficulty: difficulty || 'beginner',
    },
  })

  revalidatePath('/admin/learn')
  redirect(`/admin/learn/${data.id}`)
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const difficulty = formData.get('difficulty') as string
  const durationMinutes =
    Number.parseInt(formData.get('duration_minutes') as string) || 0
  const isPublished = formData.get('is_published') === 'true'

  if (!title) return { error: 'Title is required' }
  const slug = generateSlug(title)
  if (!slug) return { error: 'Title must contain letters or numbers' }

  const { data: updated, error } = await supabase
    .from('courses')
    .update({
      title,
      slug,
      description,
      difficulty,
      duration_minutes: durationMinutes,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error updating course:', error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: 'Course not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'course.updated',
    resourceType: 'course',
    resourceId: courseId,
    details: {
      title,
      slug,
      difficulty,
      duration_minutes: durationMinutes,
      is_published: isPublished,
    },
  })

  revalidatePath('/admin/learn')
  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: deleted, error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .select('id, title, slug')
    .maybeSingle()

  if (error) {
    console.error('Error deleting course:', error)
    return { error: error.message }
  }

  if (!deleted) {
    return { error: 'Course not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'course.deleted',
    resourceType: 'course',
    resourceId: deleted.id,
    details: {
      title: deleted.title,
      slug: deleted.slug,
    },
  })

  revalidatePath('/admin/learn')
  redirect('/admin/learn')
}

// Module actions
export async function createModule(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string

  if (!title) {
    return { error: 'Title is required' }
  }

  // Get the highest sort_order for this course
  const { data: existingModules, error: sortError } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (sortError) {
    console.error('Error fetching module sort order:', sortError)
    return { error: 'Failed to create module' }
  }

  const nextSortOrder =
    existingModules?.[0]?.sort_order === undefined
      ? 0
      : existingModules[0].sort_order + 1

  const baseSlug = generateSlug(title)
  if (!baseSlug) {
    return { error: 'Title must contain letters or numbers' }
  }

  // Generate unique slug within this course
  const slug = await generateUniqueSlug(
    supabase,
    'modules',
    'course_id',
    courseId,
    baseSlug,
  )

  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      slug,
      description,
      icon: icon || null,
      sort_order: nextSortOrder,
      is_published: true,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error creating module:', error)
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Failed to create module' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'module.created',
    resourceType: 'module',
    resourceId: data.id,
    details: {
      title,
      slug,
      course_id: courseId,
      icon: icon || null,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true, moduleId: data.id }
}

export async function updateModule(
  moduleId: string,
  courseId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const isPublished = formData.get('is_published') === 'true'

  const slug = generateSlug(title)
  if (!title) return { error: 'Title is required' }
  if (!slug) return { error: 'Title must contain letters or numbers' }

  const { data: updated, error } = await supabase
    .from('modules')
    .update({
      title,
      slug,
      description,
      icon: icon || null,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    })
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error updating module:', error)
    return { error: error.message }
  }

  if (!updated) {
    return { error: 'Module not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'module.updated',
    resourceType: 'module',
    resourceId: moduleId,
    details: {
      title,
      slug,
      course_id: courseId,
      icon: icon || null,
      is_published: isPublished,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

export async function deleteModule(moduleId: string, courseId: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: deleted, error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .select('id, title, slug')
    .maybeSingle()

  if (error) {
    console.error('Error deleting module:', error)
    return { error: error.message }
  }

  if (!deleted) {
    return { error: 'Module not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'module.deleted',
    resourceType: 'module',
    resourceId: deleted.id,
    details: {
      title: deleted.title,
      slug: deleted.slug,
      course_id: courseId,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

export async function reorderModules(courseId: string, moduleIds: string[]) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const uniqueIds = new Set(moduleIds)
  if (uniqueIds.size !== moduleIds.length) {
    return { error: 'Invalid module order' }
  }

  const { data: existingModules, error: verifyError } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)

  if (verifyError) {
    console.error('Error validating module order:', verifyError)
    return { error: 'Failed to reorder modules' }
  }

  const existingIds = new Set((existingModules ?? []).map((m) => m.id))
  if (existingIds.size !== moduleIds.length) {
    return { error: 'Invalid module order' }
  }

  for (const id of moduleIds) {
    if (!existingIds.has(id)) return { error: 'Invalid module order' }
  }

  if (moduleIds.length === 0) {
    revalidatePath(`/admin/learn/${courseId}`)
    return { success: true }
  }

  // Update each module's sort_order
  const updates = moduleIds.map((id, index) =>
    supabase
      .from('modules')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('course_id', courseId),
  )

  const results = await Promise.all(updates)
  const errors = results.filter((r) => r.error)

  if (errors.length > 0) {
    console.error('Error reordering modules:', errors)
    return { error: 'Failed to reorder modules' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'module.reordered',
    resourceType: 'module',
    details: {
      course_id: courseId,
      module_ids: moduleIds,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

// Lesson actions
export async function createLesson(
  moduleId: string,
  courseId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const lessonType = (formData.get('lesson_type') as string) || 'content'

  if (!title) {
    return { error: 'Title is required' }
  }

  // Get the highest sort_order for this module
  const { data: existingLessons, error: sortError } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (sortError) {
    console.error('Error fetching lesson sort order:', sortError)
    return { error: 'Failed to create lesson' }
  }

  const nextSortOrder =
    existingLessons?.[0]?.sort_order === undefined
      ? 0
      : existingLessons[0].sort_order + 1

  const baseSlug = generateSlug(title)
  if (!baseSlug) {
    return { error: 'Title must contain letters or numbers' }
  }

  // Generate unique slug within this module
  const slug = await generateUniqueSlug(
    supabase,
    'lessons',
    'module_id',
    moduleId,
    baseSlug,
  )

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      slug,
      description,
      lesson_type: lessonType,
      sort_order: nextSortOrder,
      is_published: true,
      difficulty: 'beginner',
      estimated_minutes: 15,
    })
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Error creating lesson:', error)
    return { error: error.message }
  }

  if (!data) {
    return { error: 'Failed to create lesson' }
  }

  const { error: contentError } = await supabase.from('lesson_content').insert({
    lesson_id: data.id,
    content: '',
    content_blocks: [],
    downloads: [],
  })
  if (contentError) {
    console.error('Error creating lesson content:', contentError)
    await supabase.from('lessons').delete().eq('id', data.id)
    return { error: contentError.message }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'lesson.created',
    resourceType: 'lesson',
    resourceId: data.id,
    details: {
      title,
      slug,
      lesson_type: lessonType,
      module_id: moduleId,
      course_id: courseId,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true, lessonId: data.id }
}

export async function updateLesson(
  lessonId: string,
  courseId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const content = (formData.get('content') as string) || ''
  const lessonType = (formData.get('lesson_type') as string) || 'content'
  const difficulty = (formData.get('difficulty') as string) || 'beginner'
  const estimatedMinutes =
    Number.parseInt(formData.get('estimated_minutes') as string) || 15
  const isPublished = formData.get('is_published') === 'true'
  const isOptional = formData.get('is_optional') === 'true'
  const videoUrl = formData.get('video_url') as string
  const codeStarter = formData.get('code_starter') as string
  const codeSolution = formData.get('code_solution') as string
  const prerequisitesRaw = formData.get('prerequisites') as string

  const contentBlocksRaw = formData.get('content_blocks') as string
  let contentBlocks: Json[] = []
  if (contentBlocksRaw) {
    const parsed = safeJsonArray(contentBlocksRaw, 'Content blocks')
    if (!parsed.ok) return { error: parsed.error }
    contentBlocks = parsed.value
  }

  let prerequisites: string[] | null = null
  if (prerequisitesRaw) {
    try {
      const parsed: unknown = JSON.parse(prerequisitesRaw)
      const isStringArray = (value: unknown): value is string[] =>
        Array.isArray(value) && value.every((v) => typeof v === 'string')
      if (isStringArray(parsed)) prerequisites = parsed
    } catch {
      return { error: 'Prerequisites is not valid JSON' }
    }
  }

  const slug = generateSlug(title)
  if (!title) return { error: 'Title is required' }
  if (!slug) return { error: 'Title must contain letters or numbers' }

  const { data: updatedLesson, error: metaError } = await supabase
    .from('lessons')
    .update({
      title,
      slug,
      description,
      lesson_type: lessonType,
      difficulty,
      estimated_minutes: estimatedMinutes,
      is_published: isPublished,
      is_optional: isOptional,
      prerequisites,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .select('id')
    .maybeSingle()

  if (metaError) {
    console.error('Error updating lesson metadata:', metaError)
    return { error: metaError.message }
  }

  if (!updatedLesson) {
    return { error: 'Lesson not found' }
  }

  const { error: contentError } = await supabase.from('lesson_content').upsert(
    {
      lesson_id: lessonId,
      content,
      content_blocks: contentBlocks,
      video_url: videoUrl || null,
      code_starter: codeStarter || null,
      code_solution: codeSolution || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'lesson_id' },
  )

  if (contentError) {
    console.error('Error updating lesson content:', contentError)
    return { error: contentError.message }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'lesson.updated',
    resourceType: 'lesson',
    resourceId: lessonId,
    details: {
      title,
      slug,
      lesson_type: lessonType,
      difficulty,
      estimated_minutes: estimatedMinutes,
      is_published: isPublished,
      is_optional: isOptional,
      course_id: courseId,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const { data: deleted, error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .select('id, module_id, title, slug')
    .maybeSingle()

  if (error) {
    console.error('Error deleting lesson:', error)
    return { error: error.message }
  }

  if (!deleted) {
    return { error: 'Lesson not found' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'lesson.deleted',
    resourceType: 'lesson',
    resourceId: deleted.id,
    details: {
      title: deleted.title,
      slug: deleted.slug,
      module_id: deleted.module_id,
      course_id: courseId,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}

export async function reorderLessons(
  moduleId: string,
  courseId: string,
  lessonIds: string[],
) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) return { error: guard.error }
  const user = guard.user

  const uniqueIds = new Set(lessonIds)
  if (uniqueIds.size !== lessonIds.length) {
    return { error: 'Invalid lesson order' }
  }

  const { data: existingLessons, error: verifyError } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', moduleId)

  if (verifyError) {
    console.error('Error validating lesson order:', verifyError)
    return { error: 'Failed to reorder lessons' }
  }

  const existingIds = new Set((existingLessons ?? []).map((l) => l.id))
  if (existingIds.size !== lessonIds.length) {
    return { error: 'Invalid lesson order' }
  }

  for (const id of lessonIds) {
    if (!existingIds.has(id)) return { error: 'Invalid lesson order' }
  }

  if (lessonIds.length === 0) {
    revalidatePath(`/admin/learn/${courseId}`)
    return { success: true }
  }

  const updates = lessonIds.map((id, index) =>
    supabase
      .from('lessons')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('module_id', moduleId),
  )

  const results = await Promise.all(updates)
  const errors = results.filter((r) => r.error)

  if (errors.length > 0) {
    console.error('Error reordering lessons:', errors)
    return { error: 'Failed to reorder lessons' }
  }

  await logAuditEvent({
    userId: user.id,
    action: 'lesson.reordered',
    resourceType: 'lesson',
    details: {
      module_id: moduleId,
      course_id: courseId,
      lesson_ids: lessonIds,
    },
  })

  revalidatePath(`/admin/learn/${courseId}`)
  return { success: true }
}
