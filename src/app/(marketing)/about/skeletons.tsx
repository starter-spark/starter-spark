import { LoadingBlock } from '@/components/loading'

export function AboutHeroSkeleton() {
  return (
    <section className="pt-32 pb-20 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-4xl mx-auto text-center">
        <LoadingBlock className="h-4 w-24 rounded mx-auto mb-4" tone="strong" />
        <LoadingBlock className="h-12 w-3/4 rounded mx-auto mb-4" tone="strong" />
        <LoadingBlock className="h-12 w-1/2 rounded mx-auto mb-8" tone="soft" />
        <LoadingBlock className="h-6 w-2/3 rounded mx-auto" tone="soft" />
      </div>
    </section>
  )
}

export function AboutStorySkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-4xl mx-auto">
        <LoadingBlock className="h-8 w-32 rounded mb-2" tone="strong" />
        <LoadingBlock className="w-16 h-1 rounded mb-12" tone="strong" />
        <div className="space-y-6">
          <LoadingBlock className="h-24 rounded" tone="soft" />
          <LoadingBlock className="h-24 rounded" tone="soft" />
          <LoadingBlock className="h-24 rounded" tone="soft" />
        </div>
      </div>
    </section>
  )
}

export function AboutTeamSkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <LoadingBlock className="h-10 w-64 rounded mx-auto mb-4" tone="strong" />
          <LoadingBlock className="h-6 w-96 rounded mx-auto" tone="soft" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded p-6"
            >
              <LoadingBlock className="w-24 h-24 mx-auto mb-4 rounded-full" tone="soft" />
              <LoadingBlock className="h-5 w-32 rounded mx-auto mb-2" tone="strong" />
              <LoadingBlock className="h-4 w-24 rounded mx-auto mb-3" tone="soft" />
              <LoadingBlock className="h-16 rounded" tone="subtle" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutGallerySkeleton() {
  return (
    <section className="py-24 px-6 lg:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <LoadingBlock className="h-96 w-full rounded" tone="soft" />
      </div>
    </section>
  )
}
