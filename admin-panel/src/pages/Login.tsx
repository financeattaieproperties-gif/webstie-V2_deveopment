import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { AttaieLogoEntrance } from '../components/AttaieLogoEntrance';

const S = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', padding: '1.5rem' } as const,
  card:  { background: '#FFFFFF', borderRadius: 10, padding: '2.25rem', width: '100%', maxWidth: 420, boxShadow: '0 1px 3px rgba(15,23,42,.05)', border: '1px solid #E2E8F0' } as const,
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' } as const,
  title: { fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem', color: '#0F172A', textAlign: 'center' as const } as const,
  sub:   { fontSize: '0.85rem', color: '#64748B', marginBottom: '1.75rem', textAlign: 'center' as const } as const,
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' } as const,
  input: { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.92rem', outline: 'none', marginBottom: '1rem', background: '#FFFFFF', color: '#0F172A' } as const,
  btn:   { width: '100%', padding: '0.7rem', background: '#0F172A', border: 'none', borderRadius: 6, color: '#FFFFFF', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer' } as const,
  err:   { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.65rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' } as const,
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

