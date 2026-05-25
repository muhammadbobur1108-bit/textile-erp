import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import * as XLSX from 'xlsx'

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
    const file = formData.get('file') as File
    const clearOld = formData.get('clearOld') === 'true'

    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'buffer' })

    // Clear old data if requested
    if (clearOld) {
      await sql`TRUNCATE TABLE nastil, buyurtma, metochilar, razdacha RESTART IDENTITY`
    }

    let nastilCount = 0, buyurtmaCount = 0, metoCount = 0, razdachaCount = 0

    // 1. Import Nastil
    const nastilWs = wb.Sheets['Отчет по настилу']
    if (nastilWs) {
      const rows = XLSX.utils.sheet_to_json(nastilWs, { header: 1, defval: null }) as any[]
      const BATCH = 200
      let batch = []
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        batch.push(r)
        if (batch.length >= BATCH) {
          await insertNastilBatch(batch)
          nastilCount += batch.length
          batch = []
        }
      }
      if (batch.length) { await insertNastilBatch(batch); nastilCount += batch.length }
    }

    // 2. Import Buyurtma
    const buyurtmaWs = wb.Sheets['Отчет по заказу']
    if (buyurtmaWs) {
      const rows = XLSX.utils.sheet_to_json(buyurtmaWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[1]) continue
        await sql`INSERT INTO buyurtma (buyurtma, model, rang, unik_kod2, buyurtmachi, rost, razmer, unik_kod,
            buyurtma_son, kroy_kilindi, meto_kilindi, patoka_berildi, razdacha_1, razdacha_2,
            brak_vozvrat, kesim_brak, umumi_qoldi, potok_orkasi, kesim_qoldi, meto_qoldi)
          VALUES (${safeStr(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
            ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])},
            ${safeInt(r[9])}, ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[12])},
            ${safeInt(r[13])}, ${safeInt(r[14])}, ${safeInt(r[15])}, ${safeInt(r[16])},
            ${safeInt(r[17])}, ${safeInt(r[18])}, ${safeInt(r[19])}, ${safeInt(r[20])})`
        buyurtmaCount++
      }
    }

    // 3. Import Metochilar
    const metoWs = wb.Sheets['меточила']
    if (metoWs) {
      const rows = XLSX.utils.sheet_to_json(metoWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        await sql`INSERT INTO metochilar (sana, buyurtma, model, rang, nastil_no, rost, razmer, tekshirish, unik_kod, son, brak, meto_kiligan_son)
          VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
            ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])}, ${safeStr(r[9])},
            ${safeInt(r[10])}, ${safeInt(r[11])}, ${safeInt(r[14])})`
        metoCount++
      }
    }

    // 4. Import Razdacha
    const razdachaWs = wb.Sheets['Раздача-Возврат']
    if (razdachaWs) {
      const rows = XLSX.utils.sheet_to_json(razdachaWs, { header: 1, defval: null }) as any[]
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r[2]) continue
        await sql`INSERT INTO razdacha (sana, buyurtma, model, rang, nastil_no, rost, razmer, tekshirish, unik_kod, sort, potok, razdacha_son, brak_vozvrat)
          VALUES (${excelDateToJS(r[1])}, ${safeStr(r[2])}, ${safeStr(r[3])}, ${safeStr(r[4])},
            ${safeStr(r[5])}, ${safeStr(r[6])}, ${safeStr(r[7])}, ${safeStr(r[8])}, ${safeStr(r[9])},
            ${safeInt(r[11])}, ${safeStr(r[12])}, ${safeInt(r[15])}, ${safeInt(r[16])})`
        razdachaCount++
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

async function insertNastilBatch(rows: any[]) {
  for (const r of rows) {
    await sql`INSERT INTO nastil (buyurtma, model, rang, be_kod, sana, nastil_no, rost, razmer, unik_kod,
        kroy_kilindi, metochi, meto_kilindi, patoka_berildi, razdacha, meto, razdacha_koldi, ombor_qoldiq)
      VALUES (${r[2]?.toString().trim()||''}, ${r[3]?.toString().trim()||''}, ${r[4]?.toString().trim()||''},
        ${r[5]?.toString().trim()||''}, ${excelDateToJS(r[6])}, ${parseInt(r[7])||0},
        ${r[8]?.toString().trim()||''}, ${r[9]?.toString().trim()||''}, ${r[10]?.toString().trim()||''},
        ${parseInt(r[11])||0}, ${r[12]?.toString().trim()||''}, ${parseInt(r[13])||0},
        ${parseInt(r[14])||0}, ${parseInt(r[15])||0}, ${parseInt(r[16])||0},
        ${parseInt(r[17])||0}, ${parseInt(r[18])||0})`
  }
}

