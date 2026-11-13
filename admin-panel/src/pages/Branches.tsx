import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Branch } from '../api';

const S = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' as const },
  title: { fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0F172A', fontVariantNumeric: 'tabular-nums' },
  btn: { padding: '0.55rem 1.15rem', background: '#0F172A', color: '#FFFFFF', border: 0, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem', whiteSpace: 'nowrap' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, background: '#FFFFFF', borderRadius: 8, overflow: 'hidden' as const, border: '1px solid #E2E8F0' },
  th: { padding: '0.7rem 1rem', background: '#F8FAFC', textAlign: 'left' as const, fontSize: '0.7rem', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', color: '#0F172A', fontVariantNumeric: 'tabular-nums' },
  action: { padding: '0.32rem 0.72rem', background: '#0F172A', color: '#FFFFFF', border: 0, borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, marginRight: 6 },
  delete: { padding: '0.32rem 0.72rem', background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
};

export default function Branches() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => api.getBranches().then(setItems).catch(e => setError(e.message || 'Could not load branches.')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const remove = async (branch: Branch) => {
    if (!confirm(`Delete the ${branch.name} branch?`)) return;
    try { await api.deleteBranch(branch.id); setItems(current => current.filter(x => x.id !== branch.id)); }
    catch (e) { setError((e as Error).message || 'Delete failed.'); }
  };
  if (loading) return <p>Loading branches…</p>;
  return <div>
    <div style={S.header}><h1 style={S.title}>Branches ({items.length})</h1><button style={S.btn} onClick={() => navigate('/branches/new')}>+ Add Branch</button></div>
    {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: '0.75rem', borderRadius: 8 }}>{error}<button onClick={() => { setError(''); setLoading(true); load(); }} style={{ marginLeft: 12 }}>Retry</button></p>}
    <div style={{ overflowX: 'auto' }}><table style={S.table}><thead><tr>{['Branch', 'Address', 'Phone', 'Email', 'Actions'].map(x => <th key={x} style={S.th}>{x}</th>)}</tr></thead><tbody>
      {items.map(branch => <tr key={branch.id}><td style={S.td}><strong style={{ color: '#0F172A' }}>{branch.name}</strong></td><td style={S.td}>{branch.address}</td><td style={S.td}>{branch.phone || '—'}</td><td style={S.td}>{branch.email || '—'}</td><td style={S.td}><button onClick={() => navigate(`/branches/${branch.id}/edit`)} style={S.action}>Edit</button><button onClick={() => remove(branch)} style={S.delete}>Delete</button></td></tr>)}
      {items.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>No branches yet. Add your first branch to show it on the About page.</td></tr>}
    </tbody></table></div>
  </div>;
}
