export default function CommunityLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-10 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-[450px] max-w-full bg-slate-200 rounded animate-pulse" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 space-y-6">
              <div className="bg-white rounded border border-slate-200 p-4">
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 w-full bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-36 bg-slate-200 rounded animate-pulse" />
              </div>

              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-slate-200 p-4"
                  >
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-full bg-slate-100 rounded animate-pulse mb-2" />
                        <div className="flex gap-4">
                          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
