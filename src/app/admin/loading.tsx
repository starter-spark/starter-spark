import { LoadingBlock } from '@/components/loading'

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div>
        <LoadingBlock className="h-8 w-48" tone="strong" />
        <LoadingBlock className="mt-2 h-4 w-64" tone="soft" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <LoadingBlock key={i} className="h-32 rounded-lg" tone="soft" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <LoadingBlock className="h-64 rounded-lg" tone="soft" />
        <LoadingBlock className="h-64 rounded-lg" tone="soft" />
      </div>
    </div>
  )
}
