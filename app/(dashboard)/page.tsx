'use client';

import { useEffect, useState } from 'react';
import { useAuth, authFetch } from '../../lib/auth-context';
import Topbar from '../../components/Topbar';
import StatsCard from '../../components/StatsCard';
import RevenueChart from '../../components/charts/RevenueChart';
import BidActivityChart from '../../components/charts/BidActivityChart';
import BidStatusPieChart from '../../components/charts/BidStatusPieChart';
import MonthlyBifurcation from '../../components/MonthlyBifurcation';
import { Send, DollarSign, Users, Zap, Target, LayoutDashboard, CalendarRange, Coins } from 'lucide-react';
import Link from 'next/link';

interface Overview {
  totalBids: number; wonBids: number; winRate: number;
  earningsByCurrency: Record<string, number>;
  monthBids: number; monthEarnings: Record<string, number>;
  totalConnects: number; totalRecruiters: number;
  bidsByStatus: Record<string, number>;
}

interface ChartData {
  monthly: { month: string; bids: number; won: number; usd: number; inr: number }[];
  recruiters: { id: number; name: string; totalBids: number; wonBids: number; earnedUsd: number; earnedInr: number; winRate: string }[];
  statusDistribution: { status: string; count: number }[];
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly'>('overview');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      authFetch('/api/analytics/overview', token).then(r => r.json()),
      authFetch('/api/analytics/charts', token).then(r => r.json()),
    ]).then(([ov, ch]) => { setOverview(ov); setCharts(ch); })
      .finally(() => setLoading(false));
  }, [token]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 36, height: 36, borderWidth: 3 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Dashboard" subtitle={`${greeting()}, ${user?.displayName} 👋`} />
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

        {/* Global Summary Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <StatsCard title="Total Bids" value={overview?.totalBids ?? 0} subtitle={`${overview?.monthBids ?? 0} this month`} icon={Send} iconColor="var(--indigo-400)" iconBg="rgba(99,102,241,0.12)" accent />
          <StatsCard title="Win Rate" value={`${overview?.winRate ?? 0}%`} subtitle={`${overview?.wonBids ?? 0} converted`} icon={Target} iconColor="var(--green-400)" iconBg="rgba(74,222,128,0.12)" />
          <StatsCard title="Earned (USD)" value={`$${(overview?.earningsByCurrency?.['USD'] ?? 0).toLocaleString()}`} subtitle={`$${(overview?.monthEarnings?.['USD'] ?? 0).toLocaleString()} this month`} icon={DollarSign} iconColor="var(--teal-400)" iconBg="rgba(20,184,166,0.12)" accent />
          <StatsCard title="Connects Used" value={overview?.totalConnects ?? 0} subtitle="All time" icon={Zap} iconColor="var(--orange-400)" iconBg="rgba(251,146,60,0.12)" />
          <StatsCard title="Investment" value={`$${((overview?.totalConnects ?? 0) * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Spent on connects ($0.15/ea)" icon={Coins} iconColor="var(--orange-400)" iconBg="rgba(251,146,60,0.12)" accent />
          <StatsCard title="Recruiters" value={overview?.totalRecruiters ?? 0} subtitle="In database" icon={Users} iconColor="var(--purple-400)" iconBg="rgba(192,132,252,0.12)" />
        </div>

        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          borderBottom: '1px solid var(--border)', 
          marginBottom: '1.5rem',
          paddingBottom: '0.1rem' 
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background: activeTab === 'overview' ? 'rgba(20,184,166,0.08)' : 'transparent',
              color: activeTab === 'overview' ? 'var(--teal-400)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--teal-500)' : '2px solid transparent',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={15} />
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background: activeTab === 'monthly' ? 'rgba(99,102,241,0.08)' : 'transparent',
              color: activeTab === 'monthly' ? 'var(--indigo-400)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === 'monthly' ? '2px solid var(--indigo-500)' : '2px solid transparent',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <CalendarRange size={15} />
            Monthly Bifurcation
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Earnings Over Time</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last 6 months (USD)</div>
                </div>
                {charts ? <RevenueChart data={charts.monthly} /> : <div className="spinner" style={{ margin: '5rem auto' }} />}
              </div>
              <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Bid Activity</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sent vs Converted</div>
                </div>
                {charts ? <BidActivityChart data={charts.monthly} /> : <div className="spinner" style={{ margin: '5rem auto' }} />}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1rem' }}>
              <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Bid Pipeline</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By status</div>
                </div>
                {charts ? <BidStatusPieChart data={charts.statusDistribution} /> : <div className="spinner" style={{ margin: '5rem auto' }} />}
              </div>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Top Recruiters</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By bid count</div>
                  </div>
                  <Link href="/recruiters" className="btn btn-ghost btn-sm">View all</Link>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Bids</th><th>Win Rate</th><th>Earnings (USD)</th></tr></thead>
                    <tbody>
                      {!charts?.recruiters?.length && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No recruiters yet</td></tr>}
                      {charts?.recruiters?.slice(0, 5).map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td>{r.totalBids}</td>
                          <td><span style={{ color: parseFloat(r.winRate) > 30 ? 'var(--green-400)' : 'var(--text-secondary)', fontWeight: 600 }}>{r.winRate}%</span></td>
                          <td style={{ color: 'var(--teal-400)', fontWeight: 600 }}>${r.earnedUsd.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <MonthlyBifurcation />
          </div>
        )}
      </main>
    </div>
  );
}

