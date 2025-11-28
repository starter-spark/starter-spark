export default function LearnLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-[500px] max-w-full bg-slate-200 rounded animate-pulse" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mb-8" />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded bg-slate-100 animate-pulse" />
                    <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="p-6 bg-slate-50/50">
                  <div className="flex gap-4 mb-4">
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
