'use client';

import { useEffect, useState } from 'react';
import { useAuth, authFetch } from '../../../lib/auth-context';
import Topbar from '../../../components/Topbar';
import RevenueChart from '../../../components/charts/RevenueChart';
import BidActivityChart from '../../../components/charts/BidActivityChart';
import BidStatusPieChart from '../../../components/charts/BidStatusPieChart';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

interface ChartData {
  monthly: { month: string; bids: number; won: number; usd: number; inr: number }[];
  recruiters: { id: number; name: string; totalBids: number; wonBids: number; earnedUsd: number; earnedInr: number; winRate: string }[];
  statusDistribution: { status: string; count: number }[];
}

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

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    authFetch('/api/analytics/charts', token).then(r => r.json()).then(d => {
      setCharts(d);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const aggregatedStatusDistribution = (() => {
    if (!charts?.statusDistribution) return [];
    const aggregated: Record<string, number> = {};
    charts.statusDistribution.forEach((s) => {
      if (!s.status) return;
      const lower = s.status.toLowerCase().trim();
      const key = (lower === 'viewed & accepted' || lower === 'seen by client') ? 'Viewed' : s.status;
      const finalKey = key.toLowerCase().trim() === 'viewed' ? 'Viewed' : key;
      aggregated[finalKey] = (aggregated[finalKey] || 0) + s.count;
    });
    return Object.entries(aggregated).map(([status, count]) => ({
      status,
      count,
    })).sort((a, b) => b.count - a.count);
  })();

  const totalBids = aggregatedStatusDistribution.reduce((a, s) => a + s.count, 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Analytics" subtitle="Performance insights & trends" />
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="page-subtitle">Deep dive into your bidding performance</p>
          </div>
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Earnings</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>USD & INR over last 6 months</div>
            </div>
            {charts && <RevenueChart data={charts.monthly} />}
          </div>
          <div className="card">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bid Activity</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sent vs Converted per month</div>
            </div>
            {charts && <BidActivityChart data={charts.monthly} />}
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bid Pipeline</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status distribution</div>
            </div>
            {charts && <BidStatusPieChart data={aggregatedStatusDistribution} />}
          </div>

          {/* Status breakdown list */}
          <div className="card">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Status Breakdown</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{totalBids} total bids</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {aggregatedStatusDistribution.map((s) => {
                const pct = totalBids > 0 ? (s.count / totalBids) * 100 : 0;
                const label = getStatusLabel(s.status);
                const color = getStatusColor(s.status);
                return (
                  <div key={s.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: color }}>
                        {s.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border)', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${pct}%`,
                        background: color,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recruiter performance table */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recruiter Performance</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ranked by total bids</div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Recruiter</th>
                  <th>Total Bids</th>
                  <th>Won</th>
                  <th>Win Rate</th>
                  <th>Earned USD</th>
                  <th>Earned INR</th>
                </tr>
              </thead>
              <tbody>
                {(!charts?.recruiters || charts.recruiters.length === 0) && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No recruiter data</td></tr>
                )}
                {charts?.recruiters?.map((r, i) => (
                  <tr key={r.id} className="fade-in">
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--teal-600), var(--indigo-600))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                        }}>
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.totalBids}</td>
                    <td style={{ color: 'var(--green-400)', fontWeight: 600 }}>{r.wonBids}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 999 }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${Math.min(100, parseFloat(r.winRate))}%`,
                            background: parseFloat(r.winRate) > 30 ? 'var(--green-400)' : parseFloat(r.winRate) > 10 ? 'var(--amber-400)' : 'var(--red-400)',
                          }} />
                        </div>
                        <span style={{
                          fontWeight: 600,
                          color: parseFloat(r.winRate) > 30 ? 'var(--green-400)' : parseFloat(r.winRate) > 10 ? 'var(--amber-400)' : 'var(--red-400)',
                          fontSize: '0.82rem',
                        }}>
                          {r.winRate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--teal-400)', fontWeight: 600 }}>${r.earnedUsd.toLocaleString()}</td>
                    <td style={{ color: 'var(--amber-400)', fontWeight: 600 }}>₹{r.earnedInr.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
