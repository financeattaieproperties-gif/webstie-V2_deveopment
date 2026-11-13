import { useState, useEffect } from 'react';
import LandingBackgroundSettings from '../components/visual/LandingBackgroundSettings';

const S = {
  page: { maxWidth: 640 } as const,
  title: { fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem', color: '#0F172A' } as const,
  sub: { color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' } as const,
  card: {
    background: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  } as const,
  section: { padding: '1.35rem 1.5rem' } as const,
  divider: { borderTop: '1px solid #F1F5F9' } as const,
  secHdr: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: '1rem',
  } as const,
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.3rem',
  } as const,
  input: {
    width: '100%',
    padding: '0.58rem 0.8rem',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#0F172A',
    background: '#FFFFFF',
  } as const,
  row: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginTop: '1rem', alignItems: 'center' } as const,
  btnPrimary: {
    padding: '0.55rem 1.15rem',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.84rem',
  } as const,
  btnSecondary: {
    padding: '0.55rem 1.15rem',
    background: '#FFFFFF',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.84rem',
  } as const,
  badge: (ok: boolean | null): React.CSSProperties => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: 6,
    fontSize: '0.76rem',
    fontWeight: 600,
    background: ok === null ? '#F1F5F9' : ok ? '#ECFDF5' : '#FEF2F2',
    color: ok === null ? '#64748B' : ok ? '#065F46' : '#DC2626',
  }),
  verRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #F1F5F9',
    fontVariantNumeric: 'tabular-nums',
  } as const,
  verKey: { fontSize: '0.875rem', color: '#334155', fontWeight: 500 } as const,
  verVal: { fontSize: '0.875rem', color: '#64748B', fontVariantNumeric: 'tabular-nums' } as const,
};

export default function SettingsPage() {
  const electron = window.electronAPI;

  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || '/api');
  const [testing, setTesting] = useState(false);
  const [connStatus, setConnStatus] = useState<boolean | null>(null);
  const [version, setVersion] = useState('—');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!electron) return;
    electron.getVersion().then(setVersion);
  }, [electron]);

  const testConnection = async () => {
    setTesting(true);
    setConnStatus(null);
    try {
      const res = await fetch(`${apiUrl}/admin/properties.php`, {
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      setConnStatus(res.ok || res.status === 401);
    } catch {
      setConnStatus(false);
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = () => {
    setSaved(true);
    electron?.notify('Settings', 'Settings saved successfully.');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Settings</h1>
      <p style={S.sub}>Backend connection and application info</p>

      {/* Backend Connection Card */}
      <div style={S.card}>
        <div style={S.section}>
          <p style={S.secHdr}>Backend Connection</p>

          <label style={S.label}>API Base URL</label>
          <input
            style={S.input}
            value={apiUrl}
            onChange={e => {
              setApiUrl(e.target.value);
              setConnStatus(null);
            }}
            placeholder="https://your-server.com/api"
            spellCheck={false}
          />
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.4rem' }}>
            This is baked at build time via <code>VITE_API_URL</code>. Shown here for reference.
          </p>

          <div style={S.row}>
            <button style={S.btnPrimary} onClick={testConnection} disabled={testing}>
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            {connStatus !== null && (
              <span style={S.badge(connStatus)}>
                {connStatus ? '✓ Reachable' : '✕ Unreachable'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Landing Page Hero Background Settings */}
      <LandingBackgroundSettings />

      {/* Application Info Card */}
      <div style={S.card}>
        <div style={S.section}>
          <p style={S.secHdr}>Application Info</p>

          {[
            ['Version', version],
            ['Platform', electron?.platform ?? 'web'],
            ['Mode', import.meta.env.MODE],
          ].map(([k, v]) => (
            <div key={k} style={S.verRow}>
              <span style={S.verKey}>{k}</span>
              <span style={S.verVal}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ ...S.section, ...S.divider }}>
          <div style={S.row}>
            <button style={S.btnPrimary} onClick={saveSettings}>
              {saved ? '✓ Saved' : 'Save Settings'}
            </button>
            <button
              style={S.btnSecondary}
              onClick={() =>
                electron
                  ? electron.openExternal('https://www.attaieproperties.com')
                  : window.open('https://www.attaieproperties.com', '_blank')
              }
            >
              Open Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
