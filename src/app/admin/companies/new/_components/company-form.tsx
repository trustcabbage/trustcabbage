'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Upload } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string; icon: string | null; parent_id: string | null }
interface BusinessModel { id: string; name: string; slug: string; description: string | null }

interface Product {
  name: string; type: 'product' | 'service'; description: string; price_range: string
}

const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '500+']

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'Jammu & Kashmir',
]

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

type Mode = 'create' | 'edit'

interface CompanyFormProps {
  categories: Category[]
  businessModels: BusinessModel[]
  mode: Mode
  initialData?: any
}

export function CompanyForm({ categories, businessModels, mode, initialData }: CompanyFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const parents = categories.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  const [info, setInfo] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    website: initialData?.website ?? '',
    description: initialData?.description ?? '',
    long_description: initialData?.long_description ?? '',
    founded_year: initialData?.founded_year?.toString() ?? '',
    employee_count: initialData?.employee_count ?? '',
    city: initialData?.city ?? '',
    state: initialData?.state ?? '',
    gst_number: initialData?.gst_number ?? '',
    cin_number: initialData?.cin_number ?? '',
  })

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category_ids ?? []
  )
  const [businessModelId, setBusinessModelId] = useState<string>(
    initialData?.business_model_id ?? ''
  )
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.logo_url ?? '')
  const [products, setProducts] = useState<Product[]>(
    initialData?.products ?? [{ name: '', type: 'service', description: '', price_range: '' }]
  )

  function updateInfo(patch: Partial<typeof info>) {
    setInfo(prev => {
      const next = { ...prev, ...patch }
      if (patch.name !== undefined && mode === 'create') next.slug = toSlug(patch.name)
      return next
    })
  }

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function addProduct() {
    setProducts(prev => [...prev, { name: '', type: 'service', description: '', price_range: '' }])
  }

  function removeProduct(i: number) {
    setProducts(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateProduct(i: number, patch: Partial<Product>) {
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5 MB'); return }
    setLogoFile(f)
    setLogoPreview(URL.createObjectURL(f))
  }

  async function findUniqueSlug(base: string): Promise<string> {
    let slug = base; let i = 2
    while (true) {
      const { data } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle()
      if (!data) return slug
      slug = `${base}-${i++}`
    }
  }

  async function save() {
    if (!info.name.trim()) { toast.error('Company name is required'); return }
    if (selectedCategories.length === 0) { toast.error('Select at least one category'); return }
    setSaving(true)

    let logoUrl = initialData?.logo_url ?? null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `${info.slug}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('company-logos').upload(path, logoFile, { upsert: true })
      if (error) { toast.error('Failed to upload logo'); setSaving(false); return }
      logoUrl = supabase.storage.from('company-logos').getPublicUrl(path).data.publicUrl
    }

    const slug = mode === 'create' ? await findUniqueSlug(info.slug || toSlug(info.name)) : info.slug

    const payload = {
      name: info.name.trim(),
      slug,
      website: info.website.trim() || null,
      description: info.description.trim() || null,
      long_description: info.long_description.trim() || null,
      founded_year: info.founded_year ? parseInt(info.founded_year) : null,
      employee_count: info.employee_count || null,
      city: info.city.trim() || null,
      state: info.state || null,
      gst_number: info.gst_number.trim() || null,
      cin_number: info.cin_number.trim() || null,
      logo_url: logoUrl,
      business_model_id: businessModelId || null,
      status: 'unclaimed',
      created_by_admin: true,
    }

    let companyId: string

    if (mode === 'create') {
      const { data, error } = await supabase.from('companies').insert(payload).select('id, slug').single()
      if (error || !data) { toast.error('Failed to create company: ' + error?.message); setSaving(false); return }
      companyId = data.id

      await supabase.from('company_categories').insert(
        selectedCategories.map(cid => ({ company_id: companyId, category_id: cid }))
      )
    } else {
      const { error } = await supabase.from('companies').update(payload).eq('id', initialData.id)
      if (error) { toast.error('Failed to update company: ' + error.message); setSaving(false); return }
      companyId = initialData.id

      await supabase.from('company_categories').delete().eq('company_id', companyId)
      await supabase.from('company_categories').insert(
        selectedCategories.map(cid => ({ company_id: companyId, category_id: cid }))
      )
    }

    await supabase.from('products_services').delete().eq('company_id', companyId)

    const validProducts = products.filter(p => p.name.trim())
    if (validProducts.length > 0) {
      await supabase.from('products_services').insert(
        validProducts.map((p, i) => ({
          company_id: companyId,
          name: p.name.trim(),
          type: p.type,
          description: p.description.trim() || null,
          price_range: p.price_range.trim() || null,
          sort_order: i,
          created_by_admin: true,
          is_active: true,
        }))
      )
    }

    setSaving(false)
    toast.success(mode === 'create' ? 'Company created!' : 'Company updated!')
    router.push('/admin/companies')
    router.refresh()
  }

  const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-black text-slate-950">Basic information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Company name *</Label>
            <input type="text" value={info.name} onChange={e => updateInfo({ name: e.target.value })} placeholder="e.g. Razorpay" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Slug *</Label>
            <input type="text" value={info.slug} onChange={e => updateInfo({ slug: e.target.value })} placeholder="auto-generated" className={inputCls} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Short description</Label>
            <input type="text" value={info.description} onChange={e => updateInfo({ description: e.target.value })} placeholder="1–2 lines shown on company cards" className={inputCls} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Long description (About section)</Label>
            <Textarea value={info.long_description} onChange={e => updateInfo({ long_description: e.target.value })} rows={4} placeholder="Full about section shown on company profile page" className="border-slate-200 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Website</Label>
            <input type="url" value={info.website} onChange={e => updateInfo({ website: e.target.value })} placeholder="https://" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Founded year</Label>
            <input type="number" value={info.founded_year} onChange={e => updateInfo({ founded_year: e.target.value })} placeholder="e.g. 2014" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Employee count</Label>
            <Select value={info.employee_count} onValueChange={v => { if (v !== null) updateInfo({ employee_count: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select range" /></SelectTrigger>
              <SelectContent>{EMPLOYEE_RANGES.map(r => <SelectItem key={r} value={r}>{r} employees</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">City</Label>
            <input type="text" value={info.city} onChange={e => updateInfo({ city: e.target.value })} placeholder="e.g. Bengaluru" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">State</Label>
            <Select value={info.state} onValueChange={v => { if (v !== null) updateInfo({ state: v }) }}>
              <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>{INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">GST number</Label>
            <input type="text" value={info.gst_number} onChange={e => updateInfo({ gst_number: e.target.value })} placeholder="Optional" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">CIN number</Label>
            <input type="text" value={info.cin_number} onChange={e => updateInfo({ cin_number: e.target.value })} placeholder="Optional" className={inputCls} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-black uppercase tracking-wide text-slate-400">
              Business model <span className="normal-case font-normal text-slate-400">— how does this company operate?</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBusinessModelId('')}
                className={`rounded-full px-3 py-1.5 text-xs font-black border transition-colors ${
                  !businessModelId ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}
              >
                Not set
              </button>
              {businessModels.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBusinessModelId(m.id)}
                  title={m.description ?? undefined}
                  className={`rounded-full px-3 py-1.5 text-xs font-black border transition-colors ${
                    businessModelId === m.id
                      ? 'border-[#6d28d9] bg-[#6d28d9] text-white'
                      : 'border-slate-200 text-slate-600 hover:border-[#6d28d9] hover:text-[#6d28d9]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-950">Logo</h2>
        <div className="flex items-center gap-5">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl">
              {info.name[0] ?? '?'}
            </div>
          )}
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
            <Upload className="h-4 w-4" /> Upload logo
            <input type="file" accept="image/*" onChange={handleLogoChange} className="sr-only" />
          </label>
          <p className="text-xs text-slate-400">PNG or JPG, max 5 MB. Square preferred.</p>
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-950">Categories *</h2>
        <p className="text-xs text-slate-500">Select all that apply. You can select both parent categories and subcategories.</p>
        <div className="space-y-4">
          {parents.map(parent => (
            <div key={parent.id}>
              <button
                type="button"
                onClick={() => toggleCategory(parent.id)}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-black text-left transition-colors ${
                  selectedCategories.includes(parent.id)
                    ? 'border-[#6d28d9] bg-violet-50 text-violet-900'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {parent.icon && <span>{parent.icon}</span>}
                {parent.name}
              </button>
              {childrenOf(parent.id).length > 0 && (
                <div className="ml-6 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {childrenOf(parent.id).map(child => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleCategory(child.id)}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-colors ${
                        selectedCategories.includes(child.id)
                          ? 'border-[#6d28d9] bg-violet-50 text-violet-900'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Products & services */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-950">Products & services</h2>
          <button
            type="button"
            onClick={addProduct}
            className="flex items-center gap-1.5 text-xs font-black text-[#6d28d9] hover:text-[#7c3aed] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add another
          </button>
        </div>
        <p className="text-xs text-slate-500">These appear in the review form as selectable options for reviewers.</p>
        <div className="space-y-4">
          {products.map((p, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Name</Label>
                <input type="text" value={p.name} onChange={e => updateProduct(i, { name: e.target.value })} placeholder="e.g. Payment Gateway API" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Type</Label>
                <Select value={p.type} onValueChange={v => { if (v !== null) updateProduct(i, { type: v as 'product' | 'service' }) }}>
                  <SelectTrigger className="border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Description</Label>
                <input type="text" value={p.description} onChange={e => updateProduct(i, { description: e.target.value })} placeholder="Short description" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-slate-400">Price range</Label>
                <input type="text" value={p.price_range} onChange={e => updateProduct(i, { price_range: e.target.value })} placeholder="e.g. ₹5,000–₹50,000/month" className={inputCls} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-8 py-3 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          {saving ? 'Saving…' : mode === 'create' ? 'Create company' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/companies')}
          className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
