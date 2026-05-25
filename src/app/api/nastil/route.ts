import { NextRequest, NextResponse } from 'next/server'
import sql, { dbQuery } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams
    const page = Number(s.get('page') || 1)
    const limit = Number(s.get('limit') || 100)
    const offset = (page - 1) * limit
    const buyurtma = s.get('buyurtma')
    const rang = s.get('rang')
    const sana_dan = s.get('sana_dan')
    const sana_gacha = s.get('sana_gacha')

    const cond: string[] = []
    const vals: any[] = []
    let i = 1

    if (buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${buyurtma}%`) }
    if (rang) { cond.push(`rang ILIKE $${i++}`); vals.push(`%${rang}%`) }
    if (sana_dan) { cond.push(`sana >= $${i++}`); vals.push(sana_dan) }
    if (sana_gacha) { cond.push(`sana <= $${i++}`); vals.push(sana_gacha) }

    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''

    const [rows, cnt, tots] = await Promise.all([
      dbQuery(
        `SELECT * FROM nastil ${where} ORDER BY sana DESC, id DESC LIMIT $${i} OFFSET $${i + 1}`,
        [...vals, limit, offset]
      ),
      dbQuery(`SELECT COUNT(*) as total FROM nastil ${where}`, vals),
      dbQuery(
        `SELECT COALESCE(SUM(kroy_kilindi),0) as kesim,
                COALESCE(SUM(razdacha),0) as razdacha,
                COALESCE(SUM(ombor_qoldiq),0) as qoldiq
         FROM nastil ${where}`,
        vals
      ),
    ])

    return NextResponse.json({
      data: rows.rows,
      total: Number(cnt.rows[0].total),
      page,
      limit,
      totals: tots.rows[0],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer,
      unik_kod, kroy_kilindi, metochi, meto_kilindi, patoka_berildi,
      razdacha, meto, razdacha_koldi, ombor_qoldiq
    } = body

    const result = await sql`
      INSERT INTO nastil (
        buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer,
        unik_kod, kroy_kilindi, metochi, meto_kilindi, patoka_berildi,
        razdacha, meto, razdacha_koldi, ombor_qoldiq
      ) VALUES (
        ${buyurtma}, ${model}, ${rang}, ${be_kod}, ${sana}, ${nastil_no},
        ${rost}, ${razmer}, ${unik_kod}, ${kroy_kilindi}, ${metochi},
        ${meto_kilindi}, ${patoka_berildi}, ${razdacha}, ${meto},
        ${razdacha_koldi}, ${ombor_qoldiq}
      ) RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
