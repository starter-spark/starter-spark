import Link from 'next/link'
import { Database, Eye, EyeOff, Pencil } from 'lucide-react'
import { listCmsDocuments } from '@/cms/admin'
import { cmsTypeNames } from '@/cms/registry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { typeDef } from './lib'

export const metadata = {
  title: 'CMS | Admin',
}

export default async function CmsIndexPage() {
  // Types with a bespoke admin (e.g. lesson content) are managed there
  const listedTypes = cmsTypeNames.filter(
    (type) => !typeDef(type).customAdminPath,
  )
  const documents = await Promise.all(
    listedTypes.map((type) => listCmsDocuments(type)),
  )
  const types = listedTypes.map((type, index) => {
    const def = typeDef(type)
    return {
      type,
      label: def.label,
      description: def.description,
      kind: def.kind,
      count: documents.at(index)?.length ?? 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">CMS</h1>
          <p className="text-slate-600">
            Draft, publish, and reorder structured site content
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" size="sm">
            <a href="/api/cms/preview?redirect=/">
              <Eye className="mr-2 h-4 w-4" />
              Preview drafts on site
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/api/cms/preview?disable=1&redirect=/">
              <EyeOff className="mr-2 h-4 w-4" />
              Exit preview
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {types.map((entry) => {
          const href =
            entry.kind === 'singleton'
              ? `/admin/cms/${entry.type}/default`
              : `/admin/cms/${entry.type}`
          return (
            <Card key={entry.type} className="bg-white border-slate-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-100 rounded">
                    <Database className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{entry.label}</CardTitle>
                    <CardDescription>{entry.description}</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-600 border-slate-200 capitalize"
                >
                  {entry.kind}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {entry.count === 1
                      ? '1 entry'
                      : `${String(entry.count)} entries`}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Link href={href}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {entry.kind === 'singleton' ? 'Edit' : 'Manage'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
