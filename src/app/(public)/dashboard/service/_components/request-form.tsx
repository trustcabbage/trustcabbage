'use client'

import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sendServiceRequests, type RequestState } from '../_actions'
import { CheckCircle, XCircle } from 'lucide-react'

interface Product { id: string; name: string }

export function RequestForm({ products }: { products: Product[] }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [state, formAction, pending] = useActionState<RequestState, FormData>(sendServiceRequests, undefined)

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-6">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        {([['single', 'One customer'], ['bulk', 'Multiple customers']] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${
              mode === m ? 'bg-[#6d28d9] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />

        {mode === 'single' ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer_name" className="text-xs font-black uppercase tracking-wide text-slate-400">
                Customer name <span className="text-red-400">*</span>
              </Label>
              <Input id="customer_name" name="customer_name" placeholder="Rahul Sharma" required className="border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer_email" className="text-xs font-black uppercase tracking-wide text-slate-400">
                Customer email <span className="text-red-400">*</span>
              </Label>
              <Input id="customer_email" name="customer_email" type="email" placeholder="rahul@example.com" required className="border-slate-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="bulk" className="text-xs font-black uppercase tracking-wide text-slate-400">
              One customer per line: name, email <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="bulk"
              name="bulk"
              rows={5}
              placeholder={'Rahul Sharma, rahul@example.com\nPriya Patel, priya@example.com'}
              className="border-slate-200 text-sm font-mono"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="product_service_id" className="text-xs font-black uppercase tracking-wide text-slate-400">Product (optional)</Label>
            <select
              id="product_service_id"
              name="product_service_id"
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              defaultValue=""
            >
              <option value="">Whole company</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_date" className="text-xs font-black uppercase tracking-wide text-slate-400">Purchase date (optional)</Label>
            <Input id="purchase_date" name="purchase_date" type="date" className="border-slate-200" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="order_ref" className="text-xs font-black uppercase tracking-wide text-slate-400">Order ref (optional)</Label>
            <Input id="order_ref" name="order_ref" placeholder="ORD-1042" className="border-slate-200" />
          </div>
        </div>

        {state?.formError && <p className="text-sm font-bold text-rose-600">{state.formError}</p>}
        {state?.limitError && <p className="text-sm font-bold text-amber-700">{state.limitError}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {pending ? 'Sending…' : 'Send request'}
        </button>

        <p className="text-xs text-slate-400">
          Complaints your customers raise appear publicly no later than 72 hours after submission.
          Resolve them first and they publish already marked resolved.
        </p>
      </form>

      {/* Results */}
      {state?.results && state.results.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4 space-y-1.5">
          {state.results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.status === 'sent'
                ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                : <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />}
              <span className="font-bold text-slate-950">{r.name}</span>
              <span className="text-slate-400">{r.email}</span>
              {r.error && <span className="text-xs text-rose-500">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
