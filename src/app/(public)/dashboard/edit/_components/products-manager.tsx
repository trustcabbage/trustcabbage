'use client'

import { useActionState } from 'react'
import { addProduct, deleteProduct } from '../_actions'
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle, Package2, Wrench } from 'lucide-react'

interface Product {
  id: string
  name: string
  type: string
  description: string | null
  price_range: string | null
}

export function ProductsManager({ products }: { products: Product[] }) {
  const [addState, addAction, addPending] = useActionState(addProduct, undefined)
  const [delState, delAction, delPending] = useActionState(deleteProduct, undefined)

  const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors'
  const label = 'block text-xs font-black text-slate-600 mb-1.5'

  return (
    <div className="space-y-6">

      {/* Existing products */}
      {products.length > 0 ? (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                {p.type === 'product'
                  ? <Package2 className="h-4 w-4 text-violet-600" />
                  : <Wrench className="h-4 w-4 text-violet-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-400 capitalize">{p.type}{p.price_range ? ` · ${p.price_range}` : ''}</p>
              </div>
              <form action={delAction}>
                <input type="hidden" name="product_id" value={p.id} />
                <button
                  type="submit"
                  disabled={delPending}
                  className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {delPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </form>
            </div>
          ))}
          {delState?.error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5" />{delState.error}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">No products or services listed yet.</p>
      )}

      {/* Add new */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add product or service
        </h3>

        {addState?.error && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {addState.error}
          </div>
        )}
        {addState?.success && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> Added!
          </div>
        )}

        <form action={addAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label}>Name *</label>
              <input name="name" type="text" required className={input} placeholder="e.g. Performance Marketing" key={addState?.success} />
            </div>
            <div>
              <label className={label}>Type *</label>
              <select name="type" className={input} defaultValue="service">
                <option value="service">Service</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div>
              <label className={label}>Price range</label>
              <input name="price_range" type="text" className={input} placeholder="e.g. ₹50k–₹2L/month" key={`pr-${addState?.success}`} />
            </div>
            <div>
              <label className={label}>Short description</label>
              <input name="description" type="text" className={input} placeholder="One-liner about this offering" key={`desc-${addState?.success}`} />
            </div>
          </div>
          <button
            type="submit"
            disabled={addPending}
            className="flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-5 py-2.5 text-xs transition-colors"
          >
            {addPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
          </button>
        </form>
      </div>
    </div>
  )
}
