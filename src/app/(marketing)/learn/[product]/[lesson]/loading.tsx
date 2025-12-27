import { LoadingBlock } from '@/components/loading'

export default function LessonLoading() {
  return (
    <div className="bg-slate-50 flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-slate-200 pt-16">
        <div className="p-4 border-b border-slate-200">
          <LoadingBlock className="h-4 w-32 mb-3" tone="soft" />
          <LoadingBlock className="h-5 w-40" tone="strong" />
        </div>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <LoadingBlock className="h-3 w-16" tone="soft" />
            <LoadingBlock className="h-3 w-10" tone="soft" />
          </div>
          <LoadingBlock className="h-2 w-full" tone="soft" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 3 }, (_, moduleIndex) => (
            <div key={moduleIndex} className="border-b border-slate-100">
              <div className="p-4 flex items-center justify-between">
                <LoadingBlock className="h-4 w-28" tone="soft" />
                <LoadingBlock className="h-4 w-4" tone="soft" />
              </div>
              <div className="pb-2">
                {Array.from({ length: 2 }, (_, lessonIndex) => (
                  <div
                    key={lessonIndex}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <LoadingBlock className="h-4 w-4 rounded-full" tone="soft" />
                    <LoadingBlock className="h-3 w-32" tone="soft" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 lg:ml-72">
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <LoadingBlock className="h-5 w-5" tone="soft" />
            <LoadingBlock className="h-4 w-40" tone="soft" />
            <div className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="hidden lg:flex items-center gap-2 mb-8">
            <LoadingBlock className="h-3 w-12" tone="soft" />
            <LoadingBlock className="h-3 w-3" tone="soft" />
            <LoadingBlock className="h-3 w-28" tone="soft" />
            <LoadingBlock className="h-3 w-3" tone="soft" />
            <LoadingBlock className="h-3 w-32" tone="soft" />
          </div>

          <LoadingBlock className="h-10 w-2/3 mb-8" tone="strong" />

          <div className="space-y-4 mb-10">
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-48 w-full" tone="soft" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <LoadingBlock className="h-12 w-full sm:w-48" tone="strong" />
            <LoadingBlock className="h-12 w-full sm:w-48" tone="strong" />
          </div>
        </div>
      </div>
    </div>
  )
}
