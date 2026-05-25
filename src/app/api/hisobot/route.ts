import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams
    const type = s.get('type') || 'all'

    if (type === 'top_buyurtma') {
      const rows = await sql`
        SELECT buyurtma,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha,
          SUM(ombor_qoldiq) as qoldiq
        FROM nastil
        GROUP BY buyurtma
        ORDER BY kesim DESC
        LIMIT 15
      `
      return NextResponse.json(rows)
    }

    if (type === 'rang_stats') {
      const rows = await sql`
        SELECT rang,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha
        FROM nastil
        WHERE rang IS NOT NULL AND rang != ''
        GROUP BY rang
        ORDER BY kesim DESC
        LIMIT 10
      `
      return NextResponse.json(rows)
    }

    if (type === 'oylik') {
      const rows = await sql`
        SELECT TO_CHAR(sana, 'YYYY-MM') as oy,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha
        FROM nastil
        WHERE sana IS NOT NULL
        GROUP BY TO_CHAR(sana, 'YYYY-MM')
        ORDER BY oy ASC
        LIMIT 24
      `
      return NextResponse.json(rows)
    }

    if (type === 'qoldiq_top') {
      const rows = await sql`
        SELECT buyurtma, rang, SUM(ombor_qoldiq) as qoldiq
        FROM nastil
        WHERE ombor_qoldiq > 0
        GROUP BY buyurtma, rang
        ORDER BY qoldiq DESC
        LIMIT 20
      `
      return NextResponse.json(rows)
    }

    if (type === 'razmer_stats') {
      const rows = await sql`
        SELECT razmer,
          SUM(kroy_kilindi) as kesim,
          SUM(razdacha) as razdacha
        FROM nastil
        WHERE razmer IS NOT NULL AND razmer != ''
        GROUP BY razmer
        ORDER BY kesim DESC
      `
      return NextResponse.json(rows)
    }

    // Default: all stats combined
    const [topBuyurtma, rangStats, oylik, qoldiqTop] = await Promise.all([
      sql`SELECT buyurtma, SUM(kroy_kilindi) as kesim, SUM(razdacha) as razdacha, SUM(ombor_qoldiq) as qoldiq FROM nastil GROUP BY buyurtma ORDER BY kesim DESC LIMIT 15`,
      sql`SELECT rang, SUM(kroy_kilindi) as kesim FROM nastil WHERE rang IS NOT NULL AND rang != '' GROUP BY rang ORDER BY kesim DESC LIMIT 10`,
      sql`SELECT TO_CHAR(sana,'YYYY-MM') as oy, SUM(kroy_kilindi) as kesim, SUM(razdacha) as razdacha FROM nastil WHERE sana IS NOT NULL GROUP BY TO_CHAR(sana,'YYYY-MM') ORDER BY oy ASC LIMIT 24`,
      sql`SELECT buyurtma, rang, SUM(ombor_qoldiq) as qoldiq FROM nastil WHERE ombor_qoldiq > 0 GROUP BY buyurtma, rang ORDER BY qoldiq DESC LIMIT 20`,
    ])

    return NextResponse.json({ topBuyurtma, rangStats, oylik, qoldiqTop })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
