import { LoadingBlock } from '@/components/loading'

export default function DocArticleLoading() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="pt-28 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-4 w-64" tone="soft" />
        </div>
      </section>

      <article className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-4 w-40 mb-4" tone="soft" />
          <header className="mb-8">
            <LoadingBlock className="h-10 w-3/4 mb-4" tone="strong" />
            <div className="flex items-center gap-4">
              <LoadingBlock className="h-4 w-32" tone="soft" />
              <LoadingBlock className="h-4 w-24" tone="soft" />
            </div>
          </header>

          <div className="bg-white rounded border border-slate-200 p-6 lg:p-10 space-y-4">
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-48 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-5/6" tone="soft" />
          </div>
        </div>
      </article>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <LoadingBlock className="h-16 w-full" tone="strong" />
            <LoadingBlock className="h-16 w-full" tone="strong" />
          </div>
        </div>
      </section>
    </div>
  )
}
