import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from './_components/review-form'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string; src?: string; embed?: string; product?: string }> }

type CompanyWithProducts = {
  id: string; name: string; slug: string; status: string; business_type: string
  products_services: Array<{ id: string; name: string; type: string; slug: string | null; external_id: string | null }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('name').eq('slug', slug).single()
  const company = data as unknown as { name: string } | null
  return { title: company ? `Write a review for ${company.name}` : 'Write a review' }
}

export default async function WriteReviewPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref, src, embed, product: productParam } = await searchParams
  const isEmbed = embed === '1'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const writeReviewParams = new URLSearchParams({ ...(ref ? { ref } : {}), ...(src ? { src } : {}), ...(isEmbed ? { embed: '1' } : {}) }).toString()
  if (!user) redirect(`/login?next=/company/${slug}/write-review${writeReviewParams ? `?${writeReviewParams}` : ''}`)

  // Fetch user profile to check if they own this company
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, slug, status, business_type, products_services(id, name, type, slug, external_id)')
    .eq('slug', slug)
    .single()

  const company = companyData as unknown as CompanyWithProducts | null
  if (!company) notFound()

  // Resolve ?product= (either a product slug or an external_id from the invite API) to a product id
  const initialProductId = productParam
    ? company.products_services.find(p => p.slug === productParam || p.external_id === productParam)?.id ?? null
    : null

  // Block company admins from reviewing their own company
  if ((userProfile as any)?.company_id === company.id) {
    redirect(`/company/${slug}?own_company=1`)
  }

  // Scoped to the specific product when one is in context (widget/email invite flow),
  // so a customer can review each distinct product they bought from this company.
  // Falls back to the original "one general review" check when no product is specified.
  let existingQuery = supabase
    .from('reviews')
    .select('id')
    .eq('company_id', company.id)
    .eq('reviewer_id', user.id)
  existingQuery = initialProductId
    ? existingQuery.eq('product_service_id', initialProductId)
    : existingQuery.is('product_service_id', null)

  const { data: existing } = await existingQuery.maybeSingle()

  if (existing) redirect(`/company/${slug}?already_reviewed=1`)

  return (
    <div>
      {/* Hero — hidden in embed mode so the widget iframe shows just the form */}
      {!isEmbed && (
        <section className="bg-[#1e1b4b] pt-10 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <nav className="text-xs text-violet-300/70 mb-3">
              <Link href={`/company/${slug}`} className="hover:text-violet-200 transition-colors">{company.name}</Link>
              <span className="mx-2">/</span>
              <span className="text-violet-200">Write a review</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Write a review</h1>
            <p className="mt-1 text-slate-400 text-sm">for <span className="text-violet-200 font-bold">{company.name}</span></p>
          </div>
        </section>
      )}

      <div className={`max-w-2xl mx-auto px-4 sm:px-6 ${isEmbed ? 'py-6' : 'py-10'}`}>
        <ReviewForm
          company={{ id: company.id, name: company.name, slug: company.slug }}
          products={company.products_services ?? []}
          userId={user.id}
          isUnclaimed={company.status === 'unclaimed'}
          refToken={ref ?? null}
          reviewSource={src ?? null}
          isEmbed={isEmbed}
          businessType={company.business_type ?? 'business_services'}
          initialProductId={initialProductId}
        />
      </div>
    </div>
  )
}
