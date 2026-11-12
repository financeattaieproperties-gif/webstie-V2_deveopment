import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttaieLogoEntrance } from '../components/AttaieLogoEntrance';

const S = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5EFE6', padding: '1.5rem' } as const,
  card:  { background: '#fff', borderRadius: 16, padding: '2.25rem', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,.10)', border: '1px solid #E5E7EB' } as const,
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' } as const,
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', color: '#0f172a', textAlign: 'center' as const } as const,
  sub:   { fontSize: '0.85rem', color: '#64748b', marginBottom: '1.75rem', textAlign: 'center' as const } as const,
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' } as const,
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.95rem', outline: 'none', marginBottom: '1rem' } as const,
  btn:   { width: '100%', padding: '0.75rem', background: '#b8960c', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' } as const,
  err:   { background: '#fee2e2', color: '#dc2626', padding: '0.65rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' } as const,
};

export default function Login() {
  const { login }       = useAuth();
  const [u, setU]       = useState('');
  const [p, setP]       = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      sessionStorage.setItem('attaie_admin_play_entrance', '1');
      await login(u, p);
    } catch {
      sessionStorage.removeItem('attaie_admin_play_entrance');
      setErr('Invalid username or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logoWrap}>
          <AttaieLogoEntrance mode="header" variant="navy" />
        </div>
        <h1 style={S.title}>Attaie Admin</h1>
        <p style={S.sub}>Sign in to manage properties, projects, and publishing tasks</p>
        {err && <div style={S.err}>{err}</div>}
        <form onSubmit={submit}>
          <label style={S.label}>Username</label>
          <input style={S.input} value={u} onChange={e => setU(e.target.value)} autoComplete="username" required />
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" required />
          <button style={S.btn} disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>
      </div>
    </div>
  );
}

