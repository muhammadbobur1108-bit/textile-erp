'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

interface Row {
  id: number
  buyurtma: string
  model: string
  rang: string
  sana: string
  nastil_no: number
  rost: string
  razmer: string
  kroy_kilindi: number
  meto_kilindi: number
  patoka_berildi: number
  razdacha: number
  razdacha_koldi: number
  ombor_qoldiq: number
}

interface Props {
  rows: Row[]
  total: number
  page: number
  limit: number
  filters: Record<string, string | undefined>
}

export default function NastilTable({ rows, total, page, limit, filters }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [buyurtma, setBuyurtma] = useState(filters.buyurtma || '')
  const [rang, setRang] = useState(filters.rang || '')
  const [sanaDan, setSanaDan] = useState(filters.sana_dan || '')
  const [sanaGacha, setSanaGacha] = useState(filters.sana_gacha || '')

  const totalPages = Math.ceil(total / limit)

  function applyFilter() {
    const params = new URLSearchParams()
    if (buyurtma) params.set('buyurtma', buyurtma)
    if (rang) params.set('rang', rang)
    if (sanaDan) params.set('sana_dan', sanaDan)
    if (sanaGacha) params.set('sana_gacha', sanaGacha)
    params.set('page', '1')
    startTransition(() => router.push(`/dashboard/nastil?${params.toString()}`))
  }

  function goPage(p: number) {
    const params = new URLSearchParams()
    if (buyurtma) params.set('buyurtma', buyurtma)
    if (rang) params.set('rang', rang)
    if (sanaDan) params.set('sana_dan', sanaDan)
    if (sanaGacha) params.set('sana_gacha', sanaGacha)
    params.set('page', String(p))
    startTransition(() => router.push(`/dashboard/nastil?${params.toString()}`))
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Buyurtma</label>
          <input className="input" placeholder="MOS-500.1..." value={buyurtma}
            onChange={e => setBuyurtma(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()} />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Rang</label>
          <input className="input" placeholder="Красный..." value={rang}
            onChange={e => setRang(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Sanadan</label>
          <input type="date" className="input" value={sanaDan} onChange={e => setSanaDan(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Sanagacha</label>
          <input type="date" className="input" value={sanaGacha} onChange={e => setSanaGacha(e.target.value)} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={applyFilter} disabled={isPending}>
          <Search size={16} />
          {isPending ? 'Qidirilmoqda...' : 'Qidirish'}
        </button>
        <button className="btn-secondary" onClick={() => {
          setBuyurtma(''); setRang(''); setSanaDan(''); setSanaGacha('')
          startTransition(() => router.push('/dashboard/nastil'))
        }}>
          Tozalash
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Buyurtma</th>
                <th>Model</th>
                <th>Rang</th>
                <th>Sana</th>
                <th>Nastil №</th>
                <th>Rost</th>
                <th>Razmer</th>
                <th>Kesim</th>
                <th>Meto</th>
                <th>Patoka</th>
                <th>Razdacha</th>
                <th>Razdacha qoldi</th>
                <th>Ombor qoldi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-slate-400">Ma'lumot topilmadi</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="text-slate-400 text-xs">{(page - 1) * limit + i + 1}</td>
                  <td className="font-semibold text-brand-700">{r.buyurtma}</td>
                  <td className="text-slate-600 max-w-[180px] truncate" title={r.model}>{r.model}</td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-600">{r.rang}</span>
                  </td>
                  <td className="text-slate-500">{r.sana ? new Date(r.sana).toLocaleDateString('uz-UZ') : '—'}</td>
                  <td className="text-center">{r.nastil_no}</td>
                  <td>{r.rost}</td>
                  <td className="font-semibold">{r.razmer}</td>
                  <td className="text-right font-semibold text-brand-600">{r.kroy_kilindi?.toLocaleString()}</td>
                  <td className="text-right">{r.meto_kilindi?.toLocaleString()}</td>
                  <td className="text-right">{r.patoka_berildi?.toLocaleString()}</td>
                  <td className="text-right text-emerald-600 font-semibold">{r.razdacha?.toLocaleString()}</td>
                  <td className="text-right">{r.razdacha_koldi?.toLocaleString()}</td>
                  <td className="text-right">
                    <span className={`font-bold ${r.ombor_qoldiq > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {r.ombor_qoldiq?.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total.toLocaleString()} ta
          </p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary p-2" onClick={() => goPage(page - 1)} disabled={page <= 1}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-600">{page} / {totalPages}</span>
            <button className="btn-secondary p-2" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
