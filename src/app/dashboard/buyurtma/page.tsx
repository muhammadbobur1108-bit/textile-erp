import sql, { dbQuery } from '@/lib/db'
import BuyurtmaTable from './BuyurtmaTable'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

async function getData(params: { [key: string]: string | undefined }) {
  const page = Number(params.page || 1)
  const limit = 100
  const offset = (page - 1) * limit
  const cond: string[] = []
  const vals: any[] = []
  let i = 1
  if (params.buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${params.buyurtma}%`) }
  if (params.rang) { cond.push(`rang ILIKE $${i++}`); vals.push(`%${params.rang}%`) }
  const where = cond.length ? `WHERE ${cond.join(" AND ")}` : ""
  try {
    const [rows, cnt, tots] = await Promise.all([
      dbQuery(`SELECT * FROM buyurtma ${where} ORDER BY id LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM buyurtma ${where}`, vals),
      dbQuery(`SELECT COALESCE(SUM(buyurtma_son),0) as buyurtma_son, COALESCE(SUM(razdacha_1),0) as razdacha, COALESCE(SUM(umumi_qoldi),0) as qoldi FROM buyurtma ${where}`, vals),
    ])
    return { rows: rows.rows, total: Number(cnt.rows[0].total), page, limit, tots: tots.rows[0] }
  } catch { return { rows: [], total: 0, page, limit, tots: { buyurtma_son: 0, razdacha: 0, qoldi: 0 } } }
}

export default async function BuyurtmaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const params = { page: sp.page as string | undefined, buyurtma: sp.buyurtma as string | undefined, rang: sp.rang as string | undefined }
  const data = await getData(params)
  return (
    <div style={{ padding: 20 }} className="space-y-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Buyurtmalar hisoboti</h1>
          <p style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>Jami: <strong>{data.total.toLocaleString()}</strong> qator</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div className="chip"><p>Buyurtma</p><p className="n-blue">{Number(data.tots.buyurtma_son).toLocaleString()}</p></div>
          <div className="chip"><p>Razdacha</p><p className="n-green">{Number(data.tots.razdacha).toLocaleString()}</p></div>
          <div className="chip"><p>Qoldi</p><p className="n-red">{Number(data.tots.qoldi).toLocaleString()}</p></div>
        </div>
      </div>
      <BuyurtmaTable rows={data.rows} total={data.total} page={data.page} limit={data.limit} filters={params} />
    </div>
  )
}
