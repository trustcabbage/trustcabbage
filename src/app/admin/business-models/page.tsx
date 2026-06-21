import { createClient } from '@/lib/supabase/server'
import { createBusinessModel, updateBusinessModel, deleteBusinessModel } from './_actions'

type BusinessModel = { id: string; name: string; slug: string; description: string | null; sort_order: number }

const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"
const labelCls = "text-xs font-black uppercase tracking-wide text-slate-400"

export default async function AdminBusinessModelsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('business_models')
    .select('id, name, slug, description, sort_order')
    .order('sort_order')

  const models = (data as unknown as BusinessModel[]) ?? []

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Business Models</h1>
        <p className="text-sm text-slate-500 mt-1">Defines how a company operates. One model per company (e.g. Payment Aggregator, SaaS Platform, Agency).</p>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-black text-slate-950 mb-5">Add business model</h2>
        <form action={createBusinessModel} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Name <span className="text-red-400">*</span></label>
              <input name="name" required placeholder="e.g. Payment Aggregator" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Description <span className="normal-case font-normal text-slate-400">(shown as tooltip)</span></label>
              <input name="description" placeholder="One line explaining this model" className={inputCls} />
            </div>
          </div>
          <button type="submit" className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm transition-colors">
            Add model
          </button>
        </form>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-black text-slate-700">{models.length} business models</p>
        </div>
        {models.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No business models yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {models.map(m => (
              <div key={m.id}>
                <div className="flex items-start justify-between px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-950">{m.name}</p>
                      <code className="text-xs text-slate-400 font-mono">{m.slug}</code>
                    </div>
                    {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <form action={deleteBusinessModel.bind(null, m.id)}>
                      <button type="submit" className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {/* Inline edit */}
                <details className="border-t border-slate-50">
                  <summary className="px-5 py-2 text-xs font-black text-[#6d28d9] cursor-pointer hover:bg-violet-50 transition-colors list-none">
                    ✏️ Edit
                  </summary>
                  <div className="px-5 py-4 bg-violet-50/40 border-t border-violet-100">
                    <form action={updateBusinessModel.bind(null, m.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={labelCls}>Name</label>
                        <input name="name" defaultValue={m.name} required className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Description</label>
                        <input name="description" defaultValue={m.description ?? ''} placeholder="One line description" className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <button type="submit" className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2 text-sm transition-colors">
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
