import { createServerSupabaseClient } from '@/lib/supabase/server'
import sql from '@/lib/db'

async function getStats() {
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
    return {
      active_orders: orders.count || 0,
      active_staff: staff.count || 0,
    }
  } catch {
    return { active_orders: 0, active_staff: 0 }
  }
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [nastilStats, erpStats] = await Promise.all([getStats(), getERPStats(supabase)])

  const cards = [
    { label: 'Nastil qatorlari', value: nastilStats.nastil_qator.toLocaleString(), icon: '⧉', color: '#4263eb' },
    { label: 'Jami kesim', value: nastilStats.jami_kesim.toLocaleString(), icon: '✂', color: '#3fb950' },
    { label: 'Unikal buyurtmalar', value: nastilStats.buyurtma_soni.toLocaleString(), icon: '📦', color: '#9b59b6' },
    { label: 'Razdacha jami', value: nastilStats.razdacha_jami.toLocaleString(), icon: '↗', color: '#f97316' },
    { label: 'Ombor qoldig\'i', value: nastilStats.ombor_qoldiq.toLocaleString(), icon: '⚠', color: '#f85149' },
    { label: 'Faol buyurtmalar', value: erpStats.active_orders.toLocaleString(), icon: '📋', color: '#58a6ff' },
    { label: 'Faol xodimlar', value: erpStats.active_staff.toLocaleString(), icon: '👥', color: '#1abc9c' },
  ]

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="card">
        <p className="text-sm font-bold" style={{ color: '#f97316' }}>
          Xush kelibsiz! 👋
        </p>
        <p className="text-xs mt-1" style={{ color: '#8b949e' }}>
          {user?.email} — Textile ERP Boshqaruv Tizimi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ padding: '14px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: c.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, marginBottom: 8
            }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Two sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Nastil & Razdacha moduli</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { href: '/dashboard/nastil', label: 'Nastil hisoboti', desc: `${nastilStats.nastil_qator.toLocaleString()} qator` },
              { href: '/dashboard/buyurtma', label: 'Buyurtmalar', desc: `${nastilStats.buyurtma_soni} unikal` },
              { href: '/dashboard/razdacha', label: 'Razdacha', desc: `Jami: ${nastilStats.razdacha_jami.toLocaleString()}` },
              { href: '/dashboard/hisobot', label: 'Hisobotlar', desc: 'Grafiklar va tahlil' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', borderRadius: 8, background: '#21262d',
                textDecoration: 'none', transition: 'background .15s'
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#30363d')}
                onMouseLeave={e => (e.currentTarget.style.background = '#21262d')}>
                <span style={{ fontSize: 12, color: '#e6edf3' }}>{l.label}</span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{l.desc}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>ERP moduli</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { href: '/dashboard/orders', label: 'Buyurtmalar (ERP)', desc: `${erpStats.active_orders} faol` },
              { href: '/dashboard/staff', label: 'Xodimlar', desc: `${erpStats.active_staff} aktiv` },
              { href: '/dashboard/attendance', label: 'Davomat', desc: 'Bugungi holat' },
              { href: '/dashboard/kpi', label: 'KPI & Ustalar', desc: 'Unumdorlik' },
              { href: '/dashboard/warehouse', label: "Ombor o'tkazmalar", desc: 'Harakatlar' },
            ].map(l => (
              <a key={l.href} href={l.href} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 10px', borderRadius: 8, background: '#21262d',
                textDecoration: 'none', transition: 'background .15s'
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#30363d')}
                onMouseLeave={e => (e.currentTarget.style.background = '#21262d')}>
                <span style={{ fontSize: 12, color: '#e6edf3' }}>{l.label}</span>
                <span style={{ fontSize: 11, color: '#8b949e' }}>{l.desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
