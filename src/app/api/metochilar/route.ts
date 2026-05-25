import { NextRequest, NextResponse } from 'next/server'
import sql, { dbQuery } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams
    const page = Number(s.get('page') || 1)
    const limit = Number(s.get('limit') || 100)
    const offset = (page - 1) * limit
    const buyurtma = s.get('buyurtma')
    const sana_dan = s.get('sana_dan')
    const sana_gacha = s.get('sana_gacha')

    const cond: string[] = []
    const vals: any[] = []
    let i = 1
    if (buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${buyurtma}%`) }
    if (sana_dan) { cond.push(`sana >= $${i++}`); vals.push(sana_dan) }
    if (sana_gacha) { cond.push(`sana <= $${i++}`); vals.push(sana_gacha) }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''

    const [rows, cnt] = await Promise.all([
      dbQuery(`SELECT * FROM metochilar ${where} ORDER BY sana DESC LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM metochilar ${where}`, vals),
    ])
    return NextResponse.json({ data: rows.rows, total: Number(cnt.rows[0].total), page, limit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json()
    const result = await sql`
      INSERT INTO metochilar (sana, buyurtma, model, rang, nastil_no, rost, razmer,
        tekshirish, unik_kod, son, brak, meto_kiligan_son)
      VALUES (${b.sana}, ${b.buyurtma}, ${b.model}, ${b.rang}, ${b.nastil_no},
        ${b.rost}, ${b.razmer}, ${b.tekshirish}, ${b.unik_kod},
        ${b.son||0}, ${b.brak||0}, ${b.meto_kiligan_son||0})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
