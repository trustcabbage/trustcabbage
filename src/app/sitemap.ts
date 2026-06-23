import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

type CompanySlug  = { slug: string; updated_at: string }
type CategorySlug = { slug: string }

// Plain anon client — no cookies, safe inside unstable_cache
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const getSitemapData = unstable_cache(
  async () => {
    const supabase = getSupabase()
    const [{ data: companiesData }, { data: categoriesData }] = await Promise.all([
      supabase.from('companies').select('slug, updated_at').order('updated_at', { ascending: false }),
      supabase.from('categories').select('slug').eq('is_active', true),
    ])
    return {
      companies:  (companiesData  as unknown as CompanySlug[])  ?? [],
      categories: (categoriesData as unknown as CategorySlug[]) ?? [],
    }
  },
  ['sitemap-data'],
  { revalidate: 3600 },
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const { companies, categories } = await getSitemapData()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${baseUrl}/search`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const companyRoutes: MetadataRoute.Sitemap = companies.map(c => ({
    url: `${baseUrl}/company/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...companyRoutes, ...categoryRoutes]
}
