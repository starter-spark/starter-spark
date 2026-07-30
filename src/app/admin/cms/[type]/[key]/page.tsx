import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCmsDocumentDetail, referenceOptionsFor } from '@/cms/admin'
import {
  ATTACHMENT_MIME_TYPES_BY_EXTENSION,
  ATTACHMENTS_BUCKET,
  getCmsAttachments,
} from '@/cms/attachments'
import { isCmsType } from '@/cms/registry'
import { Button } from '@/components/ui/button'
import { resolveParams, type MaybePromise } from '@/lib/next-params'
import { defaultDataFor, serializeFields, typeDef } from '../../lib'
import { CmsAttachmentsPanel } from './CmsAttachmentsPanel'
import { CmsDocumentEditor } from './CmsDocumentEditor'

export const metadata = {
  title: 'Edit Content | Admin',
}

export default async function CmsEditorPage({
  params,
}: {
  params: MaybePromise<{ type: string; key: string }>
}) {
  const { type, key } = await resolveParams(params)
  if (!isCmsType(type)) {
    notFound()
  }

  const def = typeDef(type)
  if (def.customAdminPath) {
    redirect(def.customAdminPath)
  }
  if (def.kind === 'singleton' && key !== 'default') {
    notFound()
  }

  const detail = await getCmsDocumentDetail(type, key)
  if (!detail && def.kind === 'collection') {
    notFound()
  }

  const defaults = defaultDataFor(type)
  const initialData = { ...defaults, ...(detail?.data ?? {}) }
  const backHref =
    def.kind === 'singleton' ? '/admin/cms' : `/admin/cms/${type}`

  // Reference fields render as selects over the referenced collection's
  // live entries, resolved here so the client editor stays schema-agnostic.
  const referenceOptions = await referenceOptionsFor(type)
  const fieldDefs = new Map(Object.entries(def.fields))
  const fields = serializeFields(type).map((field) => {
    const options = referenceOptions.get(field.name)
    if (!options) return field
    const schema = fieldDefs.get(field.name)?.schema
    return {
      ...field,
      options,
      clearable: schema ? schema.safeParse('').success : false,
    }
  })

  const attachments =
    def.attachments && detail ? await getCmsAttachments(type, key) : null

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
            <Link href={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          {def.label}
        </h1>
        <p className="text-slate-600">
          {def.kind === 'singleton' ? (
            def.description
          ) : (
            <>
              Entry{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                {key}
              </code>
            </>
          )}
        </p>
      </div>

      <CmsDocumentEditor
        type={type}
        typeKey={key}
        initialData={initialData}
        baseVersion={detail?.latestVersion ?? 0}
        hasDraft={detail?.hasDraft ?? false}
        isPublished={detail?.isPublished ?? false}
        history={(detail?.history ?? []).map((version) => ({
          id: version.id,
          version: version.version,
          note: version.note,
          createdAt: version.createdAt,
          isPublished: version.isPublished,
          isDraft: version.isDraft,
        }))}
        fields={fields}
      />

      {attachments !== null && (
        <CmsAttachmentsPanel
          type={type}
          typeKey={key}
          bucket={ATTACHMENTS_BUCKET}
          accept={[...ATTACHMENT_MIME_TYPES_BY_EXTENSION.keys()]
            .map((ext) => `.${ext}`)
            .join(',')}
          attachments={attachments.map((attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            fileSize: attachment.fileSize,
            url: attachment.url,
          }))}
        />
      )}
    </div>
  )
}
