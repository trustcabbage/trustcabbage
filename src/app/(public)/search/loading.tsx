export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-11 w-full bg-slate-100 rounded-xl" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white">
            <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-1/3 bg-slate-100 rounded" />
              <div className="h-3 w-1/4 bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
