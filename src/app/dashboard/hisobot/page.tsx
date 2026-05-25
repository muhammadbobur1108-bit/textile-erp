import sql from '@/lib/db'
import HisobotCharts from './HisobotCharts'

async function getData() {
  try {
    const [topBuyurtma, rangStats, oylikStats, qoldiqTop] = await Promise.all([
      sql`SELECT buyurtma, SUM(kroy_kilindi) as kesim, SUM(razdacha) as razdacha, SUM(ombor_qoldiq) as qoldiq FROM nastil GROUP BY buyurtma ORDER BY kesim DESC LIMIT 15`,
      sql`SELECT rang, SUM(kroy_kilindi) as kesim, SUM(razdacha) as razdacha FROM nastil WHERE rang IS NOT NULL AND rang != '' GROUP BY rang ORDER BY kesim DESC LIMIT 10`,
      sql`SELECT TO_CHAR(sana, 'YYYY-MM') as oy, SUM(kroy_kilindi) as kesim, SUM(razdacha) as razdacha FROM nastil WHERE sana IS NOT NULL GROUP BY TO_CHAR(sana, 'YYYY-MM') ORDER BY oy DESC LIMIT 12`,
      sql`SELECT buyurtma, rang, SUM(ombor_qoldiq) as qoldiq FROM nastil WHERE ombor_qoldiq > 0 GROUP BY buyurtma, rang ORDER BY qoldiq DESC LIMIT 20`,
    ])
    return { topBuyurtma, rangStats, oylikStats: [...oylikStats].reverse(), qoldiqTop }
  } catch {
    return { topBuyurtma: [], rangStats: [], oylikStats: [], qoldiqTop: [] }
  }
}

export default async function HisobotPage() {
  const data = await getData()
  return (
    <div style={{ padding: 20 }} className="space-y-5">
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Hisobotlar</h1>
        <p style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>Tahlil va statistika</p>
      </div>
      <HisobotCharts {...data} />
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #30363d', fontSize: 13, fontWeight: 600 }}>
          Omborда qolgan mahsulotlar (TOP 20)
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Buyurtma</th><th>Rang</th><th style={{ textAlign: 'right' }}>Qoldiq</th></tr></thead>
            <tbody>
              {data.qoldiqTop.map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ color: '#8b949e' }}>{i + 1}</td>
                  <td className="n-orange" style={{ fontWeight: 600 }}>{r.buyurtma}</td>
                  <td><span style={{ background: '#21262d', padding: '2px 8px', borderRadius: 5, fontSize: 11 }}>{r.rang}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#f85149' }}>{Number(r.qoldiq).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
