'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Send, DollarSign, BarChart3,
  Users, LogOut, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/bids',       label: 'Bids',        icon: Send },
  { href: '/earnings',   label: 'Earnings',    icon: DollarSign },
  { href: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/recruiters', label: 'Recruiters',  icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside
      style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          borderBottom: '1px solid var(--border)',
          minHeight: 'var(--topbar-height)',
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--teal-500), var(--indigo-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <TrendingUp size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              BidTrack
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Upwork Analytics</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.83rem',
              transition: 'all 0.12s ease',
              color: isActive(href) ? 'var(--teal-400)' : 'var(--text-secondary)',
              background: isActive(href) ? 'rgba(20,184,166,0.1)' : 'transparent',
              borderLeft: isActive(href) ? '2px solid var(--teal-500)' : '2px solid transparent',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && label}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div
        style={{
          padding: '0.75rem 0.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {!collapsed && user && (
          <div style={{ padding: '0.5rem 0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.displayName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role}</div>
          </div>
        )}
        <button
          onClick={logout}
          className="btn btn-ghost btn-sm"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}
        >
          <LogOut size={14} />
          {!collapsed && 'Sign out'}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn btn-ghost btn-sm"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
