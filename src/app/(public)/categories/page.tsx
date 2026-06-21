import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Browse categories' }

type CategoryRow = { id: string; name: string; slug: string; icon: string | null; description: string | null }

function stripMd(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order')

  const categories = (data as unknown as CategoryRow[]) ?? []

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="inline-block rounded-full bg-white/10 text-[#6d28d9] px-3 py-1 text-xs font-black uppercase tracking-wide mb-4">
            Browse
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">All categories</h1>
          <p className="mt-3 text-base text-slate-300">Find B2B companies by industry or service type</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-[#6d28d9] hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-sm"
            >
              <span className="text-3xl flex-shrink-0">{cat.icon ?? '🏢'}</span>
              <div>
                <p className="font-black text-slate-950 group-hover:text-[#6d28d9]">{cat.name}</p>
                {cat.description && <p className="text-sm text-slate-500 mt-1 leading-5 line-clamp-2">{stripMd(cat.description)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
