import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Pencil,
  BookOpen,
  Layers,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDuration } from '@/lib/utils'

export const metadata = {
  title: 'Learn | Admin',
}

interface Course {
  id: string
  title: string
  slug: string | null
  description: string | null
  difficulty: string
  duration_minutes: number
  is_published: boolean
  product: {
    id: string
    name: string
    slug: string
  } | null
  modules: {
    id: string
    lessons: { id: string }[]
  }[]
}

async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      slug,
      description,
      difficulty,
      duration_minutes,
      is_published,
      product:products (
        id,
        name,
        slug
      ),
      modules (
        id,
        lessons (id)
      )
    `,
    )
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('Error fetching courses:', error)
    return []
  }

  // Map database results to typed Course objects
  const courses: Course[] = data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    difficulty: row.difficulty,
    duration_minutes: row.duration_minutes,
    is_published: row.is_published!,
    product: row.product as Course['product'],
    modules: (row.modules || []) as Course['modules'],
  }))

  return courses
}

export default async function AdminLearnPage() {
  const courses = await getCourses()

  // Calculate stats
  const totalCourses = courses.length
  const publishedCourses = courses.filter((c) => c.is_published).length
  const totalModules = courses.reduce((acc, c) => acc + c.modules.length, 0)
  const totalLessons = courses.reduce(
    (acc, c) => acc + c.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">Learn</h1>
          <p className="text-slate-600">Manage courses, modules, and lessons</p>
        </div>
        <Button asChild className="bg-cyan-700 hover:bg-cyan-600">
          <Link href="/admin/learn/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 p-2">
              <BookOpen className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Courses</p>
              <p className="font-mono text-2xl font-bold text-slate-900">
                {totalCourses}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Published</p>
              <p className="font-mono text-2xl font-bold text-green-600">
                {publishedCourses}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Modules</p>
              <p className="font-mono text-2xl font-bold text-slate-900">
                {totalModules}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Lessons</p>
              <p className="font-mono text-2xl font-bold text-slate-900">
                {totalLessons}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      {courses.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No courses yet.</p>
          <Button asChild className="mt-4 bg-cyan-700 hover:bg-cyan-600">
            <Link href="/admin/learn/new">Create your first course</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const lessonCount = course.modules.reduce(
                  (acc, mod) => acc + mod.lessons.length,
                  0,
                )
                return (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {course.title}
                        </p>
                        {course.slug && (
                          <code className="text-xs text-slate-500">
                            {course.slug}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.product ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {course.product.name}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          course.difficulty === 'beginner'
                            ? 'bg-green-100 text-green-700'
                            : course.difficulty === 'intermediate'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }
                      >
                        {course.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {course.modules.length}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {lessonCount}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {formatDuration(course.duration_minutes)}
                    </TableCell>
                    <TableCell>
                      {course.is_published ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/admin/learn/${course.id}`}
                              aria-label={`Edit ${course.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit course</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
