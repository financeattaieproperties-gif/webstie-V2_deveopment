import { type ReactNode, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GlobalChatAlert {
  id: string;
  customerName: string;
  customerPhone: string;
  messageText: string;
}

const S = {
  shell:      { display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' as const } as const,
  sidebar:    {
    width: 220, background: '#ffffff', color: '#1A2335',
    display: 'flex', flexDirection: 'column' as const,
    borderRight: '1px solid #E5E7EB', flexShrink: 0, overflowY: 'auto' as const,
  } as const,
  logoWrap:   { padding: '1.25rem 1.5rem 1rem', borderBottom: '1px solid #F3F4F6' } as const,
  logo:       { fontWeight: 800, fontSize: '1rem', color: '#1A2335', letterSpacing: 0.5, display: 'block' } as const,
  logoGold:   { color: '#B8944A' } as const,
  navSection: { padding: '0.75rem 0' } as const,
  navLabel:   { padding: '0.4rem 1.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: 1.2 } as const,
  link:       { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.5rem', color: '#6B7280', fontSize: '0.875rem', fontWeight: 600, transition: 'all .15s', borderLeft: '3px solid transparent', textDecoration: 'none' } as const,
  active:     { background: '#FFF8EE', color: '#B8944A', borderLeft: '3px solid #B8944A' } as const,
  main:       { flex: 1, padding: '2rem', overflowY: 'auto' as const, minWidth: 0 } as const,
  footer:     { marginTop: 'auto', borderTop: '1px solid #F3F4F6', padding: '1rem 1.5rem' } as const,
  footerText: { fontSize: '0.72rem', color: '#9CA3AF' } as const,
  logoutBtn:  { width: '100%', padding: '0.55rem', background: 'transparent', border: '1.5px solid #FCA5A5', borderRadius: 8, color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', transition: 'all .15s' } as const,
  topBar:     { display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', background: '#ffffff', borderBottom: '1px solid #E5E7EB', gap: '1rem', flexShrink: 0 } as const,
  hamburger:  { background: 'none', border: 'none', color: '#B8944A', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: '0.2rem' } as const,
  overlay:    { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 } as const,
  mobileSidebar: {
    position: 'fixed' as const, top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
    background: '#ffffff', color: '#1A2335', display: 'flex', flexDirection: 'column' as const,
    boxShadow: '4px 0 24px rgba(0,0,0,0.1)', overflowY: 'auto' as const,
  } as const,
  floatingToast: {
    position: 'fixed' as const,
    top: '1.25rem',
    right: '1.25rem',
    zIndex: 80,
    width: 340,
    maxWidth: 'calc(100vw - 2.5rem)',
    background: '#1A2335',
    color: '#FFFFFF',
    border: '1.5px solid #B8944A',
    borderRadius: 12,
    boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
    padding: '0.9rem 1rem',
  } as const,
};

const navItems = [
  { to: '/properties', label: 'Properties', icon: '🏠' },
  { to: '/projects',   label: 'Projects',   icon: '🏗' },
  { to: '/tasks',      label: 'Tasks (Submissions)', icon: '✅' },
  { to: '/leads',      label: 'Leads',      icon: '📋' },
  { to: '/chat',       label: 'Live Chat',  icon: '💬' },
  { to: '/visits',     label: 'Visits',     icon: '📅' },
  { to: '/agents',     label: 'Agents & Employees', icon: '👥' },
  { to: '/branches',   label: 'Branches',   icon: '📍' },
  { to: '/careers',    label: 'Careers',    icon: '💼' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [version, setVersion]   = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [globalAlert, setGlobalAlert] = useState<GlobalChatAlert | null>(null);

  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    window.electronAPI?.getVersion().then(setVersion).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    const processConversations = (
      conversations: Array<{
        id?: string;
        customer_name?: string;
        customer_phone?: string;
        unread_admin?: number;
        messages?: Array<{ id: string; sender: string; text: string }>;
      }>
    ) => {
      if (!mounted) return;
      const total = conversations.reduce((s, c) => s + (c.unread_admin || 0), 0);
      setUnreadChatCount(total);

      if (!initializedRef.current) {
        for (const c of conversations) {
          for (const m of c.messages || []) {
            if (m.sender === 'customer') seenMsgIdsRef.current.add(m.id);
          }
        }
        initializedRef.current = true;
        return;
      }

      for (const c of conversations) {
        for (const m of c.messages || []) {
          if (m.sender === 'customer' && !seenMsgIdsRef.current.has(m.id)) {
            seenMsgIdsRef.current.add(m.id);
            if (!window.location.pathname.endsWith('/chat') && !window.location.hash.endsWith('/chat')) {
              setGlobalAlert({
                id: m.id,
                customerName: c.customer_name || 'Customer',
                customerPhone: c.customer_phone || '',
                messageText: m.text,
              });
            }
          }
        }
      }
    };

    const checkUnread = async () => {
      try {
        const res = await fetch(`/chat-service.php?action=admin_list&t=${Date.now()}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as {
            conversations?: Array<{
              id?: string;
              customer_name?: string;
              customer_phone?: string;
              unread_admin?: number;
              messages?: Array<{ id: string; sender: string; text: string }>;
            }>;
          };
          if (Array.isArray(data.conversations)) {
            processConversations(data.conversations);
            return;
          }
        }
      } catch {
        // fallback to localStorage
      }
      try {
        const raw = localStorage.getItem('attaie_chat_conversations_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            processConversations(parsed);
          }
        }
      } catch {
        // ignore
      }
    };

    void checkUnread();
    const timer = setInterval(() => void checkUnread(), 3500);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'attaie_chat_conversations_v1') {
        void checkUnread();
      }
    };
    window.addEventListener('storage', onStorage);

    const onCustomAlert = () => {
      void checkUnread();
    };
    window.addEventListener('attaie-admin-new-chat-alert', onCustomAlert);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('attaie_live_chat_channel');
        bc.onmessage = () => {
          void checkUnread();
        };
      }
    } catch {
      // ignore
    }

    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('attaie-admin-new-chat-alert', onCustomAlert);
      bc?.close();
    };
  }, []);

  // Clear floating toast when navigating into /chat
  useEffect(() => {
    if (location.pathname === '/chat') {
      setGlobalAlert(null);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const FloatingGlobalAlert = () => {
    if (!globalAlert) return null;
    return (
      <div style={S.floatingToast} role="alert">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span
            style={{
              background: '#B8944A',
              color: '#FFFFFF',
              fontSize: '0.66rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: 999,
              textTransform: 'uppercase',
            }}
          >
            🔔 New Customer Message
          </span>
          <button
            type="button"
            onClick={() => setGlobalAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '0.15rem' }}>
          {globalAlert.customerName} {globalAlert.customerPhone && `(${globalAlert.customerPhone})`}
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: '#D1D5DB',
            marginBottom: '0.65rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          “{globalAlert.messageText}”
        </div>
        <button
          type="button"
          onClick={() => {
            setGlobalAlert(null);
            navigate('/chat');
          }}
          style={{
            width: '100%',
            padding: '0.45rem',
            background: '#B8944A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 7,
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          Open in ChatInbox →
        </button>
      </div>
    );
  };

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      <div style={S.logoWrap}>
        <span style={S.logo}>ATTAIE <span style={S.logoGold}>ADMIN</span></span>
      </div>

      <div style={S.navSection}>
        <div style={S.navLabel}>Management</div>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({ ...S.link, ...(isActive ? S.active : {}) })}
            onClick={onNav}
          >
            <span>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {to === '/chat' && unreadChatCount > 0 && (
              <span
                style={{
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.45rem',
                  borderRadius: 999,
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '0 0 0.25rem' }}>
        <div style={S.navLabel}>System</div>
        <NavLink
          to="/seo"
          style={({ isActive }) => ({ ...S.link, ...(isActive ? S.active : {}) })}
          onClick={onNav}
        >
          <span>🔍</span> SEO & Metadata
        </NavLink>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({ ...S.link, ...(isActive ? S.active : {}) })}
          onClick={onNav}
        >
          <span>⚙</span> Settings
        </NavLink>
      </div>

      <div style={S.footer}>
        {version && <p style={S.footerText}>v{version}</p>}
        <p style={S.footerText}>Attaie Properties</p>
        <p style={{ ...S.footerText, fontSize: '0.68rem', color: '#B8944A', marginTop: '0.15rem' }}>
          Developed by Mohammad Roheen Ahmadi in Attaie Properties
        </p>
        <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </>
  );

  const panelTransitionStyle = {
    animation: 'adminPanelEnter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
  } as const;

  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <style>{`@keyframes adminPanelEnter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <FloatingGlobalAlert />
        <div style={S.topBar}>
          <button style={S.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
          <span style={{ ...S.logo, fontSize: '0.95rem' }}>
            ATTAIE <span style={S.logoGold}>ADMIN</span>
          </span>
        </div>

        {menuOpen && (
          <>
            <div style={S.overlay} onClick={() => setMenuOpen(false)} />
            <nav style={S.mobileSidebar}>
              <SidebarContent onNav={() => setMenuOpen(false)} />
            </nav>
          </>
        )}

        <main style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
          <div key={location.pathname} style={panelTransitionStyle}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={S.shell}>
      <style>{`@keyframes adminPanelEnter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <FloatingGlobalAlert />
      <nav style={S.sidebar}>
        <SidebarContent />
      </nav>
      <main style={S.main}>
        <div key={location.pathname} style={panelTransitionStyle}>
          {children}
        </div>
      </main>
    </div>
  );
}
