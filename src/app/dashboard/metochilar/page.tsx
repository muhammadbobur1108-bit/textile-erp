import sql, { dbQuery } from '@/lib/db'
import SimpleTable from '@/components/SimpleTable'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

const columns = [
  { key: 'sana', label: 'Sana', format: (v: any) => v ? new Date(v).toLocaleDateString('uz-UZ') : '—' },
  { key: 'buyurtma', label: 'Buyurtma' },
  { key: 'model', label: 'Model' },
  { key: 'rang', label: 'Rang' },
  { key: 'nastil_no', label: 'Nastil №' },
  { key: 'rost', label: 'Rost' },
  { key: 'razmer', label: 'Razmer' },
  { key: 'son', label: 'Soni', className: 'n-blue' },
  { key: 'brak', label: 'Brak', className: 'n-red' },
  { key: 'meto_kiligan_son', label: 'Meto kilgan', className: 'n-green' },
]

export default async function MetochilarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const buyurtma = sp.buyurtma as string | undefined
  const page = Number(sp.page || 1)
  const limit = 100
  const offset = (page - 1) * limit
  let rows: any[] = [], total = 0
  try {
    const cond = buyurtma ? 'WHERE buyurtma ILIKE $1' : ''
    const vals = buyurtma ? [`%${buyurtma}%`] : []
    const i = buyurtma ? 2 : 1
    const [r, c] = await Promise.all([
      dbQuery(`SELECT * FROM metochilar ${cond} ORDER BY sana DESC LIMIT $${i} OFFSET $${i+1}`, [...vals, limit, offset]),
      dbQuery(`SELECT COUNT(*) as total FROM metochilar ${cond}`, vals),
    ])
    rows = r.rows; total = Number(c.rows[0].total)
  } catch {}
  return (
    <div style={{ padding: 20 }} className="space-y-4">
      <div><h1 style={{ fontSize: 20, fontWeight: 700 }}>Metochilar</h1>
      <p style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>Jami: <strong>{total.toLocaleString()}</strong> qator</p></div>
      <SimpleTable rows={rows} total={total} page={page} limit={limit} columns={columns} basePath="/dashboard/metochilar" filterKey="buyurtma" filterPlaceholder="Buyurtma..." />
    </div>
  )
}
