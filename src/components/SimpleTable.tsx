'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface ColDef {
  key: string
  label: string
  format?: (v: any) => string
  className?: string
}

interface Props {
  rows: any[]
  total: number
  page: number
  limit: number
  columns: ColDef[]
  basePath: string
  filterKey: string
  filterPlaceholder?: string
}

export default function SimpleTable({ rows, total, page, limit, columns, basePath, filterKey, filterPlaceholder }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filterVal, setFilterVal] = useState('')
  const totalPages = Math.ceil(total / limit)

  function apply(pg = 1) {
    const p = new URLSearchParams()
    if (filterVal) p.set(filterKey, filterVal)
    p.set('page', String(pg))
    startTransition(() => router.push(`${basePath}?${p}`))
  }

  return (
    <div className="space-y-4">
      <div className="card flex gap-3 items-end">
        <div className="flex-1">
          <input className="input" placeholder={filterPlaceholder || 'Qidirish...'} value={filterVal}
            onChange={e => setFilterVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && apply()} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => apply()} disabled={isPending}>
          <Search size={16} />{isPending ? 'Qidirilmoqda...' : 'Qidirish'}
        </button>
        <button className="btn-secondary" onClick={() => { setFilterVal(''); startTransition(() => router.push(basePath)) }}>Tozalash</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {columns.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-8 text-slate-400">Ma'lumot topilmadi</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-slate-400 text-xs">{(page - 1) * limit + i + 1}</td>
                  {columns.map(c => (
                    <td key={c.key} className={c.className || ''}>
                      {c.format ? c.format(r[c.key]) : (r[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">{(page-1)*limit+1}–{Math.min(page*limit,total)} / {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary p-2" onClick={() => apply(page-1)} disabled={page<=1}><ChevronLeft size={16}/></button>
            <span className="text-sm font-semibold text-slate-600">{page} / {totalPages}</span>
            <button className="btn-secondary p-2" onClick={() => apply(page+1)} disabled={page>=totalPages}><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}
