'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#4263eb', '#f59f00', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#3498db']

export default function HisobotCharts({ topBuyurtma, rangStats, oylikStats }: any) {
  return (
    <div className="space-y-5">
      {/* Oylik trend */}
      <div className="card">
        <h2 className="font-bold text-slate-700 mb-4">Oylik kesim va razdacha</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={oylikStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="oy" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="kesim" name="Kesim" stroke="#4263eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="razdacha" name="Razdacha" stroke="#f59f00" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top buyurtmalar */}
        <div className="card">
          <h2 className="font-bold text-slate-700 mb-4">Top 15 buyurtma (kesim bo'yicha)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBuyurtma} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="buyurtma" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
              <Bar dataKey="kesim" name="Kesim" fill="#4263eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rang bo'yicha */}
        <div className="card">
          <h2 className="font-bold text-slate-700 mb-4">Rang bo'yicha kesim</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={rangStats} dataKey="kesim" nameKey="rang" cx="50%" cy="50%"
                outerRadius={100} label={({ rang, percent }) => `${rang} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {rangStats.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
