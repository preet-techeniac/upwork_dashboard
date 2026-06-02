'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, authFetch } from '../../../../lib/auth-context';
import Topbar from '../../../../components/Topbar';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function NewBidPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    application_date: new Date().toISOString().slice(0, 10),
    job_url: '',
    found_by: '',
    cv_name: '',
    cv_url: '',
    proposal_name: '',
    proposal_url: '',
    status: '',
    hires: '',
    interviewing: '',
    country: '',
    connects: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setSaving(true);
    try {
      const cv_used = form.cv_url ? `[${form.cv_name || 'CV Link'}](${form.cv_url})` : form.cv_name;
      const proposal_used = form.proposal_url ? `[${form.proposal_name || 'Proposal Link'}](${form.proposal_url})` : form.proposal_name;

      const payload = {
        ...form,
        cv_used,
        proposal_used
      };

      const res = await authFetch('/api/bids', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return; }
      router.push('/bids');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Topbar title="New Bid" subtitle="Add a new Upwork bid manually" />
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 640, overflowY: 'auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/bids" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>
            <ArrowLeft size={13} /> Back to Bids
          </Link>
          <h2 className="page-title">Add New Bid</h2>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label className="label" htmlFor="job_url">Job URL</label>
            <input id="job_url" className="input" placeholder="https://www.upwork.com/jobs/…" value={form.job_url} onChange={set('job_url')} type="url" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="application_date">Application Date</label>
              <input id="application_date" className="input" type="date" value={form.application_date} onChange={set('application_date')} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="found_by">Found By</label>
              <select id="found_by" className="input" value={form.found_by} onChange={set('found_by')}>
                <option value="">— Select Assignee —</option>
                <option value="Preet">Preet</option>
                <option value="Sandeep">Sandeep</option>
                <option value="Guddu">Guddu</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="cv_name">CV Name</label>
              <input id="cv_name" className="input" placeholder="e.g. CV_AI_Engineer" value={form.cv_name} onChange={set('cv_name')} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="cv_url">CV Link</label>
              <input id="cv_url" className="input" type="url" placeholder="https://drive.google.com/..." value={form.cv_url} onChange={set('cv_url')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="proposal_name">Proposal Name</label>
              <input id="proposal_name" className="input" placeholder="e.g. Proposal_FSD" value={form.proposal_name} onChange={set('proposal_name')} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="proposal_url">Proposal Link</label>
              <input id="proposal_url" className="input" type="url" placeholder="https://drive.google.com/..." value={form.proposal_url} onChange={set('proposal_url')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="status">Status</label>
              <input id="status" className="input" placeholder="e.g. Viewed, Active" value={form.status} onChange={set('status')} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="connects">Connects Used</label>
              <input id="connects" className="input" placeholder="e.g. 15, Job no longer available" value={form.connects} onChange={set('connects')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="hires">Hires</label>
              <input id="hires" className="input" placeholder="e.g. NA, 1" value={form.hires} onChange={set('hires')} />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="interviewing">Interviewing</label>
              <input id="interviewing" className="input" placeholder="e.g. 0, 2" value={form.interviewing} onChange={set('interviewing')} />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="country">Country</label>
            <input id="country" className="input" placeholder="e.g. United States, Romania" value={form.country} onChange={set('country')} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Link href="/bids" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-bid-btn">
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
              Save Bid
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
