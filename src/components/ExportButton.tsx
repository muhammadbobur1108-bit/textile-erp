'use client'
import { useState } from 'react'
import { Download } from 'lucide-react'

interface Props {
  table: 'nastil' | 'buyurtma' | 'razdacha' | 'metochilar'
  params?: Record<string, string>
}

export default function ExportButton({ table, params = {} }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const q = new URLSearchParams({ table, ...params })
      const res = await fetch(`/api/export?${q}`)
      if (!res.ok) throw new Error('Export xatosi')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export amalga oshmadi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-secondary flex items-center gap-2"
    >
      <Download size={16} />
      {loading ? 'Yuklanmoqda...' : 'Excel export'}
    </button>
  )
}
