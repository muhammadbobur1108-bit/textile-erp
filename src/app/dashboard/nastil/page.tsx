import sql, { dbQuery } from '@/lib/db'
import NastilTable from './NastilTable'
import ExportButton from '@/components/ExportButton'

interface SearchParams {
  page?: string
  buyurtma?: string
  rang?: string
  sana_dan?: string
  sana_gacha?: string
}

async function getData(params: SearchParams) {
  const page = Number(params.page || 1)
  const limit = 100
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: any[] = []
  let i = 1

  if (params.buyurtma) { conditions.push(`buyurtma ILIKE $${i++}`); values.push(`%${params.buyurtma}%`) }
  if (params.rang) { conditions.push(`rang ILIKE $${i++}`); values.push(`%${params.rang}%`) }
  if (params.sana_dan) { conditions.push(`sana >= $${i++}`); values.push(params.sana_dan) }
  if (params.sana_gacha) { conditions.push(`sana <= $${i++}`); values.push(params.sana_gacha) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  try {
    const [rows, countRes, totals] = await Promise.all([
      dbQuery(`SELECT * FROM nastil ${where} ORDER BY sana DESC, id DESC LIMIT $${i} OFFSET $${i+1}`,
        [...values, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM nastil ${where}`, values),
      dbQuery(`SELECT COALESCE(SUM(kroy_kilindi),0) as kesim, COALESCE(SUM(razdacha),0) as razdacha, COALESCE(SUM(ombor_qoldiq),0) as qoldiq FROM nastil ${where}`, values),
    ])
    return {
      rows: rows.rows,
      total: Number(countRes.rows[0].total),
      page, limit,
      totals: totals.rows[0],
    }
  } catch {
    return { rows: [], total: 0, page, limit, totals: { kesim: 0, razdacha: 0, qoldiq: 0 } }
  }
}

export default async function NastilPage({ searchParams }: { searchParams: SearchParams }) {
  const data = await getData(searchParams)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Nastil hisoboti</h1>
          <p className="text-slate-500 text-sm mt-1">
            Jami: <span className="font-bold text-slate-700">{data.total.toLocaleString()}</span> qator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton table="nastil" params={{
            ...(searchParams.buyurtma ? { buyurtma: searchParams.buyurtma } : {}),
            ...(searchParams.rang ? { rang: searchParams.rang } : {}),
          }} />
        </div>
        {/* Summary */}
        <div className="flex gap-4 text-sm">
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Kesim</p>
            <p className="font-extrabold text-brand-600">{Number(data.totals.kesim).toLocaleString()}</p>
          </div>
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Razdacha</p>
            <p className="font-extrabold text-emerald-600">{Number(data.totals.razdacha).toLocaleString()}</p>
          </div>
          <div className="card py-2 px-4 text-center">
            <p className="text-slate-500">Qoldi</p>
            <p className="font-extrabold text-red-500">{Number(data.totals.qoldiq).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <NastilTable
        rows={data.rows}
        total={data.total}
        page={data.page}
        limit={data.limit}
        filters={searchParams}
      />
    </div>
  )
}
