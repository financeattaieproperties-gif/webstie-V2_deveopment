export interface AddKeywordsResult {
  next: string[];
  added: string[];
  duplicates: string[];
}

/**
 * Normalizes whitespace inside a single keyword phrase.
 */
export function normalizeKeyword(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Parses a comma- or newline-delimited SEO keyword string into a clean,
 * case-insensitively deduplicated array while preserving original casing & order.
 */
export function parseSeoKeywords(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== 'string') return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of raw.split(/[,\n]+/)) {
    const clean = normalizeKeyword(part);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }

  return result;
}

/**
 * Serializes a keyword list into a standard comma-separated meta keywords string.
 */
export function serializeSeoKeywords(keywords: ReadonlyArray<string>): string {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const kw of keywords) {
    const clean = normalizeKeyword(kw);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(clean);
  }

  return cleaned.join(', ');
}

/**
 * Adds one or more (comma/newline separated) keywords to an existing list
 * without introducing case-insensitive duplicates.
 */
export function addSeoKeyword(
  existing: ReadonlyArray<string>,
  rawInput: string,
): AddKeywordsResult {
  const base = parseSeoKeywords(existing.join(', '));
  const seen = new Set(base.map(k => k.toLowerCase()));
  const next = [...base];
  const added: string[] = [];
  const duplicates: string[] = [];

  for (const part of rawInput.split(/[,\n]+/)) {
    const clean = normalizeKeyword(part);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) {
      duplicates.push(clean);
      continue;
    }
    seen.add(key);
    next.push(clean);
    added.push(clean);
  }

  return { next, added, duplicates };
}

/**
 * Removes a target keyword (matched case-insensitively after trimming) from the list.
 */
export function removeSeoKeyword(
  existing: ReadonlyArray<string>,
  targetKeyword: string,
): string[] {
  const targetKey = normalizeKeyword(targetKeyword).toLowerCase();
  if (!targetKey) return [...existing];
  return existing.filter(kw => normalizeKeyword(kw).toLowerCase() !== targetKey);
}

/**
 * Filters keywords by a search query (case-insensitive substring match).
 */
export function filterSeoKeywords(
  keywords: ReadonlyArray<string>,
  query: string,
): string[] {
  const q = normalizeKeyword(query).toLowerCase();
  if (!q) return [...keywords];
  return keywords.filter(kw => kw.toLowerCase().includes(q));
}

export interface SeoKeywordRecord {
  id: number;
  keyword: string;
  enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Toggles a keyword record's enabled state by ID (or explicit boolean).
 */
export function toggleSeoKeywordRecord<T extends SeoKeywordRecord>(
  items: ReadonlyArray<T>,
  id: number,
  enabled?: boolean,
): T[] {
  return items.map(item =>
    item.id === id
      ? { ...item, enabled: enabled !== undefined ? enabled : !item.enabled }
      : item,
  );
}

/**
 * Returns the comma-separated meta keywords string containing ONLY enabled keywords.
 */
export function getActiveSeoKeywordsString(
  items: ReadonlyArray<Pick<SeoKeywordRecord, 'keyword' | 'enabled'>>,
): string {
  return serializeSeoKeywords(
    items.filter(item => item.enabled).map(item => item.keyword),
  );
}

/**
 * Counts how many keywords are currently toggled ON for site-wide meta headers.
 */
export function countActiveSeoKeywords(
  items: ReadonlyArray<Pick<SeoKeywordRecord, 'enabled'>>,
): number {
  return items.reduce((count, item) => count + (item.enabled ? 1 : 0), 0);
}

/**
 * Filters structured keyword records by keyword substring.
 */
export function filterSeoKeywordRecords<T extends Pick<SeoKeywordRecord, 'keyword'>>(
  items: ReadonlyArray<T>,
  query: string,
): T[] {
  const q = normalizeKeyword(query).toLowerCase();
  if (!q) return [...items];
  return items.filter(item => item.keyword.toLowerCase().includes(q));
}

