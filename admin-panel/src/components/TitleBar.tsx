import { useEffect, useState } from 'react';

const S = {
  bar: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#ffffff',
    borderBottom: '1px solid #E5E7EB',
    WebkitAppRegion: 'drag',
    flexShrink: 0,
    userSelect: 'none',
    paddingLeft: '1rem',
  } as React.CSSProperties,
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: 0.3,
  } as const,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 3,
    background: '#0F172A',
    display: 'inline-block',
  } as const,
  controls: {
    display: 'flex',
    WebkitAppRegion: 'no-drag',
    height: '100%',
  } as React.CSSProperties,
  btn: (hover: boolean, type: 'min' | 'max' | 'close'): React.CSSProperties => ({
    width: 46,
    height: '100%',
    border: 'none',
    background: hover
      ? type === 'close' ? '#E81123' : '#E5E7EB'
      : 'transparent',
    color: hover && type === 'close' ? '#fff' : '#6B7280',
    cursor: 'pointer',
    fontSize: type === 'close' ? '0.75rem' : '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background .12s, color .12s',
    flexShrink: 0,
  }),
};

export default function TitleBar() {
  const api = window.electronAPI;
  const [maximized, setMaximized] = useState(false);
  const [hovered, setHovered] = useState<'min' | 'max' | 'close' | null>(null);

  useEffect(() => {
    if (!api) return;
    api.isMaximized().then(setMaximized);
    const unsub = api.onMaximizeChange(setMaximized);
    return unsub;
  }, [api]);

  if (!api) return null;

  return (
    <div style={S.bar}>
      <div style={S.left}>
        <span style={S.dot} />
        ATTAIE <span style={{ color: '#64748B', marginLeft: 2 }}>ADMIN</span>
      </div>

      <div style={S.controls}>
        {(
          [
            { type: 'min' as const,   label: '─', title: 'Minimize',         action: api.minimize },
            { type: 'max' as const,   label: maximized ? '❐' : '□', title: maximized ? 'Restore' : 'Maximize', action: api.maximize },
            { type: 'close' as const, label: '✕', title: 'Close',            action: api.close },
          ]
        ).map(({ type, label, title, action }) => (
          <button
            key={type}
            title={title}
            style={S.btn(hovered === type, type)}
            onMouseEnter={() => setHovered(type)}
            onMouseLeave={() => setHovered(null)}
            onClick={action}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
