import sql from '@/lib/db'
import HisobotCharts from './HisobotCharts'

async function getData() {
  try {
    const [topBuyurtma, rangStats, oylikStats, qoldiqTop] = await Promise.all([
      sql`
        SELECT buyurtma,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha,
          SUM(ombor_qoldiq) as qoldiq
        FROM nastil
        GROUP BY buyurtma
        ORDER BY kesim DESC
        LIMIT 15
      `,
      sql`
        SELECT rang,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha
        FROM nastil
        WHERE rang IS NOT NULL AND rang != ''
        GROUP BY rang
        ORDER BY kesim DESC
        LIMIT 10
      `,
      sql`
        SELECT TO_CHAR(sana, 'YYYY-MM') as oy,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha
        FROM nastil
        WHERE sana IS NOT NULL
        GROUP BY TO_CHAR(sana, 'YYYY-MM')
        ORDER BY oy DESC
        LIMIT 12
      `,
      sql`
        SELECT buyurtma, rang, SUM(ombor_qoldiq) as qoldiq
        FROM nastil
        WHERE ombor_qoldiq > 0
        GROUP BY buyurtma, rang
        ORDER BY qoldiq DESC
        LIMIT 20
      `,
    ])
    return { topBuyurtma, rangStats, oylikStats: oylikStats.reverse(), qoldiqTop }
  } catch (e) {
    return { topBuyurtma: [], rangStats: [], oylikStats: [], qoldiqTop: [] }
  }
}

export default async function HisobotPage() {
  const data = await getData()
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Hisobotlar</h1>
        <p className="text-slate-500 text-sm mt-1">Tahlil va statistika</p>
      </div>
      <HisobotCharts {...data} />

      {/* Qoldiq table */}
      <div className="card">
        <h2 className="font-bold text-slate-700 mb-4">Omborда qolgan mahsulotlar (TOP 20)</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Buyurtma</th><th>Rang</th><th className="text-right">Qoldiq (dona)</th></tr>
            </thead>
            <tbody>
              {data.qoldiqTop.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="text-slate-400 text-xs">{i + 1}</td>
                  <td className="font-semibold text-brand-700">{r.buyurtma}</td>
                  <td><span className="badge bg-slate-100 text-slate-600">{r.rang}</span></td>
                  <td className="text-right font-bold text-red-500">{Number(r.qoldiq).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
