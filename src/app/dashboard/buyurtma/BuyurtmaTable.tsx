'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

export default function BuyurtmaTable({ rows, total, page, limit, filters }: any) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [buyurtma, setBuyurtma] = useState(filters.buyurtma || '')
  const [rang, setRang] = useState(filters.rang || '')
  const totalPages = Math.ceil(total / limit)

  function apply() {
    const p = new URLSearchParams()
    if (buyurtma) p.set('buyurtma', buyurtma)
    if (rang) p.set('rang', rang)
    p.set('page', '1')
    startTransition(() => router.push(`/dashboard/buyurtma?${p}`))
  }

  function goPage(pg: number) {
    const p = new URLSearchParams()
    if (buyurtma) p.set('buyurtma', buyurtma)
    if (rang) p.set('rang', rang)
    p.set('page', String(pg))
    startTransition(() => router.push(`/dashboard/buyurtma?${p}`))
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Buyurtma</label>
          <input className="input" placeholder="MOS-..." value={buyurtma}
            onChange={e => setBuyurtma(e.target.value)} onKeyDown={e => e.key === 'Enter' && apply()} />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Rang</label>
          <input className="input" placeholder="Rang..." value={rang}
            onChange={e => setRang(e.target.value)} onKeyDown={e => e.key === 'Enter' && apply()} />
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={apply} disabled={isPending}>
          <Search size={16} />{isPending ? 'Qidirilmoqda...' : 'Qidirish'}
        </button>
        <button className="btn-secondary" onClick={() => { setBuyurtma(''); setRang(''); startTransition(() => router.push('/dashboard/buyurtma')) }}>Tozalash</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Buyurtma</th><th>Model</th><th>Rang</th>
                <th>Buyurtmachi</th><th>Rost</th><th>Razmer</th>
                <th>Buyurtma soni</th><th>Kesim</th><th>Meto</th>
                <th>Patoka</th><th>Razdacha 1s</th><th>Razdacha 2s</th>
                <th>Brak</th><th>Jami qoldi</th><th>Kesim qoldi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={16} className="text-center py-8 text-slate-400">Ma'lumot topilmadi</td></tr>
              ) : rows.map((r: any, i: number) => (
                <tr key={r.id}>
                  <td className="text-slate-400 text-xs">{(page - 1) * limit + i + 1}</td>
                  <td className="font-semibold text-brand-700">{r.buyurtma}</td>
                  <td className="text-slate-600 max-w-[160px] truncate" title={r.model}>{r.model}</td>
                  <td><span className="badge bg-slate-100 text-slate-600">{r.rang}</span></td>
                  <td>{r.buyurtmachi}</td>
                  <td>{r.rost}</td>
                  <td className="font-semibold">{r.razmer}</td>
                  <td className="text-right font-bold text-brand-600">{r.buyurtma_son?.toLocaleString()}</td>
                  <td className="text-right">{r.kroy_kilindi?.toLocaleString()}</td>
                  <td className="text-right">{r.meto_kilindi?.toLocaleString()}</td>
                  <td className="text-right">{r.patoka_berildi?.toLocaleString()}</td>
                  <td className="text-right text-emerald-600 font-semibold">{r.razdacha_1?.toLocaleString()}</td>
                  <td className="text-right">{r.razdacha_2?.toLocaleString()}</td>
                  <td className="text-right text-red-400">{r.brak_vozvrat?.toLocaleString()}</td>
                  <td className="text-right font-bold text-red-500">{r.umumi_qoldi?.toLocaleString()}</td>
                  <td className="text-right">{r.kesim_qoldi?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">{(page-1)*limit+1}–{Math.min(page*limit,total)} / {total.toLocaleString()}</p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary p-2" onClick={() => goPage(page-1)} disabled={page<=1}><ChevronLeft size={16}/></button>
            <span className="text-sm font-semibold text-slate-600">{page} / {totalPages}</span>
            <button className="btn-secondary p-2" onClick={() => goPage(page+1)} disabled={page>=totalPages}><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}
