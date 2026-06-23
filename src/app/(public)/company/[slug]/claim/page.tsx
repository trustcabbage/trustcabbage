import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ClaimForm } from './_components/claim-form'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ listed?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('name').eq('slug', slug).single()
  const company = data as unknown as { name: string } | null
  return { title: company ? `Claim ${company.name} on Trust Cabbage` : 'Claim company' }
}

export default async function ClaimPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { listed } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/company/${slug}/claim`)

  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, slug, status, business_type')
    .eq('slug', slug)
    .single()

  const company = companyData as unknown as { id: string; name: string; slug: string; status: string; business_type: string } | null
  if (!company) notFound()

  if (company.status === 'claimed') {
    redirect(`/company/${slug}`)
  }

  const { data: existingClaim } = await supabase
    .from('company_claims')
    .select('id, status')
    .eq('company_id', company.id)
    .eq('claimant_id', user.id)
    .in('status', ['pending'])
    .maybeSingle()

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-violet-300/70 mb-3">
            <Link href={`/company/${slug}`} className="hover:text-violet-200 transition-colors">{company.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-violet-200">Claim this page</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Claim {company.name}</h1>
          <p className="mt-2 text-violet-200/70 text-sm max-w-lg">
            Verify your ownership to manage your company profile, respond to reviews, and build trust with buyers.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {listed === '1' && (
          <div className="mb-5 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3.5 flex items-start gap-3">
            <span className="text-lg leading-none mt-0.5">🎉</span>
            <div>
              <p className="text-sm font-black text-violet-900">{company.name} is now on Trust Cabbage!</p>
              <p className="text-xs text-violet-700 mt-0.5">Your company page is live. Now claim it below to get admin access and start collecting reviews.</p>
            </div>
          </div>
        )}
        {existingClaim ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-lg font-black text-amber-800">Claim already submitted</p>
            <p className="text-sm text-amber-700 mt-2">
              You have a pending claim for this company. Our team will review it shortly.
            </p>
            <Link
              href={`/company/${slug}`}
              className="inline-block mt-5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm transition-colors"
            >
              Back to company page
            </Link>
          </div>
        ) : (
          <ClaimForm company={{ id: company.id, name: company.name, slug: company.slug, business_type: company.business_type }} userId={user.id} />
        )}
      </div>
    </div>
  )
}
