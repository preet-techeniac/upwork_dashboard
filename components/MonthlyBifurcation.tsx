'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, authFetch } from '../lib/auth-context';
import MonthlyBifurcationChart from './charts/MonthlyBifurcationChart';
import { 
  Send, Zap, Eye, MessageSquare, Target, DollarSign, 
  ChevronDown, ChevronUp, RefreshCw, BarChart2, Table, Coins
} from 'lucide-react';

interface MonthlyData {
  month: string;
  month_date: string;
  bids: number;
  connects: number;
  viewed: number;
  conversation: number;
  converted: number;
  earnings: number;
}

const ALL_METRICS = ['bids', 'connects', 'investment', 'viewed', 'conversation', 'converted', 'earnings'];

const METRIC_DETAILS: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  bids: { label: 'Total Bids', color: 'var(--indigo-400)', icon: Send, bg: 'rgba(99,102,241,0.12)' },
  connects: { label: 'Connects Used', color: 'var(--orange-400)', icon: Zap, bg: 'rgba(251,146,60,0.12)' },
  investment: { label: 'Investment', color: 'var(--orange-400)', icon: Coins, bg: 'rgba(251,146,60,0.12)' },
  viewed: { label: 'Proposals Viewed', color: 'var(--amber-400)', icon: Eye, bg: 'rgba(251,191,36,0.12)' },
  conversation: { label: 'In Conversation', color: 'var(--purple-400)', icon: MessageSquare, bg: 'rgba(192,132,252,0.12)' },
  converted: { label: 'Converted Bids', color: 'var(--green-400)', icon: Target, bg: 'rgba(74,222,128,0.12)' },
  earnings: { label: 'Earnings (USD)', color: 'var(--teal-400)', icon: DollarSign, bg: 'rgba(20,184,166,0.12)' },
};

const MEMBER_COLORS: Record<string, string> = {
  All: 'var(--teal-400)',
  Preet: 'var(--indigo-400)',
  Guddu: 'var(--purple-400)',
  Sandeep: 'var(--amber-400)',
};

export default function MonthlyBifurcation() {
  const { token } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetrics, setActiveMetrics] = useState<string[]>(['bids', 'converted', 'earnings']);
  const [showTable, setShowTable] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('All');

  const fetchMonthlyData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/analytics/monthly?found_by=${selectedMember}`, token);
      if (!res.ok) throw new Error('Failed to fetch monthly analytics');
      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load monthly bifurcation data.');
    } finally {
      setLoading(false);
    }
  }, [token, selectedMember]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  const toggleMetric = (metric: string) => {
    setActiveMetrics((prev) => {
      if (prev.includes(metric)) {
        if (prev.length === 1) return prev; // Keep at least one active
        return prev.filter((m) => m !== metric);
      }
      return [...prev, metric];
    });
  };

  const selectAllMetrics = () => {
    setActiveMetrics(ALL_METRICS);
  };

  const selectNoneBidsEarnings = () => {
    setActiveMetrics(['bids', 'earnings']);
  };

  if (loading) {
    return (
      <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32, borderWidth: 3 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading monthly bifurcation…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="alert alert-error" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          {error}
        </div>
        <div>
          <button onClick={fetchMonthlyData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Retry Load
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No monthly bifurcation data found in the database.</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Make sure you have imported CSV data or added bids.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header controls & Metric toggles */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} className="gradient-text" />
              Monthly Performance Bifurcation
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Month-by-month comparative analysis of bidding, connects, engagement, and earnings.
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={selectAllMetrics} className="btn btn-secondary btn-sm">Select All</button>
            <button onClick={selectNoneBidsEarnings} className="btn btn-secondary btn-sm">Reset</button>
            <button onClick={fetchMonthlyData} className="btn btn-secondary btn-sm" title="Refresh data">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Team Member Filter Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.6rem 0.85rem', 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter By Member:
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'Preet', 'Guddu', 'Sandeep'].map((member) => {
              const active = selectedMember === member;
              const color = MEMBER_COLORS[member];
              return (
                <button
                  key={member}
                  onClick={() => setSelectedMember(member)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.15s ease',
                    background: active ? color : 'transparent',
                    color: active ? (member === 'Sandeep' || member === 'All' ? '#111' : '#fff') : 'var(--text-secondary)',
                    borderColor: active ? color : 'var(--border)',
                    boxShadow: active ? `0 0 10px ${color}40` : 'none',
                  }}
                >
                  {member === 'All' ? '👥 All Team' : `👤 ${member}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pill Selection Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {ALL_METRICS.map((metric) => {
            const details = METRIC_DETAILS[metric];
            const active = activeMetrics.includes(metric);
            const Icon = details.icon;
            
            return (
              <button
                key={metric}
                onClick={() => toggleMetric(metric)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: active ? `1px solid ${details.color}` : '1px solid var(--border)',
                  background: active ? details.bg : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: active ? 'transparent' : details.bg,
                  color: details.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
                    {details.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? details.color : 'var(--text-primary)', marginTop: '0.1rem' }}>
                    {metric === 'earnings' 
                      ? `$${data.reduce((acc, curr) => acc + curr.earnings, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
                      : metric === 'investment'
                      ? `$${data.reduce((acc, curr) => acc + curr.connects * 0.15, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : data.reduce((acc, curr) => acc + (curr[metric as keyof MonthlyData] as number), 0).toLocaleString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Comparative Trend Chart */}
      <div className="card" style={{ position: 'relative' }}>
        <div 
          onClick={() => setShowChart(!showChart)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showChart ? '1.25rem' : 0 }}
        >
          <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <BarChart2 size={16} color="var(--teal-400)" />
            Comparative Trend Visualizer
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 2 }}>
            {showChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showChart && (
          <div className="fade-in" style={{ width: '100%' }}>
            <MonthlyBifurcationChart 
              data={data.map(d => ({ ...d, investment: d.connects * 0.15 }))} 
              activeMetrics={activeMetrics} 
            />
          </div>
        )}
      </div>

      {/* 3. Detailed Data Grid Table */}
      <div className="card">
        <div 
          onClick={() => setShowTable(!showTable)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showTable ? '1.25rem' : 0 }}
        >
          <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Table size={16} color="var(--indigo-400)" />
            Month-by-Month Tabular Bifurcation
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 2 }}>
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showTable && (
          <div className="table-wrap fade-in">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ color: 'var(--indigo-400)' }}>Total Bids</th>
                  <th style={{ color: 'var(--orange-400)' }}>Connects</th>
                  <th style={{ color: 'var(--orange-400)' }}>Investment</th>
                  <th style={{ color: 'var(--amber-400)' }}>Viewed</th>
                  <th style={{ color: 'var(--purple-400)' }}>In Conversation</th>
                  <th style={{ color: 'var(--green-400)' }}>Converted</th>
                  <th style={{ color: 'var(--teal-400)' }}>Earnings</th>
                  
                  {/* Derived rates for massive business analytics value */}
                  <th style={{ borderLeft: '1px solid var(--border)', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>View Rate</th>
                  <th style={{ color: 'var(--text-secondary)' }}>Conv. Rate</th>
                  <th style={{ color: 'var(--text-secondary)' }}>Connect / Bid</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const viewRate = r.bids > 0 ? (r.viewed / r.bids) * 100 : 0;
                  const convRate = r.bids > 0 ? (r.converted / r.bids) * 100 : 0;
                  const connectsPerBid = r.bids > 0 ? (r.connects / r.bids) : 0;

                  return (
                    <tr key={r.month} className="fade-in">
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {r.month}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {r.bids.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--orange-400)', fontWeight: 600 }}>
                        {r.connects.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--orange-400)', fontWeight: 600 }}>
                        ${(r.connects * 0.15).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: 'var(--amber-400)', fontWeight: 600 }}>
                        {r.viewed.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--purple-400)', fontWeight: 600 }}>
                        {r.conversation.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--green-400)', fontWeight: 600 }}>
                        {r.converted.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--teal-400)', fontWeight: 700, fontSize: '0.88rem' }}>
                        ${r.earnings.toLocaleString()}
                      </td>
                      
                      {/* Derived Columns */}
                      <td style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          color: viewRate > 20 ? 'var(--green-400)' : viewRate > 10 ? 'var(--amber-400)' : 'var(--text-secondary)'
                        }}>
                          {viewRate.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          color: convRate > 15 ? 'var(--green-400)' : convRate > 5 ? 'var(--amber-400)' : 'var(--text-secondary)'
                        }}>
                          {convRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {connectsPerBid.toFixed(1)} <span style={{ fontSize: '0.7rem' }}>conn/bid</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
