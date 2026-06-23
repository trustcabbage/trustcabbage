'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { BusinessTypeSelector, type BusinessType } from '@/components/business-type-selector'

interface Company { id: string; name: string; slug: string; business_type: string }

const PROOF_TYPE_LABELS: Record<string, string> = {
  gst: 'GST Certificate',
  cin: 'CIN / MCA filing',
  domain_email: 'Domain email (company email address)',
  other: 'Other official document',
}

export function ClaimForm({ company, userId }: { company: Company; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [proofType, setProofType] = useState('')
  const [proofNotes, setProofNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType | ''>(
    (company.business_type as BusinessType) ?? ''
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB')
      return
    }
    setFile(f)
  }

  async function submit() {
    if (!proofType) { toast.error('Please select a proof type'); return }

    setSubmitting(true)
    let proofDocumentUrl: string | null = null

    if (file) {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const path = `${userId}/${company.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('claim-documents')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        toast.error('Failed to upload document. Please try again.')
        setUploading(false)
        setSubmitting(false)
        return
      }

      const { data: urlData } = supabase.storage.from('claim-documents').getPublicUrl(path)
      proofDocumentUrl = urlData.publicUrl
      setUploading(false)
    }

    // Update business_type if it changed
    if (businessType && businessType !== company.business_type) {
      await supabase.from('companies').update({ business_type: businessType }).eq('id', company.id)
    }

    const { error } = await supabase.from('company_claims').insert({
      company_id: company.id,
      claimant_id: userId,
      proof_type: proofType,
      proof_notes: proofNotes || null,
      proof_document_url: proofDocumentUrl,
      status: 'pending',
    })

    setSubmitting(false)

    if (error) {
      toast.error('Failed to submit claim. Please try again.')
      return
    }

    toast.success("Claim submitted! We'll review it within 2–3 business days.")
    router.push(`/company/${company.slug}`)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {['Proof of ownership', 'Confirm company type'].map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              i === step ? 'bg-[#6d28d9] text-white' : i < step ? 'bg-violet-100 text-[#6d28d9]' : 'bg-slate-100 text-slate-400'
            }`}>{i + 1}</div>
            <span className={`text-xs font-black ${i === step ? 'text-[#6d28d9]' : i < step ? 'text-violet-500' : 'text-slate-400'}`}>{label}</span>
            {i === 0 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div key={step} className="animate-in fade-in slide-in-from-bottom-3 duration-300">

      {/* Step 0: Proof upload */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 text-sm text-slate-700">
            <p className="font-black text-[#6d28d9] mb-1">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Select the type of proof you can provide</li>
              <li>Upload a document (optional but speeds up approval)</li>
              <li>Our team reviews and approves within 2–3 business days</li>
            </ol>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
              Proof type <span className="text-red-400">*</span>
            </Label>
            <Select value={proofType} onValueChange={(v) => { if (v !== null) setProofType(v) }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="Select proof type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROOF_TYPE_LABELS).map(([v, label]) => (
                  <SelectItem key={v} value={v}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {proofType === 'gst' && (
              <p className="text-xs text-slate-400">Upload your GST certificate or paste your GSTIN in the notes below.</p>
            )}
            {proofType === 'cin' && (
              <p className="text-xs text-slate-400">Upload a recent MCA filing or paste your CIN in the notes.</p>
            )}
            {proofType === 'domain_email' && (
              <p className="text-xs text-slate-400">We'll send a verification link to your company domain email after review.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proof_notes" className="text-xs font-black uppercase tracking-wide text-slate-400">
              Notes / registration number
            </Label>
            <Textarea
              id="proof_notes"
              placeholder={
                proofType === 'gst' ? 'e.g. GSTIN: 22AAAAA0000A1Z5' :
                proofType === 'cin' ? 'e.g. CIN: U72200MH2010PTC123456' :
                proofType === 'domain_email' ? 'e.g. your work email: yourname@company.com' :
                "Describe the document you're providing…"
              }
              value={proofNotes}
              onChange={e => setProofNotes(e.target.value)}
              rows={3}
              className="border-slate-200 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
              Supporting document <span className="text-slate-400 font-normal">(optional, max 10 MB)</span>
            </Label>
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#6d28d9] bg-violet-50 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-950 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-8 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm font-bold text-slate-600">Click to upload</span>
                <span className="text-xs text-slate-400">PDF, JPG, PNG</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={!proofType}
            className="w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-3 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 1: Business type correction */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-black text-slate-950">Confirm your company type</h2>
            <p className="text-sm text-slate-500 mt-1">
              This was set when the page was created. Correct it if needed — it affects which review questions your customers see.
            </p>
          </div>

          <BusinessTypeSelector
            value={businessType}
            onChange={(v) => setBusinessType(v)}
          />

          <p className="text-xs text-slate-400">
            By submitting, you confirm that you are an authorised representative of {company.name} and the information provided is accurate.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !businessType}
              className="flex-1 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-3 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              {uploading ? 'Uploading…' : submitting ? 'Submitting…' : 'Submit claim'}
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
