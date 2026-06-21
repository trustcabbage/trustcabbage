import { createClient } from '@/lib/supabase/server'
import { createCategory, toggleCategory, updateCategory } from './_actions'
import { EmojiPicker } from './_components/emoji-picker'
import { FeatureManager } from './_components/feature-manager'

type Category = {
  id: string; name: string; slug: string; icon: string | null; description: string | null
  image_url: string | null; is_active: boolean; parent_id: string | null; sort_order: number; is_featured: boolean
}

const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"
const labelCls = "text-xs font-black uppercase tracking-wide text-slate-400"

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon, image_url, description, is_active, parent_id, sort_order, is_featured')
    .order('sort_order')

  const all = (data as unknown as Category[]) ?? []
  const parents = all.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) => all.filter(c => c.parent_id === parentId)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black text-slate-950">Categories</h1>

      {/* Create form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-950 mb-5">Add category or subcategory</h2>
        <form action={createCategory} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Name <span className="text-red-400">*</span></label>
              <input name="name" required placeholder="e.g. Payment Gateways" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Slug <span className="text-red-400">*</span></label>
              <input name="slug" required placeholder="e.g. payment-gateways" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Parent (leave blank for top-level)</label>
              <select name="parent_id" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] bg-white">
                <option value="">— Top-level category —</option>
                {parents.map(p => (
                  <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Icon emoji</label>
              <EmojiPicker name="icon" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Hero image URL <span className="normal-case font-normal text-slate-400">(optional — shown as background in category page banner)</span></label>
            <input name="image_url" placeholder="https://images.unsplash.com/..." className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Description <span className="normal-case font-normal text-slate-400">— supports **bold**, *italic*, line breaks, lists</span></label>
            <textarea
              name="description"
              rows={4}
              placeholder="Full description shown on the category page. Explain what services fall under this category, who it's for, etc."
              className={`${inputCls} resize-y min-h-[100px]`}
            />
          </div>
          <div className="flex items-center gap-4 pt-1">
            <button type="submit" className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm transition-colors">
              Create category
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" name="is_featured" value="1" className="rounded" />
              Featured on homepage
            </label>
          </div>
        </form>
      </div>

      {/* Category tree */}
      <div className="space-y-4">
        {parents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">No categories yet.</div>
        ) : (
          parents.map(parent => (
            <div key={parent.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Parent header */}
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  {parent.icon && <span className="text-xl">{parent.icon}</span>}
                  <span className="font-black text-slate-950">{parent.name}</span>
                  <code className="text-xs text-slate-400 font-mono">{parent.slug}</code>
                  {parent.is_featured && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-black text-[#6d28d9]">Featured</span>}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-black ${parent.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                    {parent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{childrenOf(parent.id).length} subcategories</span>
                  <form action={toggleCategory.bind(null, parent.id, parent.is_active)}>
                    <button type="submit" className="text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
                      {parent.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Description preview */}
              {parent.description && (
                <div className="px-5 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-100 italic">
                  {parent.description}
                </div>
              )}

              {/* Inline edit (details/summary) */}
              <details className="border-b border-slate-100">
                <summary className="px-5 py-2.5 text-xs font-black text-[#6d28d9] cursor-pointer hover:bg-violet-50 transition-colors list-none flex items-center gap-1">
                  ✏️ Edit this category
                </summary>
                <div className="px-5 py-4 bg-violet-50/40 border-t border-violet-100">
                  <form action={updateCategory.bind(null, parent.id)} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={labelCls}>Name</label>
                        <input name="name" defaultValue={parent.name} required className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Slug</label>
                        <input name="slug" defaultValue={parent.slug} required className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Parent</label>
                        <select name="parent_id" defaultValue={parent.parent_id ?? ''} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] bg-white">
                          <option value="">— Top-level category —</option>
                          {parents.filter(p => p.id !== parent.id).map(p => (
                            <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Icon emoji</label>
                        <EmojiPicker name="icon" defaultValue={parent.icon ?? ''} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Hero image URL <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                      <input name="image_url" defaultValue={parent.image_url ?? ''} placeholder="https://images.unsplash.com/..." className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Description <span className="normal-case font-normal text-slate-400">— supports **bold**, *italic*, line breaks, lists</span></label>
                      <textarea
                        name="description"
                        rows={5}
                        defaultValue={parent.description ?? ''}
                        placeholder="Full description shown on the category page…"
                        className={`${inputCls} resize-y min-h-[100px]`}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="submit" className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2 text-sm transition-colors">
                        Save changes
                      </button>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" name="is_featured" value="1" defaultChecked={parent.is_featured} className="rounded" />
                        Featured on homepage
                      </label>
                    </div>
                  </form>
                </div>
              </details>

              {/* Subcategory rows */}
              {childrenOf(parent.id).length > 0 && (
                <div className="divide-y divide-slate-100">
                  {childrenOf(parent.id).map(child => (
                    <div key={child.id}>
                      <div className="flex items-center justify-between px-5 py-3 pl-10">
                        <div className="flex items-center gap-2 flex-wrap">
                          {child.icon && <span>{child.icon}</span>}
                          <span className="font-bold text-slate-700 text-sm">{child.name}</span>
                          <code className="text-xs text-slate-400 font-mono">{child.slug}</code>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-black ${child.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                            {child.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <form action={toggleCategory.bind(null, child.id, child.is_active)}>
                            <button type="submit" className="text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
                              {child.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Subcategory inline edit */}
                      <details className="border-t border-slate-50">
                        <summary className="px-5 py-2 pl-10 text-xs font-black text-[#6d28d9] cursor-pointer hover:bg-violet-50 transition-colors list-none">
                          ✏️ Edit
                        </summary>
                        <div className="px-5 pl-10 py-4 bg-violet-50/40 border-t border-violet-100">
                          <form action={updateCategory.bind(null, child.id)} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className={labelCls}>Name</label>
                                <input name="name" defaultValue={child.name} required className={inputCls} />
                              </div>
                              <div className="space-y-1">
                                <label className={labelCls}>Slug</label>
                                <input name="slug" defaultValue={child.slug} required className={inputCls} />
                              </div>
                              <div className="space-y-1">
                                <label className={labelCls}>Parent</label>
                                <select name="parent_id" defaultValue={child.parent_id ?? ''} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9] bg-white">
                                  <option value="">— Top-level category —</option>
                                  {parents.map(p => (
                                    <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ''}{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className={labelCls}>Icon emoji</label>
                                <EmojiPicker name="icon" defaultValue={child.icon ?? ''} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className={labelCls}>Hero image URL <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                              <input name="image_url" defaultValue={child.image_url ?? ''} placeholder="https://images.unsplash.com/..." className={inputCls} />
                            </div>
                            <div className="space-y-1">
                              <label className={labelCls}>Description <span className="normal-case font-normal text-slate-400">— supports **bold**, *italic*, line breaks, lists</span></label>
                              <textarea
                                name="description"
                                rows={4}
                                defaultValue={child.description ?? ''}
                                placeholder="Description…"
                                className={`${inputCls} resize-y min-h-[80px]`}
                              />
                            </div>
                            <button type="submit" className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2 text-sm transition-colors">
                              Save changes
                            </button>
                          </form>
                          <FeatureManager subcategoryId={child.id} subcategoryName={child.name} />
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
