import { LoadingBlock } from '@/components/loading'

export default function LessonEditorLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <LoadingBlock className="h-10 w-10" tone="soft" />
        <div className="flex-1">
          <LoadingBlock className="h-4 w-48 mb-1" tone="soft" />
          <LoadingBlock className="h-8 w-64" tone="strong" />
        </div>
      </div>

      {/* Lesson Editor Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
        {/* Lesson Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <LoadingBlock className="h-4 w-16 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
          <div>
            <LoadingBlock className="h-4 w-12 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
        </div>

        <div>
          <LoadingBlock className="h-4 w-24 mb-2" tone="soft" />
          <LoadingBlock className="h-20 w-full" tone="soft" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <LoadingBlock className="h-4 w-24 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
          <div>
            <LoadingBlock className="h-4 w-20 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
          <div>
            <LoadingBlock className="h-4 w-20 mb-2" tone="soft" />
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>
        </div>

        {/* Content Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <LoadingBlock className="h-5 w-32" tone="strong" />
            <LoadingBlock className="h-9 w-28" tone="soft" />
          </div>

          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LoadingBlock className="h-5 w-5" tone="soft" />
                  <LoadingBlock className="h-5 w-24" tone="soft" />
                </div>
                <div className="flex gap-2">
                  <LoadingBlock className="h-8 w-8" tone="soft" />
                  <LoadingBlock className="h-8 w-8" tone="soft" />
                </div>
              </div>
              <LoadingBlock className="h-32 w-full" tone="soft" />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <LoadingBlock className="h-10 w-24" tone="soft" />
          <LoadingBlock className="h-10 w-32" tone="strong" />
        </div>
      </div>
    </div>
  )
}
