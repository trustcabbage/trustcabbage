import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Public, read-only, cached. No secret required, matching the existing
// company widget's pattern of scoping by slug rather than an API key
// (the tc_live_ key is reserved for server-side use — see /api/review-invite —
// and must never appear in publicly embeddable script data attributes).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companySlug = searchParams.get('slug')
  const productParam = searchParams.get('product')

  if (!companySlug || !productParam) {
    return NextResponse.json({ error: 'Missing slug or product parameter.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: coData } = await supabase
    .from('companies')
    .select('id, name, slug, is_verified')
    .eq('slug', companySlug)
    .maybeSingle()

  if (!coData) return NextResponse.json({ error: 'Company not found.' }, { status: 404 })
  const company = coData as any

  const { data: prodData } = await supabase
    .from('products_services')
    .select('id, name, slug, rating_avg, review_count')
    .eq('company_id', company.id)
    .eq('is_active', true)
    .or(`slug.eq.${productParam},external_id.eq.${productParam}`)
    .maybeSingle()

  if (!prodData) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  const product = prodData as any

  const [{ data: rawReviews }, { data: rawQuestions }] = await Promise.all([
    supabase
      .from('reviews')
      .select('rating_overall, what_went_well, is_anonymous, users(display_name)')
      .eq('product_service_id', product.id)
      .eq('status', 'published')
      .not('what_went_well', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('product_questions')
      .select('id, body')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const excerpts = ((rawReviews ?? []) as any[]).map(r => ({
    rating: r.rating_overall,
    text: (r.what_went_well as string ?? '').slice(0, 140),
    author: r.is_anonymous ? 'Anonymous' : (r.users?.display_name ?? 'Reviewer'),
  }))

  const questionIds = ((rawQuestions ?? []) as any[]).map(q => q.id)
  const { data: rawAnswers } = questionIds.length > 0
    ? await supabase
        .from('product_answers')
        .select('question_id, body, is_company_answer')
        .in('question_id', questionIds)
        .order('is_company_answer', { ascending: false })
        .limit(questionIds.length)
    : { data: [] }

  const firstAnswerByQuestion: Record<string, string> = {}
  for (const a of (rawAnswers ?? []) as any[]) {
    if (!firstAnswerByQuestion[a.question_id]) firstAnswerByQuestion[a.question_id] = a.body
  }

  const questions = ((rawQuestions ?? []) as any[]).map(q => ({
    question: q.body,
    answer: firstAnswerByQuestion[q.id] ?? null,
  }))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'

  return NextResponse.json(
    {
      product_name: product.name,
      rating_avg: product.rating_avg,
      review_count: product.review_count,
      excerpts,
      questions,
      company_name: company.name,
      company_verified: company.is_verified,
      product_url: `${siteUrl}/company/${company.slug}/product/${product.slug}`,
      write_review_url: `${siteUrl}/company/${company.slug}/write-review?product=${encodeURIComponent(product.slug ?? productParam)}&src=widget`,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
  )
}
