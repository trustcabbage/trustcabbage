'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/reviews/star-rating'
import { createClient } from '@/lib/supabase/client'
import { TagInput } from '@/components/tags/tag-input'
import { resolveTags, type TagChip } from '@/lib/tags'

interface Product { id: string; name: string; type: string }
interface Company { id: string; name: string; slug: string }

const STEPS = ['Your relationship', 'Product / service', 'Ratings', 'Your experience', 'Proof', 'Submit']

const RATING_FACTORS = [
  { key: 'rating_staff', label: 'Staff behaviour', desc: 'How professional and helpful was their team?' },
  { key: 'rating_quality', label: 'Product / service quality', desc: 'Did it meet your expectations?' },
  { key: 'rating_communication', label: 'Communication & support', desc: 'Were they responsive and clear?' },
  { key: 'rating_billing', label: 'Monetary & billing', desc: 'Was pricing fair and billing transparent?' },
  { key: 'rating_after_sales', label: 'After-sales support', desc: 'Post-purchase support quality?' },
  { key: 'rating_delivery', label: 'Delivery & timelines', desc: 'Did they deliver on time?' },
] as const

type RatingKey = typeof RATING_FACTORS[number]['key']

interface FormData {
  association_type: string
  reviewer_role: string
  engagement_phase: string
  association_duration: string
  product_service_id: string | null
  product_service_ids: string[]
  ratings: Record<RatingKey, number>
  what_went_well: string
  what_to_improve: string
  would_recommend: string
  recommend_reason: string
  additional_notes: string
  is_anonymous: boolean
  proof_document_url: string | null
}

const initialRatings = Object.fromEntries(RATING_FACTORS.map(f => [f.key, 0])) as Record<RatingKey, number>

export function ReviewForm({ company, products, userId, isUnclaimed = false, refToken = null, reviewSource = null, isEmbed = false }: { company: Company; products: Product[]; userId: string; isUnclaimed?: boolean; refToken?: string | null; reviewSource?: string | null; isEmbed?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [serviceTags, setServiceTags] = useState<TagChip[]>([])
  const [sentimentTags, setSentimentTags] = useState<TagChip[]>([])
  const [form, setForm] = useState<FormData>({
    association_type: '',
    reviewer_role: '',
    engagement_phase: '',
    association_duration: '',
    product_service_id: null,
    product_service_ids: [],
    ratings: initialRatings,
    what_went_well: '',
    what_to_improve: '',
    would_recommend: '',
    recommend_reason: '',
    additional_notes: '',
    is_anonymous: false,
    proof_document_url: null,
  })

  function update(patch: Partial<FormData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function canAdvance() {
    if (step === 0) return form.association_type && form.reviewer_role && form.engagement_phase && form.association_duration
    if (step === 2) return Object.values(form.ratings).every(v => v > 0)
    if (step === 3) return form.what_went_well.trim().length >= 20 && form.would_recommend
    if (step === 1 && products.length === 0) return serviceTags.length > 0
    // step 4 (proof) is optional — always can advance
    return true
  }

  const overallRating = form.ratings.rating_staff
    ? Math.round(Object.values(form.ratings).reduce((a, b) => a + b, 0) / 6 * 10) / 10
    : 0

  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return }
    setProofFile(f)
  }

  async function uploadProof(): Promise<string | null> {
    if (!proofFile) return form.proof_document_url
    setUploadingProof(true)
    const ext = proofFile.name.split('.').pop()
    const path = `${userId}/${company.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('review-proofs').upload(path, proofFile, { upsert: false })
    setUploadingProof(false)
    if (error) { toast.error('Failed to upload proof document.'); return null }
    const { data } = supabase.storage.from('review-proofs').getPublicUrl(path)
    return data.publicUrl
  }

  async function submit() {
    if (form.what_went_well.trim().length < 20) { toast.error('Please write at least 20 characters in "What went well"'); return }
    if (!form.would_recommend) { toast.error('Please select a recommendation'); return }
    setSubmitting(true)
    const proofUrl = await uploadProof()
    if (proofFile && !proofUrl) { setSubmitting(false); return }

    const { data: reviewRow, error } = await supabase.from('reviews').insert({
      company_id: company.id,
      reviewer_id: userId,
      product_service_id: form.product_service_id || null,
      association_type: form.association_type as any,
      reviewer_role: form.reviewer_role as any,
      engagement_phase: form.engagement_phase as any,
      association_duration: form.association_duration as any,
      ...form.ratings,
      rating_overall: overallRating,
      what_went_well: form.what_went_well,
      what_to_improve: form.what_to_improve,
      would_recommend: form.would_recommend as any,
      recommend_reason: form.recommend_reason,
      additional_notes: form.additional_notes,
      is_anonymous: form.is_anonymous,
      proof_document_url: proofUrl,
      status: 'published',
      ...(refToken ? { ref_token: refToken } : {}),
      ...(reviewSource ? { review_source: reviewSource } : { review_source: 'organic' }),
    }).select('id').single()
    setSubmitting(false)
    if (error) { toast.error('Failed to submit review. Please try again.'); return }

    // Save all selected products to junction table (graceful — won't fail if table missing)
    if (form.product_service_ids.length > 0) {
      await supabase.from('review_product_services').insert(
        form.product_service_ids.map(pid => ({ review_id: reviewRow.id, product_service_id: pid }))
      )
    }

    // Resolve and save tags
    const allServiceTags = await resolveTags(serviceTags, supabase, 'service')
    const allSentimentTags = await resolveTags(sentimentTags, supabase, 'sentiment')

    if (allServiceTags.length > 0) {
      // Add service tags to the review
      await supabase.from('review_tags').insert(
        allServiceTags.map(t => ({ review_id: reviewRow.id, tag_id: t.id, tag_context: 'service' }))
      )
      // Also add to company_tags (ignore duplicate conflicts)
      for (const t of allServiceTags) {
        await supabase.from('company_tags').insert({
          company_id: company.id, tag_id: t.id, added_by: 'reviewer', added_by_user_id: userId,
        }) // ignore duplicate constraint errors
      }
    }
    if (allSentimentTags.length > 0) {
      await supabase.from('review_tags').insert(
        allSentimentTags.map(t => ({ review_id: reviewRow.id, tag_id: t.id, tag_context: 'sentiment' }))
      )
    }

    toast.success('Review submitted! Thank you.')
    if (isEmbed && window.parent !== window) {
      // Tell the widget modal on the parent page to close
      window.parent.postMessage({ type: 'tc-review-submitted', slug: company.slug }, '*')
    } else {
      router.push(`/company/${company.slug}`)
      router.refresh()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
              i === step ? 'bg-[#6d28d9] text-white' :
              i < step ? 'bg-violet-100 text-[#6d28d9]' :
              'bg-slate-100 text-slate-400'
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs font-black ${
              i === step ? 'text-[#6d28d9]' :
              i < step ? 'text-violet-500' :
              'text-slate-400'
            }`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: Your relationship */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-slate-950">Your relationship with {company.name}</h2>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">I am a</Label>
            <Select value={form.association_type} onValueChange={v => { if (v !== null) update({ association_type: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current_client">Current client</SelectItem>
                <SelectItem value="past_client">Past client</SelectItem>
                <SelectItem value="pilot">Pilot / Trial customer</SelectItem>
                <SelectItem value="partner">Business partner</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="evaluator">Evaluator (did not buy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">My role in the decision</Label>
            <Select value={form.reviewer_role} onValueChange={v => { if (v !== null) update({ reviewer_role: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="decision_maker">Decision maker</SelectItem>
                <SelectItem value="end_user">End user</SelectItem>
                <SelectItem value="evaluator">Evaluator / Research</SelectItem>
                <SelectItem value="procurement">Procurement / Finance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Phase of engagement</Label>
            <Select value={form.engagement_phase} onValueChange={v => { if (v !== null) update({ engagement_phase: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select phase" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_sales">Pre-sales / Discovery</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="active">Active usage</SelectItem>
                <SelectItem value="post_project">Post-project / Offboarded</SelectItem>
                <SelectItem value="long_term">Long-term relationship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Duration of association</Label>
            <Select value={form.association_duration} onValueChange={v => { if (v !== null) update({ association_duration: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select duration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lt_3m">Less than 3 months</SelectItem>
                <SelectItem value="3_12m">3–12 months</SelectItem>
                <SelectItem value="1_3y">1–3 years</SelectItem>
                <SelectItem value="3y_plus">More than 3 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 1: Product / service + service tags */}
      {step === 1 && (
        <div className="space-y-5">
          {products.length === 0 ? (
            <>
              <h2 className="text-lg font-black text-slate-950">What did you use from {company.name}?</h2>
              <p className="text-sm text-slate-500">
                This company doesn&apos;t have products listed yet. Tag the service or product you used — this helps others find them.
              </p>
              <TagInput
                value={serviceTags}
                onChange={setServiceTags}
                label="Service / product tags"
                placeholder="e.g. #PaymentGateway #UPI #Subscriptions"
                required
                hint="Add at least one tag. Press Enter or comma to confirm each tag."
              />
            </>
          ) : (
            <>
              <h2 className="text-lg font-black text-slate-950">Which product or service are you reviewing?</h2>
              <p className="text-sm text-slate-500">Select all that apply. Leave empty for an overall company review.</p>
              <div className="grid grid-cols-1 gap-3">
                {products.map(p => {
                  const selected = form.product_service_ids.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.product_service_ids.filter(id => id !== p.id)
                          : [...form.product_service_ids, p.id]
                        update({ product_service_ids: next, product_service_id: next[0] ?? null })
                      }}
                      className={`text-left p-4 rounded-xl border text-xs font-bold transition-colors ${
                        selected
                          ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-[#6d28d9] border-[#6d28d9] text-white' : 'border-slate-300'}`}>
                            {selected && '✓'}
                          </span>
                          <p className="font-black text-sm text-slate-950">{p.name}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 capitalize">{p.type}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {form.product_service_ids.length > 0 && (
                <p className="text-xs text-green-600 font-bold">✓ {form.product_service_ids.length} product{form.product_service_ids.length > 1 ? 's' : ''} selected</p>
              )}
              <TagInput
                value={serviceTags}
                onChange={setServiceTags}
                label="Add service tags (optional)"
                placeholder="e.g. #WebDevelopment #ReactJS"
                hint="Tags help others search by technology or service type."
              />
            </>
          )}
        </div>
      )}

      {/* Step 2: Ratings */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-black text-slate-950">Rate your experience</h2>
          <p className="text-sm text-slate-500">Rate each factor from 1 (poor) to 5 (excellent).</p>
          {RATING_FACTORS.map(({ key, label, desc }) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="font-black text-slate-950">{label}</Label>
                <span className="text-sm text-slate-400">{form.ratings[key] > 0 ? `${form.ratings[key]}/5` : 'Not rated'}</span>
              </div>
              <p className="text-xs text-slate-400">{desc}</p>
              <StarRating
                value={form.ratings[key]}
                size="lg"
                interactive
                onChange={(v) => update({ ratings: { ...form.ratings, [key]: v } })}
              />
            </div>
          ))}
          {overallRating > 0 && (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
              <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide">Overall rating</p>
              <p className="text-3xl font-black text-[#6d28d9] mt-1">{overallRating}</p>
              <StarRating value={overallRating} size="lg" className="justify-center mt-1" />
            </div>
          )}
        </div>
      )}

      {/* Step 3: Written experience */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-slate-950">Share your experience</h2>
          <div className="space-y-1.5">
            <Label htmlFor="went_well" className="text-xs font-black uppercase tracking-wide text-slate-400">
              What went well? <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="went_well"
              placeholder="Describe what you liked about working with them…"
              value={form.what_went_well}
              onChange={e => update({ what_went_well: e.target.value })}
              rows={4}
              className="border-slate-200 text-sm"
            />
            {form.what_went_well.length === 0 ? null : form.what_went_well.trim().length < 20 ? (
              <p className="text-xs text-red-500 font-bold">{form.what_went_well.trim().length} / 20 chars minimum — keep going</p>
            ) : (
              <p className="text-xs text-green-600 font-bold">✓ {form.what_went_well.trim().length} chars</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="improve" className="text-xs font-black uppercase tracking-wide text-slate-400">What could be improved?</Label>
            <Textarea
              id="improve"
              placeholder="Any areas where they could do better…"
              value={form.what_to_improve}
              onChange={e => update({ what_to_improve: e.target.value })}
              rows={3}
              className="border-slate-200 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
              Would you recommend them? <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-3">
              {[{ v: 'yes', label: 'Yes' }, { v: 'conditional', label: 'Conditionally' }, { v: 'no', label: 'No' }].map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ would_recommend: v })}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${
                    form.would_recommend === v
                      ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {form.would_recommend && form.would_recommend !== 'yes' && (
            <div className="space-y-1.5">
              <Label htmlFor="rec_reason" className="text-xs font-black uppercase tracking-wide text-slate-400">Why?</Label>
              <Textarea
                id="rec_reason"
                placeholder="Explain your recommendation…"
                value={form.recommend_reason}
                onChange={e => update({ recommend_reason: e.target.value })}
                rows={2}
                className="border-slate-200 text-sm"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-black uppercase tracking-wide text-slate-400">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Anything else you'd like to add…"
              value={form.additional_notes}
              onChange={e => update({ additional_notes: e.target.value })}
              rows={2}
              className="border-slate-200 text-sm"
            />
          </div>
          <div className="pt-2">
            <TagInput
              value={sentimentTags}
              onChange={setSentimentTags}
              label="Tag your experience (optional)"
              placeholder="e.g. #Satisfied #GoodValue"
              showSentimentChips
              hint="Click a chip or type your own. These appear as searchable filters on the review."
            />
          </div>
        </div>
      )}

      {/* Step 4: Proof upload */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-slate-950">Verify your experience <span className="text-slate-400 font-normal text-base">(optional)</span></h2>
          <p className="text-sm text-slate-500">
            Uploading proof of your engagement (invoice, contract, email) helps us verify your review and earn a "Verified buyer" badge.
          </p>
          {proofFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#6d28d9] bg-violet-50 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-950 truncate">{proofFile.name}</p>
                <p className="text-xs text-slate-400">{(proofFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => setProofFile(null)}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm font-bold text-slate-600">Click to upload proof</span>
              <span className="text-xs text-slate-400">Invoice, contract, email screenshot — PDF, JPG, PNG (max 10 MB)</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleProofFileChange}
                className="sr-only"
              />
            </label>
          )}
          <p className="text-xs text-slate-400">
            Your document is kept private and used only to verify your review. Skip this step if you prefer.
          </p>
        </div>
      )}

      {/* Step 5: Review and submit */}
      {step === 5 && (
        <div className="space-y-5">
          <h2 className="text-lg font-black text-slate-950">Review your submission</h2>
          <div className="rounded-xl border border-slate-200 p-5 space-y-4 text-sm bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">Overall rating</span>
              <div className="flex items-center gap-2">
                <StarRating value={overallRating} size="sm" />
                <span className="font-black text-slate-950">{overallRating}</span>
              </div>
            </div>
            <div className="border-t border-slate-200" />
            <div>
              <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">What went well</p>
              <p className="text-slate-600 leading-relaxed">{form.what_went_well}</p>
            </div>
            {form.what_to_improve && (
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">What to improve</p>
                <p className="text-slate-600 leading-relaxed">{form.what_to_improve}</p>
              </div>
            )}
            {form.product_service_ids.length > 0 && (
              <p className="text-slate-500">Products reviewed: <span className="font-black text-slate-950">{products.filter(p => form.product_service_ids.includes(p.id)).map(p => p.name).join(', ')}</span></p>
            )}
            <p className="text-slate-500">Would recommend: <span className="font-black text-slate-950">{form.would_recommend}</span></p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={e => update({ is_anonymous: e.target.checked })}
              className="rounded"
            />
            Post anonymously (your name won&apos;t be shown)
          </label>
          <p className="text-xs text-slate-400">
            By submitting, you confirm this review reflects your genuine experience and you agree to our Terms of Service.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {step === 4 ? (proofFile ? 'Continue' : 'Skip') : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || uploadingProof}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {uploadingProof ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit review'}
          </button>
        )}
      </div>
    </div>
  )
}
