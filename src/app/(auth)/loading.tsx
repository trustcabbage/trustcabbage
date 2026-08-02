export default function Loading() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="text-center mb-8">
        <div className="h-4 w-32 bg-white/10 rounded mx-auto mb-3" />
        <div className="h-7 w-56 bg-white/10 rounded-lg mx-auto" />
        <div className="h-3.5 w-64 bg-white/10 rounded mx-auto mt-3" />
      </div>
      <div className="rounded-xl bg-white/5 border border-white/10 p-6 space-y-4">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-11 w-full bg-white/10 rounded-xl" />
        <div className="h-11 w-full bg-white/10 rounded-xl mt-2" />
      </div>
    </div>
  )
}
