import type { SupabaseClient } from '@supabase/supabase-js'

export interface TagChip {
  id?: string
  name: string
  slug: string
}

export function toTagSlug(input: string): string {
  return input
    .replace(/^#/, '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')        // camelCase → kebab (paymentGateway → payment-Gateway)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')  // acronym run → kebab (UPIPayment → UPI-Payment)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Resolve a typed tag to its canonical form, creating if needed.
// Checks synonyms → existing slug → creates new unverified tag.
export async function resolveTag(
  input: string,
  supabase: SupabaseClient,
  tagType: 'service' | 'sentiment' | 'technology' | 'general' = 'general'
): Promise<TagChip | null> {
  const slug = toTagSlug(input)
  if (!slug || slug.length < 2) return null

  // 1. Check synonym table for alias
  const { data: synonym } = await supabase
    .from('tag_synonyms')
    .select('canonical_tag_id')
    .eq('alias_name', slug)
    .maybeSingle()

  if (synonym?.canonical_tag_id) {
    const { data: canonical } = await supabase
      .from('tags')
      .select('id, name, slug')
      .eq('id', synonym.canonical_tag_id)
      .single()
    if (canonical) return canonical as TagChip
  }

  // 2. Check existing canonical tag by slug
  const { data: existing } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) return existing as TagChip

  // 3. Create new unverified tag
  const name = input.replace(/^#/, '').trim()
  const { data: created } = await supabase
    .from('tags')
    .insert({ name, slug, type: tagType, is_admin_verified: false })
    .select('id, name, slug')
    .single()
  return created as TagChip | null
}

// Resolve an array of tags, deduplicating by slug.
export async function resolveTags(
  inputs: TagChip[],
  supabase: SupabaseClient,
  tagType: 'service' | 'sentiment' | 'technology' | 'general' = 'general'
): Promise<TagChip[]> {
  const seen = new Set<string>()
  const results: TagChip[] = []
  for (const chip of inputs) {
    if (chip.id) {
      if (!seen.has(chip.slug)) { seen.add(chip.slug); results.push(chip) }
      continue
    }
    const resolved = await resolveTag(chip.name, supabase, tagType)
    if (resolved && !seen.has(resolved.slug)) {
      seen.add(resolved.slug)
      results.push(resolved)
    }
  }
  return results
}
