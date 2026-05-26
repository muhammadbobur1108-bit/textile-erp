import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import * as XLSX from 'xlsx'

export const maxDuration = 60

function excelDateToJS(serial: any): string | null {
  if (!serial || isNaN(Number(serial))) return null
  const date = new Date((Number(serial) - 25569) * 86400 * 1000)
  return date.toISOString().split('T')[0]
}

function safeInt(val: any): number {
  const n = parseInt(String(val))
  return isNaN(n) ? 0 : n
}

function safeStr(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const clearOld = formData.get('clearOld') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(Buffer.from(buffer), { type: 'buffer' })

    if (clearOld) {
      await sql`TRUNCATE TABLE nastil, buyurtma, metochilar, razdacha RESTART IDENTITY`
    }

    let nastilCount = 0, buyurtmaCount = 0, metoCount = 0, razdachaCount = 0

    // 1. Nastil
    const nastilWs = wb.Sheets['Отчет по настилу']
    if (nastilWs) {
      const rows = XLSX.utils.sheet_to_json(nastilWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        try {
          await sql`
            INSERT INTO nastil (buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer,
              unik_kod, kroy_kilindi, metochi, meto_kilindi, patoka_berildi, razdacha,
              meto, razdacha_koldi, ombor_qoldiq)
            VALUES (${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])}, ${safeStr(r[5])},
              ${excelDateToJS(r[6])}, ${safeInt(r[7])}, ${safeStr(r[8])}, ${safeStr(r[9])},
              ${safeStr(r[10])}, ${safeInt(r[11])}, ${safeStr(r[12])}, ${safeInt(r[13])},
              ${safeInt(r[14])}, ${safeInt(r[15])}, ${safeInt(r[16])}, ${safeInt(r[17])},
              ${safeInt(r[18])})
          `
          nastilCount++
        } catch {}
      }
    }

    // 2. Buyurtma
    const buyurtmaWs = wb.Sheets['Отчет по заказу']
    if (buyurtmaWs) {
      const rows = XLSX.utils.sheet_to_json(buyurtmaWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[1]) continue
        try {
          await sql`
            INSERT INTO buyurtma (buyurtma, model, rang, buyurtmachi, rost, razmer, unik_kod,
              buyurtma_son, kroy_kilindi, meto_kilindi, patoka_berildi, razdacha_1, razdacha_2,
              brak_vozvrat, kesim_brak, umumi_qoldi, kesim_qoldi, meto_qoldi)
            VALUES (${safeStr(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[5])},
              ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])},
              ${safeInt(r[9])}, ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[12])},
              ${safeInt(r[13])}, ${safeInt(r[14])}, ${safeInt(r[15])}, ${safeInt(r[16])},
              ${safeInt(r[17])}, ${safeInt(r[19])}, ${safeInt(r[20])})
          `
          buyurtmaCount++
        } catch {}
      }
    }

    // 3. Metochilar
    const metoWs = wb.Sheets['меточила']
    if (metoWs) {
      const rows = XLSX.utils.sheet_to_json(metoWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        try {
          await sql`
            INSERT INTO metochilar (sana, buyurtma, model, rang, nastil_no, rost, razmer,
              tekshirish, unik_kod, son, brak, meto_kiligan_son)
            VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
              ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])},
              ${safeStr(r[9])}, ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[14])})
          `
          metoCount++
        } catch {}
      }
    }

    // 4. Razdacha
    const razdachaWs = wb.Sheets['Раздача-Возврат']
    if (razdachaWs) {
      const rows = XLSX.utils.sheet_to_json(razdachaWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        try {
          await sql`
            INSERT INTO razdacha (sana, buyurtma, model, rang, nastil_no, rost, razmer,
              tekshirish, unik_kod, sort, potok, razdacha_son, brak_vozvrat)
            VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
              ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])},
              ${safeStr(r[9])}, ${safeInt(r[11])}, ${safeStr(r[12])},
              ${safeInt(r[15])}, ${safeInt(r[16])})
          `
          razdachaCount++
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      nastil: nastilCount,
      buyurtma: buyurtmaCount,
      metochilar: metoCount,
      razdacha: razdachaCount,
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
