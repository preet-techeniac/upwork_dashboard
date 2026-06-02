'use client';

import { ReactNode } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  accent?: boolean;
}

export default function StatsCard({
  title, value, subtitle, icon: Icon,
  iconColor = 'var(--teal-400)',
  iconBg = 'rgba(20,184,166,0.12)',
  trend, trendLabel, accent = false,
}: StatsCardProps) {
  return (
    <div
      className="card glow-teal fade-in"
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...(accent ? {
          background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(99,102,241,0.08))',
          borderColor: 'rgba(20,184,166,0.3)',
        } : {}),
      }}
    >
      {accent && (
        <div
          style={{
            position: 'absolute', top: 0, right: 0,
            width: 80, height: 80,
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
            borderRadius: '50%', transform: 'translate(20px, -20px)',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: iconBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: '0.72rem', fontWeight: 600,
              color: trend >= 0 ? 'var(--green-400)' : 'var(--red-400)',
            }}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {(subtitle || trendLabel) && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          {trendLabel ?? subtitle}
        </div>
      )}
    </div>
  );
}
