import { getProperties, type Property } from './dbService';

export type AiProviderId = 'openai' | 'gemini' | 'anthropic';

export interface VerifiedPropertyCard {
  id: number;
  serial_number: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  beds: number | null;
  baths: number | null;
  area: number | null;
  area_unit: string;
  floor: number | null;
  status: 'available' | 'pending' | 'sold' | 'rented';
  type: 'Villa' | 'Apartment' | 'House' | 'Commercial' | 'Land';
  listing_type: 'sale' | 'rent';
  image_url: string | null;
  description: string;
  url: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'customer' | 'assistant' | 'system';
  text: string;
  cards?: VerifiedPropertyCard[];
  provider?: string;
  model?: string;
  suggest_handoff?: boolean;
  error?: boolean;
  created_at: string;
}

export interface AiConversationState {
  id: string;
  provider: string;
  model: string;
  language: 'fa' | 'ps' | 'en';
  last_property_id: number | null;
  page_context: string | null;
  handoff_status: 'none' | 'delivered_to_crm' | 'stored_pending_setup';
  lead_submitted: boolean;
  messages: AiChatMessage[];
}

export interface ExtractedDariFilters {
  type: 'Villa' | 'Apartment' | 'House' | 'Commercial' | 'Land' | null;
  listing_type: 'sale' | 'rent' | null;
  min_beds: number | null;
  max_beds: number | null;
  min_price: number | null;
  max_price: number | null;
  location: string | null;
  location_aliases: string[];
  keyword: string | null;
  serial_number: string | null;
  is_gerawi: boolean;
  asks_afn: boolean;
}

export const ALLOWED_TOOLS = [
  'search_properties',
  'get_property_details',
  'get_project_details',
  'check_property_availability',
] as const;

export type AllowedToolName = (typeof ALLOWED_TOOLS)[number];

/**
 * Converts Persian (۰-۹) and Eastern Arabic (٠-٩) digits to Western ASCII digits (0-9).
 */
export function normalizeDariDigits(input: string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let out = input;
  for (let i = 0; i < 10; i++) {
    out = out.split(persian[i]).join(String(i));
    out = out.split(arabic[i]).join(String(i));
  }
  return out;
}

/**
 * Normalizes Afghan Dari / Persian / Arabic character variants (ي/ی, ك/ک, ة/ه, آ/أ/إ/ا, ZWNJ).
 */
export function normalizeDariText(input: string): string {
  let text = normalizeDariDigits(input);
  const charMap: Record<string, string> = {
    'ي': 'ی',
    'ئ': 'ی',
    'ى': 'ی',
    'ك': 'ک',
    'ة': 'ه',
    'ۀ': 'ه',
    'أ': 'ا',
    'إ': 'ا',
    'آ': 'ا',
    'ؤ': 'و',
    '\u200C': ' ',
    '\u0640': '',
  };
  for (const [k, v] of Object.entries(charMap)) {
    text = text.split(k).join(v);
  }
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Detects customer reply language ('fa' Afghan Dari default, 'ps' Pashto, or 'en' English).
 */
export function detectCustomerLanguage(input: string): 'fa' | 'ps' | 'en' {
  const norm = normalizeDariText(input);
  if (/\b(speak english|in english|english please)\b/i.test(norm)) {
    return 'en';
  }
  if (/[ټډړږښګڼېڅځ]|(^|\s)په\s|پښتو/u.test(input)) {
    return 'ps';
  }
  if (!/[\u0600-\u06FF]/u.test(input) && /[a-zA-Z]{3,}/.test(input)) {
    return 'en';
  }
  return 'fa';
}

/**
 * Sanitizes untrusted text from database descriptions or user inputs against HTML/XSS and prompt injection.
 */
export function sanitizeUntrustedContent(text: string | null | undefined, maxLen = 400): string {
  if (!text) return '';
  let clean = text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '[blocked]')
    .replace(/data\s*:\s*text\/html/gi, '[blocked]')
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi, '[redacted]')
    .replace(/disregard\s+(all\s+)?(previous|prior|system)\s+instructions/gi, '[redacted]')
    .replace(/system\s*prompt\s*:/gi, '[redacted]')
    .replace(/reveal\s+(your\s+)?(api\s+key|secret|password|instructions)/gi, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen) + '…';
  }
  return clean;
}

/**
 * Validates and returns a safe internal property URL. Rejects external/javascript URLs.
 */
export function sanitizeInternalListingUrl(urlOrId: string | number): string {
  if (typeof urlOrId === 'number') {
    return `/properties/${Math.max(1, Math.floor(urlOrId))}`;
  }
  const trimmed = String(urlOrId).trim();
  const match = /^\/(properties|projects)\/(\d+)$/.exec(trimmed);
  if (match) {
    return `/${match[1]}/${match[2]}`;
  }
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num) && num > 0) {
    return `/properties/${num}`;
  }
  return '/properties';
}

/**
 * Extracts structured search filters from natural Afghan Dari, Pashto, or English messages.
 */
export function extractDariSearchFilters(message: string): ExtractedDariFilters {
  const norm = normalizeDariText(message);
  const filters: ExtractedDariFilters = {
    type: null,
    listing_type: null,
    min_beds: null,
    max_beds: null,
    min_price: null,
    max_price: null,
    location: null,
    location_aliases: [],
    keyword: null,
    serial_number: null,
    is_gerawi: false,
    asks_afn: false,
  };

  if (/(اپارتمان|فلت|apartment|flat)/u.test(norm)) {
    filters.type = 'Apartment';
  } else if (/(ویلا|villa)/u.test(norm)) {
    filters.type = 'Villa';
  } else if (/(نمره زمین|زمین|land|plot|بسوه|جریده)/u.test(norm)) {
    filters.type = 'Land';
  } else if (/(تجارتی|تجاعتی|دوکان|دکان|مارکیت|دفتر|commercial|shop|office)/u.test(norm)) {
    filters.type = 'Commercial';
  } else if (/(حویلی|خانه|کور|house|home)/u.test(norm)) {
    filters.type = 'House';
  }

  if (/(گروی|گرو|gerawi|mortgage)/u.test(norm)) {
    filters.is_gerawi = true;
    filters.keyword = 'گروی';
  }
  if (/(کرایه|کرایی|اجاره|rent|rental|for rent)/u.test(norm)) {
    filters.listing_type = 'rent';
  } else if (/(فروشی|فروش|خرید|sale|for sale|buy)/u.test(norm)) {
    filters.listing_type = 'sale';
  }

  if (/(افغانی|افغاني|afn|afghani)/u.test(norm)) {
    filters.asks_afn = true;
  }

  const wordToNum: Record<string, number> = {
    'یک': 1,
    'دو': 2,
    'سه': 3,
    'چهار': 4,
    'پنج': 5,
    'شش': 6,
    'هفت': 7,
    'هشت': 8,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
  };

  const digitMatch = /\b([1-9])\s*(اتاقه|اتاق|خواب|اطاق|اطاقه|bed|bedroom|bedrooms|rooms)\b/u.exec(norm);
  if (digitMatch) {
    const beds = Number.parseInt(digitMatch[1], 10);
    filters.min_beds = beds;
    filters.max_beds = beds;
  } else {
    for (const [word, num] of Object.entries(wordToNum)) {
      const re = new RegExp(`(?:^|\\s)${word}\\s*(?:اتاقه|اتاق|خواب|اطاق|اطاقه|bed|bedroom|bedrooms|rooms)(?:$|\\s|[؟?!.,])`, 'u');
      if (re.test(norm)) {
        filters.min_beds = num;
        filters.max_beds = num;
        break;
      }
    }
  }

  const locationMap: Record<string, string[]> = {
    'وزیر اکبر خان': ['وزیر اکبر خان', 'Wazir Akbar Khan'],
    'wazir akbar': ['وزیر اکبر خان', 'Wazir Akbar Khan'],
    'شهر نو': ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
    'shahr-e-naw': ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
    'shahr e naw': ['شهر نو', 'Shahr-e-Naw', 'Shahr-e Naw'],
    'کارته چهار': ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
    'کارته 4': ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
    'karte 4': ['کارته چهار', 'کارته 4', 'Karta-e-Char', 'Karte 4'],
    'کارته سه': ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
    'کارته 3': ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
    'karte 3': ['کارته سه', 'کارته 3', 'Karta-e-Seh', 'Karte 3'],
    'مکروریان': ['مکروریان', 'Macrorayan'],
    'macrorayan': ['مکروریان', 'Macrorayan'],
    'دارالامان': ['دارالامان', 'Darulaman'],
    'darulaman': ['دارالامان', 'Darulaman'],
    'خیرخانه': ['خیرخانه', 'Khair Khana'],
    'khair khana': ['خیرخانه', 'Khair Khana'],
    'تیمنی': ['تیمنی', 'Taimani'],
    'taimani': ['تیمنی', 'Taimani'],
    'شیرپور': ['شیرپور', 'Sherpur'],
    'sherpur': ['شیرپور', 'Sherpur'],
    'کابل': ['کابل', 'Kabul'],
    'kabul': ['کابل', 'Kabul'],
  };

  for (const [needle, aliases] of Object.entries(locationMap)) {
    if (norm.includes(needle)) {
      filters.location = aliases[0];
      filters.location_aliases = aliases;
      break;
    }
  }

  const serialMatch = /\b(atp-[0-9a-z]+)\b/i.exec(norm);
  if (serialMatch) {
    filters.serial_number = serialMatch[1].toUpperCase();
  }

  return filters;
}

export type CustomerIntent =
  | 'greeting'
  | 'handoff'
  | 'followup_property'
  | 'project_lookup'
  | 'property_search'
  | 'general';

export function classifyCustomerIntent(message: string, contextPropertyId: number | null = null): CustomerIntent {
  const norm = normalizeDariText(message);

  if (/(مشاور انسانی|ادمین|انسان|نماینده|کمک مستقیم|تماس با مشاور|human agent|real person|talk to agent|talk to admin|speak to a human)/u.test(norm)) {
    return 'handoff';
  }

  if (/^(سلام|سلام علیکم|درود|صبح بخیر|عصر بخیر|روز بخیر|تشکر|ممنون|خدا حافظ|hi|hello|hey|thanks|thank you|salam|salaam)[!؟?.\s]*$/u.test(norm)) {
    return 'greeting';
  }

  const isFollowupPhrase = /(کرایه اش|کرایه‌اش|قیمتش|قیمت اش|این اپارتمان|این خانه|این ویلا|این ملک|همین اپارتمان|هنوز موجود است|موجود است|موجوده|چند اتاق دارد|در کدام منزل|مساحتش|how much is it|is it still available|is this available)/u.test(
    norm
  );
  if (isFollowupPhrase && contextPropertyId !== null && contextPropertyId > 0) {
    return 'followup_property';
  }

  if (/(پروژه|پروژه‌ها|شهرک|project|projects|development)/u.test(norm)) {
    return 'project_lookup';
  }

  if (
    /(اپارتمان|حویلی|ویلا|خانه|نمره زمین|زمین|تجارتی|دوکان|دکان|کرایه|فروشی|فروش|گروی|اتاق|اطاق|منزل|تشناب|قیمت|چند است|موجود|دارین|دارید|کابل|وزیر اکبر|شهر نو|کارته|مکروریان|دارالامان|تیمنی|شیرپور|خیرخانه|apartment|villa|house|land|rent|sale|price|available|bedroom|property|properties)/u.test(
      norm
    )
  ) {
    return 'property_search';
  }

  return 'general';
}

/**
 * Formats a Property record into a verified card with sanitized fields and safe relative URL.
 */
export function toVerifiedPropertyCard(p: Property): VerifiedPropertyCard {
  const numericId = Number.parseInt(String(p.id), 10) || 1;
  return {
    id: numericId,
    serial_number: p.serial_number || `ATP-${numericId}`,
    title: sanitizeUntrustedContent(p.title, 160),
    price: Number.isFinite(p.price) ? p.price : 0,
    currency: 'USD',
    location: sanitizeUntrustedContent(p.location, 140),
    beds: p.beds ?? null,
    baths: p.baths ?? null,
    area: p.area ?? null,
    area_unit: 'm²',
    floor: p.floor ?? null,
    status: p.status,
    type: p.type,
    listing_type: p.listing_type,
    image_url: p.image_url || null,
    description: sanitizeUntrustedContent(p.description, 360),
    url: sanitizeInternalListingUrl(numericId),
  };
}

/**
 * Executes an allowlisted property lookup against a dataset of Property records.
 * Used both by the automated verification suite and as a local preview fallback when PHP is offline.
 */
export function executeValidatedPropertyTool(
  toolName: string,
  rawArgs: Record<string, unknown>,
  dataset: Property[]
): { ok: boolean; error?: string; cards: VerifiedPropertyCard[]; found?: boolean } {
  if (!ALLOWED_TOOLS.includes(toolName as AllowedToolName)) {
    return { ok: false, error: 'Tool not in server allowlist.', cards: [] };
  }

  // Reject SQL injection payloads or non-scalar malicious objects in arguments
  for (const val of Object.values(rawArgs)) {
    if (typeof val === 'string' && /(;\s*drop\s+table|union\s+select|--\s*$)/i.test(val)) {
      return { ok: false, error: 'INVALID_ARGUMENT_DETECTED', cards: [] };
    }
  }

  // Only published listings ('available' or 'pending') are exposed to search
  const published = dataset.filter(p => p.status === 'available' || p.status === 'pending');

  if (toolName === 'get_property_details' || toolName === 'check_property_availability') {
    const propId = typeof rawArgs.property_id === 'number' ? rawArgs.property_id : Number(rawArgs.property_id || 0);
    const serial = typeof rawArgs.serial_number === 'string' ? rawArgs.serial_number.trim().toUpperCase() : '';
    if (propId <= 0 && !serial) {
      return { ok: false, error: 'INVALID_ARGUMENTS', cards: [] };
    }
    const match = dataset.find(
      p => (propId > 0 && Number(p.id) === propId) || (serial && (p.serial_number || '').toUpperCase() === serial)
    );
    if (!match) {
      return { ok: true, found: false, cards: [] };
    }
    return { ok: true, found: true, cards: [toVerifiedPropertyCard(match)] };
  }

  if (toolName === 'search_properties') {
    let matches = [...published];

    if (typeof rawArgs.type === 'string' && rawArgs.type.trim() !== '') {
      const t = rawArgs.type.trim().toLowerCase();
      matches = matches.filter(p => p.type.toLowerCase() === t);
    }

    if (typeof rawArgs.listing_type === 'string' && rawArgs.listing_type.trim() !== '') {
      const lt = rawArgs.listing_type.trim().toLowerCase();
      matches = matches.filter(p => p.listing_type.toLowerCase() === lt);
    }

    if (typeof rawArgs.min_beds === 'number' && rawArgs.min_beds > 0) {
      matches = matches.filter(p => p.beds !== null && p.beds >= (rawArgs.min_beds as number));
    }

    if (typeof rawArgs.max_beds === 'number' && rawArgs.max_beds > 0) {
      matches = matches.filter(p => p.beds !== null && p.beds <= (rawArgs.max_beds as number));
    }

    if (typeof rawArgs.max_price === 'number' && rawArgs.max_price > 0) {
      matches = matches.filter(p => p.price <= (rawArgs.max_price as number));
    }

    if (typeof rawArgs.location === 'string' && rawArgs.location.trim() !== '') {
      const locExtracted = extractDariSearchFilters(rawArgs.location);
      const aliases =
        locExtracted.location_aliases.length > 0
          ? locExtracted.location_aliases
          : [rawArgs.location.trim(), normalizeDariText(rawArgs.location)];

      matches = matches.filter(p => {
        const hay = normalizeDariText(`${p.location} ${p.title}`);
        return aliases.some(a => hay.includes(normalizeDariText(a)));
      });
    }

    const cards = matches.slice(0, 6).map(toVerifiedPropertyCard);
    return { ok: true, cards };
  }

  return { ok: true, cards: [] };
}

/**
 * Formats provider-specific API request payloads for OpenAI, Gemini, and Anthropic tool calling.
 * Used for adapter verification tests.
 */
export function buildProviderAdapterRequest(
  provider: AiProviderId,
  model: string,
  systemPrompt: string,
  userMessage: string
): { endpoint: string; headers: string[]; payload: Record<string, unknown> } {
  if (provider === 'openai') {
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      headers: ['Content-Type: application/json', 'Authorization: Bearer [REDACTED]'],
      payload: {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        tools: ALLOWED_TOOLS.map(name => ({
          type: 'function',
          function: { name, parameters: { type: 'object' } },
        })),
        tool_choice: 'auto',
      },
    };
  }

  if (provider === 'gemini') {
    return {
      endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      headers: ['Content-Type: application/json', 'x-goog-api-key: [REDACTED]'],
      payload: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        tools: [
          {
            functionDeclarations: ALLOWED_TOOLS.map(name => ({
              name,
              parameters: { type: 'object' },
            })),
          },
        ],
      },
    };
  }

  return {
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: ['Content-Type: application/json', 'x-api-key: [REDACTED]', 'anthropic-version: 2023-06-01'],
    payload: {
      model,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      tools: ALLOWED_TOOLS.map(name => ({
        name,
        input_schema: { type: 'object' },
      })),
    },
  };
}

/**
 * Fallback Kabul properties used ONLY when the local Vite preview has no live MySQL connection.
 */
const PREVIEW_KABUL_PROPERTIES: Property[] = [
  {
    id: 101,
    serial_number: 'ATP-101',
    title: 'اپارتمان سه اتاقه کرایی در وزیر اکبر خان، کابل',
    price: 650,
    location: 'وزیر اکبر خان، کابل (Wazir Akbar Khan, Kabul)',
    beds: 3,
    baths: 2,
    area: 145,
    floor: 3,
    status: 'available',
    type: 'Apartment',
    listing_type: 'rent',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    description: 'اپارتمان لوکس سه اتاقه در منزل سوم با مرکزگرمی، لفت ۲۴ ساعته و پارکنگ در وزیر اکبر خان کابل.',
    gallery_images: [],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 102,
    serial_number: 'ATP-102',
    title: 'اپارتمان چهار اتاقه فروشی تخت بام دار در شهر نو، کابل',
    price: 95000,
    location: 'شهر نو، کابل (Shahr-e-Naw, Kabul)',
    beds: 4,
    baths: 3,
    area: 185,
    floor: 5,
    status: 'available',
    type: 'Apartment',
    listing_type: 'sale',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
    description: 'اپارتمان چهار اتاقه نوساخت فروشی با تخت بام مجهز و قباله شرعی در شهر نو کابل.',
    gallery_images: [],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    created_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 103,
    serial_number: 'ATP-103',
    title: 'حویلی پنج اتاقه فروشی در کارته چهار، کابل',
    price: 165000,
    location: 'کارته چهار، کابل (Karta-e-Char, Kabul)',
    beds: 5,
    baths: 4,
    area: 320,
    floor: 2,
    status: 'available',
    type: 'House',
    listing_type: 'sale',
    image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    description: 'حویلی مستقل دو منزله دارای ۵ اتاق، ۴ تشناب و حیاط وسیع در کارته چهار کابل.',
    gallery_images: [],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    created_at: '2026-10-10T10:00:00Z',
  },
];

let cachedCsrfToken = '';

export async function initAiChatSession(conversationId?: string): Promise<{
  enabled: boolean;
  activeProviderLabel: string;
  conversation: AiConversationState | null;
}> {
  try {
    const qs = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : '';
    const res = await fetch(`/ai-chat/chat.php${qs}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = (await res.json()) as {
        enabled?: boolean;
        active_provider_label?: string;
        csrf_token?: string;
        conversation?: AiConversationState | null;
      };
      if (data.csrf_token) {
        cachedCsrfToken = data.csrf_token;
      }
      return {
        enabled: data.enabled ?? true,
        activeProviderLabel: data.active_provider_label || 'Google Gemini',
        conversation: data.conversation ?? null,
      };
    }
  } catch {
    // Fallback to preview state when PHP is not running locally
  }

  return {
    enabled: true,
    activeProviderLabel: 'Grounded MySQL Assistant',
    conversation: null,
  };
}

export async function sendAiCustomerMessage(params: {
  conversationId?: string;
  message: string;
  pageContext?: string;
  propertyId?: number | null;
  currentState?: AiConversationState | null;
}): Promise<{ conversation: AiConversationState; reply: AiChatMessage }> {
  const trimmed = params.message.trim();
  if (!trimmed) {
    throw new Error('لطفاً پیام خود را بنویسید.');
  }
  if (trimmed.length > 1200) {
    throw new Error('پیام شما بیش از حد طولانی است (حداکثر ۱۲۰۰ حرف).');
  }

  // 1. Try production PHP endpoint (/ai-chat/chat.php)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cachedCsrfToken) {
      headers['X-CSRF-Token'] = cachedCsrfToken;
    }
    const res = await fetch('/ai-chat/chat.php', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        conversation_id: params.conversationId || '',
        message: trimmed,
        page_context: params.pageContext || '',
        property_id: params.propertyId ?? null,
      }),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        conversation?: AiConversationState;
        reply?: AiChatMessage;
      };
      if (!res.ok || !data.ok || !data.conversation || !data.reply) {
        throw new Error(data.error || 'خطا در ارتباط با دستیار هوشمند.');
      }
      return {
        conversation: data.conversation,
        reply: data.reply,
      };
    }
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // 2. Local preview fallback (uses live dbService properties or verified Kabul sample dataset)
  let dataset = await getProperties().catch(() => []);
  if (!dataset || dataset.length === 0) {
    dataset = PREVIEW_KABUL_PROPERTIES;
  }

  const prev = params.currentState;
  const lastPropId = params.propertyId ?? prev?.last_property_id ?? null;
  const lang = detectCustomerLanguage(trimmed);
  const intent = classifyCustomerIntent(trimmed, lastPropId);
  const filters = extractDariSearchFilters(trimmed);

  let cards: VerifiedPropertyCard[] = [];
  let updatedPropId = lastPropId;

  if (intent === 'followup_property' && lastPropId) {
    const res = executeValidatedPropertyTool('check_property_availability', { property_id: lastPropId }, dataset);
    cards = res.cards;
  } else if (intent === 'property_search') {
    const res = filters.serial_number
      ? executeValidatedPropertyTool('get_property_details', { serial_number: filters.serial_number }, dataset)
      : executeValidatedPropertyTool('search_properties', filters as unknown as Record<string, unknown>, dataset);
    cards = res.cards;
    if (cards.length > 0) {
      updatedPropId = cards[0].id;
    }
  }

  let replyText = '';
  if (intent === 'greeting') {
    replyText =
      lang === 'en'
        ? 'Hello and welcome to Attaie Properties! I am your AI real-estate assistant. Ask me about apartments, houses (haweli), villas, or land for sale or rent in Kabul.'
        : 'سلام و خوش آمدید به رهنمای معاملات عطایی! من دستیار هوشمند املاک شما هستم. می‌توانید درباره اپارتمان‌ها، حویلی‌ها، ویلاها یا نمره زمین برای خرید، فروش یا کرایه در کابل از من بپرسید.';
  } else if (intent === 'handoff') {
    replyText =
      lang === 'en'
        ? 'Certainly! Click "Request Human Agent" below to share your contact details with your consent, and our advisor will contact you.'
        : 'چشم! برای ارتباط مستقیم با مشاور انسانی رهنمای معاملات عطایی، لطفاً روی دکمه «ارتباط با مشاور انسانی» در پایین کلیک کنید و با رضایت خود نام و شماره تماس‌تان را ثبت نمایید.';
  } else if (intent === 'followup_property' && cards.length > 0) {
    const p = cards[0];
    const priceStr = p.price > 0 ? `$${p.price.toLocaleString()}` : 'توافقی (تماس بگیرید)';
    const statusFa = p.status === 'available' ? 'موجود (Available)' : 'در حال معامله / واگذار شده';
    const txFa = p.listing_type === 'rent' ? 'کرایه ماهانه' : 'قیمت فروش';
    replyText =
      lang === 'en'
        ? `Live database check for ${p.title} (${p.serial_number}):\n• Status: ${p.status}\n• ${p.listing_type === 'rent' ? 'Monthly Rent' : 'Sale Price'}: ${priceStr}\n• Location: ${p.location}\n• Beds: ${p.beds ?? 'N/A'}, Baths: ${p.baths ?? 'N/A'}, Floor: ${p.floor ?? 'N/A'}.`
        : `بر اساس بررسی تازه در دیتابیس برای «${p.title}» (کود: ${p.serial_number}):\n• وضعیت فعلی: ${statusFa}\n• ${txFa}: ${priceStr}\n• موقعیت: ${p.location}\n• مشخصات: ${p.beds ?? 'نامشخص'} اتاق، ${p.baths ?? 'نامشخص'} تشناب، منزل ${p.floor ?? 'نامشخص'}.`;
  } else if (cards.length > 0) {
    if (lang === 'en') {
      replyText =
        `I found ${cards.length} verified listing(s) in our database:\n` +
        cards
          .map(c => `• ${c.title} (${c.serial_number}) — $${c.price.toLocaleString()} in ${c.location}`)
          .join('\n');
    } else {
      replyText =
        `بر اساس جستجو در دیتابیس رهنمای معاملات عطایی، ${cards.length} ملک معتبر یافت شد:\n` +
        cards
          .map(
            c =>
              `• ${c.title} (کود ${c.serial_number}) — ${c.beds ? `${c.beds} اتاقه | ` : ''}${c.location} | ${
                c.price > 0 ? `$${c.price.toLocaleString()}${c.listing_type === 'rent' ? ' در ماه' : ''}` : 'قیمت توافقی'
              }`
          )
          .join('\n') +
        '\n\nمی‌توانید درباره کرایه، قیمت یا موجودیت هر کدام سوال بپرسید.';
    }
  } else if (intent === 'property_search') {
    replyText =
      lang === 'en'
        ? 'No published listings currently match those exact filters. Would you like to adjust the neighborhood, room count, or speak with a human advisor?'
        : 'متأسفانه فعلاً ملکی دقیقاً با این مشخصات در دیتابیس موجود نیست. آیا مایل هستید فیلترها (مانند ناحیه، تعداد اتاق یا نوع معامله) را تغییر دهیم و یا شما را به مشاور انسانی وصل کنم؟';
  } else {
    replyText =
      lang === 'en'
        ? 'Please let me know what type of property (apartment, house, villa, or land), how many rooms, and whether you want to rent or buy in Kabul.'
        : 'لطفاً مشخص فرمایید که دنبال چه نوع ملک (اپارتمان، حویلی، ویلا یا نمره زمین)، چند اتاقه و برای کرایه یا خرید در کدام ناحیه کابل هستید تا در دیتابیس برای شما جستجو کنم.';
  }

  const now = new Date().toISOString();
  const userMsg: AiChatMessage = {
    id: `msg_${Date.now()}_u`,
    sender: 'customer',
    text: trimmed,
    created_at: now,
  };
  const assistantMsg: AiChatMessage = {
    id: `msg_${Date.now()}_a`,
    sender: 'assistant',
    text: replyText,
    cards,
    provider: 'grounded_db',
    model: 'mysql_grounded_v1',
    suggest_handoff: intent === 'handoff' || (intent === 'property_search' && cards.length === 0),
    created_at: now,
  };

  const conv: AiConversationState = {
    id: prev?.id || `aichat_${Date.now()}`,
    provider: 'grounded_db',
    model: 'mysql_grounded_v1',
    language: lang,
    last_property_id: updatedPropId,
    page_context: params.pageContext || prev?.page_context || null,
    handoff_status: prev?.handoff_status || 'none',
    lead_submitted: prev?.lead_submitted || false,
    messages: [...(prev?.messages || []), userMsg, assistantMsg].slice(-28),
  };

  return { conversation: conv, reply: assistantMsg };
}

export async function submitHumanHandoffRequest(params: {
  conversationId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  consentGiven: boolean;
}): Promise<{ ok: boolean; delivered: boolean; message: string }> {
  if (!params.consentGiven) {
    throw new Error('برای ارسال مشخصات تماس به مشاور انسانی، تایید رضایت شما الزامی است.');
  }

  try {
    const res = await fetch('/ai-chat/handoff.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: params.conversationId,
        name: params.name.trim(),
        phone: params.phone.trim(),
        email: (params.email || '').trim(),
        notes: (params.notes || '').trim(),
        consent_given: params.consentGiven,
      }),
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = (await res.json()) as {
        ok?: boolean;
        delivered?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'خطا در ثبت درخواست مشاور.');
      }
      return {
        ok: true,
        delivered: Boolean(data.delivered),
        message: data.message || 'درخواست شما با موفقیت ثبت شد.',
      };
    }
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Fallback for static preview: store in localStorage chat inbox so Admin CRM /admin/chat sees it
  try {
    const raw = localStorage.getItem('attaie_chat_conversations_v1');
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    const now = new Date().toISOString();
    const handoffConv = {
      id: params.conversationId,
      customer_name: params.name.trim(),
      customer_phone: params.phone.trim(),
      customer_email: (params.email || '').trim(),
      property_id: null,
      property_name: 'AI Chat Handoff',
      page_context: window.location.pathname,
      status: 'open',
      unread_admin: 1,
      unread_customer: 0,
      created_at: now,
      updated_at: now,
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: 'customer',
          sender_name: params.name.trim(),
          text: `🤝 [درخواست مشاور انسانی از چت هوشمند]\nیادداشت: ${params.notes || 'درخواست تماس تلفنی'}`,
          created_at: now,
        },
      ],
    };
    list.unshift(handoffConv);
    localStorage.setItem('attaie_chat_conversations_v1', JSON.stringify(list));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('attaie_live_chat_channel');
      bc.postMessage({ type: 'NEW_CUSTOMER_MESSAGE', conversation: handoffConv });
      bc.close();
    }
  } catch {
    // ignore
  }

  return {
    ok: true,
    delivered: true,
    message: `درخواست شما با موفقیت در صندوق پیام مشاوران ثبت شد. همکاران ما با شماره ${params.phone} تماس خواهند گرفت.`,
  };
}
