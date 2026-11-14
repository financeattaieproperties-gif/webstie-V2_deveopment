export interface ChatMessage {
  id: string;
  client_message_id?: string;
  delivery_status?: 'pending' | 'confirmed' | 'needs_attention';
  sender: 'customer' | 'admin' | 'system';
  sender_name?: string;
  text: string;
  read_status?: 'sent' | 'read';
  read_at?: string | null;
  created_at: string;
}
export interface ChatConversation {
  id: string;
  version?: number;
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
const SESSION_KEY = 'attaie_customer_chat_session_v1';
const CACHE_KEY = 'attaie_customer_chat_cache_v2';
const flights = new Map<string, Promise<void>>();
const tokens = new Map<string, string>();
let cacheFlight: Promise<unknown> = Promise.resolve();
function endpoint(): string { return `${((import.meta.env?.VITE_API_URL as string | undefined) || '').replace(/\/api\/?$/, '')}/chat-service.php`; }
function readCache(): ChatConversation[] {
  try { const rows = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); return Array.isArray(rows) ? rows : []; }
  catch { return []; }
}
function store(conv: ChatConversation): void {
  // Persistence failures propagate to the composer; never claim an unsaved message is queued.
  localStorage.setItem(CACHE_KEY, JSON.stringify([conv, ...readCache().filter(row => row.id !== conv.id)]));
}
async function updateCache(id: string, update: (current?: ChatConversation) => ChatConversation | undefined): Promise<ChatConversation | undefined> {
  const mutate = () => {
    const next = update(readCache().find(conv => conv.id === id));
    if (next) store(next);
    return next;
  };
  if (navigator.locks) return navigator.locks.request('attaie-customer-chat-cache', mutate);
  const next = cacheFlight.then(mutate, mutate);
  cacheFlight = next.catch(() => undefined);
  return next;
}
function tokenFor(sessionId: string): string {
  if (tokens.has(sessionId)) return tokens.get(sessionId)!;
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  if (session.sessionId !== sessionId || !/^[a-f0-9]{64}$/.test(session.ownerToken || '')) throw new Error('Chat session unavailable');
  tokens.set(sessionId, session.ownerToken);
  return session.ownerToken;
}
export function getStoredCustomerSession(): {sessionId:string;name:string;phone:string;email:string} {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (typeof session.sessionId === 'string' && /^[a-f0-9]{64}$/.test(session.ownerToken || '')) {
      tokens.set(session.sessionId,session.ownerToken);
      return {sessionId:session.sessionId,name:session.name || '',phone:session.phone || '',email:session.email || ''};
    }
  } catch { /* The composer will show persistence errors if storage remains unavailable. */ }
  // Old ID-only threads stay in the private Admin history; they cannot be claimed by guessing their ID.
  const session = {sessionId:`chat_${crypto.randomUUID()}`,name:'',phone:'',email:''};
  tokens.set(session.sessionId, crypto.randomUUID().replaceAll('-','') + crypto.randomUUID().replaceAll('-',''));
  try { saveCustomerSession(session); } catch { /* Keep an in-memory identity until the user can save. */ }
  return session;
}
export function saveCustomerSession(session: {sessionId:string;name:string;phone:string;email:string}): void {
  localStorage.setItem(SESSION_KEY,JSON.stringify({...session,ownerToken:tokenFor(session.sessionId)}));
}
function mergeRemote(remote: ChatConversation, local?: ChatConversation): ChatConversation {
  if (local && (remote.version ?? 0) < (local.version ?? 0)) return local;
  const ids = new Set(remote.messages.map(message => message.client_message_id));
  const pending = (local?.messages || []).filter(message => message.delivery_status !== 'confirmed' && !ids.has(message.client_message_id));
  return {...remote,messages:[...remote.messages.map(message => ({...message,delivery_status:'confirmed' as const})),...pending]};
}
async function request(action: string, sessionId: string, body?: Record<string,unknown>): Promise<ChatConversation | null> {
  const response = await fetch(`${endpoint()}?action=${action}${body ? '' : `&session_id=${encodeURIComponent(sessionId)}`}`, {
    method: body ? 'POST' : 'GET', credentials:'include', cache:'no-store',
    headers:{'Content-Type':'application/json','X-Chat-Token':tokenFor(sessionId)},
    ...(body ? {body:JSON.stringify({...body,session_id:sessionId})} : {}),
  });
  if (!response.ok) throw Object.assign(new Error('Chat delivery unavailable'),{status:response.status});
  const data = await response.json() as {conversation:ChatConversation|null};
  if (!('conversation' in data)) throw new Error('Invalid chat confirmation');
  return data.conversation;
}
export function flushCustomerChatMessages(sessionId: string): Promise<void> {
  const current = flights.get(sessionId); if (current) return current;
  const flight = (async () => {
    const local = readCache().find(conv => conv.id === sessionId);
    for (const message of local?.messages || []) {
      if (message.sender !== 'customer' || message.delivery_status !== 'pending') continue;
      try {
        const remote = await request('customer_message',sessionId,{customer_name:local!.customer_name,customer_phone:local!.customer_phone,customer_email:local!.customer_email || '',page_context:local!.page_context || '',message:message.text,client_message_id:message.client_message_id});
        if (!remote) throw new Error('No chat confirmation');
        await updateCache(sessionId,current=>mergeRemote(remote,current));
      } catch (error) {
        const status = (error as {status?:number})?.status;
        if (status && status >= 400 && status < 500 && ![408,429].includes(status)) {
          await updateCache(sessionId,latest=>latest ? {...latest,messages:latest.messages.map(item=>item.client_message_id===message.client_message_id && item.delivery_status!=='confirmed' ? {...item,delivery_status:'needs_attention'} : item)} : latest);
        }
        break;
      }
    }
  })().finally(()=>flights.delete(sessionId));
  flights.set(sessionId,flight);return flight;
}
export async function fetchCustomerThread(sessionId: string, markRead=false): Promise<ChatConversation|null> {
  await flushCustomerChatMessages(sessionId);
  const local=readCache().find(conv=>conv.id===sessionId);
  try {
    const remote=await request('thread',sessionId);
    if (remote) { const merged=(await updateCache(sessionId,current=>mergeRemote(remote,current)))!;return markRead ? await markCustomerMessagesRead(sessionId) || merged : merged; }
  } catch { /* Cached records retain explicit pending/confirmed delivery states. */ }
  return readCache().find(conv=>conv.id===sessionId) || local || null;
}
/** Updates read receipts only after the server confirms the mutation. */
export async function markCustomerMessagesRead(sessionId:string): Promise<ChatConversation|null> {
  try { const remote=await request('customer_mark_read',sessionId,{});if(remote) return (await updateCache(sessionId,current=>mergeRemote(remote,current)))!; }
  catch { /* Read status stays unchanged during transport failure. */ }
  return null;
}
/** Sends a typing signal; it never implies delivery of a message. */
export async function sendCustomerTypingSignal(sessionId:string,isTyping:boolean,customerName?:string): Promise<void> {
  try { await request('typing',sessionId,{actor:'customer',is_typing:isTyping,actor_name:customerName || 'Customer'}); }
  catch { /* A missed typing signal expires naturally; no local receipt is fabricated. */ }
}
export async function retryCustomerChatMessages(sessionId:string): Promise<void> {
  await updateCache(sessionId,local=>local ? {...local,messages:local.messages.map(message=>message.delivery_status==='needs_attention'?{...message,delivery_status:'pending'}:message)} : local);
  await flushCustomerChatMessages(sessionId);
}
export async function sendCustomerChatMessage(input:{sessionId:string;name?:string;phone?:string;email?:string;pageContext?:string;message:string}): Promise<ChatConversation> {
  const sessionId=input.sessionId;
  const now=new Date().toISOString(), clientId=crypto.randomUUID();
  const session=getStoredCustomerSession();
  saveCustomerSession({...session,sessionId,name:input.name || session.name,phone:input.phone || session.phone,email:input.email || session.email});
  await updateCache(sessionId,existing=>({
    id:sessionId,customer_name:input.name || existing?.customer_name || `Visitor #${sessionId.slice(-4).toUpperCase()}`,
    customer_phone:input.phone || existing?.customer_phone || '',customer_email:input.email || existing?.customer_email || '',page_context:input.pageContext || existing?.page_context || '',
    status:'open',unread_admin:existing?.unread_admin || 0,unread_customer:existing?.unread_customer || 0,
    created_at:existing?.created_at || now,updated_at:now,
    ...existing,
    messages:[...(existing?.messages || []),{id:clientId,client_message_id:clientId,sender:'customer',text:input.message,created_at:now,delivery_status:'pending'}],
  }));
  await flushCustomerChatMessages(sessionId);
  return readCache().find(item=>item.id===sessionId)!;
}
