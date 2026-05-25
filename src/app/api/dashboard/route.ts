import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const [nastil, buyurtma, razdacha, qoldiq, kunlik, oylik] = await Promise.all([
      sql`SELECT COUNT(*) as total, COALESCE(SUM(kroy_kilindi),0) as kesim FROM nastil`,
      sql`SELECT COUNT(DISTINCT buyurtma) as total FROM buyurtma`,
      sql`SELECT COALESCE(SUM(razdacha_son),0) as total FROM razdacha`,
      sql`SELECT COALESCE(SUM(ombor_qoldiq),0) as total FROM nastil WHERE ombor_qoldiq > 0`,
      sql`
        SELECT DATE(sana) as kun,
          COALESCE(SUM(razdacha),0) as razdacha_son,
          COALESCE(SUM(kroy_kilindi),0) as kesim_son
        FROM nastil
        WHERE sana >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY DATE(sana)
        ORDER BY kun ASC
      `,
      sql`
        SELECT TO_CHAR(sana, 'YYYY-MM') as oy,
          COALESCE(SUM(kroy_kilindi),0) as kesim,
          COALESCE(SUM(razdacha),0) as razdacha
        FROM nastil
        WHERE sana IS NOT NULL
        GROUP BY TO_CHAR(sana, 'YYYY-MM')
        ORDER BY oy DESC
        LIMIT 12
      `,
    ])

    return NextResponse.json({
      nastil_qator: Number(nastil[0].total),
      jami_kesim: Number(nastil[0].kesim),
      buyurtma_soni: Number(buyurtma[0].total),
      razdacha_jami: Number(razdacha[0].total),
      ombor_qoldiq: Number(qoldiq[0].total),
      kunlik: kunlik,
      oylik: oylik.reverse(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
