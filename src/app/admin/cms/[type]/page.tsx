import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { listCmsDocuments } from '@/cms/admin'
import { isCmsType } from '@/cms/registry'
import { Button } from '@/components/ui/button'
import { resolveParams, type MaybePromise } from '@/lib/next-params'
import { defaultDataFor, listColumns, typeDef } from '../lib'
import { CmsCollectionList } from './CmsCollectionList'

export const metadata = {
  title: 'CMS | Admin',
}

export default async function CmsTypePage({
  params,
}: {
  params: MaybePromise<{ type: string }>
}) {
  const { type } = await resolveParams(params)
  if (!isCmsType(type)) {
    notFound()
  }

  const def = typeDef(type)
  if (def.kind === 'singleton') {
    redirect(`/admin/cms/${type}/default`)
  }

  const documents = await listCmsDocuments(type)

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-2 text-slate-500 hover:text-slate-900"
          >
            <Link href="/admin/cms">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          {def.label}
        </h1>
        <p className="text-slate-600">{def.description}</p>
      </div>

      <CmsCollectionList
        type={type}
        columns={listColumns(type)}
        orderable={def.orderable ?? false}
        defaultData={defaultDataFor(type)}
        entries={documents.map((doc) => ({
          key: doc.key,
          hasDraft: doc.hasDraft,
          isPublished: doc.isPublished,
          updatedAt: doc.updatedAt,
          data: doc.data,
        }))}
      />
    </div>
  )
}
