import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const rows = await sql`SELECT * FROM nastil WHERE id = ${Number(params.id)}`
    if (!rows.length) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const {
      buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer,
      unik_kod, kroy_kilindi, metochi, meto_kilindi, patoka_berildi,
      razdacha, meto, razdacha_koldi, ombor_qoldiq
    } = body

    const result = await sql`
      UPDATE nastil SET
        buyurtma = ${buyurtma}, model = ${model}, rang = ${rang},
        be_kod = ${be_kod}, sana = ${sana}, nastil_no = ${nastil_no},
        rost = ${rost}, razmer = ${razmer}, unik_kod = ${unik_kod},
        kroy_kilindi = ${kroy_kilindi}, metochi = ${metochi},
        meto_kilindi = ${meto_kilindi}, patoka_berildi = ${patoka_berildi},
        razdacha = ${razdacha}, meto = ${meto},
        razdacha_koldi = ${razdacha_koldi}, ombor_qoldiq = ${ombor_qoldiq}
      WHERE id = ${Number(params.id)}
      RETURNING *
    `
    if (!result.length) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    return NextResponse.json(result[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM nastil WHERE id = ${Number(params.id)}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
