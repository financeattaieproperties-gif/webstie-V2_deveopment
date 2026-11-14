import { createLead, InquirySubmissionError, type Lead, type InquirySubmissionResult } from './dbService';

type Unconfirmed = { clientRequestId: string; payload: Lead; attempts: number; status: 'pending' | 'sending' | 'needs_attention' };
export type QueuedInquiry = Unconfirmed & { status: 'pending' };
export type InquiryDelivery = Unconfirmed | { clientRequestId: string; status: 'confirmed'; receipt: InquirySubmissionResult['receipt'] };
const listeners = new Set<() => void>();
let database: Promise<IDBDatabase> | undefined;
let flight: Promise<void> | undefined;
let flushAgain = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryCount = 0;
let channel: BroadcastChannel | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('attaie-website-inquiries', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('deliveries', { keyPath: 'clientRequestId' });
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Inquiry storage is blocked'));
  }).catch(error => { database = undefined; throw error; });
  return database;
}

function notify(remote = false): void {
  listeners.forEach(listener => listener());
  if (!remote) channel?.postMessage('changed');
}

export function subscribeInquiryDeliveries(listener: () => void): () => void {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('attaie-website-inquiries');
    channel.onmessage = () => notify(true);
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Resolve only after IndexedDB commits, including quota failures at commit time. */
async function mutate(id: string, update: (current?: InquiryDelivery) => InquiryDelivery | undefined): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readwrite');
    const store = tx.objectStore('deliveries');
    const request = store.get(id);
    request.onsuccess = () => {
      const next = update(request.result as InquiryDelivery | undefined);
      if (next) store.put(next); else store.delete(id);
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Inquiry storage failed'));
    tx.onerror = () => reject(tx.error || new Error('Inquiry storage failed'));
  });
  notify();
}

export async function listInquiryDeliveries(): Promise<InquiryDelivery[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('deliveries', 'readonly');
    const request = tx.objectStore('deliveries').getAll();
    tx.oncomplete = () => resolve(request.result as InquiryDelivery[]);
    tx.onabort = () => reject(tx.error);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueInquiry(payload: Lead): Promise<QueuedInquiry> {
  const clientRequestId = crypto.randomUUID();
  const item: QueuedInquiry = { clientRequestId, payload: { ...payload, clientRequestId }, attempts: 0, status: 'pending' };
  await mutate(clientRequestId, () => item);
  retryCount = 0;
  void flushInquiries();
  return item;
}

export async function discardPendingInquiry(id: string): Promise<void> {
  await mutate(id, current => current?.status === 'pending' || current?.status === 'needs_attention' ? undefined : current);
}

export async function retryInquiry(id: string): Promise<void> {
  await mutate(id, current => current && current.status !== 'confirmed' && current.status !== 'sending' ? { ...current, status: 'pending' } : current);
  retryCount = 0;
  await flushInquiries();
}

async function drain(): Promise<void> {
  let transient = false;
  for (const item of await listInquiryDeliveries()) {
    if (item.status === 'confirmed' || item.status === 'needs_attention') continue;
    let claimed = false;
    await mutate(item.clientRequestId, current => {
      if (!current || current.status === 'confirmed' || current.status === 'needs_attention') return current;
      claimed = true;
      return { ...current, status: 'sending', attempts: current.attempts + 1 };
    });
    if (!claimed) continue;
    try {
      const result = await createLead(item.payload);
      await mutate(item.clientRequestId, current => current ? { clientRequestId: item.clientRequestId, status: 'confirmed', receipt: result.receipt } : current);
    } catch (error) {
      const permanent = error instanceof InquirySubmissionError && error.status >= 400 && error.status < 500 && ![408,429].includes(error.status);
      transient ||= !permanent;
      await mutate(item.clientRequestId, current => !current || current.status === 'confirmed' ? current : { ...current, status: permanent ? 'needs_attention' : 'pending' });
    }
  }
  if (transient && retryCount < 4) {
    retryTimer = setTimeout(() => { retryTimer = undefined; void flushInquiries(); }, 1000 * 2 ** retryCount++);
  }
}

export function flushInquiries(): Promise<void> {
  if (flight) { flushAgain = true; return flight; }
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = undefined; }
  // Web Locks suppress duplicate sends across tabs. The server UUID constraint remains authoritative.
  flight = (async () => {
    do {
      flushAgain = false;
      await (navigator.locks ? navigator.locks.request('attaie-inquiry-delivery', drain) : drain());
    } while (flushAgain);
  })()
    .catch(() => { /* Keep durable rows intact on storage failure; the next explicit retry/startup can recover. */ })
    .finally(() => { flight = undefined; });
  return flight;
}

export function startInquiryDelivery(): () => void {
  const online = () => { retryCount = 0; void flushInquiries(); };
  window.addEventListener('online', online);
  online();
  return () => { window.removeEventListener('online', online); };
}
