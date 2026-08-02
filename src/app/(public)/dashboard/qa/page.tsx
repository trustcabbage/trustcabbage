import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AnswerForm } from './_components/answer-form'
import { ChevronLeft, MessageCircleQuestion, ShieldCheck, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Q&A inbox | Dashboard' }

type Answer = {
  id: string
  body: string
  is_company_answer: boolean
  is_verified_buyer: boolean
  created_at: string
  answerer_name: string
}

type QuestionRow = {
  id: string
  body: string
  created_at: string
  asker_name: string
  product_id: string
  product_name: string
  product_slug: string | null
  answers: Answer[]
}

export default async function QaInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/qa')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const { data: co } = await supabase.from('companies').select('slug').eq('id', companyId).single()
  const companySlug = (co as any)?.slug as string

  const { data: productsRaw } = await supabase
    .from('products_services')
    .select('id, name, slug')
    .eq('company_id', companyId)
    .eq('is_active', true)

  const products = (productsRaw ?? []) as any[]
  const productIds = products.map(p => p.id)
  const productById = Object.fromEntries(products.map(p => [p.id, p]))

  let questions: QuestionRow[] = []

  if (productIds.length > 0) {
    const { data: questionsRaw } = await supabase
      .from('product_questions')
      .select('id, body, created_at, product_id, users(display_name)')
      .in('product_id', productIds)
      .order('created_at', { ascending: false })

    const questionRows = (questionsRaw ?? []) as any[]
    const questionIds = questionRows.map(q => q.id)

    const { data: answersRaw } = questionIds.length > 0
      ? await supabase
          .from('product_answers')
          .select('id, question_id, body, is_company_answer, is_verified_buyer, created_at, users(display_name)')
          .in('question_id', questionIds)
          .order('created_at', { ascending: true })
      : { data: [] }

    const answersByQuestion: Record<string, Answer[]> = {}
    for (const a of (answersRaw ?? []) as any[]) {
      if (!answersByQuestion[a.question_id]) answersByQuestion[a.question_id] = []
      answersByQuestion[a.question_id].push({
        id: a.id,
        body: a.body,
        is_company_answer: a.is_company_answer,
        is_verified_buyer: a.is_verified_buyer,
        created_at: a.created_at,
        answerer_name: a.users?.display_name ?? 'A user',
      })
    }

    questions = questionRows.map(q => {
      const product = productById[q.product_id]
      return {
        id: q.id,
        body: q.body,
        created_at: q.created_at,
        asker_name: q.users?.display_name ?? 'A visitor',
        product_id: q.product_id,
        product_name: product?.name ?? 'Unknown product',
        product_slug: product?.slug ?? null,
        answers: (answersByQuestion[q.id] ?? []).sort(
          (a, b) => (b.is_company_answer ? 1 : 0) - (a.is_company_answer ? 1 : 0)
        ),
      }
    })
  }

  const unanswered = questions.filter(q => !q.answers.some(a => a.is_company_answer))
  const answered = questions.filter(q => q.answers.some(a => a.is_company_answer))

  function QuestionCard({ q }: { q: QuestionRow }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] flex-shrink-0">
              {q.asker_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{q.body}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Asked by {q.asker_name} · on{' '}
                {q.product_slug ? (
                  <Link href={`/company/${companySlug}/product/${q.product_slug}`} className="text-[#6d28d9] font-bold hover:underline">
                    {q.product_name}
                  </Link>
                ) : q.product_name}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {q.answers.length > 0 && (
          <div className="ml-10 space-y-2">
            {q.answers.map(a => (
              <div
                key={a.id}
                className={`rounded-xl p-3 text-xs ${a.is_company_answer ? 'bg-violet-50 border-l-4 border-[#6d28d9]' : 'bg-slate-50'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-black">
                  {a.is_company_answer ? (
                    <span className="flex items-center gap-1 text-[#6d28d9]"><ShieldCheck className="h-3 w-3" /> Official</span>
                  ) : a.is_verified_buyer ? (
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" /> {a.answerer_name} · Verified buyer</span>
                  ) : (
                    <span className="text-slate-500">{a.answerer_name} · Community</span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        )}

        {!q.answers.some(a => a.is_company_answer) && (
          <div className="ml-10">
            <AnswerForm
              questionId={q.id}
              productId={q.product_id}
              companySlug={companySlug}
              productSlug={q.product_slug ?? ''}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">Q&amp;A inbox</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-[#6d28d9]" />
          <h1 className="text-2xl font-black text-slate-950">Q&amp;A inbox</h1>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <MessageCircleQuestion className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="font-black text-slate-700">No questions yet</p>
            <p className="text-sm text-slate-400 mt-1">Questions asked on your product pages will show up here.</p>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-black text-slate-950 text-sm">Unanswered</h2>
                {unanswered.length > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black">
                    {unanswered.length}
                  </span>
                )}
              </div>
              {unanswered.length === 0 ? (
                <p className="text-sm text-slate-400">You&apos;re all caught up.</p>
              ) : (
                <div className="space-y-3">
                  {unanswered.map(q => <QuestionCard key={q.id} q={q} />)}
                </div>
              )}
            </div>

            {answered.length > 0 && (
              <div>
                <h2 className="font-black text-slate-950 text-sm mb-4">Answered</h2>
                <div className="space-y-3">
                  {answered.map(q => <QuestionCard key={q.id} q={q} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
