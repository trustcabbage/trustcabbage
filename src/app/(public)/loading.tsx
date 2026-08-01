export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      {/* Hero placeholder */}
      <div className="bg-[#1e1b4b] pt-12 pb-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="h-3 w-40 bg-white/10 rounded-full mb-5" />
          <div className="h-8 w-2/3 bg-white/10 rounded-lg mb-3" />
          <div className="h-4 w-1/2 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Content placeholder */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
