export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="bg-gradient-to-br from-violet-50 via-white to-slate-50 pt-10 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-3 w-48 bg-slate-200 rounded mb-5" />
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-slate-200 rounded-xl" />
            <div className="h-8 w-1/3 bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 items-start">
          <div className="hidden lg:block w-56 flex-shrink-0 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 bg-white border border-slate-200 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
