'use client'
// app/login/page.tsx

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const sb = createClient()
    // Supabase email login ishlatamiz (login = email kabi)
    const { error: authError } = await sb.auth.signInWithPassword({
      email: login.includes('@') ? login : `${login}@chusttextile.uz`,
      password,
    })
    if (authError) {
      setError("Login yoki parol noto'g'ri")
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🧵</div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#f97316' }}>
            CHUST TEXTILE
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            ERP Boshqaruv Tizimi
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: '#161b22', borderColor: '#30363d' }}>
          <h2 className="text-base font-bold mb-6">Tizimga kirish</h2>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-4 text-sm"
                 style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8b949e' }}>
                Login
              </label>
              <input
                type="text"
                value={login}
                onChange={e => setLogin(e.target.value)}
                placeholder="bobirjon"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: '#21262d', border: '1px solid #30363d',
                  color: '#e6edf3', fontSize: '13px'
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#30363d'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8b949e' }}>
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: '#21262d', border: '1px solid #30363d',
                  color: '#e6edf3', fontSize: '13px'
                }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#30363d'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: loading ? '#7c3a0e' : '#f97316',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}>
              {loading ? 'Kirilmoqda...' : 'Kirish →'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#6e7681' }}>
            Muammo bo'lsa: Admin bilan bog'laning
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#6e7681' }}>
          CHUST TEXTILE ERP v2.5.1
        </p>
      </div>
    </div>
  )
}
