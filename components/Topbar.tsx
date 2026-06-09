'use client';

import { useState } from 'react';
import { Bell, LogOut, Key, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth, authFetch } from '../lib/auth-context';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user, token, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [confirmChangePassword, setConfirmChangePassword] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Visibility States
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showRecoveryPin, setShowRecoveryPin] = useState(false);

  const resetModalStates = () => {
    setCurrentPassword('');
    setChangeNewPassword('');
    setConfirmChangePassword('');
    setRecoveryPin('');
    setChangeError('');
    setChangeSuccess('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setShowRecoveryPin(false);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    if (changeNewPassword.length < 6) {
      setChangeError('New password must be at least 6 characters long');
      return;
    }

    if (changeNewPassword !== confirmChangePassword) {
      setChangeError('New passwords do not match');
      return;
    }

    setChangeLoading(true);
    try {
      const res = await authFetch('/api/auth/change-password', token, {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword: changeNewPassword,
          recoveryPin: recoveryPin.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChangeError(data.error ?? 'Failed to update password');
        return;
      }

      setChangeSuccess('Password updated successfully!');
      setTimeout(() => {
        setShowChangePassword(false);
        resetModalStates();
      }, 2000);
    } catch {
      setChangeError('Connection failed. Please try again.');
    } finally {
      setChangeLoading(false);
    }
  };

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

                  {/* Change Password Button */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowChangePassword(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-overlay)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Key size={14} />
                    Change Password
                  </button>

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

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Change Password
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setShowChangePassword(false);
                  resetModalStates();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {changeError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={14} />
                {changeError}
              </div>
            )}

            {changeSuccess && (
              <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                {changeSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit}>
              <div className="form-group">
                <label className="label" htmlFor="currentPassword">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="currentPassword"
                    className="input"
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                    disabled={changeLoading || !!changeSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((s) => !s)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      padding: 0, display: 'flex',
                    }}
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="changeNewPassword">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="changeNewPassword"
                    className="input"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="minimum 6 characters"
                    value={changeNewPassword}
                    onChange={(e) => setChangeNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                    disabled={changeLoading || !!changeSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((s) => !s)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      padding: 0, display: 'flex',
                    }}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="confirmChangePassword">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmChangePassword"
                    className="input"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="confirm new password"
                    value={confirmChangePassword}
                    onChange={(e) => setConfirmChangePassword(e.target.value)}
                    required
                    style={{ paddingRight: '2.5rem' }}
                    disabled={changeLoading || !!changeSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((s) => !s)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      padding: 0, display: 'flex',
                    }}
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="divider" style={{ margin: '1.25rem 0' }} />
              
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                  Update Recovery PIN
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', lineHeight: '1.3' }}>
                  Configure or update your Recovery PIN to verify your identity if you forget your password.
                </p>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="label" htmlFor="recoveryPin">New Recovery PIN</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="recoveryPin"
                      className="input"
                      type={showRecoveryPin ? 'text' : 'password'}
                      placeholder="leave blank to keep current PIN"
                      value={recoveryPin}
                      onChange={(e) => setRecoveryPin(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                      disabled={changeLoading || !!changeSuccess}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryPin((s) => !s)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: 0, display: 'flex',
                      }}
                    >
                      {showRecoveryPin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowChangePassword(false);
                    resetModalStates();
                  }}
                  disabled={changeLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changeLoading || !!changeSuccess}
                >
                  {changeLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
