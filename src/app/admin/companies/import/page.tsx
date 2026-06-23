import { CsvImporter } from './_components/csv-importer'
import { createClient } from '@/lib/supabase/server'

type Category = { id: string; name: string; slug: string }

export default async function AdminImportPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order')
  const categories = (data as unknown as Category[]) ?? []

  const TEMPLATE = `name,website,description,city,state,founded_year,employee_count,category_slugs,gst_number,cin_number,business_type
Razorpay,https://razorpay.com,"India's leading payment gateway",Bengaluru,Karnataka,2014,500+,payment-gateways,,,business_services
Shiprocket,https://shiprocket.in,"Ecommerce shipping solution",Delhi,Delhi,2017,201-500,logistics,,,business_services
Nykaa,https://nykaa.com,"Beauty & fashion marketplace",Mumbai,Maharashtra,2012,500+,beauty-personal-care,,,online_b2c`

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Bulk import companies</h1>
        <p className="text-sm text-slate-500 mt-1">Import multiple companies at once from a CSV file.</p>
      </div>

      {/* Template download */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-950">Step 1 — Download template</h2>
        <p className="text-sm text-slate-600">Use this CSV template. The <code className="bg-slate-100 px-1 rounded text-xs">category_slugs</code> column accepts pipe-separated slugs. The <code className="bg-slate-100 px-1 rounded text-xs">business_type</code> column accepts: <code className="bg-slate-100 px-1 rounded text-xs">business_services</code>, <code className="bg-slate-100 px-1 rounded text-xs">online_b2c</code>, <code className="bg-slate-100 px-1 rounded text-xs">retail_chain</code>. Leave blank to default to <code className="bg-slate-100 px-1 rounded text-xs">business_services</code>.</p>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 overflow-x-auto">
          <pre className="text-xs text-slate-600 font-mono whitespace-pre">{TEMPLATE}</pre>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
          download="trust-cabbage-companies-template.csv"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Download template CSV
        </a>

        <div className="mt-4 space-y-1">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Active category slugs you can use:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(cat => (
              <code key={cat.id} className="bg-violet-50 text-[#6d28d9] px-2 py-0.5 rounded text-xs font-mono">{cat.slug}</code>
            ))}
          </div>
        </div>
      </div>

      {/* Uploader */}
      <CsvImporter categories={categories} />
    </div>
  )
}
