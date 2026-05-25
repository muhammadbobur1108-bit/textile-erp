'use client'
import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'

type Status = 'idle' | 'uploading' | 'success' | 'error'

export default function ImportExcel() {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [clearOld, setClearOld] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setStatus('uploading')
    setMessage('Fayl yuklanmoqda...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clearOld', String(clearOld))

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xato')
      setStatus('success')
      setMessage(`✅ Import tugadi! Nastil: ${data.nastil}, Buyurtma: ${data.buyurtma}, Razdacha: ${data.razdacha}, Metochilar: ${data.metochilar} qator`)
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${status === 'uploading' ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50'}`}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xlsm,.xls"
          className="hidden"
          onChange={handleUpload}
          disabled={status === 'uploading'}
        />
        {status === 'uploading' ? (
          <>
            <Loader size={28} className="text-brand-500 animate-spin mb-2" />
            <p className="text-sm font-semibold text-brand-600">Import qilinmoqda...</p>
            <p className="text-xs text-slate-400 mt-1">{fileName}</p>
          </>
        ) : (
          <>
            <Upload size={28} className="text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Excel faylni bu yerga tashlang</p>
            <p className="text-xs text-slate-400 mt-1">.xlsx, .xlsm, .xls qo'llab-quvvatlanadi</p>
          </>
        )}
      </label>

      {/* Options */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={clearOld} onChange={e => setClearOld(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-brand-500" />
        <span className="text-sm text-slate-600">
          Avvalgi ma'lumotlarni o'chirib, yangidan import qilish
        </span>
      </label>

      {/* Status message */}
      {message && (
        <div className={`flex items-start gap-3 p-3 rounded-lg text-sm
          ${status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-brand-50 text-brand-700 border border-brand-200'}`}>
          {status === 'success' ? <CheckCircle size={18} className="mt-0.5 flex-shrink-0" /> :
           status === 'error' ? <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> : null}
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}
