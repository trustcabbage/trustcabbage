import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Browse categories — Trust Cabbage' }

type Props = { searchParams: Promise<{ tab?: string }> }

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

export default async function CategoriesPage({ searchParams }: Props) {
  const { tab = 'b2b' } = await searchParams
  const isB2c = tab === 'b2c'
  const platformTypes = isB2c ? ['b2c', 'both'] : ['b2b', 'both']

  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description')
    .eq('is_active', true)
    .is('parent_id', null)
    .in('platform_type', platformTypes)
    .order('sort_order')

  const categories = (data as unknown as CategoryRow[]) ?? []

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <span className="inline-block rounded-full bg-white/10 text-violet-300 px-3 py-1 text-xs font-black uppercase tracking-wide mb-4">
            Browse
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">All categories</h1>
          <p className="mt-2 text-base text-slate-300">
            {isB2c ? 'Online brands, D2C stores, and retail chains' : 'Find B2B companies by industry or service type'}
          </p>

          {/* Tab toggle */}
          <div className="mt-6 flex gap-2 flex-wrap">
            <Link
              href="/categories"
              className={`rounded-full px-5 py-2 text-sm font-black transition-colors ${
                !isB2c
                  ? 'bg-white text-[#6d28d9]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🏢 B2B Services
            </Link>
            <Link
              href="/categories?tab=b2c"
              className={`rounded-full px-5 py-2 text-sm font-black transition-colors ${
                isB2c
                  ? 'bg-white text-rose-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              🛍️ Online Brands & Stores
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-4">{isB2c ? '🛍️' : '🏢'}</p>
            <p className="font-black text-slate-700">No categories yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`flex gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all group shadow-sm ${
                  isB2c ? 'hover:border-rose-300' : 'hover:border-[#6d28d9]'
                }`}
              >
                <span className="text-3xl flex-shrink-0">{cat.icon ?? (isB2c ? '🛍️' : '🏢')}</span>
                <div>
                  <p className={`font-black text-slate-950 ${isB2c ? 'group-hover:text-rose-600' : 'group-hover:text-[#6d28d9]'}`}>
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-sm text-slate-500 mt-1 leading-5 line-clamp-2">{stripMd(cat.description)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
