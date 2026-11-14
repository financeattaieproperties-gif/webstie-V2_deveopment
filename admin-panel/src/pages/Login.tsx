import { useState, type FormEvent } from 'react';
import { ShieldCheck, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AttaieLogoEntrance } from '../components/AttaieLogoEntrance';

const S = {
  page:  { minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', background: '#F7F8FA', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' } as const,
  brand: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, marginBottom: '1.5rem' } as const,
  brandCaption: { fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: '#64748B', fontWeight: 600 } as const,
  card:  { background: '#FFFFFF', borderRadius: 12, padding: '2.25rem', width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(15,23,42,.04)', border: '1px solid #E2E8F0' } as const,
  iconBox: { width: 48, height: 48, borderRadius: 10, background: '#F1F5F9', color: '#0F172A', display: 'grid', placeItems: 'center', marginBottom: '1.25rem' } as const,
  eyebrow: { fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: '#0F172A', marginBottom: 6, textTransform: 'uppercase' as const } as const,
  title: { fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem', color: '#0F172A', letterSpacing: '-0.02em' } as const,
  sub:   { fontSize: '0.82rem', color: '#64748B', marginBottom: '1.25rem', lineHeight: 1.5 } as const,
  roleBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', marginBottom: '1.25rem', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11, color: '#334155', fontVariantNumeric: 'tabular-nums' } as const,
  codeBadge: { fontSize: 11, fontWeight: 600, color: '#0F172A', background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #E2E8F0' } as const,
  label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.35rem' } as const,
  input: { width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '0.88rem', outline: 'none', marginBottom: '1rem', background: '#F7F8FA', color: '#0F172A', boxSizing: 'border-box' as const } as const,
  passwordWrap: { position: 'relative' as const, display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' } as const,
  passwordInput: { width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: '0.88rem', outline: 'none', background: '#F7F8FA', color: '#0F172A', boxSizing: 'border-box' as const } as const,
  passwordToggle: { position: 'absolute' as const, insetInlineEnd: 6, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 6, border: 'none', background: 'transparent', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 } as const,
  btn:   { width: '100%', padding: '0.75rem', background: '#0F172A', border: '1px solid #0F172A', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' } as const,
  err:   { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.65rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.82rem' } as const,
  privateNote: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: '1.35rem', fontSize: 10, color: '#64748B' } as const,
  footer: { marginTop: '1.5rem', fontSize: 11, color: '#64748B' } as const,
};

export default function Login() {
  const { login }       = useAuth();
  const [u, setU]       = useState('');
  const [p, setP]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={S.page} data-panel-id="admin">
      <div style={S.brand}>
        <AttaieLogoEntrance mode="header" variant="navy" />
        <span style={S.brandCaption}>Website Admin CRM</span>
      </div>
      <div style={S.card}>
        <div style={S.iconBox}>
          <Globe size={22} />
        </div>
        <div style={S.eyebrow}>ATTAIE WEBSITE ADMIN</div>
        <h1 style={S.title}>Website Admin CRM</h1>
        <p style={S.sub}>Sign in to manage public listings, projects, submissions, live chat, and SEO.</p>
        <div style={S.roleBox}>
          <span><strong>Role:</strong> Website Administrator</span>
          <code style={S.codeBadge}>/admin</code>
        </div>
        {err && <div style={S.err}>{err}</div>}
        <form onSubmit={submit}>
          <label htmlFor="admin-login-username" style={S.label}>Username</label>
          <input id="admin-login-username" style={S.input} value={u} onChange={e => setU(e.target.value)} autoComplete="username" required />
          <label htmlFor="admin-login-password" style={S.label}>Password</label>
          <div style={S.passwordWrap}>
            <input
              id="admin-login-password"
              style={S.passwordInput}
              type={showPassword ? 'text' : 'password'}
              value={p}
              onChange={e => setP(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              style={S.passwordToggle}
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button style={S.btn} disabled={busy}>{busy ? 'Signing in…' : 'Sign in →'}</button>
        </form>
        <div style={S.privateNote}>
          <ShieldCheck size={13} />
          <span>Private, authorized staff access only · Fixed Role Workspace</span>
        </div>
      </div>
      <footer style={S.footer}>Attaie Properties · Kabul, Afghanistan</footer>
    </div>
  );
}
