import { LoadingBlock } from '@/components/loading'

export function HeroSkeleton() {
  return (
    <section className="relative min-h-screen flex flex-col lg:flex-row items-center pt-20 lg:pt-0 overflow-hidden bg-slate-50 border-b border-slate-200">
      <div className="w-full lg:w-1/2 px-6 lg:px-20 z-10 flex flex-col justify-center h-full space-y-8">
        <div className="space-y-4">
          <LoadingBlock className="h-4 w-48" tone="strong" />
          <div className="space-y-3">
            <LoadingBlock className="h-12 w-full max-w-xl" tone="strong" />
            <LoadingBlock className="h-12 w-4/5 max-w-lg" tone="strong" />
          </div>
          <div className="space-y-2">
            <LoadingBlock className="h-5 w-full max-w-lg" tone="soft" />
            <LoadingBlock className="h-5 w-11/12 max-w-md" tone="soft" />
          </div>
          <LoadingBlock className="h-4 w-64" tone="soft" />
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:w-auto">
          <LoadingBlock className="h-14 w-full sm:w-48 rounded-none" tone="strong" />
          <LoadingBlock className="h-14 w-full sm:w-56 rounded-none" tone="soft" />
        </div>
      </div>

      <div className="w-full lg:w-1/2 h-[60vh] lg:h-screen relative flex items-center justify-center">
        <div className="absolute inset-[10%] border border-slate-200 pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-slate-200" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-slate-200" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-slate-200" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-slate-200" />
        </div>
        <div className="relative w-[70%] max-w-md aspect-square bg-white border border-slate-200">
          <LoadingBlock className="absolute inset-0" tone="soft" />
        </div>
      </div>
    </section>
  )
}

export function DifferentiatorsSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <LoadingBlock className="h-9 w-56 mx-auto" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-full bg-white border border-slate-200 shadow-sm p-6"
            >
              <LoadingBlock className="h-12 w-12 rounded mb-4" tone="soft" />
              <LoadingBlock className="h-5 w-32 mb-3" tone="strong" />
              <LoadingBlock className="h-4 w-full mb-2" tone="soft" />
              <LoadingBlock className="h-4 w-5/6" tone="soft" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeaturedProductSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <LoadingBlock className="h-4 w-28 mx-auto" tone="soft" />
          <LoadingBlock className="h-9 w-64 mx-auto" tone="strong" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-3/5 space-y-4">
            <div className="relative aspect-[4/3] bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
              <LoadingBlock className="absolute inset-0" tone="soft" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <LoadingBlock
                  key={i}
                  className="h-20 w-20 rounded border border-slate-200"
                  tone="soft"
                />
              ))}
            </div>
          </div>

          <div className="w-full lg:w-2/5 space-y-6">
            <div className="space-y-3">
              <LoadingBlock className="h-6 w-48" tone="strong" />
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-11/12" tone="soft" />
              <LoadingBlock className="h-4 w-10/12" tone="soft" />
            </div>

            <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
              <LoadingBlock className="h-4 w-32" tone="soft" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <LoadingBlock className="h-3 w-32" tone="soft" />
                  <LoadingBlock className="h-3 w-24" tone="strong" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <LoadingBlock className="h-4 w-24" tone="soft" />
                <LoadingBlock className="h-9 w-24" tone="strong" />
              </div>
              <LoadingBlock className="h-12 w-40" tone="strong" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LearningPreviewSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <LoadingBlock className="h-9 w-48 mx-auto" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center mb-24">
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-[4/3] rounded border border-slate-700 shadow-xl overflow-hidden bg-slate-900">
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <LoadingBlock className="h-3 w-40" tone="deep" />
                <div className="flex items-center gap-2">
                  <LoadingBlock className="h-3 w-16" tone="deep" />
                  <LoadingBlock className="h-3 w-16" tone="deep" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <LoadingBlock className="h-3 w-2/3" tone="deep" />
                <LoadingBlock className="h-3 w-4/5" tone="deep" />
                <LoadingBlock className="h-3 w-3/5" tone="deep" />
                <LoadingBlock className="h-3 w-2/3" tone="deep" />
                <LoadingBlock className="h-3 w-1/2" tone="deep" />
              </div>
              <LoadingBlock className="absolute bottom-3 right-3 h-5 w-36" tone="deep" />
            </div>
          </div>

          <div className="w-full lg:w-1/2 space-y-4">
            <LoadingBlock className="h-12 w-12 rounded" tone="soft" />
            <LoadingBlock className="h-7 w-64" tone="strong" />
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-12 w-40" tone="strong" />
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-12 items-center">
          <div className="w-full lg:w-1/2 space-y-4">
            <LoadingBlock className="h-12 w-12 rounded" tone="soft" />
            <LoadingBlock className="h-7 w-64" tone="strong" />
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-12 w-40" tone="soft" />
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative bg-white rounded border border-slate-200 shadow-lg overflow-hidden">
              <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4">
                <LoadingBlock className="h-3 w-40" tone="strong" />
                <LoadingBlock className="h-3 w-16" tone="soft" />
              </div>
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <LoadingBlock className="h-8 w-8 rounded-full" tone="soft" />
                  <div className="flex-1 space-y-2">
                    <LoadingBlock className="h-4 w-48" tone="strong" />
                    <LoadingBlock className="h-4 w-5/6" tone="soft" />
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <LoadingBlock className="h-4 w-11/12" tone="soft" />
                <LoadingBlock className="h-4 w-10/12" tone="soft" />
                <LoadingBlock className="h-4 w-4/5" tone="soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function MissionImpactSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <LoadingBlock className="h-9 w-56 mx-auto" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-3/5 space-y-8">
            <div className="space-y-3">
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-11/12" tone="soft" />
              <LoadingBlock className="h-4 w-10/12" tone="soft" />
              <LoadingBlock className="h-4 w-5/6" tone="soft" />
            </div>
            <div className="bg-white rounded border-l-4 border-amber-500 p-6 shadow-sm space-y-3">
              <LoadingBlock className="h-5 w-40" tone="strong" />
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-10/12" tone="soft" />
              <LoadingBlock className="h-3 w-3/5" tone="soft" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="text-center space-y-2">
                  <LoadingBlock className="h-10 w-16 mx-auto" tone="strong" />
                  <LoadingBlock className="h-3 w-20 mx-auto" tone="soft" />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-2/5">
            <div className="grid grid-cols-2 gap-3">
              <LoadingBlock className="col-span-2 aspect-[2/1]" tone="soft" />
              {Array.from({ length: 4 }, (_, i) => (
                <LoadingBlock key={i} className="aspect-square" tone="soft" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function EventsPreviewSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <LoadingBlock className="h-9 w-64 mx-auto" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-1/2 flex flex-col min-w-0 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <LoadingBlock className="h-6 w-40" tone="strong" />
              <LoadingBlock className="h-8 w-24" tone="soft" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <LoadingBlock className="h-4 w-24" tone="soft" />
                      <LoadingBlock className="h-5 w-40" tone="strong" />
                    </div>
                    <LoadingBlock className="h-6 w-16" tone="soft" />
                  </div>
                  <LoadingBlock className="h-4 w-32" tone="soft" />
                </div>
              ))}
            </div>
            <LoadingBlock className="h-12 w-full mt-auto" tone="soft" />
          </div>

          <div className="w-full lg:w-1/2 flex flex-col min-w-0 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <LoadingBlock className="h-6 w-32" tone="strong" />
              <LoadingBlock className="h-8 w-24" tone="soft" />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <LoadingBlock className="h-4 w-24" tone="soft" />
              <LoadingBlock className="h-3 w-3 rounded-full" tone="soft" />
              <LoadingBlock className="h-4 w-24" tone="soft" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-4">
                  <div className="flex gap-4">
                    <div className="min-w-[40px] space-y-2">
                      <LoadingBlock className="h-4 w-10" tone="soft" />
                      <LoadingBlock className="h-3 w-8" tone="soft" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <LoadingBlock className="h-4 w-2/3" tone="strong" />
                      <LoadingBlock className="h-4 w-1/2" tone="soft" />
                      <LoadingBlock className="h-4 w-3/4" tone="soft" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <LoadingBlock className="h-12 w-full mt-auto" tone="strong" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function MarketingLoading() {
  return (
    <div className="bg-slate-50">
      <HeroSkeleton />
      <DifferentiatorsSkeleton />
      <FeaturedProductSkeleton />
      <LearningPreviewSkeleton />
      <MissionImpactSkeleton />
      <EventsPreviewSkeleton />
    </div>
  )
}
