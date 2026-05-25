import { NextRequest, NextResponse } from 'next/server'
import sql, { dbQuery } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  try {
    const s = req.nextUrl.searchParams
    const table = s.get('table') || 'nastil'
    const buyurtma = s.get('buyurtma')
    const rang = s.get('rang')
    const sana_dan = s.get('sana_dan')
    const sana_gacha = s.get('sana_gacha')

    // Allowed tables only (security)
    const allowed = ['nastil', 'buyurtma', 'razdacha', 'metochilar']
    if (!allowed.includes(table)) {
      return NextResponse.json({ error: 'Noto\'g\'ri jadval' }, { status: 400 })
    }

    const cond: string[] = []
    const vals: any[] = []
    let i = 1
    if (buyurtma) { cond.push(`buyurtma ILIKE $${i++}`); vals.push(`%${buyurtma}%`) }
    if (rang && table === 'nastil') { cond.push(`rang ILIKE $${i++}`); vals.push(`%${rang}%`) }
    if (sana_dan) { cond.push(`sana >= $${i++}`); vals.push(sana_dan) }
    if (sana_gacha) { cond.push(`sana <= $${i++}`); vals.push(sana_gacha) }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''

    // Fetch all rows (no limit for export)
    const result = await dbQuery(
      `SELECT * FROM ${table} ${where} ORDER BY id LIMIT 50000`,
      vals
    )
    const rows = result.rows

    // Column headers in Uzbek
    const headers: Record<string, Record<string, string>> = {
      nastil: {
        id: 'ID', buyurtma: 'Buyurtma', model: 'Model', rang: 'Rang',
        be_kod: 'BE kod', sana: 'Sana', nastil_no: 'Nastil №',
        rost: 'Rost', razmer: 'Razmer', unik_kod: 'Unik kod',
        kroy_kilindi: 'Kesim', metochi: 'Metochi', meto_kilindi: 'Meto kilindi',
        patoka_berildi: 'Patoka berildi', razdacha: 'Razdacha',
        meto: 'Meto', razdacha_koldi: 'Razdacha qoldi', ombor_qoldiq: 'Ombor qoldi',
      },
      buyurtma: {
        id: 'ID', buyurtma: 'Buyurtma', model: 'Model', rang: 'Rang',
        buyurtmachi: 'Buyurtmachi', rost: 'Rost', razmer: 'Razmer',
        buyurtma_son: 'Buyurtma soni', kroy_kilindi: 'Kesim',
        meto_kilindi: 'Meto kilindi', patoka_berildi: 'Patoka',
        razdacha_1: 'Razdacha 1s', razdacha_2: 'Razdacha 2s',
        brak_vozvrat: 'Brak/Vozvrat', umumi_qoldi: 'Jami qoldi',
        kesim_qoldi: 'Kesim qoldi', meto_qoldi: 'Meto qoldi',
      },
      razdacha: {
        id: 'ID', sana: 'Sana', buyurtma: 'Buyurtma', model: 'Model',
        rang: 'Rang', nastil_no: 'Nastil №', rost: 'Rost', razmer: 'Razmer',
        sort: 'Sort', potok: 'Poток', razdacha_son: 'Razdacha soni',
        brak_vozvrat: 'Brak/Vozvrat',
      },
      metochilar: {
        id: 'ID', sana: 'Sana', buyurtma: 'Buyurtma', model: 'Model',
        rang: 'Rang', nastil_no: 'Nastil №', rost: 'Rost', razmer: 'Razmer',
        son: 'Soni', brak: 'Brak', meto_kiligan_son: 'Meto kilgan',
      },
    }

    const cols = headers[table]
    const colKeys = Object.keys(cols)

    // Build worksheet data
    const wsData = [
      colKeys.map(k => cols[k]), // header row
      ...rows.map(row =>
        colKeys.map(k => {
          const v = row[k]
          if (v instanceof Date) return v.toLocaleDateString('uz-UZ')
          return v ?? ''
        })
      )
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    ws['!cols'] = colKeys.map(k => ({ wch: Math.max(cols[k].length + 2, 12) }))

    // Header row style (bold)
    const range = XLSX.utils.decode_range(ws['!ref']!)
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })]
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4263EB' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, table.charAt(0).toUpperCase() + table.slice(1))

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `${table}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
