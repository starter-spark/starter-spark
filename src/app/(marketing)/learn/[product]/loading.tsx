import { LoadingBlock } from '@/components/loading'

export default function CourseLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-32 mb-6" tone="soft" />
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <LoadingBlock className="h-12 w-12 rounded" tone="soft" />
                <LoadingBlock className="h-5 w-16" tone="soft" />
              </div>
              <LoadingBlock className="h-10 w-2/3 mb-4" tone="strong" />
              <LoadingBlock className="h-5 w-full max-w-2xl mb-2" tone="soft" />
              <LoadingBlock className="h-5 w-5/6 max-w-xl mb-6" tone="soft" />
              <div className="flex flex-wrap items-center gap-6">
                {Array.from({ length: 3 }, (_, i) => (
                  <LoadingBlock key={i} className="h-4 w-24" tone="soft" />
                ))}
              </div>
            </div>

            <div className="lg:w-80 bg-slate-50 rounded border border-slate-200 p-6">
              <LoadingBlock className="h-6 w-20 mx-auto mb-2" tone="strong" />
              <LoadingBlock className="h-4 w-24 mx-auto mb-4" tone="soft" />
              <LoadingBlock className="h-2 w-full mb-6" tone="soft" />
              <LoadingBlock className="h-10 w-full mb-3" tone="strong" />
              <LoadingBlock className="h-4 w-40 mx-auto" tone="soft" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-8 w-40 mb-8" tone="strong" />
          <div className="space-y-6">
            {Array.from({ length: 2 }, (_, moduleIndex) => (
              <div
                key={moduleIndex}
                className="bg-white rounded border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100">
                  <LoadingBlock className="h-5 w-1/2 mb-2" tone="strong" />
                  <LoadingBlock className="h-4 w-2/3" tone="soft" />
                </div>
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 3 }, (_, lessonIndex) => (
                    <div
                      key={lessonIndex}
                      className="flex items-center gap-4 p-4"
                    >
                      <LoadingBlock className="h-5 w-5 rounded-full" tone="soft" />
                      <div className="flex-1 min-w-0">
                        <LoadingBlock className="h-4 w-2/3 mb-2" tone="soft" />
                        <LoadingBlock className="h-3 w-1/2" tone="soft" />
                      </div>
                      <LoadingBlock className="h-4 w-14" tone="soft" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
