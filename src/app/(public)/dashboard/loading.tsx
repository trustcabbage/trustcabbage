export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-6 w-10 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white h-48" />
            <div className="rounded-xl border border-slate-200 bg-white h-32" />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white h-40" />
            <div className="rounded-xl border border-slate-200 bg-white h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
