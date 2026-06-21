'use client'
import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

type Category = { id: string; name: string; slug: string; icon: string | null; description: string | null }

export function CategoryChips({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<Category | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActive(cat)}
            className="rounded-full bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 text-xs font-bold hover:border-[#6d28d9] hover:text-[#6d28d9] transition-colors cursor-pointer"
          >
            {cat.icon && <span className="mr-1">{cat.icon}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                {active.icon && <span className="text-3xl leading-none mt-0.5">{active.icon}</span>}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Category</p>
                  <h3 className="text-lg font-black text-slate-950 leading-tight">{active.name}</h3>
                </div>
              </div>
              {active.description ? (
                <div className="text-sm text-slate-600 mt-3 leading-relaxed max-h-[7em] overflow-hidden [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                  <ReactMarkdown>{active.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-3 italic">No description available.</p>
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-5 py-4 bg-slate-50">
              <p className="text-xs text-slate-500 font-bold mb-3">
                Want to see more companies providing these services?
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/categories/${active.slug}`}
                  className="flex-1 text-center rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black text-sm px-4 py-2.5 transition-colors"
                >
                  Yes, explore →
                </Link>
                <button
                  onClick={() => setActive(null)}
                  className="rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-black text-sm px-4 py-2.5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
