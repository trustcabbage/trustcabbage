import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

type CompanySlug = { slug: string; updated_at: string }
type CategorySlug = { slug: string }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'

  const [{ data: companiesData }, { data: categoriesData }] = await Promise.all([
    supabase.from('companies').select('slug, updated_at').order('updated_at', { ascending: false }),
    supabase.from('categories').select('slug').eq('is_active', true),
  ])

  const companies = (companiesData as unknown as CompanySlug[]) ?? []
  const categories = (categoriesData as unknown as CategorySlug[]) ?? []

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
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
