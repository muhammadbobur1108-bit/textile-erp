import sql, { dbQuery } from '@/lib/db'
import NastilTable from './NastilTable'
import ExportButton from '@/components/ExportButton'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

async function getData(params: { [key: string]: string | undefined }) {
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
      dbQuery(`SELECT * FROM nastil ${where} ORDER BY sana DESC, id DESC LIMIT $${i} OFFSET $${i+1}`, [...values, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM nastil ${where}`, values),
      dbQuery(`SELECT COALESCE(SUM(kroy_kilindi),0) as kesim, COALESCE(SUM(razdacha),0) as razdacha, COALESCE(SUM(ombor_qoldiq),0) as qoldiq FROM nastil ${where}`, values),
    ])
    return { rows: rows.rows, total: Number(countRes.rows[0].total), page, limit, totals: totals.rows[0] }
  } catch {
    return { rows: [], total: 0, page, limit, totals: { kesim: 0, razdacha: 0, qoldiq: 0 } }
  }
}

export default async function NastilPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const params = {
    page: sp.page as string | undefined,
    buyurtma: sp.buyurtma as string | undefined,
    rang: sp.rang as string | undefined,
    sana_dan: sp.sana_dan as string | undefined,
    sana_gacha: sp.sana_gacha as string | undefined,
  }
  const data = await getData(params)
  return (
    <div style={{ padding: 20 }} className="space-y-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Nastil hisoboti</h1>
          <p style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>
            Jami: <strong>{data.total.toLocaleString()}</strong> qator
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="chip"><p>Kesim</p><p className="n-blue">{Number(data.totals.kesim).toLocaleString()}</p></div>
          <div className="chip"><p>Razdacha</p><p className="n-green">{Number(data.totals.razdacha).toLocaleString()}</p></div>
          <div className="chip"><p>Qoldi</p><p className="n-red">{Number(data.totals.qoldiq).toLocaleString()}</p></div>
          <ExportButton table="nastil" params={{ ...(params.buyurtma ? { buyurtma: params.buyurtma } : {}), ...(params.rang ? { rang: params.rang } : {}) }} />
        </div>
      </div>
      <NastilTable rows={data.rows} total={data.total} page={data.page} limit={data.limit} filters={params} />
    </div>
  )
}
