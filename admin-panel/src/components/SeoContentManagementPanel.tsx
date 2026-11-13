import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  countActiveSeoKeywords,
  filterSeoKeywordRecords,
  getActiveSeoKeywordsString,
  normalizeKeyword,
  parseSeoKeywords,
  serializeSeoKeywords,
  type SeoKeywordRecord,
} from '../lib/seoKeywords';

export interface SeoContentManagementPanelProps {
  /** Structured keyword records fetched from /api/admin/seo-keywords.php */
  items: SeoKeywordRecord[];
  /** Called when a user toggles an individual keyword on or off */
  onToggleKeyword: (id: number, enabled: boolean) => void | Promise<void>;
  /** Called when a user toggles all keywords on or off */
  onToggleAll: (enabled: boolean) => void | Promise<void>;
  /** Called when adding one or more comma-separated keywords */
  onAddKeyword: (keyword: string) => void | Promise<void>;
  /** Called when deleting a keyword by ID */
  onDeleteKeyword: (id: number, keyword: string) => void | Promise<void>;
  /** Called when restoring the default global keywords list */
  onRestoreDefaults: () => void | Promise<void>;
  /** Default keywords string used to detect deviations from default set */
  defaultKeywordsValue: string;
  /** Indicates the keyword list is currently loading */
  loading?: boolean;
  /** Indicates a global metadata save is currently in flight */
  syncing?: boolean;
  /** Inline feedback message from parent if global sync failed */
  syncError?: string;
}

const S = {
  card: {
    background: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  } as const,
  section: { padding: '1.35rem 1.5rem' } as const,
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1.15rem',
  } as const,
  title: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 0.25rem 0',
  } as const,
  sub: {
    fontSize: '0.82rem',
    color: '#64748B',
    margin: 0,
    lineHeight: 1.45,
  } as const,
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  } as const,
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.28rem 0.7rem',
    borderRadius: 6,
    fontSize: '0.74rem',
    fontWeight: 600,
    background: '#F1F5F9',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    fontVariantNumeric: 'tabular-nums',
  } as const,
  syncBadge: (syncing: boolean, hasActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.28rem 0.7rem',
    borderRadius: 6,
    fontSize: '0.74rem',
    fontWeight: 600,
    background: syncing ? '#FEF3C7' : hasActive ? '#ECFDF5' : '#F1F5F9',
    color: syncing ? '#92400E' : hasActive ? '#065F46' : '#475569',
    border: syncing
      ? '1px solid #FDE68A'
      : hasActive
        ? '1px solid #A7F3D0'
        : '1px solid #E2E8F0',
  }),
  addRow: {
    display: 'flex',
    gap: '0.65rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
    marginBottom: '0.85rem',
  } as const,
  inputWrap: { flex: '1 1 280px' } as const,
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '0.35rem',
  } as const,
  input: {
    width: '100%',
    padding: '0.58rem 0.85rem',
    border: '1px solid #CBD5E1',
    borderRadius: 6,
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#0F172A',
    background: '#FFFFFF',
  } as const,
  btnAdd: {
    padding: '0.58rem 1.15rem',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.84rem',
    whiteSpace: 'nowrap' as const,
  } as const,
  btnSecondary: {
    padding: '0.45rem 0.85rem',
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap' as const,
  } as const,
  feedback: (tone: 'info' | 'warn' | 'error'): React.CSSProperties => ({
    padding: '0.55rem 0.85rem',
    borderRadius: 8,
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '0.85rem',
    background: tone === 'error' ? '#FEF2F2' : tone === 'warn' ? '#FFFBEB' : '#ECFDF5',
    color: tone === 'error' ? '#DC2626' : tone === 'warn' ? '#92400E' : '#065F46',
    border: `1px solid ${tone === 'error' ? '#FECACA' : tone === 'warn' ? '#FDE68A' : '#A7F3D0'}`,
  }),
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '0.9rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #F3F4F6',
  } as const,
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    flexWrap: 'wrap' as const,
  } as const,
  filterInput: {
    padding: '0.45rem 0.75rem',
    border: '1px solid #D1D5DB',
    borderRadius: 7,
    fontSize: '0.8rem',
    color: '#111827',
    minWidth: 210,
    outline: 'none',
  } as const,
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '0.65rem',
  } as const,
  listItem: (enabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.6rem',
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    background: enabled ? '#FFFFFF' : '#F9FAFB',
    border: enabled ? '1px solid #E5E7EB' : '1px dashed #D1D5DB',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  }),
  kwLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    minWidth: 0,
    flex: 1,
  } as const,
  toggleTrack: (enabled: boolean): React.CSSProperties => ({
    position: 'relative',
    width: 38,
    height: 22,
    borderRadius: 999,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    background: enabled ? '#0F172A' : '#CBD5E1',
    transition: 'background 0.18s ease',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
  }),
  toggleKnob: (enabled: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 3,
    left: enabled ? 19 : 3,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    transition: 'left 0.18s ease',
  }),
  kwLabel: (enabled: boolean): React.CSSProperties => ({
    fontSize: '0.84rem',
    fontWeight: 600,
    color: enabled ? '#0F172A' : '#64748B',
    textDecoration: enabled ? 'none' : 'line-through',
    overflowWrap: 'anywhere' as const,
  }),
  kwRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexShrink: 0,
  } as const,
  stateTag: (enabled: boolean): React.CSSProperties => ({
    fontSize: '0.68rem',
    fontWeight: 600,
    padding: '0.16rem 0.45rem',
    borderRadius: 6,
    background: enabled ? '#ECFDF5' : '#F1F5F9',
    color: enabled ? '#065F46' : '#64748B',
    border: enabled ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  }),
  btnRemove: {
    padding: '0.26rem 0.5rem',
    background: '#FFFFFF',
    color: '#DC2626',
    border: '1px solid #FECACA',
    borderRadius: 6,
    fontSize: '0.73rem',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  } as const,
  emptyState: {
    padding: '1.25rem',
    textAlign: 'center' as const,
    background: '#F9FAFB',
    border: '1px dashed #D1D5DB',
    borderRadius: 8,
    color: '#6B7280',
    fontSize: '0.84rem',
  } as const,
  metaPreview: {
    marginTop: '1rem',
    padding: '0.75rem 0.9rem',
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: '0.76rem',
    color: '#334155',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    wordBreak: 'break-word' as const,
    lineHeight: 1.5,
  } as const,
};

export default function SeoContentManagementPanel({
  items,
  onToggleKeyword,
  onToggleAll,
  onAddKeyword,
  onDeleteKeyword,
  onRestoreDefaults,
  defaultKeywordsValue,
  loading = false,
  syncing = false,
  syncError = '',
}: SeoContentManagementPanelProps) {
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [notice, setNotice] = useState<{ tone: 'info' | 'warn' | 'error'; text: string } | null>(null);

  const filteredItems = useMemo(
    () => filterSeoKeywordRecords(items, filterQuery),
    [items, filterQuery],
  );

  const activeCount = useMemo(() => countActiveSeoKeywords(items), [items]);
  const activePreview = useMemo(() => getActiveSeoKeywordsString(items), [items]);

  const normalizedDefaultStr = useMemo(
    () => serializeSeoKeywords(parseSeoKeywords(defaultKeywordsValue)).toLowerCase(),
    [defaultKeywordsValue],
  );
  const allDefaultsEnabled = useMemo(() => {
    if (items.length === 0 || activeCount !== items.length) return false;
    return activePreview.toLowerCase() === normalizedDefaultStr;
  }, [items.length, activeCount, activePreview, normalizedDefaultStr]);

  const handleAdd = async () => {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) {
      setNotice({ tone: 'warn', text: 'Enter one or more keywords to add.' });
      return;
    }

    const existingSet = new Set(items.map(i => normalizeKeyword(i.keyword).toLowerCase()));
    const candidates = parseSeoKeywords(trimmed);
    const toAdd: string[] = [];
    const duplicates: string[] = [];

    for (const candidate of candidates) {
      if (existingSet.has(candidate.toLowerCase())) {
        duplicates.push(candidate);
      } else {
        toAdd.push(candidate);
      }
    }

    if (toAdd.length === 0 && duplicates.length > 0) {
      setNotice({
        tone: 'warn',
        text: `Already in global SEO keywords: ${duplicates.join(', ')}`,
      });
      return;
    }

    if (toAdd.length === 0) {
      setNotice({ tone: 'warn', text: 'No valid keyword found to add.' });
      return;
    }

    setNewKeywordInput('');
    setNotice({
      tone: 'info',
      text:
        duplicates.length > 0
          ? `Added ${toAdd.join(', ')} (skipped existing: ${duplicates.join(', ')}).`
          : `Added "${toAdd.join(', ')}" and enabled for site-wide meta headers.`,
    });
    await onAddKeyword(toAdd.join(', '));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAdd();
    }
  };

  const handleToggle = async (item: SeoKeywordRecord) => {
    const nextState = !item.enabled;
    setNotice({
      tone: 'info',
      text: nextState
        ? `Enabled "${item.keyword}" in site-wide meta headers.`
        : `Disabled "${item.keyword}" from site-wide meta headers.`,
    });
    await onToggleKeyword(item.id, nextState);
  };

  const handleToggleAll = async (enabled: boolean) => {
    setNotice({
      tone: 'info',
      text: enabled
        ? 'Enabled all SEO keywords for site-wide meta headers.'
        : 'Disabled all SEO keywords from site-wide meta headers.',
    });
    await onToggleAll(enabled);
  };

  const handleRemove = async (item: SeoKeywordRecord) => {
    setNotice({
      tone: 'info',
      text: `Removed "${item.keyword}" from SEO keywords.`,
    });
    await onDeleteKeyword(item.id, item.keyword);
  };

  const handleRestoreDefaults = async () => {
    setFilterQuery('');
    setNotice({
      tone: 'info',
      text: 'Restored default global SEO keywords.',
    });
    await onRestoreDefaults();
  };

  return (
    <section style={S.card} aria-labelledby="seo-content-mgmt-heading">
      <div style={S.section}>
        <div style={S.headerRow}>
          <div>
            <h2 id="seo-content-mgmt-heading" style={S.title}>
              SEO Content Management
            </h2>
            <p style={S.sub}>
              Toggle individual SEO keywords on or off, add new terms, or remove obsolete phrases. Only enabled keywords are injected into site-wide <code>&lt;meta name="keywords"&gt;</code> headers.
            </p>
          </div>
          <div style={S.statusGroup}>
            <span style={S.countPill} data-testid="seo-keywords-count">
              {activeCount} / {items.length} Active
            </span>
            <span style={S.syncBadge(syncing, activeCount > 0)} data-testid="seo-keywords-sync-badge">
              {syncing
                ? 'Syncing globally…'
                : activeCount > 0
                  ? '✓ Site-wide meta active'
                  : 'Meta keywords paused'}
            </span>
          </div>
        </div>

        <div style={S.addRow}>
          <div style={S.inputWrap}>
            <label htmlFor="seo-new-keyword-input" style={S.label}>
              Add Global SEO Keyword
            </label>
            <input
              id="seo-new-keyword-input"
              type="text"
              style={S.input}
              value={newKeywordInput}
              onChange={e => {
                setNewKeywordInput(e.target.value);
                if (notice) setNotice(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Kabul luxury villas, Wazir Akbar Khan apartments (comma-separated supported)"
            />
          </div>
          <button
            type="button"
            style={S.btnAdd}
            onClick={() => void handleAdd()}
            disabled={loading}
          >
            + Add Keyword
          </button>
        </div>

        {syncError && (
          <div style={S.feedback('error')} role="alert">
            ✕ {syncError}
          </div>
        )}
        {!syncError && notice && (
          <div style={S.feedback(notice.tone)} role="status">
            {notice.text}
          </div>
        )}

        <div style={S.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <label htmlFor="seo-filter-keywords-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4B5563' }}>
              Filter Keywords:
            </label>
            <input
              id="seo-filter-keywords-input"
              type="search"
              style={S.filterInput}
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder={`Search ${items.length} keywords…`}
            />
          </div>

          <div style={S.toolbarActions}>
            {items.length > 0 && activeCount < items.length && (
              <button
                type="button"
                style={S.btnSecondary}
                onClick={() => void handleToggleAll(true)}
              >
                Enable All
              </button>
            )}
            {items.length > 0 && activeCount > 0 && (
              <button
                type="button"
                style={S.btnSecondary}
                onClick={() => void handleToggleAll(false)}
              >
                Disable All
              </button>
            )}
            {!allDefaultsEnabled && (
              <button
                type="button"
                style={S.btnSecondary}
                onClick={() => void handleRestoreDefaults()}
              >
                Restore Default Keywords
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={S.emptyState}>
            Loading SEO keywords from <code>/api/admin/seo-keywords.php</code>…
          </div>
        ) : items.length === 0 ? (
          <div style={S.emptyState}>
            No global SEO keywords are currently stored. Add keywords above to populate the site&apos;s meta headers.
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={S.emptyState}>
            No SEO keywords match &ldquo;{filterQuery}&rdquo;.
          </div>
        ) : (
          <ul style={S.list} aria-label="Global SEO keywords" data-testid="seo-keywords-list">
            {filteredItems.map(item => (
              <li
                key={item.id}
                style={S.listItem(item.enabled)}
                data-testid={`seo-keyword-item-${item.id}`}
                data-enabled={item.enabled ? 'true' : 'false'}
              >
                <div style={S.kwLeft}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`Toggle keyword ${item.keyword} ${item.enabled ? 'off' : 'on'}`}
                    style={S.toggleTrack(item.enabled)}
                    onClick={() => void handleToggle(item)}
                  >
                    <span style={S.toggleKnob(item.enabled)} />
                  </button>
                  <span style={S.kwLabel(item.enabled)}>{item.keyword}</span>
                </div>

                <div style={S.kwRight}>
                  <span style={S.stateTag(item.enabled)}>
                    {item.enabled ? 'On' : 'Off'}
                  </span>
                  <button
                    type="button"
                    style={S.btnRemove}
                    aria-label={`Remove keyword ${item.keyword}`}
                    onClick={() => void handleRemove(item)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={S.metaPreview} data-testid="seo-keywords-preview">
          <strong style={{ color: '#0F172A' }}>Live Global Meta Tag Preview:</strong>{' '}
          {activePreview
            ? `<meta name="keywords" content="${activePreview}" />`
            : '(no active keywords — meta name="keywords" omitted)'}
        </div>
      </div>
    </section>
  );
}
