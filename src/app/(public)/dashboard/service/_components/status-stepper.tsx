const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reply', label: 'First reply' },
  { key: 'offered', label: 'Resolution offered' },
  { key: 'resolved', label: 'Resolved' },
] as const

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Ticket-lifecycle stepper for a complaint. Purely presentational, reads the
// same timestamps the public thread and the customer's case tracker are built
// from, so what the company sees here always matches what becomes public.
export function StatusStepper({
  createdAt,
  firstReplyAt,
  offeredAt,
  resolvedAt,
  isUnresolved,
}: {
  createdAt: string
  firstReplyAt: string | null
  offeredAt: string | null
  resolvedAt: string | null
  isUnresolved: boolean
}) {
  const timestamps: Record<string, string | null> = {
    submitted: createdAt,
    reply: firstReplyAt,
    offered: offeredAt,
    resolved: resolvedAt,
  }
  let reachedIndex = 0
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (timestamps[STEPS[i].key]) { reachedIndex = i; break }
  }
  if (isUnresolved) reachedIndex = STEPS.findIndex(s => s.key === 'offered')

  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const isTerminal = step.key === 'resolved' && isUnresolved
        const done = i <= reachedIndex
        const isLast = i === STEPS.length - 1
        const ts = timestamps[step.key]
        return (
          <div key={step.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                  isTerminal ? 'bg-rose-500 text-white'
                  : done ? 'bg-teal-600 text-white'
                  : i === reachedIndex + 1 ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isTerminal ? '✕' : done ? '✓' : i + 1}
              </div>
              <p className={`text-[10px] font-bold mt-1 text-center leading-tight w-16 ${isTerminal ? 'text-rose-600' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                {isTerminal ? 'Not resolved' : step.label}
              </p>
              {ts && done && !isTerminal && <p className="text-[9px] text-slate-400">{fmtShort(ts)}</p>}
            </div>
            {!isLast && <div className={`h-0.5 flex-1 mx-1 rounded ${i < reachedIndex ? 'bg-teal-600' : 'bg-slate-100'}`} />}
          </div>
        )
      })}
    </div>
  )
}
