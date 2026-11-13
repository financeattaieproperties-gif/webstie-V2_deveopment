import { type ReactNode, useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface GlobalChatAlert {
  id: string;
  customerName: string;
  customerPhone: string;
  messageText: string;
}

type IconName =
  | 'building'
  | 'command'
  | 'sales'
  | 'org'
  | 'system'
  | 'home'
  | 'layers'
  | 'check'
  | 'clipboard'
  | 'chat'
  | 'calendar'
  | 'users'
  | 'pin'
  | 'briefcase'
  | 'search'
  | 'sliders'
  | 'menu'
  | 'x'
  | 'chevron'
  | 'bell'
  | 'logout'
  | 'panelClose'
  | 'panelOpen';

function Icon({ name, size = 16, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { flexShrink: 0, display: 'block' },
  };

  switch (name) {
    case 'building':
      return (
        <svg {...common}>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    case 'command':
      return (
        <svg {...common}>
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      );
    case 'sales':
    case 'briefcase':
      return (
        <svg {...common}>
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect width="20" height="14" x="2" y="6" rx="2" />
        </svg>
      );
    case 'org':
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'system':
    case 'sliders':
      return (
        <svg {...common}>
          <line x1="21" x2="14" y1="4" y2="4" />
          <line x1="10" x2="3" y1="4" y2="4" />
          <line x1="21" x2="12" y1="12" y2="12" />
          <line x1="8" x2="3" y1="12" y2="12" />
          <line x1="21" x2="16" y1="20" y2="20" />
          <line x1="12" x2="3" y1="20" y2="20" />
          <line x1="14" x2="14" y1="2" y2="6" />
          <line x1="8" x2="8" y1="10" y2="14" />
          <line x1="16" x2="16" y1="18" y2="22" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...common}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg {...common}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
      );
    case 'panelClose':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m16 15-3-3 3-3" />
        </svg>
      );
    case 'panelOpen':
      return (
        <svg {...common}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="m14 9 3 3-3 3" />
        </svg>
      );
  }
}

interface AdminNavItem {
  to: string;
  label: string;
  icon: IconName;
  sourceTag: 'Core' | 'CRM' | 'Web';
}

interface AdminPillarGroup {
  id: 'command' | 'sales-crm' | 'organization' | 'system';
  label: string;
  icon: IconName;
  items: AdminNavItem[];
}

const ADMIN_PILLARS: AdminPillarGroup[] = [
  {
    id: 'command',
    label: 'Command',
    icon: 'command',
    items: [
      { to: '/properties', label: 'Properties', icon: 'home', sourceTag: 'Core' },
      { to: '/projects', label: 'Projects', icon: 'layers', sourceTag: 'Core' },
    ],
  },
  {
    id: 'sales-crm',
    label: 'Sales & Client CRM',
    icon: 'sales',
    items: [
      { to: '/tasks', label: 'Tasks (Submissions)', icon: 'check', sourceTag: 'CRM' },
      { to: '/leads', label: 'Leads', icon: 'clipboard', sourceTag: 'CRM' },
      { to: '/chat', label: 'Live Chat', icon: 'chat', sourceTag: 'Web' },
      { to: '/visits', label: 'Site Visits', icon: 'calendar', sourceTag: 'Web' },
    ],
  },
  {
    id: 'organization',
    label: 'Organization & Web',
    icon: 'org',
    items: [
      { to: '/agents', label: 'Agents & Employees', icon: 'users', sourceTag: 'Core' },
      { to: '/branches', label: 'Branches', icon: 'pin', sourceTag: 'Web' },
      { to: '/careers', label: 'Careers', icon: 'briefcase', sourceTag: 'Web' },
    ],
  },
  {
    id: 'system',
    label: 'System & SEO',
    icon: 'system',
    items: [
      { to: '/seo', label: 'SEO & Metadata', icon: 'search', sourceTag: 'Web' },
      { to: '/settings', label: 'Settings', icon: 'sliders', sourceTag: 'Core' },
    ],
  },
];

const S = {
  shell: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative' as const,
    background: '#F7F8FA',
    color: '#0F172A',
  } as const,
  splitRail: {
    display: 'flex',
    height: '100%',
    flexShrink: 0,
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
  } as const,
  pillarRail: {
    width: 64,
    background: '#FBFBFD',
    borderRight: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '14px 0',
    flexShrink: 0,
  } as const,
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 6,
    border: '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#0F172A',
    display: 'grid',
    placeItems: 'center',
    marginBottom: 20,
    cursor: 'pointer',
  } as const,
  pillarBtn: (active: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 6,
    border: 'none',
    background: active ? '#0F172A' : 'transparent',
    color: active ? '#FFFFFF' : '#64748B',
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
  }),
  subDrawer: {
    width: 224,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#FFFFFF',
    minWidth: 0,
  } as const,
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #E2E8F0',
    padding: '14px 16px',
  } as const,
  drawerEyebrow: {
    fontSize: 11,
    fontWeight: 500,
    color: '#94A3B8',
    lineHeight: 1.3,
  } as const,
  drawerTitle: {
    fontSize: 13.5,
    fontWeight: 600,
    color: '#0F172A',
    lineHeight: 1.35,
  } as const,
  navScroll: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  } as const,
  link: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    minHeight: 38,
    borderRadius: 6,
    background: active ? '#F1F5F9' : 'transparent',
    color: active ? '#0F172A' : '#475569',
    fontSize: 12.5,
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
  }),
  allLink: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderRadius: 5,
    background: active ? '#F8FAFC' : 'transparent',
    color: active ? '#0F172A' : '#64748B',
    fontSize: 11.5,
    fontWeight: active ? 600 : 500,
    textDecoration: 'none',
  }),
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid #E2E8F0',
    padding: '12px',
  } as const,
  logoutBtn: {
    width: '100%',
    minHeight: 36,
    padding: '6px 10px',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 6,
    color: '#DC2626',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 12,
    marginTop: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  } as const,
  mainCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#F7F8FA',
    overflow: 'hidden',
  } as const,
  topBar: {
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    gap: 12,
    flexShrink: 0,
  } as const,
  hamburger: {
    width: 36,
    height: 36,
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#334155',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const,
  mainScroll: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto' as const,
    minWidth: 0,
  } as const,
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15, 23, 42, 0.25)',
    zIndex: 40,
  } as const,
  mobileDrawerWrap: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    display: 'flex',
    background: '#FFFFFF',
    borderRight: '1px solid #E2E8F0',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.14)',
  } as const,
  floatingToast: {
    position: 'fixed' as const,
    top: '1.25rem',
    right: '1.25rem',
    zIndex: 80,
    width: 340,
    maxWidth: 'calc(100vw - 2rem)',
    background: '#FFFFFF',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
    padding: '0.9rem 1rem',
  } as const,
};

function findOwnerPillar(pathname: string): AdminPillarGroup {
  for (const pillar of ADMIN_PILLARS) {
    if (pillar.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))) {
      return pillar;
    }
  }
  return ADMIN_PILLARS[0];
}

function findActiveItem(pathname: string): { pillar: AdminPillarGroup; item: AdminNavItem } {
  const pillar = findOwnerPillar(pathname);
  const item =
    pillar.items.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`)) ||
    pillar.items[0];
  return { pillar, item };
}

const ADMIN_SIDEBAR_COMPACT_KEY = 'attaie_admin_sidebar_compact';

function readAdminSidebarCompact(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage?.getItem(ADMIN_SIDEBAR_COMPACT_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => readAdminSidebarCompact());
  const [version, setVersion] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [globalAlert, setGlobalAlert] = useState<GlobalChatAlert | null>(null);
  const [selectedPillarId, setSelectedPillarId] = useState<AdminPillarGroup['id']>(
    () => findOwnerPillar(location.pathname).id,
  );

  const handleToggleCompact = () => {
    setIsCompact((prev) => {
      const next = !prev;
      try {
        window.localStorage?.setItem(ADMIN_SIDEBAR_COMPACT_KEY, next ? 'true' : 'false');
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  };

  const seenMsgIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  const routeMatch = useMemo(() => findActiveItem(location.pathname), [location.pathname]);

  useEffect(() => {
    setSelectedPillarId(routeMatch.pillar.id);
  }, [routeMatch.pillar.id]);

  const activeDrawerPillar = useMemo(
    () => ADMIN_PILLARS.find((p) => p.id === selectedPillarId) || routeMatch.pillar,
    [selectedPillarId, routeMatch.pillar],
  );

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

  useEffect(() => {
    if (location.pathname === '/chat') {
      setGlobalAlert(null);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSelectPillar = (pillar: AdminPillarGroup) => {
    setSelectedPillarId(pillar.id);
    if (pillar.items.length > 0) {
      navigate(pillar.items[0].to);
    }
  };

  const FloatingGlobalAlert = () => {
    if (!globalAlert) return null;
    return (
      <div style={S.floatingToast} role="alert">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#0F172A',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Icon name="bell" size={14} color="#0F172A" />
            New Customer Message
          </span>
          <button
            type="button"
            onClick={() => setGlobalAlert(null)}
            aria-label="Dismiss notification"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#0F172A', marginBottom: '0.2rem' }}>
          {globalAlert.customerName} {globalAlert.customerPhone && `(${globalAlert.customerPhone})`}
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: '#64748B',
            marginBottom: '0.75rem',
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
            padding: '0.5rem 0.75rem',
            background: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          Open in Chat Inbox
        </button>
      </div>
    );
  };

  const SplitRailContent = ({ onNav, mobileDrawer }: { onNav?: () => void; mobileDrawer?: boolean }) => {
    const primaryPillars = ADMIN_PILLARS.filter((p) => p.id !== 'system');
    const systemPillar = ADMIN_PILLARS.find((p) => p.id === 'system')!;

    return (
      <>
        {/* Tier 1: 64px Alabaster Pillar Icon Rail */}
        <div style={S.pillarRail}>
          <button
            type="button"
            style={S.brandMark}
            onClick={() => {
              navigate('/properties');
              onNav?.();
            }}
            title="Attaie Properties Admin"
            aria-label="Attaie Properties Admin"
          >
            <Icon name="building" size={16} />
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {primaryPillars.map((pillar) => {
              const isCurrent = pillar.id === activeDrawerPillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => handleSelectPillar(pillar)}
                  title={pillar.label}
                  aria-label={pillar.label}
                  style={S.pillarBtn(isCurrent)}
                >
                  <Icon name={pillar.icon} size={16} color={isCurrent ? '#FFFFFF' : '#64748B'} />
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              paddingTop: 10,
              borderTop: '1px solid #E2E8F0',
              width: '100%',
            }}
          >
            {!mobileDrawer && (
              <button
                type="button"
                data-testid="admin-sidebar-compact-toggle"
                onClick={handleToggleCompact}
                aria-pressed={isCompact}
                aria-expanded={!isCompact}
                title={isCompact ? 'Expand full sidebar' : 'Compact icon-only sidebar'}
                aria-label={isCompact ? 'Expand full sidebar' : 'Compact icon-only sidebar'}
                style={S.pillarBtn(isCompact)}
              >
                <Icon
                  name={isCompact ? 'panelOpen' : 'panelClose'}
                  size={16}
                  color={isCompact ? '#FFFFFF' : '#64748B'}
                />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectPillar(systemPillar)}
              title={systemPillar.label}
              aria-label={systemPillar.label}
              style={S.pillarBtn(activeDrawerPillar.id === 'system')}
            >
              <Icon
                name="sliders"
                size={16}
                color={activeDrawerPillar.id === 'system' ? '#FFFFFF' : '#64748B'}
              />
            </button>
          </div>
        </div>

        {/* Tier 2: 224px Contextual Sub-Drawer */}
        {(mobileDrawer || !isCompact) && (
        <div style={S.subDrawer}>
          <div style={S.drawerHeader}>
            <div style={{ minWidth: 0 }}>
              <div style={S.drawerEyebrow}>Attaie Properties</div>
              <div style={S.drawerTitle}>{activeDrawerPillar.label}</div>
            </div>
            {mobileDrawer && (
              <button
                type="button"
                onClick={onNav}
                aria-label="Close menu"
                style={{
                  width: 32,
                  height: 32,
                  border: 'none',
                  background: 'transparent',
                  color: '#64748B',
                  borderRadius: 6,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <Icon name="x" size={16} />
              </button>
            )}
          </div>

          <div style={S.navScroll}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeDrawerPillar.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => S.link(isActive)}
                  onClick={onNav}
                >
                  <Icon name={item.icon} size={15} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {item.to === '/chat' && unreadChatCount > 0 && (
                    <span
                      className="tabular-nums"
                      style={{
                        color: '#DC2626',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {unreadChatCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <div
                style={{
                  padding: '0 8px 6px',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#94A3B8',
                }}
              >
                All Modules
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ADMIN_PILLARS.flatMap((pillar) =>
                  pillar.items.map((item) => (
                    <NavLink
                      key={`all-${item.to}`}
                      to={item.to}
                      style={({ isActive }) => S.allLink(isActive)}
                      onClick={onNav}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 6, flexShrink: 0 }}>
                        {item.sourceTag}
                      </span>
                    </NavLink>
                  )),
                )}
              </div>
            </div>
          </div>

          <div style={S.footer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>Admin CRM</span>
              {version && <span className="tabular-nums">v{version}</span>}
            </div>
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
              Attaie Properties · Alabaster UI
            </div>
            <button type="button" style={S.logoutBtn} onClick={handleLogout}>
              <Icon name="logout" size={14} color="#DC2626" />
              <span>Logout</span>
            </button>
          </div>
        </div>
        )}
      </>
    );
  };

  const panelTransitionStyle = {
    animation: 'adminPanelEnter 180ms cubic-bezier(0.16, 1, 0.3, 1)',
  } as const;

  return (
    <div
      style={S.shell}
      data-testid="admin-alabaster-split-rail"
      data-sidebar-mode={isCompact ? 'compact' : 'expanded'}
    >
      <style>{`@keyframes adminPanelEnter { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <FloatingGlobalAlert />

      {!isMobile && (
        <aside style={S.splitRail} aria-label="Admin CRM Navigation">
          <SplitRailContent />
        </aside>
      )}

      {isMobile && menuOpen && (
        <>
          <div style={S.overlay} onClick={() => setMenuOpen(false)} />
          <aside style={S.mobileDrawerWrap} aria-label="Mobile Admin CRM Navigation">
            <SplitRailContent mobileDrawer onNav={() => setMenuOpen(false)} />
          </aside>
        </>
      )}

      <div style={S.mainCol}>
        <header style={S.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button
                type="button"
                style={S.hamburger}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                <Icon name={menuOpen ? 'x' : 'menu'} size={16} />
              </button>
            )}
            <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
              {routeMatch.pillar.label}
            </span>
            <Icon name="chevron" size={14} color="#94A3B8" />
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: '#0F172A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {routeMatch.item.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#64748B',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 6,
                padding: '4px 10px',
                whiteSpace: 'nowrap',
              }}
            >
              Attaie Admin CRM
            </span>
          </div>
        </header>

        <main style={{ ...S.mainScroll, padding: isMobile ? '16px' : '24px' }}>
          <div key={location.pathname} style={panelTransitionStyle}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
