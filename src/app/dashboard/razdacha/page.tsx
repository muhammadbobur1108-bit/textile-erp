import sql, { dbQuery } from '@/lib/db'
import SimpleTable from '@/components/SimpleTable'

interface SP { page?: string; buyurtma?: string }

async function getData(params: SP) {
  const page = Number(params.page || 1)
  const limit = 100
  const offset = (page - 1) * limit
  const cond: string[] = []
  const vals: any[] = []
  let i = 1
  if (params.buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${params.buyurtma}%`) }
  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''
  try {
    const [rows, cnt] = await Promise.all([
      dbQuery(`SELECT * FROM razdacha ${where} ORDER BY sana DESC LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM razdacha ${where}`, vals),
    ])
    return { rows: rows.rows, total: Number(cnt.rows[0].total), page, limit }
  } catch { return { rows: [], total: 0, page, limit } }
}

const columns = [
  { key: 'sana', label: 'Sana', format: (v: any) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
  { key: 'buyurtma', label: 'Buyurtma' },
  { key: 'model', label: 'Model' },
  { key: 'rang', label: 'Rang' },
  { key: 'nastil_no', label: 'Nastil №' },
  { key: 'rost', label: 'Rost' },
  { key: 'razmer', label: 'Razmer' },
  { key: 'sort', label: 'Sort' },
  { key: 'potok', label: 'Poток' },
  { key: 'razdacha_son', label: 'Razdacha', className: 'text-right font-bold text-emerald-600' },
  { key: 'brak_vozvrat', label: 'Brak/Vozvrat', className: 'text-right text-red-500' },
]

export default async function RazdachaPage({ searchParams }: { searchParams: SP }) {
  const data = await getData(searchParams)
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Razdacha — Vozvrat</h1>
        <p className="text-slate-500 text-sm mt-1">Jami: <span className="font-bold">{data.total.toLocaleString()}</span> qator</p>
      </div>
      <SimpleTable rows={data.rows} total={data.total} page={data.page} limit={data.limit}
        columns={columns} basePath="/dashboard/razdacha" filterKey="buyurtma" filterPlaceholder="Buyurtma..." />
    </div>
  )
}
