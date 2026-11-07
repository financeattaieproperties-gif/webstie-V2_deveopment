import { createLead } from './dbService';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  sender_name?: string;
  text: string;
  read_status?: 'sent' | 'read';
  read_at?: string | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  page_context?: string;
  status: 'open' | 'resolved';
  unread_admin: number;
  unread_customer: number;
  typing_customer_at?: string | null;
  typing_admin_at?: string | null;
  typing_admin_name?: string | null;
  is_customer_typing?: boolean;
  is_admin_typing?: boolean;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

const SESSION_STORAGE_KEY = 'attaie_customer_chat_session_v1';
const LOCAL_STORE_KEY = 'attaie_chat_conversations_v1';
const LEAD_SYNCED_PREFIX = 'attaie_chat_lead_synced_';
const TYPING_TTL_MS = 6000;

function resolveChatEndpoint(): string {
  const apiEnv = (import.meta.env?.VITE_API_URL as string | undefined) || '';
  const root = apiEnv.replace(/\/api\/?$/, '');
  return `${root}/chat-service.php`;
}

function enrichConversationClient(conv: ChatConversation): ChatConversation {
  const nowMs = Date.now();
  const custTs = conv.typing_customer_at ? Date.parse(conv.typing_customer_at) : NaN;
  const admTs = conv.typing_admin_at ? Date.parse(conv.typing_admin_at) : NaN;

  return {
    ...conv,
    is_customer_typing:
      Boolean(conv.is_customer_typing) ||
      (Number.isFinite(custTs) && nowMs - custTs <= TYPING_TTL_MS),
    is_admin_typing:
      Boolean(conv.is_admin_typing) ||
      (Number.isFinite(admTs) && nowMs - admTs <= TYPING_TTL_MS),
    messages: (conv.messages || []).map(m => ({
      ...m,
      read_status: m.read_status ?? 'sent',
      read_at: m.read_at ?? null,
    })),
  };
}

function readLocalConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as ChatConversation[]).map(enrichConversationClient)
      : [];
  } catch {
    return [];
  }
}

function writeLocalConversations(list: ChatConversation[]): void {
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function broadcastChatEvent(payload: Record<string, unknown>): void {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('attaie_live_chat_channel');
      bc.postMessage(payload);
      bc.close();
    }
  } catch {
    // ignore if BroadcastChannel is unsupported
  }
}

function upsertLocalConversation(conv: ChatConversation, eventType = 'CONVERSATION_UPDATED'): void {
  const enriched = enrichConversationClient(conv);
  const list = readLocalConversations();
  const idx = list.findIndex(c => c.id === enriched.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  }
  list.unshift(enriched);
  writeLocalConversations(list);
  broadcastChatEvent({ type: eventType, conversation: enriched });
}

export function getStoredCustomerSession(): {
  sessionId: string;
  name: string;
  phone: string;
  email: string;
} {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.sessionId === 'string') {
        return {
          sessionId: parsed.sessionId,
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
        };
      }
    }
  } catch {
    // ignore
  }
  const newId = `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return { sessionId: newId, name: '', phone: '', email: '' };
}

export function saveCustomerSession(data: {
  sessionId: string;
  name: string;
  phone: string;
  email: string;
}): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function fetchCustomerThread(
  sessionId: string,
  markRead = false
): Promise<ChatConversation | null> {
  if (!sessionId) return null;

  try {
    const markParam = markRead ? '&mark_read=1' : '';
    const res = await fetch(
      `${resolveChatEndpoint()}?action=thread&session_id=${encodeURIComponent(sessionId)}${markParam}&t=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = (await res.json()) as { conversation?: ChatConversation | null };
      if (data && 'conversation' in data) {
        if (data.conversation) {
          const enriched = enrichConversationClient(data.conversation);
          upsertLocalConversation(enriched, 'THREAD_SYNC');
          return enriched;
        }
        return null;
      }
    }
  } catch {
    // fallback to local store in static preview
  }

  const localList = readLocalConversations();
  const found = localList.find(c => c.id === sessionId) ?? null;
  if (!found) return null;

  if (markRead) {
    const hasUnreadAdmin =
      found.unread_customer > 0 ||
      found.messages.some(m => m.sender === 'admin' && m.read_status !== 'read');
    if (hasUnreadAdmin) {
      const now = new Date().toISOString();
      const updated: ChatConversation = {
        ...found,
        unread_customer: 0,
        messages: found.messages.map(m =>
          m.sender === 'admin' && m.read_status !== 'read'
            ? { ...m, read_status: 'read', read_at: now }
            : m
        ),
      };
      upsertLocalConversation(updated, 'MESSAGES_READ');
      return enrichConversationClient(updated);
    }
  }
  return enrichConversationClient(found);
}

/**
 * Updates the read_status ('sent' -> 'read') for admin messages read by the customer.
 */
export async function markCustomerMessagesRead(
  sessionId: string
): Promise<ChatConversation | null> {
  if (!sessionId) return null;

  try {
    const res = await fetch(`${resolveChatEndpoint()}?action=mark_read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_read',
        session_id: sessionId,
        reader: 'customer',
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { conversation?: ChatConversation | null };
      if (data?.conversation) {
        const enriched = enrichConversationClient(data.conversation);
        upsertLocalConversation(enriched, 'MESSAGES_READ');
        return enriched;
      }
    }
  } catch {
    // fallback to local store in static preview
  }

  return fetchCustomerThread(sessionId, true);
}

/**
 * Sends a real-time typing signal for the customer ('typing...' indicator).
 */
export async function sendCustomerTypingSignal(
  sessionId: string,
  isTyping: boolean,
  customerName?: string
): Promise<void> {
  if (!sessionId) return;

  const nowIso = isTyping ? new Date().toISOString() : null;

  // 1. Update local store & broadcast immediately via BroadcastChannel
  try {
    const list = readLocalConversations();
    const idx = list.findIndex(c => c.id === sessionId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        typing_customer_at: nowIso,
        is_customer_typing: isTyping,
      };
      writeLocalConversations(list);
    }
    broadcastChatEvent({
      type: 'TYPING_STATUS',
      sessionId,
      actor: 'customer',
      isTyping,
      actorName: customerName || 'Customer',
      timestamp: Date.now(),
    });
  } catch {
    // ignore
  }

  // 2. Notify PHP backend for cross-device admin polling
  try {
    await fetch(`${resolveChatEndpoint()}?action=typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'typing',
        session_id: sessionId,
        actor: 'customer',
        is_typing: isTyping,
        actor_name: customerName || 'Customer',
      }),
    });
  } catch {
    // ignore network errors in static preview
  }
}

export async function sendCustomerChatMessage(input: {
  sessionId: string;
  name?: string;
  phone?: string;
  email?: string;
  pageContext?: string;
  message: string;
}): Promise<ChatConversation> {
  const sessionId =
    input.sessionId ||
    `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const visitorLabel =
    input.name?.trim() || `Visitor #${sessionId.slice(-4).toUpperCase()}`;
  const visitorPhone = input.phone?.trim() || '';

  saveCustomerSession({
    sessionId,
    name: visitorLabel,
    phone: visitorPhone,
    email: input.email || '',
  });

  // Also forward the first message of the session to the existing Leads endpoint if contact info exists
  const leadSyncKey = `${LEAD_SYNCED_PREFIX}${sessionId}`;
  if (!localStorage.getItem(leadSyncKey) && input.name?.trim() && input.phone?.trim()) {
    try {
      localStorage.setItem(leadSyncKey, '1');
      void createLead({
        name: visitorLabel,
        email: input.email?.trim() || 'chat@attaieproperties.com',
        phone: visitorPhone,
        message: `[Direct Chat] ${input.message}`,
        propertyName: input.pageContext || 'Website Live Chat',
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`${resolveChatEndpoint()}?action=customer_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'customer_message',
        session_id: sessionId,
        customer_name: visitorLabel,
        customer_phone: visitorPhone,
        customer_email: input.email || '',
        page_context: input.pageContext || '',
        message: input.message,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { conversation?: ChatConversation };
      if (data?.conversation) {
        const enriched = enrichConversationClient(data.conversation);
        upsertLocalConversation(enriched, 'NEW_CUSTOMER_MESSAGE');
        return enriched;
      }
    }
  } catch {
    // fallback to local store in static preview
  }

  const now = new Date().toISOString();
  const list = readLocalConversations();
  const existing = list.find(c => c.id === sessionId);
  const newMsg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: 'customer',
    sender_name: visitorLabel,
    text: input.message,
    read_status: 'sent',
    read_at: null,
    created_at: now,
  };

  if (!existing) {
    const created: ChatConversation = {
      id: sessionId,
      customer_name: visitorLabel,
      customer_phone: visitorPhone,
      customer_email: input.email || '',
      page_context: input.pageContext || '',
      status: 'open',
      unread_admin: 1,
      unread_customer: 0,
      typing_customer_at: null,
      typing_admin_at: null,
      typing_admin_name: null,
      is_customer_typing: false,
      is_admin_typing: false,
      created_at: now,
      updated_at: now,
      messages: [newMsg],
    };
    upsertLocalConversation(created, 'NEW_CUSTOMER_MESSAGE');
    return created;
  }

  const updated: ChatConversation = {
    ...existing,
    customer_name: existing.customer_name || visitorLabel,
    customer_phone: existing.customer_phone || visitorPhone,
    customer_email: input.email || existing.customer_email,
    page_context: input.pageContext || existing.page_context,
    status: 'open',
    unread_admin: (existing.unread_admin || 0) + 1,
    typing_customer_at: null,
    is_customer_typing: false,
    updated_at: now,
    messages: [...existing.messages, newMsg],
  };
  upsertLocalConversation(updated, 'NEW_CUSTOMER_MESSAGE');
  return updated;
}
