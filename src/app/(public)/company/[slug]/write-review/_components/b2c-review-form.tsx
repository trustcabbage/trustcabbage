'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StarRating } from '@/components/reviews/star-rating'
import { createClient } from '@/lib/supabase/client'
import { TagInput } from '@/components/tags/tag-input'
import { resolveTags, type TagChip } from '@/lib/tags'

interface Product { id: string; name: string; type: string }
interface Company { id: string; name: string; slug: string }

const B2C_STEPS = ['Your purchase', 'What you bought', 'Ratings', 'Your review', 'Photos & proof', 'Submit']

const B2C_RATING_FACTORS = [
  { key: 'rating_product_accuracy', label: 'Product accuracy', desc: 'Did you receive exactly what was shown or described?' },
  { key: 'rating_packaging', label: 'Packaging', desc: 'Was it well-packed and arrived in good condition?' },
  { key: 'rating_delivery_speed', label: 'Delivery speed', desc: 'Did it arrive when expected?' },
  { key: 'rating_return_refund', label: 'Returns & refunds', desc: 'Was the return or refund process smooth?' },
  { key: 'rating_value_for_money', label: 'Value for money', desc: 'Was the price fair for what you received?' },
  { key: 'rating_customer_support', label: 'Customer support', desc: 'Were support interactions helpful and quick?' },
] as const

const RETAIL_RATING_FACTORS = [
  { key: 'rating_store_experience', label: 'Store experience', desc: 'How was the overall in-store environment?' },
  { key: 'rating_staff_in_store', label: 'Staff & service', desc: 'Were staff helpful and attentive?' },
] as const

type B2cRatingKey = typeof B2C_RATING_FACTORS[number]['key']
type RetailRatingKey = typeof RETAIL_RATING_FACTORS[number]['key']

const initialB2cRatings = Object.fromEntries(B2C_RATING_FACTORS.map(f => [f.key, 0])) as Record<B2cRatingKey, number>
const initialRetailRatings = Object.fromEntries(RETAIL_RATING_FACTORS.map(f => [f.key, 0])) as Record<RetailRatingKey, number>

export function B2cReviewForm({
  company,
  products,
  userId,
  isRetail,
  refToken = null,
  reviewSource = null,
  isEmbed = false,
}: {
  company: Company
  products: Product[]
  userId: string
  isRetail: boolean
  refToken?: string | null
  reviewSource?: string | null
  isEmbed?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [serviceTags, setServiceTags] = useState<TagChip[]>([])
  const [sentimentTags, setSentimentTags] = useState<TagChip[]>([])

  // Step 0: purchase context
  const [purchase, setPurchase] = useState({
    purchase_channel: '', // retail only: online / in_store / both
    purchase_type: '',    // first_time / repeat / gifting
    order_value_range: '',
    discovery_channel: '',
  })

  // Step 1: product selection
  const [productServiceIds, setProductServiceIds] = useState<string[]>([])

  // Step 2: ratings
  const [b2cRatings, setB2cRatings] = useState<Record<B2cRatingKey, number>>(initialB2cRatings)
  const [retailRatings, setRetailRatings] = useState<Record<RetailRatingKey, number>>(initialRetailRatings)

  // Step 3: written review
  const [written, setWritten] = useState({
    what_went_well: '',
    what_to_improve: '',
    in_store_experience: '',
    additional_notes: '',
    would_buy_again: '',
    is_anonymous: false,
  })

  // Show retail in-store rating factors only when purchase_channel includes in-store
  const showRetailRatings = isRetail && (purchase.purchase_channel === 'in_store' || purchase.purchase_channel === 'both')

  const allRatingValues = [
    ...Object.values(b2cRatings),
    ...(showRetailRatings ? Object.values(retailRatings) : []),
  ]
  const allRated = allRatingValues.every(v => v > 0)
  const overallRating = allRated
    ? Math.round(allRatingValues.reduce((a, b) => a + b, 0) / allRatingValues.length * 10) / 10
    : 0

  function canAdvance(): boolean {
    if (step === 0) {
      const base = !!(purchase.purchase_type && purchase.order_value_range && purchase.discovery_channel)
      return isRetail ? base && !!purchase.purchase_channel : base
    }
    if (step === 1 && products.length === 0) return serviceTags.length > 0
    if (step === 2) {
      const b2cOk = Object.values(b2cRatings).every(v => v > 0)
      return showRetailRatings ? b2cOk && Object.values(retailRatings).every(v => v > 0) : b2cOk
    }
    if (step === 3) return written.what_went_well.trim().length >= 20 && !!written.would_buy_again
    return true
  }

  async function uploadFile(file: File, pathPrefix: string): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${pathPrefix}/${userId}/${company.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('review-proofs').upload(path, file, { upsert: false })
    if (error) return null
    return supabase.storage.from('review-proofs').getPublicUrl(path).data.publicUrl
  }

  async function submit() {
    if (written.what_went_well.trim().length < 20) { toast.error('Please write at least 20 characters in your review'); return }
    if (!written.would_buy_again) { toast.error('Please select if you would buy again'); return }
    setSubmitting(true)
    setUploadingFiles(true)

    let proofUrl: string | null = null
    let photoUrl: string | null = null

    if (photoFile) {
      photoUrl = await uploadFile(photoFile, 'photos')
      if (!photoUrl) { toast.error('Failed to upload product photo'); setSubmitting(false); setUploadingFiles(false); return }
    }
    if (proofFile) {
      proofUrl = await uploadFile(proofFile, 'proof')
      if (!proofUrl) { toast.error('Failed to upload proof document'); setSubmitting(false); setUploadingFiles(false); return }
    }
    setUploadingFiles(false)

    // Map would_buy_again to would_recommend for the shared column
    const would_recommend = written.would_buy_again === 'yes' ? 'yes' : written.would_buy_again === 'maybe' ? 'conditional' : 'no'

    // Combine in-store experience and additional notes into additional_notes column
    const noteParts: string[] = []
    if (isRetail && written.in_store_experience.trim()) noteParts.push(`In-store experience: ${written.in_store_experience.trim()}`)
    if (written.additional_notes.trim()) noteParts.push(written.additional_notes.trim())
    const additional_notes = noteParts.join('\n').trim() || null

    const { data: reviewRow, error } = await supabase.from('reviews').insert({
      company_id: company.id,
      reviewer_id: userId,
      review_type: 'b2c',
      // B2C purchase context
      purchase_type: purchase.purchase_type as any,
      order_value_range: purchase.order_value_range as any,
      discovery_channel: purchase.discovery_channel as any,
      purchase_channel: isRetail ? (purchase.purchase_channel as any) : null,
      // B2C ratings
      ...b2cRatings,
      ...(showRetailRatings ? retailRatings : {}),
      rating_overall: overallRating,
      // B2C written fields
      what_went_well: written.what_went_well,
      what_to_improve: written.what_to_improve || null,
      additional_notes,
      would_buy_again: written.would_buy_again as any,
      would_recommend: would_recommend as any,
      is_anonymous: written.is_anonymous,
      product_photo_url: photoUrl,
      proof_document_url: proofUrl,
      status: 'published',
      ...(refToken ? { ref_token: refToken } : {}),
      ...(reviewSource ? { review_source: reviewSource } : { review_source: 'organic' }),
    }).select('id').single()

    setSubmitting(false)
    if (error) { toast.error('Failed to submit review. Please try again.'); return }

    // Save selected products to junction table
    if (productServiceIds.length > 0) {
      await supabase.from('review_product_services').insert(
        productServiceIds.map(pid => ({ review_id: reviewRow.id, product_service_id: pid }))
      )
    }

    // Resolve and save tags
    const allServiceTags = await resolveTags(serviceTags, supabase, 'service')
    const allSentimentTags = await resolveTags(sentimentTags, supabase, 'sentiment')

    if (allServiceTags.length > 0) {
      await supabase.from('review_tags').insert(
        allServiceTags.map(t => ({ review_id: reviewRow.id, tag_id: t.id, tag_context: 'service' }))
      )
      for (const t of allServiceTags) {
        await supabase.from('company_tags').insert({
          company_id: company.id, tag_id: t.id, added_by: 'reviewer', added_by_user_id: userId,
        })
      }
    }
    if (allSentimentTags.length > 0) {
      await supabase.from('review_tags').insert(
        allSentimentTags.map(t => ({ review_id: reviewRow.id, tag_id: t.id, tag_context: 'sentiment' }))
      )
    }

    toast.success('Review submitted! Thank you.')
    if (isEmbed && window.parent !== window) {
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
        {B2C_STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
              i === step ? 'bg-[#6d28d9] text-white' :
              i < step ? 'bg-violet-100 text-[#6d28d9]' :
              'bg-slate-100 text-slate-400'
            }`}>{i + 1}</div>
            <span className={`text-xs font-black ${
              i === step ? 'text-[#6d28d9]' : i < step ? 'text-violet-500' : 'text-slate-400'
            }`}>{label}</span>
            {i < B2C_STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-300">

        {/* Step 0: Purchase context */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-black text-slate-950">Tell us about your purchase</h2>

            {/* purchase_channel — retail only, shown first */}
            {isRetail && (
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                  How did you purchase? <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: 'online', label: '🛒 Online' },
                    { v: 'in_store', label: '🏪 In store' },
                    { v: 'both', label: '✦ Both' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPurchase(prev => ({ ...prev, purchase_channel: v }))}
                      className={`py-3 rounded-xl border text-sm font-black transition-colors ${
                        purchase.purchase_channel === v
                          ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Type of purchase <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'first_time', label: '🆕 First time' },
                  { v: 'repeat', label: '🔄 Repeat buyer' },
                  { v: 'gifting', label: '🎁 Gifting' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPurchase(prev => ({ ...prev, purchase_type: v }))}
                    className={`py-3 rounded-xl border text-sm font-black transition-colors ${
                      purchase.purchase_type === v
                        ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Order value <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'under_500', label: 'Under ₹500' },
                  { v: '500_2000', label: '₹500 – ₹2,000' },
                  { v: '2000_5000', label: '₹2,000 – ₹5,000' },
                  { v: 'above_5000', label: 'Above ₹5,000' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPurchase(prev => ({ ...prev, order_value_range: v }))}
                    className={`py-3 rounded-xl border text-sm font-black transition-colors ${
                      purchase.order_value_range === v
                        ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                How did you discover them? <span className="text-red-400">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'instagram', label: '📸 Instagram' },
                  { v: 'google', label: '🔍 Google' },
                  { v: 'friend', label: '👥 Friend/Family' },
                  { v: 'youtube', label: '▶️ YouTube' },
                  { v: 'other', label: '✦ Other' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPurchase(prev => ({ ...prev, discovery_channel: v }))}
                    className={`py-3 rounded-xl border text-xs font-black transition-colors ${
                      purchase.discovery_channel === v
                        ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: What you bought */}
        {step === 1 && (
          <div className="space-y-5">
            {products.length === 0 ? (
              <>
                <h2 className="text-lg font-black text-slate-950">What did you buy from {company.name}?</h2>
                <p className="text-sm text-slate-500">
                  Tag the product or service you bought — this helps others find it.
                </p>
                <TagInput
                  value={serviceTags}
                  onChange={setServiceTags}
                  label="Product tags"
                  placeholder="e.g. #Moisturiser #SPF50 #NightCream"
                  required
                  hint="Add at least one tag. Press Enter or comma to confirm."
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-black text-slate-950">Which product are you reviewing?</h2>
                <p className="text-sm text-slate-500">Select all that apply. Leave empty for an overall review.</p>
                <div className="grid grid-cols-1 gap-3">
                  {products.map(p => {
                    const selected = productServiceIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? productServiceIds.filter(id => id !== p.id)
                            : [...productServiceIds, p.id]
                          setProductServiceIds(next)
                        }}
                        className={`text-left p-4 rounded-xl border text-xs font-bold transition-colors ${
                          selected
                            ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-[#6d28d9] border-[#6d28d9] text-white' : 'border-slate-300'}`}>
                            {selected && '✓'}
                          </span>
                          <p className="font-black text-sm text-slate-950">{p.name}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {productServiceIds.length > 0 && (
                  <p className="text-xs text-green-600 font-bold">✓ {productServiceIds.length} product{productServiceIds.length > 1 ? 's' : ''} selected</p>
                )}
                <TagInput
                  value={serviceTags}
                  onChange={setServiceTags}
                  label="Add product tags (optional)"
                  placeholder="e.g. #Moisturiser #SPF50"
                  hint="Tags help others search by product type."
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

            {B2C_RATING_FACTORS.map(({ key, label, desc }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-slate-950">{label}</Label>
                  <span className="text-sm text-slate-400">{b2cRatings[key] > 0 ? `${b2cRatings[key]}/5` : 'Not rated'}</span>
                </div>
                <p className="text-xs text-slate-400">{desc}</p>
                <StarRating
                  value={b2cRatings[key]}
                  size="lg"
                  interactive
                  onChange={v => setB2cRatings(prev => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}

            {showRetailRatings && (
              <div className="border-t border-slate-100 pt-4 space-y-5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wide">In-store experience</p>
                {RETAIL_RATING_FACTORS.map(({ key, label, desc }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-black text-slate-950">{label}</Label>
                      <span className="text-sm text-slate-400">{retailRatings[key] > 0 ? `${retailRatings[key]}/5` : 'Not rated'}</span>
                    </div>
                    <p className="text-xs text-slate-400">{desc}</p>
                    <StarRating
                      value={retailRatings[key]}
                      size="lg"
                      interactive
                      onChange={v => setRetailRatings(prev => ({ ...prev, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {overallRating > 0 && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide">Overall rating</p>
                <p className="text-3xl font-black text-[#6d28d9] mt-1">{overallRating}</p>
                <StarRating value={overallRating} size="lg" className="justify-center mt-1" />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Written review */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-black text-slate-950">Share your experience</h2>

            <div className="space-y-1.5">
              <Label htmlFor="went_well" className="text-xs font-black uppercase tracking-wide text-slate-400">
                What did you love about it? <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="went_well"
                placeholder="Tell others what you loved — product quality, packaging, delivery speed…"
                value={written.what_went_well}
                onChange={e => setWritten(prev => ({ ...prev, what_went_well: e.target.value }))}
                rows={4}
                className="border-slate-200 text-sm"
              />
              {written.what_went_well.length === 0 ? null : written.what_went_well.trim().length < 20 ? (
                <p className="text-xs text-red-500 font-bold">{written.what_went_well.trim().length} / 20 chars minimum — keep going</p>
              ) : (
                <p className="text-xs text-green-600 font-bold">✓ {written.what_went_well.trim().length} chars</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="improve" className="text-xs font-black uppercase tracking-wide text-slate-400">What could be better?</Label>
              <Textarea
                id="improve"
                placeholder="Any areas to improve — sizing, packaging, delivery delays…"
                value={written.what_to_improve}
                onChange={e => setWritten(prev => ({ ...prev, what_to_improve: e.target.value }))}
                rows={3}
                className="border-slate-200 text-sm"
              />
            </div>

            {showRetailRatings && (
              <div className="space-y-1.5">
                <Label htmlFor="instore" className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Describe your in-store experience <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="instore"
                  placeholder="How was the store atmosphere, staff helpfulness, waiting time…"
                  value={written.in_store_experience}
                  onChange={e => setWritten(prev => ({ ...prev, in_store_experience: e.target.value }))}
                  rows={2}
                  className="border-slate-200 text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Would you buy from them again? <span className="text-red-400">*</span>
              </Label>
              <div className="flex gap-3">
                {[{ v: 'yes', label: '👍 Yes' }, { v: 'maybe', label: '🤔 Maybe' }, { v: 'no', label: '👎 No' }].map(({ v, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWritten(prev => ({ ...prev, would_buy_again: v }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${
                      written.would_buy_again === v
                        ? 'border-[#6d28d9] bg-violet-50 text-violet-800'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-black uppercase tracking-wide text-slate-400">Additional notes <span className="font-normal text-slate-400">(optional)</span></Label>
              <Textarea
                id="notes"
                placeholder="Anything else you'd like others to know…"
                value={written.additional_notes}
                onChange={e => setWritten(prev => ({ ...prev, additional_notes: e.target.value }))}
                rows={2}
                className="border-slate-200 text-sm"
              />
            </div>

            <div className="pt-2">
              <TagInput
                value={sentimentTags}
                onChange={setSentimentTags}
                label="Tag your experience (optional)"
                placeholder="e.g. #FastDelivery #GoodPackaging"
                showSentimentChips
                hint="Click a chip or type your own."
              />
            </div>
          </div>
        )}

        {/* Step 4: Photos & proof */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-950">Add a photo <span className="text-slate-400 font-normal text-base">(optional)</span></h2>
              <p className="text-sm text-slate-500">Share a photo of your purchase — it helps others see what they are buying.</p>
              {photoFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-[#6d28d9] bg-violet-50 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-950 truncate">{photoFile.name}</p>
                    <p className="text-xs text-slate-400">{(photoFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoFile(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">Click to upload product photo</span>
                  <span className="text-xs text-slate-400">JPG or PNG — max 10 MB</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return }
                      setPhotoFile(f)
                    }}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-sm font-black text-slate-950">Proof of purchase <span className="text-slate-400 font-normal">(optional)</span></h3>
              <p className="text-sm text-slate-500">
                Upload your order confirmation or invoice to earn a &ldquo;Verified buyer&rdquo; badge.
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
                  <span className="text-sm font-bold text-slate-600">Click to upload order confirmation</span>
                  <span className="text-xs text-slate-400">PDF, JPG, PNG — max 10 MB</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return }
                      setProofFile(f)
                    }}
                    className="sr-only"
                  />
                </label>
              )}
              <p className="text-xs text-slate-400">Your document is kept private and used only to verify your review.</p>
            </div>
          </div>
        )}

        {/* Step 5: Submit */}
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
                <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">What you loved</p>
                <p className="text-slate-600 leading-relaxed">{written.what_went_well}</p>
              </div>
              {written.what_to_improve && (
                <div>
                  <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">What could be better</p>
                  <p className="text-slate-600 leading-relaxed">{written.what_to_improve}</p>
                </div>
              )}
              {productServiceIds.length > 0 && (
                <p className="text-slate-500">
                  Products: <span className="font-black text-slate-950">{products.filter(p => productServiceIds.includes(p.id)).map(p => p.name).join(', ')}</span>
                </p>
              )}
              <p className="text-slate-500">Would buy again: <span className="font-black text-slate-950">{written.would_buy_again}</span></p>
              {photoFile && <p className="text-slate-500">📷 Product photo attached</p>}
              {proofFile && <p className="text-slate-500">✓ Proof of purchase attached</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={written.is_anonymous}
                onChange={e => setWritten(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                className="rounded"
              />
              Post anonymously (your name won&apos;t be shown)
            </label>
            <p className="text-xs text-slate-400">
              By submitting, you confirm this review reflects your genuine experience and you agree to our Terms of Service.
            </p>
          </div>
        )}

      </div>

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
        {step < B2C_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {step === 4 ? ((photoFile || proofFile) ? 'Continue' : 'Skip') : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || uploadingFiles}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {uploadingFiles ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit review'}
          </button>
        )}
      </div>
    </div>
  )
}
