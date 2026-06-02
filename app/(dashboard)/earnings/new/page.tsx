'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, authFetch } from '../../../../lib/auth-context';
import Topbar from '../../../../components/Topbar';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface Recruiter { id: number; name: string; }
interface Bid { id: number; job_title: string; }

export default function NewEarningPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    amount: '', currency: 'USD', payment_date: new Date().toISOString().slice(0, 10),
    description: '', bid_id: '', recruiter_id: '',
  });

  useEffect(() => {
    if (!token) return;
    Promise.all([
      authFetch('/api/recruiters?limit=100', token).then(r => r.json()),
      authFetch('/api/bids?limit=100', token).then(r => r.json()),
    ]).then(([recRes, bidRes]) => {
      setRecruiters(recRes.data ?? []);
      setBids(bidRes.data ?? []);
    });
  }, [token]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.amount || !form.payment_date) { setError('Amount and payment date are required'); return; }
    setSaving(true);
    try {
      const res = await authFetch('/api/earnings', token, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          bid_id: form.bid_id ? parseInt(form.bid_id) : null,
          recruiter_id: form.recruiter_id ? parseInt(form.recruiter_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      router.push('/earnings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Log Payment" subtitle="Record a new earning" />
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 560, overflowY: 'auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/earnings" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
            <ArrowLeft size={13} /> Back
          </Link>
          <h2 className="page-title">Log Payment</h2>
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={14} /> {error}</div>}

        <form onSubmit={handleSubmit} className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="amount">Amount *</label>
              <input id="amount" className="input" type="number" step="0.01" min="0" placeholder="500" value={form.amount} onChange={set('amount')} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="currency">Currency</label>
              <select id="currency" className="input" value={form.currency} onChange={set('currency')}>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="payment_date">Payment Date *</label>
            <input id="payment_date" className="input" type="date" value={form.payment_date} onChange={set('payment_date')} required />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" className="input" placeholder="e.g. React Dashboard — Milestone 1" value={form.description} onChange={set('description')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="bid_id">Related Bid</label>
              <select id="bid_id" className="input" value={form.bid_id} onChange={set('bid_id')}>
                <option value="">— None —</option>
                {bids.map(b => <option key={b.id} value={b.id}>{b.job_title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="recruiter_id">Recruiter</label>
              <select id="recruiter_id" className="input" value={form.recruiter_id} onChange={set('recruiter_id')}>
                <option value="">— None —</option>
                {recruiters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Link href="/earnings" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-earning-btn">
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
              Save Payment
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
