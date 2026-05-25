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

    const cond: string[] = []
    const vals: any[] = []
    let i = 1
    if (buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${buyurtma}%`) }
    if (rang) { cond.push(`rang ILIKE $${i++}`); vals.push(`%${rang}%`) }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''

    const [rows, cnt, tots] = await Promise.all([
      dbQuery(`SELECT * FROM buyurtma ${where} ORDER BY id LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM buyurtma ${where}`, vals),
      dbQuery(`SELECT COALESCE(SUM(buyurtma_son),0) as buyurtma_son, COALESCE(SUM(razdacha_1),0) as razdacha, COALESCE(SUM(umumi_qoldi),0) as qoldi FROM buyurtma ${where}`, vals),
    ])

    return NextResponse.json({ data: rows.rows, total: Number(cnt.rows[0].total), page, limit, totals: tots.rows[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const result = await sql`
      INSERT INTO buyurtma (buyurtma, model, rang, unik_kod2, buyurtmachi, rost, razmer, unik_kod,
        buyurtma_son, kroy_kilindi, meto_kilindi, patoka_berildi, razdacha_1, razdacha_2,
        brak_vozvrat, kesim_brak, umumi_qoldi, potok_orkasi, kesim_qoldi, meto_qoldi)
      VALUES (${b.buyurtma}, ${b.model}, ${b.rang}, ${b.unik_kod2}, ${b.buyurtmachi}, ${b.rost},
        ${b.razmer}, ${b.unik_kod}, ${b.buyurtma_son||0}, ${b.kroy_kilindi||0}, ${b.meto_kilindi||0},
        ${b.patoka_berildi||0}, ${b.razdacha_1||0}, ${b.razdacha_2||0}, ${b.brak_vozvrat||0},
        ${b.kesim_brak||0}, ${b.umumi_qoldi||0}, ${b.potok_orkasi||0}, ${b.kesim_qoldi||0}, ${b.meto_qoldi||0})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
