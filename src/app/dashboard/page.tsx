import { createServerSupabaseClient } from '@/lib/supabase/server'
import sql from '@/lib/db'
import Link from 'next/link'

async function getNastilStats() {
  try {
    const [nastil, buyurtma, razdacha, qoldiq] = await Promise.all([
      sql`SELECT COUNT(*) as total, COALESCE(SUM(kroy_kilindi),0) as kesim FROM nastil`,
      sql`SELECT COUNT(DISTINCT buyurtma) as total FROM buyurtma`,
      sql`SELECT COALESCE(SUM(razdacha_son),0) as total FROM razdacha`,
      sql`SELECT COALESCE(SUM(ombor_qoldiq),0) as total FROM nastil WHERE ombor_qoldiq > 0`,
    ])
    return {
      nastil_qator: Number(nastil[0].total),
      jami_kesim: Number(nastil[0].kesim),
      buyurtma_soni: Number(buyurtma[0].total),
      razdacha_jami: Number(razdacha[0].total),
      ombor_qoldiq: Number(qoldiq[0].total),
    }
  } catch {
    return { nastil_qator: 0, jami_kesim: 0, buyurtma_soni: 0, razdacha_jami: 0, ombor_qoldiq: 0 }
  }
}

async function getERPStats(supabase: any) {
  try {
    const [orders, staff] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])
    return { active_orders: orders.count || 0, active_staff: staff.count || 0 }
  } catch {
    return { active_orders: 0, active_staff: 0 }
  }
}

const cards = [
  { label: 'Nastil qatorlari', key: 'nastil_qator', icon: '⧉', color: '#4263eb' },
  { label: 'Jami kesim', key: 'jami_kesim', icon: '✂', color: '#3fb950' },
  { label: 'Buyurtmalar', key: 'buyurtma_soni', icon: '📦', color: '#9b59b6' },
  { label: 'Razdacha jami', key: 'razdacha_jami', icon: '↗', color: '#f97316' },
  { label: "Ombor qoldi", key: 'ombor_qoldiq', icon: '⚠', color: '#f85149' },
]

const nastilLinks = [
  { href: '/dashboard/nastil', label: 'Nastil hisoboti' },
  { href: '/dashboard/buyurtma', label: 'Buyurtmalar' },
  { href: '/dashboard/razdacha', label: 'Razdacha' },
  { href: '/dashboard/metochilar', label: 'Metochilar' },
  { href: '/dashboard/hisobot', label: 'Hisobotlar' },
]

const erpLinks = [
  { href: '/dashboard/orders', label: 'Buyurtmalar (ERP)' },
  { href: '/dashboard/staff', label: 'Xodimlar' },
  { href: '/dashboard/attendance', label: 'Davomat' },
  { href: '/dashboard/kpi', label: 'KPI & Ustalar' },
  { href: '/dashboard/warehouse', label: 'Ombor' },
]

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [s, erp] = await Promise.all([getNastilStats(), getERPStats(supabase)])

  const statValues: Record<string, number> = {
    nastil_qator: s.nastil_qator,
    jami_kesim: s.jami_kesim,
    buyurtma_soni: s.buyurtma_soni,
    razdacha_jami: s.razdacha_jami,
    ombor_qoldiq: s.ombor_qoldiq,
  }

  return (
    <div className="space-y-5 p-5">
      <div className="card">
        <p className="text-sm font-bold n-orange">Xush kelibsiz 👋</p>
        <p className="text-xs mt-1" style={{ color: '#8b949e' }}>{user?.email}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {cards.map((c) => (
          <div key={c.key} className="card">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{statValues[c.key].toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Nastil & Razdacha</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nastilLinks.map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', borderRadius: 8, background: '#21262d',
                textDecoration: 'none', color: '#e6edf3', fontSize: 12,
              }}>
                {l.label}
                <span style={{ color: '#8b949e', fontSize: 11 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>ERP Moduli</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {erpLinks.map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', borderRadius: 8, background: '#21262d',
                textDecoration: 'none', color: '#e6edf3', fontSize: 12,
              }}>
                {l.label}
                <span style={{ color: '#8b949e', fontSize: 11 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
