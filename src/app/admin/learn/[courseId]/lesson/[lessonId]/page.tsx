import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { LessonEditor } from './LessonEditor'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Edit Lesson | Admin',
}

interface Lesson {
  id: string
  title: string
  slug: string
  description: string | null
  lesson_type: string
  difficulty: string
  estimated_minutes: number
  is_published: boolean
  is_optional: boolean
  prerequisites: string[] | null
  sort_order: number
  content: string
  content_blocks: unknown[]
  video_url: string | null
  code_starter: string | null
  code_solution: string | null
  module: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
}

async function getLesson(
  courseId: string,
  lessonId: string,
): Promise<Lesson | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(
      `
      id,
      title,
      slug,
      description,
      lesson_type,
      difficulty,
      estimated_minutes,
      is_published,
      is_optional,
      prerequisites,
      sort_order,
      content_data:lesson_content (
        content,
        content_blocks,
        video_url,
        code_starter,
        code_solution
      ),
      module:modules (
        id,
        title,
        course:courses (
          id,
          title
        )
      )
    `,
    )
    .eq('id', lessonId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching lesson:', error)
    throw new Error('Failed to load lesson')
  }

  if (!data) {
    return null
  }

  const moduleData = data.module as {
    id: string
    title: string
    course: { id: string; title: string } | null
  } | null

  if (!moduleData?.course) {
    return null
  }

  if (moduleData.course.id !== courseId) {
    return null
  }

  const lessonContent = data.content_data as {
    content: string | null
    content_blocks: unknown[] | null
    video_url: string | null
    code_starter: string | null
    code_solution: string | null
  } | null
  const contentBlocks = lessonContent?.content_blocks

  const lesson: Lesson = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    lesson_type: data.lesson_type! || 'content',
    difficulty: data.difficulty! || 'beginner',
    estimated_minutes: data.estimated_minutes! || 15,
    is_published: data.is_published!,
    is_optional: data.is_optional!,
    prerequisites: data.prerequisites ?? null,
    sort_order: data.sort_order,
    content: lessonContent?.content || '',
    content_blocks: Array.isArray(contentBlocks) ? contentBlocks : [],
    video_url: lessonContent?.video_url ?? null,
    code_starter: lessonContent?.code_starter ?? null,
    code_solution: lessonContent?.code_solution ?? null,
    module: {
      id: moduleData.id,
      title: moduleData.title,
      course: {
        id: moduleData.course.id,
        title: moduleData.course.title,
      },
    },
  }

  return lesson
}

async function getAvailableLessons(
  courseId: string,
): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modules')
    .select(
      `
      lessons (
        id,
        title
      )
    `,
    )
    .eq('course_id', courseId)

  if (error) {
    console.error('Error fetching course lessons:', error)
    throw new Error('Failed to load course lessons')
  }

  const lessons = (data ?? []).flatMap(
    (m) => (m.lessons || []) as { id: string; title: string }[],
  )
  return lessons
}

export default async function EditLessonPage({
  params,
}: {
  params: MaybePromise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await resolveParams(params)
  const lesson = await getLesson(courseId, lessonId)
  const availableLessons = await getAvailableLessons(courseId)

  if (!lesson) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/learn">Learn</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/admin/learn/${courseId}`}>
                {lesson.module.course.title}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lesson.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 mb-1">{lesson.module.title}</p>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          {lesson.title}
        </h1>
      </div>

      {/* Lesson Editor */}
      <LessonEditor
        lesson={lesson}
        courseId={courseId}
        availableLessons={availableLessons}
      />
    </div>
  )
}
