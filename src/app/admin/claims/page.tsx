import { createClient } from '@/lib/supabase/server'
import { approveClaim, rejectClaim } from './_actions'
import Link from 'next/link'
import { FileText, ExternalLink } from 'lucide-react'

const STATUS_CHIPS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default async function AdminClaimsPage() {
  const supabase = await createClient()

  const { data: claims } = await supabase
    .from('company_claims')
    .select(`
      id, proof_type, proof_notes, proof_document_url, status, created_at,
      companies(id, name, slug, status),
      users!company_claims_claimant_id_fkey(display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (claims ?? []) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-950">Company Claims</h1>
        <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-black">
          {rows.filter(c => c.status === 'pending').length} pending
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">No claims yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((claim) => (
            <div key={claim.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/company/${claim.companies?.slug}`} className="font-black text-slate-950 hover:text-[#6d28d9] transition-colors">
                      {claim.companies?.name ?? '—'}
                    </Link>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${STATUS_CHIPS[claim.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    by <strong>{claim.users?.display_name ?? claim.users?.email ?? '—'}</strong>
                    {' · '}
                    {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-black uppercase tracking-wide">Proof type</span>
                  <p className="font-bold text-slate-700 capitalize">{claim.proof_type?.replace('_', ' ')}</p>
                </div>
                {claim.proof_notes && (
                  <div className="flex-1">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-wide">Notes</span>
                    <p className="text-slate-600">{claim.proof_notes}</p>
                  </div>
                )}
              </div>

              {claim.proof_document_url && (
                <a
                  href={claim.proof_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#6d28d9] hover:underline"
                >
                  <FileText className="h-4 w-4" /> View document
                </a>
              )}

              {claim.status === 'pending' && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <form action={approveClaim.bind(null, claim.id, claim.companies?.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2 text-sm transition-colors"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectClaim.bind(null, claim.id)}>
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 text-red-600 font-black px-5 py-2 text-sm hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
