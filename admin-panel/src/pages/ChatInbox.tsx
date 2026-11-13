import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { api, type ChatConversation } from '../api';

export interface IncomingVisualAlert {
  id: string;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  pageContext: string | null;
  messageText: string;
  arrivedAt: string;
}

/**
 * Plays a gentle 2-note notification chime using Web Audio API (no external audio asset needed).
 */
function playNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.11); // A5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);
  } catch {
    // ignore if browser blocks autoplay before user interaction
  }
}

const S = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 'calc(100vh - 3.5rem)',
    maxWidth: 1240,
    position: 'relative' as const,
  } as const,
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginBottom: '0.85rem',
    flexShrink: 0,
  } as const,
  title: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  } as const,
  sub: {
    color: '#64748B',
    fontSize: '0.82rem',
    marginTop: '0.2rem',
    marginBottom: 0,
  } as const,
  alertStack: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.55rem',
    marginBottom: '0.9rem',
    flexShrink: 0,
  } as const,
  alertBanner: {
    background: '#FFFFFF',
    color: '#0F172A',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    padding: '0.8rem 1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '0.85rem',
  } as const,
  alertPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    background: '#0F172A',
    color: '#FFFFFF',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '0.18rem 0.55rem',
    borderRadius: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  } as const,
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.85rem',
    marginBottom: '0.95rem',
    flexShrink: 0,
  } as const,
  kpiCard: (_accentColor: string): React.CSSProperties => ({
    background: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    padding: '0.78rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    fontVariantNumeric: 'tabular-nums',
  }),
  kpiLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  } as const,
  kpiValue: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.2,
    fontVariantNumeric: 'tabular-nums',
  } as const,
  shell: {
    display: 'grid',
    gridTemplateColumns: '355px 1fr',
    gap: '1.15rem',
    flex: 1,
    minHeight: 0,
  } as const,
  sidebarCard: {
    background: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minHeight: 0,
  } as const,
  filterBar: {
    padding: '0.85rem',
    borderBottom: '1px solid #E2E8F0',
    background: '#F8FAFC',
    flexShrink: 0,
  } as const,
  searchInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: '0.82rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '0.6rem',
    background: '#FFFFFF',
    color: '#0F172A',
  } as const,
  tabsRow: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap' as const,
  } as const,
  tabBtn: (active: boolean): React.CSSProperties => ({
    padding: '0.3rem 0.6rem',
    borderRadius: 6,
    border: active ? '1px solid #0F172A' : '1px solid #E2E8F0',
    background: active ? '#0F172A' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#475569',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
  }),
  convList: {
    flex: 1,
    overflowY: 'auto' as const,
  } as const,
  convItem: (selected: boolean, unread: boolean, highlighted: boolean): React.CSSProperties => ({
    padding: '0.85rem 0.95rem',
    borderBottom: '1px solid #F1F5F9',
    background: highlighted
      ? '#ECFDF5'
      : selected
        ? '#F1F5F9'
        : unread
          ? '#F8FAFC'
          : '#FFFFFF',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  }),
  avatar: (selected: boolean): React.CSSProperties => ({
    width: 34,
    height: 34,
    borderRadius: 999,
    background: selected ? '#0F172A' : '#334155',
    color: '#FFFFFF',
    fontSize: '0.76rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  convName: {
    fontSize: '0.86rem',
    fontWeight: 700,
    color: '#0F172A',
  } as const,
  unreadBadge: {
    background: '#DC2626',
    color: '#FFFFFF',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '0.1rem 0.45rem',
    borderRadius: 6,
    fontVariantNumeric: 'tabular-nums',
  } as const,
  statusTag: (resolved: boolean): React.CSSProperties => ({
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '0.12rem 0.45rem',
    borderRadius: 6,
    textTransform: 'uppercase',
    background: resolved ? '#ECFDF5' : '#FEF3C7',
    color: resolved ? '#065F46' : '#92400E',
  }),
  sourceTag: {
    fontSize: '0.64rem',
    fontWeight: 600,
    padding: '0.1rem 0.4rem',
    borderRadius: 6,
    background: '#F1F5F9',
    color: '#475569',
  } as const,
  threadCard: {
    background: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    minHeight: 0,
  } as const,
  threadHeader: {
    padding: '0.95rem 1.25rem',
    borderBottom: '1px solid #E2E8F0',
    background: '#F8FAFC',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    flexShrink: 0,
  } as const,
  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1.15rem 1.25rem',
    background: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.85rem',
  } as const,
  composerBox: {
    padding: '0.85rem 1.15rem',
    borderTop: '1px solid #E5E7EB',
    background: '#FFFFFF',
    flexShrink: 0,
  } as const,
  cannedRow: {
    display: 'flex',
    gap: '0.35rem',
    flexWrap: 'wrap' as const,
    marginBottom: '0.55rem',
  } as const,
  cannedBtn: {
    padding: '0.25rem 0.55rem',
    fontSize: '0.71rem',
    fontWeight: 600,
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    cursor: 'pointer',
  } as const,
  btnGold: {
    padding: '0.6rem 1.25rem',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '0.84rem',
    cursor: 'pointer',
  } as const,
  btnSecondary: {
    padding: '0.4rem 0.78rem',
    background: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  } as const,
  btnDanger: {
    padding: '0.4rem 0.78rem',
    background: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: '0.75rem',
    cursor: 'pointer',
  } as const,
};

const SAMPLE_DEMO_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'chat_demo_kabul_1',
    customer_name: 'احمد سیرت (Ahmad Seerat)',
    customer_phone: '+93 78 412 8890',
    customer_email: 'ahmad.seerat@example.com',
    property_id: '101',
    property_name: 'اپارتمان سه اتاقه کرایی در وزیر اکبر خان',
    page_context: '/properties/101 — اپارتمان سه اتاقه کرایی در وزیر اکبر خان',
    status: 'open',
    unread_admin: 2,
    unread_customer: 0,
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'm_demo_1',
        sender: 'customer',
        sender_name: 'احمد سیرت',
        text: 'سلام، آیا این اپارتمان سه اتاقه در وزیر اکبر خان هنوز برای کرایه موجود است؟ مرکزگرمی و لفت ۲۴ ساعته دارد؟',
        created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'm_demo_3',
        sender: 'customer',
        sender_name: 'احمد سیرت',
        text: 'اگر امکان داشته باشد فردا ساعت ۱۰ صبح برای دیدن اپارتمان بیایم.',
        created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      },
    ],
  },
];

function isRtlText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function getInitials(name: string): string {
  const parts = name.replace(/[()]/g, '').trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ChatInbox() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'unread' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [adminName, setAdminName] = useState('Attaie Advisor');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<string>('');
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Real-time visual alert notification state
  const [visualAlerts, setVisualAlerts] = useState<IncomingVisualAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('attaie_admin_chat_sound') !== 'off';
  });
  const [recentlyArrivedConvId, setRecentlyArrivedConvId] = useState<string | null>(null);

  // Track seen customer message IDs so only newly arriving customer messages trigger alerts
  const seenCustomerMsgIdsRef = useRef<Set<string>>(new Set());
  const initialLoadCompletedRef = useRef<boolean>(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time typing state (tracks which customer conversation IDs are currently typing + admin typing debounce)
  const [typingCustomerMap, setTypingCustomerMap] = useState<Record<string, boolean>>({});
  const customerTypingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAdminTypingSentRef = useRef<number>(0);

  // New conversation modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerContext, setNewCustomerContext] = useState('');
  const [newInitialReply, setNewInitialReply] = useState('');

  const triggerIncomingVisualAlert = useCallback(
    (conv: ChatConversation, msgId: string, msgText: string, msgCreatedAt: string) => {
      const alertItem: IncomingVisualAlert = {
        id: `alert_${msgId}_${Date.now()}`,
        conversationId: conv.id,
        customerName: conv.customer_name,
        customerPhone: conv.customer_phone,
        pageContext: conv.page_context || conv.property_name || null,
        messageText: msgText,
        arrivedAt: msgCreatedAt,
      };

      setVisualAlerts(prev => {
        if (prev.some(a => a.id.includes(msgId))) return prev;
        return [alertItem, ...prev].slice(0, 4);
      });

      setRecentlyArrivedConvId(conv.id);
      setTimeout(() => {
        setRecentlyArrivedConvId(curr => (curr === conv.id ? null : curr));
      }, 4500);

      if (soundEnabled) {
        playNotificationChime();
      }

      // Trigger Electron native OS notification if running in desktop app
      window.electronAPI?.notify(
        `New message from ${conv.customer_name}`,
        msgText.slice(0, 120)
      );

      // Dispatch custom event so Layout sidebar badge updates immediately
      window.dispatchEvent(
        new CustomEvent('attaie-admin-new-chat-alert', { detail: alertItem })
      );
    },
    [soundEnabled]
  );

  const loadConversations = useCallback(async () => {
    let list = await api.getChatConversations();

    // Seed sample Kabul customer threads once in preview if none exist yet
    if (list.length === 0 && !sessionStorage.getItem('attaie_chat_demo_seeded')) {
      try {
        sessionStorage.setItem('attaie_chat_demo_seeded', '1');
        localStorage.setItem('attaie_chat_conversations_v1', JSON.stringify(SAMPLE_DEMO_CONVERSATIONS));
        list = SAMPLE_DEMO_CONVERSATIONS;
      } catch {
        // ignore
      }
    }

    // Detect newly arrived customer messages for real-time visual alerts
    const seen = seenCustomerMsgIdsRef.current;
    if (!initialLoadCompletedRef.current) {
      for (const conv of list) {
        for (const m of conv.messages) {
          if (m.sender === 'customer') {
            seen.add(m.id);
          }
        }
      }
      initialLoadCompletedRef.current = true;
    } else {
      for (const conv of list) {
        for (const m of conv.messages) {
          if (m.sender === 'customer' && !seen.has(m.id)) {
            seen.add(m.id);
            triggerIncomingVisualAlert(conv, m.id, m.text, m.created_at);
          }
        }
      }
    }

    // Sync server/storage-based customer typing flags (6-second TTL)
    const nextTypingMap: Record<string, boolean> = {};
    for (const conv of list) {
      if (conv.is_customer_typing) {
        nextTypingMap[conv.id] = true;
      } else if (conv.typing_customer_at) {
        const elapsed = Date.now() - new Date(conv.typing_customer_at).getTime();
        if (elapsed >= 0 && elapsed <= 6000) {
          nextTypingMap[conv.id] = true;
        }
      }
    }
    setTypingCustomerMap(prev => ({ ...prev, ...nextTypingMap }));

    setConversations(list);
    setLoading(false);
    setLastSynced(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    setSelectedId(prev => {
      if (prev && list.some(c => c.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [triggerIncomingVisualAlert]);

  // Real-time listeners: Polling + Storage Event + BroadcastChannel
  useEffect(() => {
    void loadConversations();
    const timer = setInterval(() => {
      void loadConversations();
    }, 3000);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'attaie_chat_conversations_v1') {
        void loadConversations();
      }
    };
    window.addEventListener('storage', onStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('attaie_live_chat_channel');
        bc.onmessage = (event: MessageEvent) => {
          const data = event.data as {
            type?: string;
            conversationId?: string;
            sender?: string;
            isTyping?: boolean;
            reader?: string;
            readAt?: string;
          } | null;

          if (data?.type === 'TYPING_STATUS' && data.sender === 'customer' && data.conversationId) {
            const convId = data.conversationId;
            setTypingCustomerMap(prev => ({ ...prev, [convId]: Boolean(data.isTyping) }));
            if (customerTypingTimersRef.current[convId]) {
              clearTimeout(customerTypingTimersRef.current[convId]);
            }
            if (data.isTyping) {
              customerTypingTimersRef.current[convId] = setTimeout(() => {
                setTypingCustomerMap(prev => ({ ...prev, [convId]: false }));
              }, 6000);
            }
            return;
          }

          if (data?.type === 'MESSAGES_READ' && data.reader === 'customer' && data.conversationId) {
            const convId = data.conversationId;
            const readTime = data.readAt || new Date().toISOString();
            setConversations(prev =>
              prev.map(c =>
                c.id === convId
                  ? {
                      ...c,
                      unread_customer: 0,
                      messages: c.messages.map(m =>
                        m.sender === 'admin'
                          ? { ...m, read_status: 'read' as const, read_at: m.read_at || readTime }
                          : m
                      ),
                    }
                  : c
              )
            );
            return;
          }

          void loadConversations();
        };
      }
    } catch {
      // ignore if BroadcastChannel is unavailable
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      bc?.close();
    };
  }, [loadConversations]);

  const activeConv = conversations.find(c => c.id === selectedId) ?? null;
  const isActiveCustomerTyping = Boolean(activeConv && typingCustomerMap[activeConv.id]);

  useEffect(() => {
    if (!activeConv) return;
    const hasUnreadCustomerMsg =
      activeConv.unread_admin > 0 ||
      activeConv.messages.some(m => m.sender === 'customer' && m.read_status !== 'read');

    if (hasUnreadCustomerMsg) {
      const now = new Date().toISOString();
      void api.markChatRead(activeConv.id).then(() => {
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConv.id
              ? {
                  ...c,
                  unread_admin: 0,
                  messages: c.messages.map(m =>
                    m.sender === 'customer'
                      ? { ...m, read_status: 'read' as const, read_at: m.read_at || now }
                      : m
                  ),
                }
              : c
          )
        );
      });
    }
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }, [activeConv?.id, activeConv?.messages.length, isActiveCustomerTyping]);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('attaie_admin_chat_sound', next ? 'on' : 'off');
      if (next) playNotificationChime();
      return next;
    });
  };

  /**
   * Simulates a real-time incoming customer message so the admin can test the visual alert listener immediately.
   */
  const handleSimulateIncomingMessage = () => {
    const now = new Date().toISOString();
    const msgId = `msg_live_${Date.now()}`;
    const sampleCustomers = [
      {
        id: 'chat_live_sim_1',
        name: 'فرهاد نوری (Farhad Noori)',
        phone: '+93 70 554 1920',
        context: '/properties/102 — اپارتمان چهار اتاقه فروشی در شهر نو',
        text: 'سلام! آیا این اپارتمان چهار اتاقه در شهر نو قباله شرعی دارد و امکان بازدید امروز عصر هست؟',
      },
      {
        id: 'chat_demo_kabul_1',
        name: 'احمد سیرت (Ahmad Seerat)',
        phone: '+93 78 412 8890',
        context: '/properties/101 — اپارتمان سه اتاقه کرایی در وزیر اکبر خان',
        text: 'لطفاً آدرس دقیق سرک وزیر اکبر خان را برایم ارسال کنید تا برای بازدید بیایم.',
      },
    ];
    const pick = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];

    const existingIdx = conversations.findIndex(c => c.id === pick.id);
    let updatedConv: ChatConversation;
    const nextList = [...conversations];

    if (existingIdx >= 0) {
      const target = nextList[existingIdx];
      updatedConv = {
        ...target,
        status: 'open',
        unread_admin: (target.unread_admin || 0) + 1,
        updated_at: now,
        messages: [
          ...target.messages,
          {
            id: msgId,
            sender: 'customer',
            sender_name: pick.name,
            text: pick.text,
            created_at: now,
          },
        ],
      };
      nextList.splice(existingIdx, 1);
      nextList.unshift(updatedConv);
    } else {
      updatedConv = {
        id: pick.id,
        customer_name: pick.name,
        customer_phone: pick.phone,
        customer_email: '',
        property_id: '102',
        property_name: pick.context,
        page_context: pick.context,
        status: 'open',
        unread_admin: 1,
        unread_customer: 0,
        created_at: now,
        updated_at: now,
        messages: [
          {
            id: msgId,
            sender: 'customer',
            sender_name: pick.name,
            text: pick.text,
            created_at: now,
          },
        ],
      };
      nextList.unshift(updatedConv);
    }

    seenCustomerMsgIdsRef.current.add(msgId);
    setConversations(nextList);
    try {
      localStorage.setItem('attaie_chat_conversations_v1', JSON.stringify(nextList));
    } catch {
      // ignore
    }
    triggerIncomingVisualAlert(updatedConv, msgId, pick.text, now);
  };

  const handleOpenAlertConversation = (alert: IncomingVisualAlert) => {
    setSelectedId(alert.conversationId);
    setVisualAlerts(prev => prev.filter(a => a.id !== alert.id));
    setTimeout(() => {
      replyTextareaRef.current?.focus();
    }, 100);
  };

  const handleAdminReplyInputChange = (nextValue: string) => {
    setReplyText(nextValue);
    if (!activeConv) return;

    const senderLabel = adminName.trim() || 'Attaie Advisor';
    if (!nextValue.trim()) {
      if (adminTypingTimeoutRef.current) {
        clearTimeout(adminTypingTimeoutRef.current);
      }
      void api.sendAdminTypingSignal(activeConv.id, false, senderLabel);
      return;
    }

    const now = Date.now();
    if (now - lastAdminTypingSentRef.current > 1800) {
      lastAdminTypingSentRef.current = now;
      void api.sendAdminTypingSignal(activeConv.id, true, senderLabel);
    }

    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
    }
    adminTypingTimeoutRef.current = setTimeout(() => {
      void api.sendAdminTypingSignal(activeConv.id, false, senderLabel);
    }, 2500);
  };

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeConv || !replyText.trim() || sending) return;

    const trimmedReply = replyText.trim();
    const senderLabel = adminName.trim() || 'Attaie Advisor';
    setSending(true);
    setSentNotice(null);
    if (adminTypingTimeoutRef.current) {
      clearTimeout(adminTypingTimeoutRef.current);
    }
    void api.sendAdminTypingSignal(activeConv.id, false, senderLabel);

    try {
      const updated = await api.replyToChat(activeConv.id, trimmedReply, senderLabel);
      if (updated) {
        setConversations(prev => [updated, ...prev.filter(c => c.id !== updated.id)]);
      }
      setReplyText('');
      setVisualAlerts(prev => prev.filter(a => a.conversationId !== activeConv.id));
      setSentNotice(`✓ Reply delivered to ${activeConv.customer_name}`);
      setTimeout(() => setSentNotice(null), 3500);
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewThread = (e: FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newInitialReply.trim()) return;

    const now = new Date().toISOString();
    const newThread: ChatConversation = {
      id: `chat_${Date.now()}`,
      customer_name: newCustomerName.trim(),
      customer_phone: newCustomerPhone.trim(),
      customer_email: '',
      property_id: null,
      property_name: newCustomerContext.trim() || 'Direct Advisor Outreach',
      page_context: newCustomerContext.trim() || 'Direct Advisor Outreach',
      status: 'open',
      unread_admin: 0,
      unread_customer: 1,
      created_at: now,
      updated_at: now,
      messages: [
        {
          id: `msg_${Date.now()}_adm`,
          sender: 'admin',
          sender_name: adminName.trim() || 'Attaie Advisor',
          text: newInitialReply.trim(),
          created_at: now,
        },
      ],
    };

    const nextList = [newThread, ...conversations];
    setConversations(nextList);
    setSelectedId(newThread.id);
    try {
      localStorage.setItem('attaie_chat_conversations_v1', JSON.stringify(nextList));
    } catch {
      // ignore
    }
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerContext('');
    setNewInitialReply('');
    setShowNewModal(false);
  };

  const handleLoadSampleThreads = () => {
    const merged = [
      ...SAMPLE_DEMO_CONVERSATIONS.filter(d => !conversations.some(c => c.id === d.id)),
      ...conversations,
    ];
    setConversations(merged);
    if (merged[0]) setSelectedId(merged[0].id);
    try {
      localStorage.setItem('attaie_chat_conversations_v1', JSON.stringify(merged));
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async () => {
    if (!activeConv) return;
    const nextStatus = activeConv.status === 'resolved' ? 'open' : 'resolved';
    await api.updateChatStatus(activeConv.id, nextStatus);
    setConversations(prev =>
      prev.map(c => (c.id === activeConv.id ? { ...c, status: nextStatus } : c))
    );
  };

  const handleDelete = async () => {
    if (!activeConv) return;
    const targetId = activeConv.id;
    await api.deleteChatConversation(targetId);
    setVisualAlerts(prev => prev.filter(a => a.conversationId !== targetId));
    setConversations(prev => {
      const remaining = prev.filter(c => c.id !== targetId);
      setSelectedId(remaining[0]?.id ?? null);
      return remaining;
    });
  };

  const filteredConversations = conversations.filter(c => {
    if (filter === 'unread' && !(c.unread_admin > 0)) return false;
    if (filter === 'open' && c.status !== 'open') return false;
    if (filter === 'resolved' && c.status !== 'resolved') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.customer_name.toLowerCase().includes(q);
      const matchPhone = c.customer_phone.toLowerCase().includes(q);
      const matchEmail = (c.customer_email || '').toLowerCase().includes(q);
      const matchContext = (c.page_context || '').toLowerCase().includes(q);
      const matchMsg = c.messages.some(m => m.text.toLowerCase().includes(q));
      return matchName || matchPhone || matchEmail || matchContext || matchMsg;
    }
    return true;
  });

  const openCount = conversations.filter(c => c.status === 'open').length;
  const resolvedCount = conversations.filter(c => c.status === 'resolved').length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_admin || 0), 0);
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);

  return (
    <div style={S.page}>
      {/* Top Dashboard Header */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>
            <span>Customer Chat Dashboard</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
                padding: '0.18rem 0.55rem',
                borderRadius: 6,
              }}
            >
              Live Listener Active
            </span>
            {totalUnread > 0 && (
              <span style={{ ...S.unreadBadge, fontSize: '0.76rem' }}>
                {totalUnread} unread
              </span>
            )}
          </h1>
          <p style={S.sub}>
            Real-time notification listener for incoming customer messages.
            {lastSynced && <span style={{ marginLeft: '0.5rem', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>• Synced {lastSynced}</span>}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={toggleSound}
            title="Toggle audio chime when a new customer message arrives"
          >
            {soundEnabled ? 'Sound On' : 'Sound Muted'}
          </button>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={handleSimulateIncomingMessage}
            title="Simulate an incoming customer message to test the real-time visual alert"
          >
            Test Incoming Alert
          </button>
          <button
            type="button"
            style={{ ...S.btnGold, padding: '0.42rem 0.9rem', fontSize: '0.76rem' }}
            onClick={() => setShowNewModal(v => !v)}
          >
            + Message Customer
          </button>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={() => void loadConversations()}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Real-Time Visual Alert Notification Stack */}
      {visualAlerts.length > 0 && (
        <div style={S.alertStack} role="status" aria-live="polite">
          {visualAlerts.map(alert => (
            <div key={alert.id} style={S.alertBanner}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={S.alertPill}>
                    New Customer Message
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>
                    {alert.customerName}
                  </strong>
                  <span style={{ fontSize: '0.76rem', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                    {alert.customerPhone}
                  </span>
                  {alert.pageContext && (
                    <span style={{ fontSize: '0.73rem', color: '#64748B' }}>
                      {alert.pageContext}
                    </span>
                  )}
                </div>
                <div
                  dir={isRtlText(alert.messageText) ? 'rtl' : 'ltr'}
                  style={{
                    fontSize: '0.82rem',
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 740,
                  }}
                >
                  “{alert.messageText}”
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    ...S.btnGold,
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.78rem',
                  }}
                  onClick={() => handleOpenAlertConversation(alert)}
                >
                  Open & Reply Now →
                </button>
                <button
                  type="button"
                  style={{
                    background: '#F8FAFC',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    padding: '0.42rem 0.7rem',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setVisualAlerts(prev => prev.filter(a => a.id !== alert.id))
                  }
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div style={S.kpiGrid}>
        <div style={S.kpiCard('#0F172A')}>
          <span style={S.kpiLabel}>Active Conversations</span>
          <span style={S.kpiValue}>{openCount}</span>
        </div>
        <div style={S.kpiCard('#DC2626')}>
          <span style={S.kpiLabel}>Unread Customer Messages</span>
          <span style={{ ...S.kpiValue, color: totalUnread > 0 ? '#DC2626' : '#0F172A' }}>
            {totalUnread}
          </span>
        </div>
        <div style={S.kpiCard('#0F172A')}>
          <span style={S.kpiLabel}>Total Messages Exchanged</span>
          <span style={S.kpiValue}>{totalMessages}</span>
        </div>
        <div style={S.kpiCard('#059669')}>
          <span style={S.kpiLabel}>Resolved Threads</span>
          <span style={S.kpiValue}>{resolvedCount}</span>
        </div>
      </div>

      {/* Optional New Outbound Customer Thread Form */}
      {showNewModal && (
        <form
          onSubmit={handleCreateNewThread}
          style={{
            background: '#FFFFFF',
            border: '1px solid #0F172A',
            borderRadius: 10,
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            alignItems: 'end',
            flexShrink: 0,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Customer Name *
            </label>
            <input
              required
              style={{ ...S.searchInput, marginBottom: 0 }}
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
              placeholder="e.g. حمیدالله کریمی"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Customer Phone *
            </label>
            <input
              required
              style={{ ...S.searchInput, marginBottom: 0 }}
              value={newCustomerPhone}
              onChange={e => setNewCustomerPhone(e.target.value)}
              placeholder="+93 78 222 2279"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Property / Context
            </label>
            <input
              style={{ ...S.searchInput, marginBottom: 0 }}
              value={newCustomerContext}
              onChange={e => setNewCustomerContext(e.target.value)}
              placeholder="e.g. ATP-101 Wazir Akbar Khan"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
              Initial Message *
            </label>
            <input
              required
              style={{ ...S.searchInput, marginBottom: 0 }}
              value={newInitialReply}
              onChange={e => setNewInitialReply(e.target.value)}
              placeholder="سلام، در مورد درخواست ملک شما…"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ ...S.btnGold, padding: '0.5rem 1rem', fontSize: '0.78rem' }}>
              Send & Open
            </button>
            <button
              type="button"
              style={S.btnSecondary}
              onClick={() => setShowNewModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Two-Pane Inbox & Reply Workspace */}
      <div style={S.shell}>
        {/* Left Sidebar: Active Customer Conversations List */}
        <div style={S.sidebarCard}>
          <div style={S.filterBar}>
            <input
              style={S.searchInput}
              placeholder="Search customer name, phone, property, or message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div style={S.tabsRow}>
              {(
                [
                  ['all', `All (${conversations.length})`],
                  ['open', `Active (${openCount})`],
                  ['unread', `Unread (${totalUnread})`],
                  ['resolved', `Resolved (${resolvedCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  style={S.tabBtn(filter === key)}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={S.convList}>
            {loading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                Loading customer conversations…
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '2.5rem 1.25rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.84rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>No customer conversations match this filter.</p>
                {conversations.length === 0 && (
                  <button
                    type="button"
                    style={S.btnSecondary}
                    onClick={handleLoadSampleThreads}
                  >
                    Load Sample Active Conversations
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isSelected = conv.id === activeConv?.id;
                const isUnread = (conv.unread_admin || 0) > 0;
                const isHighlighted = conv.id === recentlyArrivedConvId;
                const updatedTime = new Date(conv.updated_at || conv.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={conv.id}
                    style={S.convItem(isSelected, isUnread, isHighlighted)}
                    onClick={() => setSelectedId(conv.id)}
                  >
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <div style={S.avatar(isSelected)}>{getInitials(conv.customer_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                          <span style={{ ...S.convName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.customer_name}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {updatedTime}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.74rem', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                            {conv.customer_phone}
                          </span>
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            {isUnread && <span style={S.unreadBadge}>{conv.unread_admin}</span>}
                            <span style={S.sourceTag}>
                              Live Chat
                            </span>
                            <span style={S.statusTag(conv.status === 'resolved')}>
                              {conv.status === 'resolved' ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                        </div>

                        {conv.page_context && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#64748B',
                              marginBottom: '0.22rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {conv.page_context}
                          </div>
                        )}

                        {typingCustomerMap[conv.id] ? (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#059669',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>Customer is typing...</span>
                          </div>
                        ) : (
                          lastMsg && (
                            <div
                              dir={isRtlText(lastMsg.text) ? 'rtl' : 'ltr'}
                              style={{
                                fontSize: '0.75rem',
                                color: isUnread ? '#111827' : '#6B7280',
                                fontWeight: isUnread ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {lastMsg.sender === 'admin'
                                ? lastMsg.read_status === 'read'
                                  ? '✓✓ You: '
                                  : '✓ You: '
                                : ''}
                              {lastMsg.text}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Selected Customer Thread & Direct Reply Composer */}
        <div style={S.threadCard}>
          {!activeConv ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                fontSize: '0.9rem',
                padding: '2rem',
              }}
            >
              Select an active customer conversation on the left to view messages and send a direct reply.
            </div>
          ) : (
            <>
              {/* Customer Thread Header */}
              <div style={S.threadHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      {activeConv.customer_name}
                    </h2>
                    <span style={S.statusTag(activeConv.status === 'resolved')}>
                      {activeConv.status === 'resolved' ? 'Resolved' : 'Active Conversation'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                      ID: <code>{activeConv.id}</code>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', fontSize: '0.78rem', color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                    <span>
                      <strong>{activeConv.customer_phone}</strong>
                    </span>
                    {activeConv.customer_email && <span>{activeConv.customer_email}</span>}
                    {activeConv.page_context && <span>{activeConv.page_context}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <a href={`tel:${activeConv.customer_phone}`} style={S.btnSecondary}>
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${activeConv.customer_phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.btnSecondary}
                  >
                    WhatsApp
                  </a>
                  {activeConv.customer_email && (
                    <a href={`mailto:${activeConv.customer_email}`} style={S.btnSecondary}>
                      Email
                    </a>
                  )}
                  <button
                    type="button"
                    style={S.btnSecondary}
                    onClick={() => void handleToggleStatus()}
                  >
                    {activeConv.status === 'resolved' ? 'Reopen Thread' : 'Mark Resolved'}
                  </button>
                  <button
                    type="button"
                    style={S.btnDanger}
                    onClick={() => void handleDelete()}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Chronological Message History */}
              <div style={S.messagesArea}>
                {activeConv.messages.map(msg => {
                  const isAdmin = msg.sender === 'admin';
                  const isSystem = msg.sender === 'system';
                  const rtl = isRtlText(msg.text);
                  const timestamp = new Date(msg.created_at).toLocaleString([], {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: 'center',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#065F46',
                          fontSize: '0.73rem',
                          padding: '0.35rem 0.85rem',
                          borderRadius: 6,
                        }}
                      >
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdmin ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#64748B',
                          marginBottom: '0.2rem',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {isAdmin
                          ? `${msg.sender_name || 'Attaie Advisor'} (Admin)`
                          : activeConv.customer_name}{' '}
                        • {timestamp}
                      </span>
                      <div
                        dir={rtl ? 'rtl' : 'ltr'}
                        style={{
                          maxWidth: '75%',
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          background: isAdmin ? '#0F172A' : '#FFFFFF',
                          color: isAdmin ? '#FFFFFF' : '#0F172A',
                          border: isAdmin ? 'none' : '1px solid #E2E8F0',
                          textAlign: rtl ? 'right' : 'left',
                        }}
                      >
                        {msg.text}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          marginTop: '0.22rem',
                          color: isAdmin
                            ? msg.read_status === 'read'
                              ? '#0F172A'
                              : '#64748B'
                            : '#059669',
                        }}
                      >
                        {isAdmin
                          ? msg.read_status === 'read'
                            ? 'Read by customer'
                            : 'Sent'
                          : msg.read_status === 'read'
                            ? 'Read'
                            : 'Received'}
                      </span>
                    </div>
                  );
                })}

                {/* Real-time Customer Typing Indicator */}
                {isActiveCustomerTyping && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: '#059669',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {activeConv.customer_name}
                    </span>
                    <div
                      style={{
                        padding: '0.6rem 0.95rem',
                        borderRadius: 8,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#065F46',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                    >
                      <span>{activeConv.customer_name} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Admin Reply Composer */}
              <form onSubmit={handleSendReply} style={S.composerBox}>
                {sentNotice && (
                  <div
                    style={{
                      marginBottom: '0.55rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 6,
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {sentNotice}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: '#475569' }}>
                    <span>Reply as:</span>
                    <input
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      style={{
                        padding: '0.22rem 0.5rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        width: 135,
                      }}
                      placeholder="Attaie Advisor"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
                  <textarea
                    ref={replyTextareaRef}
                    rows={2}
                    dir={isRtlText(replyText) ? 'rtl' : 'ltr'}
                    value={replyText}
                    onChange={e => handleAdminReplyInputChange(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleSendReply(e);
                      }
                    }}
                    placeholder={`Write a direct reply to ${activeConv.customer_name} in Dari or English… (Press Enter to send)`}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={S.btnGold}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? 'Sending…' : 'Send Reply →'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
