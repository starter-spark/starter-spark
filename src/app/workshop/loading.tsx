export default function WorkshopLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-10 w-40 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="w-full lg:w-[70%]">
              <div className="bg-white rounded border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-slate-200 rounded"
                    >
                      <div className="h-5 w-48 bg-slate-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-[30%] space-y-6">
              <div className="bg-white rounded border border-slate-200 p-6">
                <div className="h-6 w-28 bg-slate-200 rounded animate-pulse mb-4" />
                <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
