'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_LABELS: Record<string, string> = {
  bid: 'Bid Sent',
  viewed: 'Viewed',
  received_message: 'Got Message',
  received_offer: 'Got Offer',
  client: 'Converted',
  'in conversation': 'In Conversation',
  'sent an offer': 'Sent an Offer',
  'viewed & accepted': 'Viewed & Accepted',
  'seen by client': 'Seen by Client',
  'viewed, but client is now restricted from upwork.': 'Client Restricted',
};

const STATUS_COLORS: Record<string, string> = {
  bid: 'var(--blue-400)',
  viewed: 'var(--amber-400)',
  received_message: 'var(--purple-400)',
  received_offer: 'var(--orange-400)',
  client: 'var(--green-400)',
  'in conversation': 'var(--purple-400)',
  'sent an offer': 'var(--orange-400)',
  'viewed & accepted': 'var(--green-400)',
  'seen by client': 'var(--teal-400)',
  'viewed, but client is now restricted from upwork.': 'var(--red-400)',
};

const getStatusLabel = (status: string): string => {
  if (!status) return '';
  const key = status.toLowerCase().trim();
  return STATUS_LABELS[key] ?? STATUS_LABELS[status] ?? status;
};

const getStatusColor = (status: string): string => {
  if (!status) return 'var(--text-secondary)';
  const key = status.toLowerCase().trim();
  return STATUS_COLORS[key] ?? STATUS_COLORS[status] ?? 'var(--text-secondary)';
};

interface DataPoint {
  status: string;
  count: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="card" style={{ padding: '0.65rem 0.9rem', boxShadow: 'var(--shadow-lg)' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {getStatusLabel(d.name)}
      </div>
      <div style={{ fontSize: '0.78rem', color: d.payload.fill, fontWeight: 700 }}>{d.value} bids</div>
    </div>
  );
};

export default function BidStatusPieChart({ data }: { data: DataPoint[] }) {
  // Aggregate 'Viewed & accepted' and 'seen by client' under 'Viewed'
  const aggregated: Record<string, number> = {};
  data?.forEach((d) => {
    if (!d.status) return;
    const lower = d.status.toLowerCase().trim();
    const key = (lower === 'viewed & accepted' || lower === 'seen by client') ? 'Viewed' : d.status;
    const finalKey = key.toLowerCase().trim() === 'viewed' ? 'Viewed' : key;
    aggregated[finalKey] = (aggregated[finalKey] || 0) + d.count;
  });

  const chartData = Object.entries(aggregated).map(([status, count]) => ({
    name: status,
    value: count,
    fill: getStatusColor(status),
  })).sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%" cy="50%"
          innerRadius={60} outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData?.map((entry, index) => (
            <Cell key={index} fill={entry.fill} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v) => getStatusLabel(v)}
          wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}