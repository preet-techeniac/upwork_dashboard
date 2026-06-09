'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface MonthlyData {
  month: string;
  bids: number;
  connects: number;
  viewed: number;
  conversation: number;
  converted: number;
  earnings: number;
}

interface MonthlyBifurcationChartProps {
  data: MonthlyData[];
  activeMetrics: string[];
}

const METRIC_COLORS: Record<string, string> = {
  bids: 'var(--indigo-400)',
  connects: 'var(--orange-400)',
  viewed: 'var(--amber-400)',
  conversation: 'var(--purple-400)',
  converted: 'var(--green-400)',
  earnings: 'var(--teal-400)',
  investment: 'var(--orange-400)',
};

const METRIC_LABELS: Record<string, string> = {
  bids: 'Total Bids',
  connects: 'Connects Used',
  viewed: 'Proposals Viewed',
  conversation: 'In Conversation',
  converted: 'Converted',
  earnings: 'Earnings ($)',
  investment: 'Investment ($)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated" style={{ padding: '0.75rem 1rem', minWidth: 160, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {payload.map((p: any) => {
          const isDollar = p.dataKey === 'earnings' || p.dataKey === 'investment';
          const valueStr = isDollar ? `$${p.value.toLocaleString(undefined, { minimumFractionDigits: isDollar && p.dataKey === 'investment' ? 2 : 0, maximumFractionDigits: 2 })}` : p.value.toLocaleString();
          return (
            <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem' }}>
              <span style={{ color: p.color || p.fill, fontWeight: 500 }}>{METRIC_LABELS[p.dataKey] ?? p.name}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{valueStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MonthlyBifurcationChart({ data, activeMetrics }: MonthlyBifurcationChartProps) {
  const chartData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
        <defs>
          {activeMetrics.map((metric) => (
            <linearGradient key={metric} id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={METRIC_COLORS[metric]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={METRIC_COLORS[metric]} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />

        {/* Primary Y-Axis for counts */}
        <YAxis
          yAxisId="left"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={{ value: 'Count (Bids / Views / Converted)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 10, textAnchor: 'middle' }, offset: 5 }}
        />

        {/* Secondary Y-Axis for Connects & Earnings */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={{ value: 'Scale (Connects / Dollars)', angle: 90, position: 'insideRight', style: { fill: 'var(--text-muted)', fontSize: 10, textAnchor: 'middle' }, offset: 5 }}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />

        <Legend
          wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.75rem' }}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{METRIC_LABELS[value] ?? value}</span>}
        />

        {activeMetrics.map((metric) => {
          // Bids, views, conversations, and conversions go on left axis; connects, earnings, and investment go on right axis
          const yAxisId = (metric === 'connects' || metric === 'earnings' || metric === 'investment') ? 'right' : 'left';
          return (
            <Area
              key={metric}
              yAxisId={yAxisId}
              type="monotone"
              dataKey={metric}
              stroke={METRIC_COLORS[metric]}
              fillOpacity={1}
              fill={`url(#grad-${metric})`}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              name={metric}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}