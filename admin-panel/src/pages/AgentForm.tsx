import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type AgentInput } from '../api';
import ImageUpload from '../components/ImageUpload';

const blank: AgentInput = { name: '', role: '', background: '', portrait_url: '', phone: '', email: '', whatsapp: null, published: false };
const S = {
  page: { maxWidth: 760 }, top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' as const },
  title: { fontSize: '1.35rem', margin: 0, color: '#0F172A' }, card: { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' },
  section: { padding: '1.5rem' }, grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' },
  full: { gridColumn: '1 / -1' }, label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' as const, color: '#0F172A' },
  area: { width: '100%', minHeight: 150, padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box' as const, resize: 'vertical' as const, color: '#0F172A' },
  footer: { padding: '1.25rem 1.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const },
  save: { padding: '0.62rem 1.4rem', background: '#0F172A', color: '#FFFFFF', border: 0, borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
  cancel: { padding: '0.62rem 1rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer' },
};

export default function AgentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState<AgentInput>(blank);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!editing) return;
    api.getAgents().then(items => {
      const agent = items.find(x => x.id === Number(id));
      if (agent) { const { id: _id, created_at: _createdAt, ...data } = agent; setForm(data); }
      else setError('Agent profile not found.');
    }).catch(e => setError(e.message || 'Could not load profile.')).finally(() => setLoading(false));
  }, [editing, id]);
  const set = <K extends keyof AgentInput>(key: K, value: AgentInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (editing) await api.updateAgent({ ...form, id: Number(id) }); else await api.createAgent(form);
      navigate('/agents');
    } catch (e) { setError((e as Error).message || 'Could not save profile.'); }
    finally { setBusy(false); }
  };
  if (loading) return <p>Loading profile…</p>;
  return <div style={S.page}>
    <div style={S.top}><h1 style={S.title}>{editing ? 'Edit Agent or Employee' : 'Add Agent or Employee'}</h1><button style={S.cancel} type="button" onClick={() => navigate('/agents')}>Back to list</button></div>
    {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: 8 }}>{error}</p>}
    <form onSubmit={submit}><div style={S.card}>
      <section style={S.section}><label style={S.label}>Portrait *</label><ImageUpload value={form.portrait_url || null} onChange={url => set('portrait_url', url || '')} /></section>
      <section style={{ ...S.section, borderTop: '1px solid #f1f5f9' }}><div style={S.grid}>
        <div><label style={S.label} htmlFor="agent-name">Name *</label><input id="agent-name" style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required maxLength={255} /></div>
        <div><label style={S.label} htmlFor="agent-role">Role or title *</label><input id="agent-role" style={S.input} value={form.role} onChange={e => set('role', e.target.value)} required maxLength={160} /></div>
        <div><label style={S.label} htmlFor="agent-phone">Phone *</label><input id="agent-phone" type="tel" style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)} required maxLength={50} /></div>
        <div><label style={S.label} htmlFor="agent-email">Email *</label><input id="agent-email" type="email" style={S.input} value={form.email} onChange={e => set('email', e.target.value)} required maxLength={255} /></div>
        <div style={S.full}><label style={S.label} htmlFor="agent-whatsapp">WhatsApp (optional)</label><input id="agent-whatsapp" type="tel" style={S.input} value={form.whatsapp ?? ''} onChange={e => set('whatsapp', e.target.value || null)} maxLength={50} /></div>
        <div style={S.full}><label style={S.label} htmlFor="agent-background">Background *</label><textarea id="agent-background" style={S.area} value={form.background} onChange={e => set('background', e.target.value)} required /></div>
        <label style={{ ...S.full, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><input type="checkbox" checked={form.published} onChange={e => set('published', e.target.checked)} /> Publish this profile on the website</label>
      </div></section>
      <div style={S.footer}><button type="submit" style={{ ...S.save, opacity: busy ? 0.6 : 1 }} disabled={busy || !form.portrait_url}>{busy ? 'Saving…' : editing ? 'Save profile' : 'Create profile'}</button><button type="button" style={S.cancel} onClick={() => navigate('/agents')}>Cancel</button>{!form.portrait_url && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Upload a portrait before saving.</span>}</div>
    </div></form>
  </div>;
}
