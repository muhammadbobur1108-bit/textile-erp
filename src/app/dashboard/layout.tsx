'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { group: 'Asosiy', items: [
    { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  ]},
  { group: 'Nastil & Razdacha', items: [
    { href: '/dashboard/nastil', icon: '⧉', label: 'Nastil hisoboti' },
    { href: '/dashboard/buyurtma', icon: '📦', label: 'Buyurtmalar' },
    { href: '/dashboard/razdacha', icon: '↗', label: 'Razdacha' },
    { href: '/dashboard/metochilar', icon: '🧵', label: 'Metochilar' },
    { href: '/dashboard/hisobot', icon: '📊', label: 'Hisobotlar' },
  ]},
  { group: 'Ishlab Chiqarish', items: [
    { href: '/dashboard/orders', icon: '📋', label: 'Buyurtmalar (ERP)', badge: '12' },
    { href: '/dashboard/matrix', icon: '⊟', label: 'Size Matrix' },
    { href: '/dashboard/quality', icon: '✓', label: 'OTK Nazorat' },
    { href: '/dashboard/tasks', icon: '☑', label: 'Shogird Vazifalari', badge: '5' },
    { href: '/dashboard/kpi', icon: '★', label: 'KPI & Ustalar' },
  ]},
  { group: 'Ombor', items: [
    { href: '/dashboard/warehouse', icon: '⇄', label: "O'tkazmalar" },
    { href: '/dashboard/disputes', icon: '⚠', label: 'Nizolar', badge: '2', danger: true },
  ]},
  { group: 'Ofis', items: [
    { href: '/dashboard/attendance', icon: '📅', label: 'Davomat' },
    { href: '/dashboard/staff', icon: '👥', label: 'Xodimlar' },
  ]},
  { group: "Ma'lumotlar", items: [
    { href: '/dashboard/import', icon: '↑', label: 'Excel Import' },
    { href: '/dashboard/qr', icon: '⬛', label: 'QR Generator' },
    { href: '/dashboard/reports', icon: '📈', label: 'Hisobotlar (ERP)' },
    { href: '/dashboard/settings', icon: '⚙', label: 'Sozlamalar' },
  ]},
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className="flex flex-col border-r overflow-y-auto flex-shrink-0 transition-all duration-300"
        style={{ width: collapsed ? '52px' : '220px', background: '#161b22', borderColor: '#30363d' }}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-3.5 border-b flex-shrink-0" style={{ borderColor: '#30363d' }}>
          <span className="text-xl flex-shrink-0">🧵</span>
          {!collapsed && (
            <div>
              <div className="text-sm font-extrabold leading-none" style={{ color: '#f97316' }}>TEXTILE ERP</div>
              <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: '#6e7681' }}>Boshqaruv Tizimi</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-xs p-1 rounded hover:bg-[#21262d]"
            style={{ color: '#6e7681', flexShrink: 0 }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.group} className="mb-1">
              {!collapsed && (
                <div className="text-[9px] uppercase tracking-widest px-4 py-1 font-semibold" style={{ color: '#6e7681' }}>
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const active = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-all relative"
                    style={{
                      color: active ? '#f97316' : '#8b949e',
                      background: active ? 'rgba(249,115,22,.1)' : 'transparent',
                      borderLeft: `2px solid ${active ? '#f97316' : 'transparent'}`,
                    }}>
                    <span className="flex-shrink-0 text-sm w-4 text-center">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white flex-shrink-0"
                            style={{ background: (item as any).danger ? '#ef4444' : '#f97316' }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t flex-shrink-0" style={{ borderColor: '#30363d' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs py-1.5 px-2 rounded hover:bg-[#21262d]"
            style={{ color: '#8b949e' }}>
            <span>⎋</span>
            {!collapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 h-[50px] border-b flex-shrink-0"
          style={{ background: '#161b22', borderColor: '#30363d' }}>
          <span className="font-bold text-sm truncate">
            {NAV.flatMap(g => g.items).find(i =>
              pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href))
            )?.label || 'Dashboard'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/import">
              <button className="btn text-xs px-3 py-1.5">↑ Excel Import</button>
            </Link>
            <Link href="/dashboard/orders">
              <button className="btn btn-primary text-xs px-3 py-1.5">+ Yangi Buyurtma</button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5" style={{ background: '#0d1117' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
