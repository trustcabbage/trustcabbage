'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }

const BUSINESS_TYPE_MAP: Record<string, string> = {
  b2b: 'business_services',
  b2c: 'online_b2c',
  business_services: 'business_services',
  online_b2c: 'online_b2c',
  retail_chain: 'retail_chain',
  both: 'both',
}

interface ParsedRow {
  name: string; website: string; description: string; city: string; state: string
  founded_year: string; employee_count: string; category_slugs: string; gst_number: string; cin_number: string
  business_type: string
  _errors: string[]; _status: 'ok' | 'error' | 'duplicate'
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

// Proper RFC-4180 CSV field parser — handles quoted fields with commas and escaped quotes inside
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i <= line.length) {
    if (i === line.length) { fields.push(''); break }
    if (line[i] === '"') {
      let field = ''; i++
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2 }
        else if (line[i] === '"') { i++; break }
        else { field += line[i]; i++ }
      }
      fields.push(field)
      if (line[i] === ',') i++
    } else {
      let field = ''
      while (i < line.length && line[i] !== ',') { field += line[i]; i++ }
      fields.push(field.trim())
      if (line[i] === ',') i++
    }
  }
  return fields
}

function parseCSV(text: string): ParsedRow[] {
  // Normalize line endings
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const row: any = { _errors: [], _status: 'ok' }
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    if (!row.name?.trim()) { row._errors.push('Name is required'); row._status = 'error' }
    // Normalize business_type: auto-map b2b/b2c, default to business_services
    const rawBt = (row.business_type ?? '').trim().toLowerCase()
    row.business_type = BUSINESS_TYPE_MAP[rawBt] ?? 'business_services'
    return row as ParsedRow
  })
}

export function CsvImporter({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ created: number; skipped: number; errors: number } | null>(null)

  const slugToId = Object.fromEntries(categories.map(c => [c.slug, c.id]))

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseCSV(text)

    // Check duplicates against DB
    const names = parsed.map(r => r.name.trim()).filter(Boolean)
    const { data: existing } = await supabase.from('companies').select('name').in('name', names)
    const existingNames = new Set((existing ?? []).map((c: any) => c.name.toLowerCase()))

    setRows(parsed.map(r => {
      if (existingNames.has(r.name.toLowerCase())) {
        return { ...r, _status: 'duplicate', _errors: [...r._errors, 'Company with this name already exists'] }
      }
      return r
    }))
    setResults(null)
  }

  async function runImport() {
    const toImport = rows.filter(r => r._status === 'ok')
    if (toImport.length === 0) { toast.error('No valid rows to import'); return }
    setImporting(true)

    let created = 0; let errors = 0

    for (const row of toImport) {
      const slug = toSlug(row.name)
      const { data: newCompany, error } = await supabase.from('companies').insert({
        name: row.name.trim(),
        slug,
        website: row.website?.trim() || null,
        description: row.description?.trim() || null,
        city: row.city?.trim() || null,
        state: row.state?.trim() || null,
        founded_year: row.founded_year ? parseInt(row.founded_year) : null,
        employee_count: row.employee_count?.trim() || null,
        gst_number: row.gst_number?.trim() || null,
        cin_number: row.cin_number?.trim() || null,
        business_type: row.business_type || 'business_services',
        status: 'unclaimed',
        created_by_admin: true,
      }).select('id').single()

      if (error || !newCompany) { errors++; continue }

      const categorySlugs = (row.category_slugs ?? '').split('|').map(s => s.trim()).filter(Boolean)
      const categoryIds = categorySlugs.map(s => slugToId[s]).filter(Boolean)
      if (categoryIds.length > 0) {
        await supabase.from('company_categories').insert(
          categoryIds.map(cid => ({ company_id: newCompany.id, category_id: cid }))
        )
      }
      created++
    }

    setImporting(false)
    setResults({ created, skipped: rows.filter(r => r._status === 'duplicate').length, errors })
    toast.success(`Import complete: ${created} created, ${errors} errors`)
    if (created > 0) setTimeout(() => { router.push('/admin/companies'); router.refresh() }, 2000)
  }

  const okCount = rows.filter(r => r._status === 'ok').length
  const dupCount = rows.filter(r => r._status === 'duplicate').length
  const errCount = rows.filter(r => r._status === 'error').length

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-950">Step 2 — Upload your CSV</h2>
        <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 p-10 cursor-pointer hover:border-[#6d28d9] hover:bg-violet-50 transition-colors">
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Click to upload CSV file</span>
          <input type="file" accept=".csv,.txt" onChange={handleFile} className="sr-only" />
        </label>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-950">Step 3 — Preview & confirm</h2>
              <div className="flex items-center gap-4 mt-1 text-xs">
                <span className="flex items-center gap-1 text-green-700 font-bold"><CheckCircle className="h-3.5 w-3.5" /> {okCount} ready</span>
                <span className="flex items-center gap-1 text-amber-700 font-bold"><AlertCircle className="h-3.5 w-3.5" /> {dupCount} duplicate</span>
                <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle className="h-3.5 w-3.5" /> {errCount} error</span>
              </div>
            </div>
            <button
              onClick={runImport}
              disabled={importing || okCount === 0}
              className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              {importing ? 'Importing…' : `Import ${okCount} companies`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide w-8">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide hidden sm:table-cell">City / State</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide hidden md:table-cell">Categories</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-black text-slate-400 uppercase tracking-wide">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={i} className={row._status === 'error' ? 'bg-red-50' : row._status === 'duplicate' ? 'bg-amber-50' : ''}>
                    <td className="px-4 py-2.5">
                      {row._status === 'ok' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {row._status === 'duplicate' && <AlertCircle className="h-4 w-4 text-amber-600" />}
                      {row._status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-black text-slate-950 text-sm">{row.name || '—'}</p>
                      {row.website && <p className="text-xs text-slate-400 truncate max-w-[160px]">{row.website}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden lg:table-cell max-w-[200px]">
                      <span className="line-clamp-2">{row.description || '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden sm:table-cell">{[row.city, row.state].filter(Boolean).join(', ') || '—'}</td>
                    <td className="px-4 py-2.5 text-xs hidden md:table-cell">
                      {row.category_slugs?.split('|').filter(Boolean).map(s => (
                        <span key={s} className={`inline-block mr-1 px-1.5 py-0.5 rounded font-mono text-[10px] ${slugToId[s.trim()] ? 'bg-violet-50 text-[#6d28d9]' : 'bg-red-50 text-red-600'}`}>{s}</span>
                      ))}
                    </td>
                    <td className="px-4 py-2.5 text-xs hidden lg:table-cell">
                      <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 font-mono text-[10px]">{row.business_type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-red-600">{row._errors.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="font-black text-green-800">Import complete</p>
          <p className="text-sm text-green-700 mt-1">
            {results.created} companies created · {results.skipped} skipped (duplicates) · {results.errors} errors
          </p>
          <p className="text-xs text-green-600 mt-1">Redirecting to companies list…</p>
        </div>
      )}
    </div>
  )
}
