import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { CourseEditor } from "./CourseEditor"

export const metadata = {
  title: "Edit Course | Admin",
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
  sort_order: number
}

interface Module {
  id: string
  title: string
  slug: string | null
  description: string | null
  icon: string | null
  is_published: boolean
  sort_order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  slug: string | null
  description: string | null
  difficulty: string
  duration_minutes: number
  is_published: boolean
  icon: string | null
  cover_image_url: string | null
  product: {
    id: string
    name: string
    slug: string
  } | null
  modules: Module[]
}

async function getCourse(courseId: string): Promise<Course | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      slug,
      description,
      difficulty,
      duration_minutes,
      is_published,
      icon,
      cover_image_url,
      product:products (
        id,
        name,
        slug
      ),
      modules (
        id,
        title,
        slug,
        description,
        icon,
        is_published,
        sort_order,
        lessons (
          id,
          title,
          slug,
          description,
          lesson_type,
          difficulty,
          estimated_minutes,
          is_published,
          is_optional,
          sort_order
        )
      )
    `)
    .eq("id", courseId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching course:", error)
    throw new Error("Failed to load course")
  }

  if (!data) {
    return null
  }

  // Sort modules and lessons
  const rawModules = (data.modules || []) as Module[]
  const modules: Module[] = rawModules
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).sort((a, b) => a.sort_order - b.sort_order),
    }))

  // Build typed Course object
  const course: Course = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    difficulty: data.difficulty,
    duration_minutes: data.duration_minutes,
    is_published: data.is_published!,
    icon: data.icon,
    cover_image_url: data.cover_image_url,
    product: data.product as Course["product"],
    modules,
  }

  return course
}

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourse(courseId)

  if (!course) {
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
            <BreadcrumbPage>{course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          {course.title}
        </h1>
        <p className="text-slate-600">
          {course.product?.name || "No product"} &middot;{" "}
          {course.modules.length} modules &middot;{" "}
          {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
        </p>
      </div>

      {/* Course Editor */}
      <CourseEditor course={course} />
    </div>
  )
}
