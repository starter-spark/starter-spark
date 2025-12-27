import { LoadingBlock } from '@/components/loading'

export default function ClaimLoading() {
  return (
    <div className="min-h-[60vh] bg-white px-6 py-24 lg:px-20">
      <div className="mx-auto max-w-2xl text-center">
        <LoadingBlock className="h-4 w-28 mx-auto mb-3" tone="soft" />
        <LoadingBlock className="h-10 w-2/3 mx-auto mb-4" tone="strong" />
        <LoadingBlock className="h-4 w-full max-w-xl mx-auto mb-2" tone="soft" />
        <LoadingBlock className="h-4 w-5/6 max-w-lg mx-auto mb-8" tone="soft" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <LoadingBlock className="h-10 w-36" tone="strong" />
          <LoadingBlock className="h-10 w-36" tone="strong" />
        </div>
      </div>
    </div>
  )
}
