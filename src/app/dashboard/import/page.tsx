import ImportExcel from './ImportExcel'

export default function ImportPage() {
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Excel Import</h1>
        <p style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
          Yangi Excel faylni yuklang — ma'lumotlar avtomatik import qilinadi
        </p>
      </div>
      <div className="card space-y-4">
        <ImportExcel />
      </div>
    </div>
  )
}
