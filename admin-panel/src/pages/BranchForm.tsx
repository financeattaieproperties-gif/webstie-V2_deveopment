import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type BranchInput } from '../api';

const blank: BranchInput = { name: '', address: '', phone: null, email: null };
const S = {
  page: { maxWidth: 760 }, top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' as const },
  title: { fontSize: '1.35rem', margin: 0, color: '#0F172A' }, card: { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }, full: { gridColumn: '1 / -1' },
  section: { padding: '1.5rem' }, label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' as const, color: '#0F172A' },
  footer: { padding: '1.25rem 1.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem' },
  save: { padding: '0.62rem 1.4rem', background: '#0F172A', color: '#FFFFFF', border: 0, borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  cancel: { padding: '0.62rem 1rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
};

export default function BranchForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState<BranchInput>(blank);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!editing) return;
    api.getBranches().then(items => {
      const branch = items.find(x => x.id === Number(id));
      if (branch) { const { id: _id, created_at: _createdAt, ...data } = branch; setForm(data); }
      else setError('Branch not found.');
    }).catch(e => setError(e.message || 'Could not load branch.')).finally(() => setLoading(false));
  }, [editing, id]);
  const set = <K extends keyof BranchInput>(key: K, value: BranchInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { if (editing) await api.updateBranch({ ...form, id: Number(id) }); else await api.createBranch(form); navigate('/branches'); }
    catch (e) { setError((e as Error).message || 'Could not save branch.'); }
    finally { setBusy(false); }
  };
  if (loading) return <p>Loading branch…</p>;
  return <div style={S.page}>
    <div style={S.top}><h1 style={S.title}>{editing ? 'Edit Branch' : 'Add Branch'}</h1><button style={S.cancel} onClick={() => navigate('/branches')}>Back to list</button></div>
    {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: 8 }}>{error}</p>}
    <form onSubmit={submit}><div style={S.card}><section style={S.section}><div style={S.grid}>
      <div style={S.full}><label htmlFor="branch-name" style={S.label}>Branch name *</label><input id="branch-name" style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required maxLength={255} /></div>
      <div style={S.full}><label htmlFor="branch-address" style={S.label}>Address *</label><input id="branch-address" style={S.input} value={form.address} onChange={e => set('address', e.target.value)} required maxLength={500} /></div>
      <div><label htmlFor="branch-phone" style={S.label}>Phone (optional)</label><input id="branch-phone" type="tel" style={S.input} value={form.phone ?? ''} onChange={e => set('phone', e.target.value || null)} maxLength={50} /></div>
      <div><label htmlFor="branch-email" style={S.label}>Email (optional)</label><input id="branch-email" type="email" style={S.input} value={form.email ?? ''} onChange={e => set('email', e.target.value || null)} maxLength={255} /></div>
    </div></section><div style={S.footer}><button type="submit" style={{ ...S.save, opacity: busy ? 0.6 : 1 }} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save branch' : 'Create branch'}</button><button type="button" style={S.cancel} onClick={() => navigate('/branches')}>Cancel</button></div></div></form>
  </div>;
}
