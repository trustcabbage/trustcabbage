'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X, Info } from 'lucide-react'
import { TagInput } from '@/components/tags/tag-input'
import { resolveTags, type TagChip } from '@/lib/tags'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRating } from '@/components/reviews/star-rating'
import { createClient } from '@/lib/supabase/client'
import { BusinessTypeSelector, type BusinessType } from '@/components/business-type-selector'
import { getCategoriesByBusinessType } from '@/lib/get-categories-by-business-type'

interface Category { id: string; name: string; slug: string; icon: string | null; parent_id: string | null; platform_type: 'b2b' | 'b2c' | 'both' }

const B2B_STEPS = ['Business type', 'Company details', 'Your relationship', 'Ratings', 'Your experience', 'Proof', 'Submit']
const B2C_STEPS = ['Business type', 'Company details', 'Your purchase', 'What you bought', 'Ratings', 'Your review', 'Proof', 'Submit']

const B2B_RATING_FACTORS = [
  { key: 'rating_staff', label: 'Staff behaviour', desc: 'How professional and helpful was their team?' },
  { key: 'rating_quality', label: 'Product / service quality', desc: 'Did it meet your expectations?' },
  { key: 'rating_communication', label: 'Communication & support', desc: 'Were they responsive and clear?' },
  { key: 'rating_billing', label: 'Monetary & billing', desc: 'Was pricing fair and billing transparent?' },
  { key: 'rating_after_sales', label: 'After-sales support', desc: 'Post-purchase support quality?' },
  { key: 'rating_delivery', label: 'Delivery & timelines', desc: 'Did they deliver on time?' },
] as const

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

type B2bRatingKey = typeof B2B_RATING_FACTORS[number]['key']
type B2cRatingKey = typeof B2C_RATING_FACTORS[number]['key']
type RetailRatingKey = typeof RETAIL_RATING_FACTORS[number]['key']

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'Jammu & Kashmir',
]

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function NewCompanyReviewForm({
  initialName,
  categories,
  userId,
}: {
  initialName: string
  categories: Category[]
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [serviceTags, setServiceTags] = useState<TagChip[]>([])
  const [sentimentTags, setSentimentTags] = useState<TagChip[]>([])
  const [websiteDuplicate, setWebsiteDuplicate] = useState<{ name: string; slug: string } | null>(null)
  const websiteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [businessType, setBusinessType] = useState<BusinessType | ''>('')

  const isB2C = businessType === 'online_b2c' || businessType === 'retail_chain'
  const isRetail = businessType === 'retail_chain'
  const STEPS = isB2C ? B2C_STEPS : B2B_STEPS

  // Shared company state
  const [company, setCompany] = useState({
    name: initialName,
    website: '',
    city: '',
    state: '',
    category_id: '',
  })

  // B2B state
  const [b2bRatings, setB2bRatings] = useState<Record<B2bRatingKey, number>>(
    Object.fromEntries(B2B_RATING_FACTORS.map(f => [f.key, 0])) as Record<B2bRatingKey, number>
  )
  const [review, setReview] = useState({
    association_type: '',
    reviewer_role: '',
    engagement_phase: '',
    association_duration: '',
    what_went_well: '',
    what_to_improve: '',
    would_recommend: '',
    recommend_reason: '',
    additional_notes: '',
    is_anonymous: false,
  })

  // B2C state
  const [purchase, setPurchase] = useState({
    purchase_channel: '',
    purchase_type: '',
    order_value_range: '',
    discovery_channel: '',
  })
  const [b2cRatings, setB2cRatings] = useState<Record<B2cRatingKey, number>>(
    Object.fromEntries(B2C_RATING_FACTORS.map(f => [f.key, 0])) as Record<B2cRatingKey, number>
  )
  const [retailRatings, setRetailRatings] = useState<Record<RetailRatingKey, number>>(
    Object.fromEntries(RETAIL_RATING_FACTORS.map(f => [f.key, 0])) as Record<RetailRatingKey, number>
  )
  const [b2cWritten, setB2cWritten] = useState({
    what_went_well: '',
    what_to_improve: '',
    would_buy_again: '',
    additional_notes: '',
  })

  const showRetailRatings = isRetail && (purchase.purchase_channel === 'in_store' || purchase.purchase_channel === 'both')

  const b2bOverallRating = Object.values(b2bRatings).every(v => v > 0)
    ? Math.round(Object.values(b2bRatings).reduce((a, b) => a + b, 0) / 6 * 10) / 10
    : 0

  const b2cAllRatingValues = [...Object.values(b2cRatings), ...(showRetailRatings ? Object.values(retailRatings) : [])]
  const b2cOverallRating = b2cAllRatingValues.length > 0 && b2cAllRatingValues.every(v => v > 0)
    ? Math.round(b2cAllRatingValues.reduce((a, b) => a + b, 0) / b2cAllRatingValues.length * 10) / 10
    : 0

  const overallRating = isB2C ? b2cOverallRating : b2bOverallRating

  const filteredCategories = useMemo(() => {
    if (!businessType) return categories
    return getCategoriesByBusinessType(businessType, categories)
  }, [businessType, categories])

  useEffect(() => {
    if (company.category_id && !filteredCategories.find(c => c.id === company.category_id)) {
      setCompany(prev => ({ ...prev, category_id: '' }))
    }
  }, [filteredCategories])

  useEffect(() => {
    const raw = company.website.trim()
    if (!raw || raw.length < 4) { setWebsiteDuplicate(null); return }
    const domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
    if (!domain.includes('.')) { setWebsiteDuplicate(null); return }
    if (websiteDebounceRef.current) clearTimeout(websiteDebounceRef.current)
    websiteDebounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('companies')
        .select('name, slug')
        .ilike('website', `%${domain}%`)
        .maybeSingle()
      setWebsiteDuplicate(data ? { name: (data as any).name, slug: (data as any).slug } : null)
    }, 400)
  }, [company.website])

  function updateCompany(patch: Partial<typeof company>) {
    setCompany(prev => ({ ...prev, ...patch }))
  }
  function updateReview(patch: Partial<typeof review>) {
    setReview(prev => ({ ...prev, ...patch }))
  }

  function canAdvance(): boolean {
    if (step === 0) return businessType !== ''
    if (step === 1) return company.website.trim().length >= 4 && company.name.trim().length >= 2 && !!company.category_id

    if (isB2C) {
      if (step === 2) {
        const base = !!(purchase.purchase_type && purchase.order_value_range && purchase.discovery_channel)
        return isRetail ? base && !!purchase.purchase_channel : base
      }
      if (step === 3) return serviceTags.length > 0
      if (step === 4) {
        const b2cOk = Object.values(b2cRatings).every(v => v > 0)
        return showRetailRatings ? b2cOk && Object.values(retailRatings).every(v => v > 0) : b2cOk
      }
      if (step === 5) return b2cWritten.what_went_well.trim().length >= 20 && !!b2cWritten.would_buy_again
      return true
    } else {
      if (step === 2) return !!(review.association_type && review.reviewer_role && review.engagement_phase && review.association_duration) && serviceTags.length > 0
      if (step === 3) return Object.values(b2bRatings).every(v => v > 0)
      if (step === 4) return review.what_went_well.trim().length >= 20 && !!review.would_recommend
      return true
    }
  }

  async function findUniqueSlug(base: string): Promise<string> {
    let slug = base
    let i = 2
    while (true) {
      const { data } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle()
      if (!data) return slug
      slug = `${base}-${i++}`
    }
  }

  async function submit() {
    setSubmitting(true)

    let proofUrl: string | null = null
    if (proofFile) {
      const ext = proofFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('review-proofs').upload(path, proofFile)
      if (upErr) { toast.error('Failed to upload proof document.'); setSubmitting(false); return }
      proofUrl = supabase.storage.from('review-proofs').getPublicUrl(path).data.publicUrl
    }

    let photoUrl: string | null = null
    if (isB2C && photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `photos/${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('review-proofs').upload(path, photoFile)
      if (upErr) { toast.error('Failed to upload photo.'); setSubmitting(false); return }
      photoUrl = supabase.storage.from('review-proofs').getPublicUrl(path).data.publicUrl
    }

    const baseSlug = toSlug(company.name.trim())
    const slug = await findUniqueSlug(baseSlug)

    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company.name.trim(),
        slug,
        website: company.website.trim() || null,
        city: company.city.trim() || null,
        state: company.state || null,
        status: 'unclaimed',
        created_by: userId,
        business_type: businessType || 'business_services',
      })
      .select('id, slug')
      .single()

    if (companyError || !newCompany) {
      toast.error('Failed to create company. Please try again.')
      setSubmitting(false)
      return
    }

    await supabase.from('company_categories').insert({
      company_id: newCompany.id,
      category_id: company.category_id,
    })

    let reviewRow: { id: string } | null = null
    let reviewError: any = null

    if (isB2C) {
      const would_recommend = b2cWritten.would_buy_again === 'yes' ? 'yes' : b2cWritten.would_buy_again === 'maybe' ? 'conditional' : 'no'
      const { data, error } = await supabase.from('reviews').insert({
        company_id: newCompany.id,
        reviewer_id: userId,
        review_type: 'b2c',
        purchase_type: purchase.purchase_type as any,
        order_value_range: purchase.order_value_range as any,
        discovery_channel: purchase.discovery_channel as any,
        purchase_channel: isRetail ? (purchase.purchase_channel as any) : null,
        ...b2cRatings,
        ...(showRetailRatings ? retailRatings : {}),
        rating_overall: b2cOverallRating,
        what_went_well: b2cWritten.what_went_well,
        what_to_improve: b2cWritten.what_to_improve || null,
        additional_notes: b2cWritten.additional_notes || null,
        would_buy_again: b2cWritten.would_buy_again as any,
        would_recommend: would_recommend as any,
        is_anonymous: review.is_anonymous,
        product_photo_url: photoUrl,
        proof_document_url: proofUrl,
        status: 'published',
        review_source: 'organic',
      }).select('id').single()
      reviewRow = data
      reviewError = error
    } else {
      const { data, error } = await supabase.from('reviews').insert({
        company_id: newCompany.id,
        reviewer_id: userId,
        association_type: review.association_type as any,
        reviewer_role: review.reviewer_role as any,
        engagement_phase: review.engagement_phase as any,
        association_duration: review.association_duration as any,
        ...b2bRatings,
        rating_overall: b2bOverallRating,
        what_went_well: review.what_went_well,
        what_to_improve: review.what_to_improve || null,
        would_recommend: review.would_recommend as any,
        recommend_reason: review.recommend_reason || null,
        additional_notes: review.additional_notes || null,
        is_anonymous: review.is_anonymous,
        proof_document_url: proofUrl,
        status: 'published',
      }).select('id').single()
      reviewRow = data
      reviewError = error
    }

    if (reviewError || !reviewRow) {
      toast.error('Company created but review failed. Please go to the company page and try again.')
      router.push(`/company/${newCompany.slug}`)
      return
    }

    const allServiceTags = await resolveTags(serviceTags, supabase, 'service')
    const allSentimentTags = await resolveTags(sentimentTags, supabase, 'sentiment')

    if (allServiceTags.length > 0) {
      await supabase.from('review_tags').insert(
        allServiceTags.map(t => ({ review_id: reviewRow!.id, tag_id: t.id, tag_context: 'service' }))
      )
      for (const t of allServiceTags) {
        await supabase.from('company_tags').insert({
          company_id: newCompany.id, tag_id: t.id, added_by: 'reviewer', added_by_user_id: userId,
        })
      }
    }
    if (allSentimentTags.length > 0) {
      await supabase.from('review_tags').insert(
        allSentimentTags.map(t => ({ review_id: reviewRow!.id, tag_id: t.id, tag_context: 'sentiment' }))
      )
    }

    toast.success('Company added and review published!')
    router.push(`/company/${newCompany.slug}`)
  }

  const isProofStep = isB2C ? step === 6 : step === 5
  const hasProofAttached = isB2C ? !!(photoFile || proofFile) : !!proofFile

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
              i === step ? 'bg-[#6d28d9] text-white scale-110' :
              i < step ? 'bg-violet-100 text-[#6d28d9]' :
              'bg-slate-100 text-slate-400'
            }`}>{i + 1}</div>
            <span className={`text-xs font-black transition-colors duration-200 ${
              i === step ? 'text-[#6d28d9]' : i < step ? 'text-violet-500' : 'text-slate-400'
            }`}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-300">

        {/* ── SHARED STEPS ── */}

        {/* Step 0: Business type */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-slate-700">
              <Info className="h-4 w-4 text-[#6d28d9] mt-0.5 flex-shrink-0" />
              <p>This helps us show the right categories and review questions for the company you&apos;re adding.</p>
            </div>
            <h2 className="text-lg font-black text-slate-950">What type of company is this?</h2>
            <BusinessTypeSelector value={businessType} onChange={(v) => setBusinessType(v)} />
          </div>
        )}

        {/* Step 1: Company details */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-slate-700">
              <Info className="h-4 w-4 text-[#6d28d9] mt-0.5 flex-shrink-0" />
              <p>You&apos;re creating this company&apos;s page. It will be publicly visible and Google-searchable. The company can claim and manage it later.</p>
            </div>
            <h2 className="text-lg font-black text-slate-950">Company details</h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Company website <span className="text-red-400">*</span>
              </Label>
              <input
                type="url"
                value={company.website}
                onChange={e => updateCompany({ website: e.target.value })}
                placeholder="https://company.com"
                autoFocus
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  websiteDuplicate
                    ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-400'
                    : 'border-slate-200 focus:border-[#6d28d9] focus:ring-[#6d28d9]'
                }`}
              />
              {websiteDuplicate && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm space-y-2">
                  <p className="font-black text-amber-900">
                    This website already belongs to: <span className="text-[#6d28d9]">{websiteDuplicate.name}</span>
                  </p>
                  <p className="text-amber-700 text-xs">Write your review there instead of creating a duplicate page.</p>
                  <a
                    href={`/company/${websiteDuplicate.slug}/write-review`}
                    className="inline-block rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2 text-xs transition-colors"
                  >
                    Write a review for {websiteDuplicate.name} →
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Company name <span className="text-red-400">*</span>
              </Label>
              <input
                type="text"
                value={company.name}
                onChange={e => updateCompany({ name: e.target.value })}
                placeholder="e.g. Pixel Republic Digital"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                Industry / category <span className="text-red-400">*</span>
              </Label>
              <div className="relative">
                <select
                  value={company.category_id}
                  onChange={e => updateCompany({ category_id: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] transition-colors cursor-pointer pr-10"
                >
                  <option value="" disabled>Select a category</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">City</Label>
                <input
                  type="text"
                  value={company.city}
                  onChange={e => updateCompany({ city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">State</Label>
                <Select value={company.state} onValueChange={v => { if (v !== null) updateCompany({ state: v }) }}>
                  <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ── B2C STEPS ── */}
        {isB2C && (
          <>
            {/* B2C Step 2: Your purchase */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Tell us about your purchase</h2>

                {isRetail && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                      How did you purchase? <span className="text-red-400">*</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ v: 'online', label: '🛒 Online' }, { v: 'in_store', label: '🏪 In store' }, { v: 'both', label: '✦ Both' }].map(({ v, label }) => (
                        <button key={v} type="button"
                          onClick={() => setPurchase(prev => ({ ...prev, purchase_channel: v }))}
                          className={`py-3 rounded-xl border text-sm font-black transition-colors ${purchase.purchase_channel === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Type of purchase <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ v: 'first_time', label: '🆕 First time' }, { v: 'repeat', label: '🔄 Repeat buyer' }, { v: 'gifting', label: '🎁 Gifting' }].map(({ v, label }) => (
                      <button key={v} type="button"
                        onClick={() => setPurchase(prev => ({ ...prev, purchase_type: v }))}
                        className={`py-3 rounded-xl border text-sm font-black transition-colors ${purchase.purchase_type === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Order value <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v: 'under_500', label: 'Under ₹500' }, { v: '500_2000', label: '₹500 – ₹2,000' }, { v: '2000_5000', label: '₹2,000 – ₹5,000' }, { v: 'above_5000', label: 'Above ₹5,000' }].map(({ v, label }) => (
                      <button key={v} type="button"
                        onClick={() => setPurchase(prev => ({ ...prev, order_value_range: v }))}
                        className={`py-3 rounded-xl border text-sm font-black transition-colors ${purchase.order_value_range === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    How did you discover them? <span className="text-red-400">*</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ v: 'instagram', label: '📸 Instagram' }, { v: 'google', label: '🔍 Google' }, { v: 'friend', label: '👥 Friend/Family' }, { v: 'youtube', label: '▶️ YouTube' }, { v: 'other', label: '✦ Other' }].map(({ v, label }) => (
                      <button key={v} type="button"
                        onClick={() => setPurchase(prev => ({ ...prev, discovery_channel: v }))}
                        className={`py-3 rounded-xl border text-xs font-black transition-colors ${purchase.discovery_channel === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* B2C Step 3: What you bought */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">What did you buy from {company.name}?</h2>
                <p className="text-sm text-slate-500">Tag the product or service you bought — this helps others find it.</p>
                <TagInput
                  value={serviceTags}
                  onChange={setServiceTags}
                  label="Product tags"
                  placeholder="e.g. #Moisturiser #SPF50 #NightCream"
                  required
                  hint="Add at least one tag. Press Enter or comma to confirm."
                />
              </div>
            )}

            {/* B2C Step 4: Ratings */}
            {step === 4 && (
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
                    <StarRating value={b2cRatings[key]} size="lg" interactive onChange={v => setB2cRatings(prev => ({ ...prev, [key]: v }))} />
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
                        <StarRating value={retailRatings[key]} size="lg" interactive onChange={v => setRetailRatings(prev => ({ ...prev, [key]: v }))} />
                      </div>
                    ))}
                  </div>
                )}
                {b2cOverallRating > 0 && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide">Overall rating</p>
                    <p className="text-3xl font-black text-[#6d28d9] mt-1">{b2cOverallRating}</p>
                    <StarRating value={b2cOverallRating} size="lg" className="justify-center mt-1" />
                  </div>
                )}
              </div>
            )}

            {/* B2C Step 5: Your review */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Share your experience</h2>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    What did you love about it? <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    placeholder="Tell others what you loved — product quality, packaging, delivery speed…"
                    value={b2cWritten.what_went_well}
                    onChange={e => setB2cWritten(prev => ({ ...prev, what_went_well: e.target.value }))}
                    rows={4}
                    className="border-slate-200 text-sm"
                  />
                  {b2cWritten.what_went_well.length > 0 && b2cWritten.what_went_well.trim().length < 20 ? (
                    <p className="text-xs text-red-500 font-bold">{b2cWritten.what_went_well.trim().length} / 20 chars minimum — keep going</p>
                  ) : b2cWritten.what_went_well.trim().length >= 20 ? (
                    <p className="text-xs text-green-600 font-bold">✓ {b2cWritten.what_went_well.trim().length} chars</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">What could be better?</Label>
                  <Textarea
                    placeholder="Any areas to improve — sizing, packaging, delivery delays…"
                    value={b2cWritten.what_to_improve}
                    onChange={e => setB2cWritten(prev => ({ ...prev, what_to_improve: e.target.value }))}
                    rows={3}
                    className="border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Would you buy from them again? <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex gap-3">
                    {[{ v: 'yes', label: '👍 Yes' }, { v: 'maybe', label: '🤔 Maybe' }, { v: 'no', label: '👎 No' }].map(({ v, label }) => (
                      <button key={v} type="button"
                        onClick={() => setB2cWritten(prev => ({ ...prev, would_buy_again: v }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${b2cWritten.would_buy_again === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Additional notes (optional)</Label>
                  <Textarea
                    placeholder="Anything else you'd like others to know…"
                    value={b2cWritten.additional_notes}
                    onChange={e => setB2cWritten(prev => ({ ...prev, additional_notes: e.target.value }))}
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

            {/* B2C Step 6: Proof */}
            {step === 6 && (
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
                      <button type="button" onClick={() => setPhotoFile(null)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">Click to upload product photo</span>
                      <span className="text-xs text-slate-400">JPG or PNG — max 10 MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return } if (f) setPhotoFile(f) }} className="sr-only" />
                    </label>
                  )}
                </div>
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h3 className="text-sm font-black text-slate-950">Proof of purchase <span className="text-slate-400 font-normal">(optional)</span></h3>
                  <p className="text-sm text-slate-500">Upload your order confirmation or invoice to earn a &ldquo;Verified buyer&rdquo; badge.</p>
                  {proofFile ? (
                    <div className="flex items-center gap-3 rounded-xl border border-[#6d28d9] bg-violet-50 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-950 truncate">{proofFile.name}</p>
                        <p className="text-xs text-slate-400">{(proofFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={() => setProofFile(null)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">Click to upload order confirmation</span>
                      <span className="text-xs text-slate-400">PDF, JPG, PNG — max 10 MB</span>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return } if (f) setProofFile(f) }} className="sr-only" />
                    </label>
                  )}
                  <p className="text-xs text-slate-400">Your document is kept private and used only to verify your review.</p>
                </div>
              </div>
            )}

            {/* B2C Step 7: Submit */}
            {step === 7 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Review your submission</h2>
                <div className="rounded-xl border border-slate-200 p-5 space-y-4 text-sm bg-slate-50">
                  <div>
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">Company being added</p>
                    <p className="font-black text-slate-950">{company.name}</p>
                    {(company.city || company.state) && <p className="text-xs text-slate-500">{[company.city, company.state].filter(Boolean).join(', ')}</p>}
                    {company.website && <p className="text-xs text-slate-400">{company.website}</p>}
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Overall rating</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={b2cOverallRating} size="sm" />
                      <span className="font-black text-slate-950">{b2cOverallRating}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div>
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">What you loved</p>
                    <p className="text-slate-600 leading-relaxed">{b2cWritten.what_went_well}</p>
                  </div>
                  {b2cWritten.what_to_improve && (
                    <div>
                      <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">What could be better</p>
                      <p className="text-slate-600 leading-relaxed">{b2cWritten.what_to_improve}</p>
                    </div>
                  )}
                  <p className="text-slate-500">Would buy again: <span className="font-black text-slate-950">{b2cWritten.would_buy_again}</span></p>
                  {photoFile && <p className="text-slate-500">📷 Product photo attached</p>}
                  {proofFile && <p className="text-slate-500">✓ Proof of purchase attached</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={review.is_anonymous} onChange={e => updateReview({ is_anonymous: e.target.checked })} className="rounded" />
                  Post anonymously (your name won&apos;t be shown)
                </label>
                <p className="text-xs text-slate-400">By submitting, you confirm this company and review reflect your genuine experience and you agree to our Terms of Service.</p>
              </div>
            )}
          </>
        )}

        {/* ── B2B STEPS ── */}
        {!isB2C && (
          <>
            {/* B2B Step 2: Your relationship */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Your relationship with {company.name}</h2>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">I am a</Label>
                  <Select value={review.association_type} onValueChange={v => { if (v !== null) updateReview({ association_type: v }) }}>
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
                  <Select value={review.reviewer_role} onValueChange={v => { if (v !== null) updateReview({ reviewer_role: v }) }}>
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
                  <Select value={review.engagement_phase} onValueChange={v => { if (v !== null) updateReview({ engagement_phase: v }) }}>
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
                  <Select value={review.association_duration} onValueChange={v => { if (v !== null) updateReview({ association_duration: v }) }}>
                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lt_3m">Less than 3 months</SelectItem>
                      <SelectItem value="3_12m">3–12 months</SelectItem>
                      <SelectItem value="1_3y">1–3 years</SelectItem>
                      <SelectItem value="3y_plus">More than 3 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-1">
                  <TagInput
                    value={serviceTags}
                    onChange={setServiceTags}
                    label="What service or product did you use? Add hashtags"
                    placeholder="e.g. #PaymentGateway #UPIIntegration #Subscriptions"
                    required
                    hint="At least one service tag required. Press Enter or comma to confirm."
                  />
                </div>
              </div>
            )}

            {/* B2B Step 3: Ratings */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-slate-950">Rate your experience</h2>
                <p className="text-sm text-slate-500">Rate each factor from 1 (poor) to 5 (excellent).</p>
                {B2B_RATING_FACTORS.map(({ key, label, desc }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-black text-slate-950">{label}</Label>
                      <span className="text-sm text-slate-400">{b2bRatings[key] > 0 ? `${b2bRatings[key]}/5` : 'Not rated'}</span>
                    </div>
                    <p className="text-xs text-slate-400">{desc}</p>
                    <StarRating value={b2bRatings[key]} size="lg" interactive onChange={(v) => setB2bRatings(prev => ({ ...prev, [key]: v }))} />
                  </div>
                ))}
                {b2bOverallRating > 0 && (
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide">Overall rating</p>
                    <p className="text-3xl font-black text-[#6d28d9] mt-1">{b2bOverallRating}</p>
                    <StarRating value={b2bOverallRating} size="lg" className="justify-center mt-1" />
                  </div>
                )}
              </div>
            )}

            {/* B2B Step 4: Written experience */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Share your experience</h2>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
                    What went well? <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    placeholder="Describe what you liked about working with them…"
                    value={review.what_went_well}
                    onChange={e => updateReview({ what_went_well: e.target.value })}
                    rows={4}
                    className="border-slate-200 text-sm"
                  />
                  <p className="text-xs text-slate-400">{review.what_went_well.length} chars (min 20)</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">What could be improved?</Label>
                  <Textarea
                    placeholder="Any areas where they could do better…"
                    value={review.what_to_improve}
                    onChange={e => updateReview({ what_to_improve: e.target.value })}
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
                      <button key={v} type="button"
                        onClick={() => updateReview({ would_recommend: v })}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-colors ${review.would_recommend === v ? 'border-[#6d28d9] bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                {review.would_recommend && review.would_recommend !== 'yes' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Why?</Label>
                    <Textarea
                      placeholder="Explain your recommendation…"
                      value={review.recommend_reason}
                      onChange={e => updateReview({ recommend_reason: e.target.value })}
                      rows={2}
                      className="border-slate-200 text-sm"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Additional notes (optional)</Label>
                  <Textarea
                    placeholder="Anything else you'd like to add…"
                    value={review.additional_notes}
                    onChange={e => updateReview({ additional_notes: e.target.value })}
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
                    hint="Click a chip or type your own."
                  />
                </div>
              </div>
            )}

            {/* B2B Step 5: Proof upload */}
            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Verify your experience <span className="text-slate-400 font-normal text-base">(optional)</span></h2>
                <p className="text-sm text-slate-500">
                  Upload proof of your engagement (invoice, contract, email) to earn a Verified buyer badge.
                </p>
                {proofFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#6d28d9] bg-violet-50 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-950 truncate">{proofFile.name}</p>
                      <p className="text-xs text-slate-400">{(proofFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => setProofFile(null)} className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Click to upload proof</span>
                    <span className="text-xs text-slate-400">PDF, JPG, PNG — max 10 MB</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f && f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return } if (f) setProofFile(f) }} className="sr-only" />
                  </label>
                )}
                <p className="text-xs text-slate-400">Your document is kept private and used only to verify your review.</p>
              </div>
            )}

            {/* B2B Step 6: Submit */}
            {step === 6 && (
              <div className="space-y-5">
                <h2 className="text-lg font-black text-slate-950">Review your submission</h2>
                <div className="rounded-xl border border-slate-200 p-5 space-y-4 text-sm bg-slate-50">
                  <div>
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">Company being added</p>
                    <p className="font-black text-slate-950">{company.name}</p>
                    {(company.city || company.state) && <p className="text-xs text-slate-500">{[company.city, company.state].filter(Boolean).join(', ')}</p>}
                    {company.website && <p className="text-xs text-slate-400">{company.website}</p>}
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Overall rating</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={b2bOverallRating} size="sm" />
                      <span className="font-black text-slate-950">{b2bOverallRating}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div>
                    <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">What went well</p>
                    <p className="text-slate-600 leading-relaxed">{review.what_went_well}</p>
                  </div>
                  {review.what_to_improve && (
                    <div>
                      <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">What to improve</p>
                      <p className="text-slate-600 leading-relaxed">{review.what_to_improve}</p>
                    </div>
                  )}
                  <p className="text-slate-500">Would recommend: <span className="font-black text-slate-950">{review.would_recommend}</span></p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={review.is_anonymous} onChange={e => updateReview({ is_anonymous: e.target.checked })} className="rounded" />
                  Post anonymously (your name won&apos;t be shown)
                </label>
                <p className="text-xs text-slate-400">By submitting, you confirm this company and review reflect your genuine experience and you agree to our Terms of Service.</p>
              </div>
            )}
          </>
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
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance()}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {isProofStep && !hasProofAttached ? 'Skip' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {submitting ? 'Publishing…' : 'Add company & publish review'}
          </button>
        )}
      </div>
    </div>
  )
}
