import { LoadingBlock } from '@/components/loading'

export default function CourseEditorLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <LoadingBlock className="h-10 w-10" tone="soft" />
        <div className="flex-1">
          <LoadingBlock className="h-8 w-64" tone="strong" />
          <LoadingBlock className="mt-2 h-4 w-48" tone="soft" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <LoadingBlock className="h-9 w-24" tone="soft" />
        <LoadingBlock className="h-9 w-24" tone="soft" />
        <LoadingBlock className="h-9 w-24" tone="soft" />
      </div>

      {/* Course Settings Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <LoadingBlock className="h-4 w-16 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
          <div>
            <LoadingBlock className="h-4 w-20 mb-2" tone="soft" />
            <LoadingBlock className="h-24 w-full" tone="soft" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <LoadingBlock className="h-4 w-20 mb-2" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
            <div>
              <LoadingBlock className="h-4 w-20 mb-2" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <LoadingBlock className="h-4 w-24 mb-2" tone="soft" />
            <LoadingBlock className="h-48 w-full rounded-lg" tone="soft" />
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <LoadingBlock className="h-6 w-24" tone="strong" />
          <div className="flex gap-2">
            <LoadingBlock className="h-9 w-28" tone="soft" />
            <LoadingBlock className="h-9 w-28" tone="soft" />
          </div>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <LoadingBlock className="h-5 w-5" tone="soft" />
              <LoadingBlock className="h-6 w-48" tone="soft" />
              <LoadingBlock className="ml-auto h-6 w-16" tone="soft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
