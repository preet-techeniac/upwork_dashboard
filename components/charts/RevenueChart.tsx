'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface DataPoint {
  month: string;
  usd: number;
  inr: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '0.75rem 1rem', minWidth: 160, boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem' }}>
          <span style={{ color: p.color }}>{p.dataKey.toUpperCase()}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ${p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="usdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingTop: '0.5rem' }}
          formatter={(v) => v.toUpperCase()}
        />
        <Area type="monotone" dataKey="usd" stroke="#14b8a6" strokeWidth={2} fill="url(#usdGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
