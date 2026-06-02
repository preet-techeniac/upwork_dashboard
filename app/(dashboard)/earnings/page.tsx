'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, authFetch } from '../../../lib/auth-context';
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Earning {
  id: number;
  amount: string;
  currency: string;
  payment_date: string;
  description: string | null;
  job_title: string | null;
  recruiter_name: string | null;
  created_by_name: string | null;
}

export default function EarningsPage() {
  const { token } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [totals, setTotals] = useState({ usd: 0, inr: 0 });

  const fetchEarnings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (currencyFilter) params.set('currency', currencyFilter);
    const res = await authFetch(`/api/earnings?${params}`, token);
    const data = await res.json();
    setEarnings(data.data ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [token, page, currencyFilter]);

  const fetchTotals = useCallback(async () => {
    if (!token) return;
    const [usdRes, inrRes] = await Promise.all([
      authFetch('/api/earnings?currency=USD&limit=1000', token).then(r => r.json()),
      authFetch('/api/earnings?currency=INR&limit=1000', token).then(r => r.json()),
    ]);
    const sumUsd = (usdRes.data ?? []).reduce((acc: number, e: Earning) => acc + parseFloat(e.amount), 0);
    const sumInr = (inrRes.data ?? []).reduce((acc: number, e: Earning) => acc + parseFloat(e.amount), 0);
    setTotals({ usd: sumUsd, inr: sumInr });
  }, [token]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  useEffect(() => { fetchTotals(); }, [fetchTotals]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleting(true);
    await authFetch(`/api/earnings/${deleteId}`, token, { method: 'DELETE' });
    setDeleteId(null);
    setDeleting(false);
    fetchEarnings();
    fetchTotals();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Earnings" subtitle={`${total} records`} />
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">Earnings</h2>
            <p className="page-subtitle">Track all your payments from clients</p>
          </div>
          <Link href="/earnings/new" className="btn btn-primary" id="add-earning-btn">
            <Plus size={15} /> Log Payment
          </Link>
        </div>

        {/* Total cards */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 160, background: 'rgba(20,184,166,0.06)', borderColor: 'rgba(20,184,166,0.25)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total USD</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal-400)' }}>${totals.usd.toLocaleString()}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 160, background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.25)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total INR</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber-400)' }}>₹{totals.inr.toLocaleString()}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', minWidth: 140 }} value={currencyFilter} onChange={(e) => { setCurrencyFilter(e.target.value); setPage(1); }}>
            <option value="">All Currencies</option>
            <option value="USD">USD Only</option>
            <option value="INR">INR Only</option>
          </select>
          {currencyFilter && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setCurrencyFilter(''); setPage(1); }}>Clear</button>
          )}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : earnings.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>💰</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No earnings yet</div>
              <Link href="/earnings/new" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                <Plus size={13} /> Log Payment
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Related Bid</th>
                  <th>Recruiter</th>
                  <th>Payment Date</th>
                  <th>Added By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id} className="fade-in">
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: e.currency === 'USD' ? 'var(--teal-400)' : 'var(--amber-400)' }}>
                        {e.currency === 'USD' ? '$' : '₹'}{parseFloat(e.amount).toLocaleString()}
                      </span>
                      <span className={`badge badge-${e.currency.toLowerCase()}`} style={{ marginLeft: '0.4rem' }}>{e.currency}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.description ?? '—'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.job_title ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.recruiter_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {format(new Date(e.payment_date), 'dd MMM yyyy')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.created_by_name ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(e.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Page {page} of {pages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight size={14} /></button>
          </div>
        )}
      </main>

      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Earning?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
              This will permanently delete this earning record.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
