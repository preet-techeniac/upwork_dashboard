'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth, authFetch } from '../../../lib/auth-context';
import Topbar from '../../../components/Topbar';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, Save, AlertCircle } from 'lucide-react';

interface Recruiter {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  platform: string;
  country: string | null;
  notes: string | null;
  total_bids: string;
  won_bids: string;
  total_earned_usd: string;
  total_earned_inr: string;
}

const emptyForm = {
  name: '', email: '', company: '', platform: 'Upwork', country: '', notes: '',
};

export default function RecruitersPage() {
  const { token } = useAuth();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Recruiter | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecruiters = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (search) params.set('search', search);
    const res = await authFetch(`/api/recruiters?${params}`, token);
    const data = await res.json();
    setRecruiters(data.data ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [token, page, search]);

  useEffect(() => { fetchRecruiters(); }, [fetchRecruiters]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (r: Recruiter) => {
    setEditing(r);
    setForm({ name: r.name, email: r.email ?? '', company: r.company ?? '', platform: r.platform, country: r.country ?? '', notes: r.notes ?? '' });
    setFormError('');
    setShowModal(true);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/recruiters/${editing.id}` : '/api/recruiters';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, token, { method, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Failed to save'); return; }
      setShowModal(false);
      fetchRecruiters();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !token) return;
    setDeleting(true);
    await authFetch(`/api/recruiters/${deleteId}`, token, { method: 'DELETE' });
    setDeleteId(null);
    setDeleting(false);
    fetchRecruiters();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Recruiters" subtitle={`${total} recruiters`} />
      <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">Recruiters</h2>
            <p className="page-subtitle">Manage the clients and recruiters you bid with</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} id="add-recruiter-btn">
            <Plus size={15} /> Add Recruiter
          </button>
        </div>

        {/* Search */}
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: '2.2rem' }} placeholder="Search recruiters…"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {search && <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPage(1); }}>Clear</button>}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : recruiters.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem' }}>👤</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No recruiters yet</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={openAdd}>
                <Plus size={13} /> Add Recruiter
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Country</th>
                  <th>Bids</th>
                  <th>Won</th>
                  <th>Earned USD</th>
                  <th>Earned INR</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r) => (
                  <tr key={r.id} className="fade-in">
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
                    <td style={{ color: 'var(--text-secondary)' }}>{r.company ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{r.email ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.country ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{r.total_bids}</td>
                    <td style={{ color: 'var(--green-400)', fontWeight: 600 }}>{r.won_bids}</td>
                    <td style={{ color: 'var(--teal-400)', fontWeight: 600 }}>${parseFloat(r.total_earned_usd).toLocaleString()}</td>
                    <td style={{ color: 'var(--amber-400)', fontWeight: 600 }}>₹{parseFloat(r.total_earned_inr).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Edit2 size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(r.id)}><Trash2 size={13} /></button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Recruiter' : 'Add Recruiter'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            {formError && <div className="alert alert-error"><AlertCircle size={14} /> {formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="label" htmlFor="r-name">Name *</label>
                <input id="r-name" className="input" placeholder="Alice Johnson" value={form.name} onChange={set('name')} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="r-email">Email</label>
                  <input id="r-email" className="input" type="email" placeholder="alice@example.com" value={form.email} onChange={set('email')} />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="r-company">Company</label>
                  <input id="r-company" className="input" placeholder="TechCorp" value={form.company} onChange={set('company')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label" htmlFor="r-country">Country</label>
                  <input id="r-country" className="input" placeholder="United States" value={form.country} onChange={set('country')} />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="r-platform">Platform</label>
                  <select id="r-platform" className="input" value={form.platform} onChange={set('platform')}>
                    <option value="Upwork">Upwork</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Toptal">Toptal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="r-notes">Notes</label>
                <textarea id="r-notes" className="input" placeholder="Any notes about this recruiter…" value={form.notes} onChange={set('notes')} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Recruiter?</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
              This will permanently delete this recruiter. Their bids and earnings will remain but will no longer be linked.
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
