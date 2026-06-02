'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, authFetch } from '../../../lib/auth-context';
import Topbar from '../../../components/Topbar';
import Link from 'next/link';
import { Plus, Search, Filter, Edit2, Trash2, ExternalLink, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Bid {
  id: number;
  application_date: string | null;
  job_url: string | null;
  found_by: string | null;
  cv_used: string | null;
  proposal_used: string | null;
  status: string | null;
  hires: string | null;
  interviewing: string | null;
  country: string | null;
  connects: string | null;
}

export default function BidsPage() {
  const { token } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [foundByFilter, setFoundByFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBids = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    if (foundByFilter) params.set('found_by', foundByFilter);
    if (monthFilter) params.set('month', monthFilter);
    if (yearFilter) params.set('year', yearFilter);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    const res = await authFetch(`/api/bids?${params}`, token);
    const data = await res.json();
    setBids(data.data ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [token, page, search, foundByFilter, monthFilter, yearFilter, sortBy, sortOrder]);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleting(true);
    await authFetch(`/api/bids/${deleteId}`, token, { method: 'DELETE' });
    setDeleteId(null);
    setDeleting(false);
    fetchBids();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <span style={{ color: 'transparent' }}> ↓</span>;
    return <span style={{ color: 'var(--blue-400)' }}>{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>;
  };

  const renderLink = (value: string | null, type: 'cvs' | 'proposals') => {
    if (!value) return '—';
    const mdMatch = value.match(/^\[(.*?)\]\((.*?)\)$/);
    if (mdMatch) {
      return (
        <a href={mdMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-400)', textDecoration: 'underline' }}>
          {mdMatch[1]} <ExternalLink size={11} style={{ display: 'inline' }} />
        </a>
      );
    }
    return (
      <a href={`/uploads/${type}/${encodeURIComponent(value)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-400)', textDecoration: 'underline' }}>
        {value} <ExternalLink size={11} style={{ display: 'inline' }} />
      </a>
    );
  };

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Bids" subtitle={`${total} bids total`} />

      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">All Bids</h2>
            <p className="page-subtitle">Track every bid you've submitted on Upwork</p>
          </div>
          <Link href="/bids/new" className="btn btn-primary" id="add-bid-btn">
            <Plus size={15} /> New Bid
          </Link>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: '2.2rem' }}
              placeholder="Search Job URL, CV, Proposal…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select className="input" style={{ width: 'auto', minWidth: 160 }} value={foundByFilter} onChange={(e) => { setFoundByFilter(e.target.value); setPage(1); }}>
            <option value="">All Assignees</option>
            <option value="Preet">Preet</option>
            <option value="Sandeep">Sandeep</option>
            <option value="Guddu">Guddu</option>
          </select>

          <select className="input" style={{ width: 'auto', minWidth: 120 }} value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select className="input" style={{ width: 'auto', minWidth: 100 }} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>

          {(search || foundByFilter || monthFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFoundByFilter(''); setMonthFilter(''); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : bids.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>📋</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No bids found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('date')}>
                      Date{renderSortIcon('date')}
                    </th>
                    <th>Job URL</th>
                    <th>Found By</th>
                    <th>CV Used</th>
                    <th>Proposal</th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                      Status{renderSortIcon('status')}
                    </th>
                    <th>Hires</th>
                    <th>Interviewing</th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('country')}>
                      Country{renderSortIcon('country')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('connects')}>
                      Connects{renderSortIcon('connects')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id} className="fade-in">
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {bid.application_date ? format(new Date(bid.application_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td>
                        {bid.job_url ? (
                          <a href={bid.job_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-400)', textDecoration: 'underline' }}>
                            Link <ExternalLink size={11} style={{ display: 'inline' }} />
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{bid.found_by || '—'}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={bid.cv_used || ''}>
                        {renderLink(bid.cv_used, 'cvs')}
                      </td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={bid.proposal_used || ''}>
                        {renderLink(bid.proposal_used, 'proposals')}
                      </td>
                      <td>
                        <span className={`badge badge-${(bid.status || 'unknown').toLowerCase().replace(' ', '-')}`}>
                          {bid.status || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{bid.hires || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{bid.interviewing || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{bid.country || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{bid.connects || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <Link href={`/bids/${bid.id}/edit`} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.4rem', color: 'var(--blue-400)' }} title="Edit Bid">
                            <Edit2 size={13} />
                          </Link>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.4rem', color: 'var(--red-400)' }} onClick={() => setDeleteId(bid.id)} title="Delete Bid">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
              Page {page} of {pages}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} />
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Bid?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
              Are you sure you want to permanently delete this bid? This action cannot be undone.
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
