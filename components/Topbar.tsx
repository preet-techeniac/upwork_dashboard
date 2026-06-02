'use client';

import { useState } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: '1rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}>
          <Bell size={16} />
        </button>

        {/* Avatar with Dropdown */}
        {user && (
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(prev => !prev)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--teal-500), var(--indigo-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                flexShrink: 0, cursor: 'pointer',
                border: showDropdown ? '2px solid var(--teal-400)' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
              title={user.displayName}
            >
              {user.displayName ? user.displayName.toUpperCase().charAt(0) : '?'}
            </div>

            {showDropdown && (
              <>
                {/* Click outside backdrop */}
                <div 
                  onClick={() => setShowDropdown(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99,
                    cursor: 'default',
                  }}
                />
                
                {/* Floating Menu */}
                <div
                  className="fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '115%',
                    width: 200,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.5rem',
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.displayName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                      {user.username}
                    </div>
                  </div>
                  
                  <div className="divider" style={{ margin: '0.4rem 0' }} />
                  
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--red-400)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(248,113,113,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
