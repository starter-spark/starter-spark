export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-10 w-48 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-80 bg-slate-200 rounded animate-pulse" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded border border-slate-200 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
