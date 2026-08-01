export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Hero */}
      <div className="bg-gradient-to-b from-violet-50 via-white to-slate-50 border-b border-slate-200 pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-5 items-start">
            <div className="h-20 w-20 rounded-2xl bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-6 w-1/3 bg-slate-200 rounded-lg" />
              <div className="h-3.5 w-1/4 bg-slate-200 rounded" />
              <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 w-20 bg-slate-100 rounded" />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="h-3.5 w-1/4 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
