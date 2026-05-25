import sql, { dbQuery } from '@/lib/db'
import BuyurtmaTable from './BuyurtmaTable'

interface SP { page?: string; buyurtma?: string; rang?: string }

async function getData(params: SP) {
  const page = Number(params.page || 1)
  const limit = 100
  const offset = (page - 1) * limit
  const cond: string[] = []
  const vals: any[] = []
  let i = 1
  if (params.buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${params.buyurtma}%`) }
  if (params.rang) { cond.push(`rang ILIKE $${i++}`); vals.push(`%${params.rang}%`) }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
  try {
    const [rows, cnt, tots] = await Promise.all([
      dbQuery(`SELECT * FROM buyurtma ${where} ORDER BY id LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM buyurtma ${where}`, vals),
      dbQuery(`SELECT COALESCE(SUM(buyurtma_son),0) as buyurtma, COALESCE(SUM(razdacha_1),0) as razdacha, COALESCE(SUM(umumi_qoldi),0) as qoldi FROM buyurtma ${where}`, vals),
    ])
    return { rows: rows.rows, total: Number(cnt.rows[0].total), page, limit, tots: tots.rows[0] }
  } catch {
    return { rows: [], total: 0, page, limit, tots: { buyurtma: 0, razdacha: 0, qoldi: 0 } }
  }
}

export default async function BuyurtmaPage({ searchParams }: { searchParams: SP }) {
  const data = await getData(searchParams)
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Buyurtmalar hisoboti</h1>
          <p className="text-slate-500 text-sm mt-1">Jami: <span className="font-bold text-slate-700">{data.total.toLocaleString()}</span> qator</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Buyurtma soni</p>
            <p className="font-extrabold text-brand-600">{Number(data.tots.buyurtma).toLocaleString()}</p>
          </div>
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Razdacha</p>
            <p className="font-extrabold text-emerald-600">{Number(data.tots.razdacha).toLocaleString()}</p>
          </div>
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Qoldi</p>
            <p className="font-extrabold text-red-500">{Number(data.tots.qoldi).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <BuyurtmaTable rows={data.rows} total={data.total} page={data.page} limit={data.limit} filters={searchParams} />
    </div>
  )
}
