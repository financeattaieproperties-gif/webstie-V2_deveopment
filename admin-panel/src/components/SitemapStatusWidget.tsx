import { useState, useEffect, useCallback } from 'react';
import { api, type SitemapStatusData } from '../api';

export type SitemapCategoryFilter =
  | 'all'
  | 'static'
  | 'properties'
  | 'projects'
  | 'careers'
  | 'agents';

interface SitemapStatusWidgetProps {
  externalStatus?: SitemapStatusData | null;
  selectedCategory?: SitemapCategoryFilter;
  onSelectCategory?: (category: SitemapCategoryFilter) => void;
  onStatusLoaded?: (data: SitemapStatusData) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

const S = {
  widget: {
    background: '#FFFFFF',
    borderRadius: 10,
    padding: '1.35rem 1.5rem',
    color: '#0F172A',
    border: '1px solid #E2E8F0',
    marginBottom: '1.5rem',
  } as const,
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '0.85rem',
    marginBottom: '1.15rem',
  } as const,
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap' as const,
    marginBottom: '0.35rem',
  } as const,
  overline: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 1.1,
    margin: 0,
  } as const,
  statusPill: (ok: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.18rem 0.6rem',
    borderRadius: 6,
    background: ok ? '#ECFDF5' : '#FEF2F2',
    color: ok ? '#065F46' : '#991B1B',
    border: ok ? '1px solid #A7F3D0' : '1px solid #FECACA',
  }),
  heading: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  } as const,
  subText: {
    fontSize: '0.8rem',
    color: '#64748B',
    marginTop: '0.2rem',
    marginBottom: 0,
  } as const,
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    flexWrap: 'wrap' as const,
  } as const,
  btnGhost: {
    padding: '0.45rem 0.85rem',
    background: '#FFFFFF',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  } as const,
  btnGold: {
    padding: '0.48rem 0.95rem',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  } as const,
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.9rem',
    marginBottom: '1.1rem',
  } as const,
  kpiCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    padding: '0.95rem 1.1rem',
    fontVariantNumeric: 'tabular-nums',
  } as const,
  kpiLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    marginBottom: '0.35rem',
  } as const,
  kpiMainValue: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: 1.15,
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  } as const,
  kpiTimestampValue: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0F172A',
    lineHeight: 1.3,
  } as const,
  kpiMeta: {
    fontSize: '0.74rem',
    color: '#64748B',
    marginTop: '0.3rem',
  } as const,
  progressWrap: {
    background: '#F1F5F9',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    display: 'flex',
    marginBottom: '0.75rem',
    border: '1px solid #E2E8F0',
  } as const,
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
    gap: '0.55rem',
  } as const,
  breakdownChip: (active: boolean): React.CSSProperties => ({
    padding: '0.55rem 0.75rem',
    borderRadius: 8,
    background: active ? '#F1F5F9' : '#FFFFFF',
    border: active
      ? '1px solid #0F172A'
      : '1px solid #E2E8F0',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  }),
  chipLabel: {
    fontSize: '0.74rem',
    fontWeight: 600,
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  } as const,
  chipCount: {
    fontSize: '0.88rem',
    fontWeight: 800,
    color: '#0F172A',
    fontVariantNumeric: 'tabular-nums',
  } as const,
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    padding: '0.65rem 0.9rem',
    borderRadius: 8,
    fontSize: '0.8rem',
    marginTop: '0.5rem',
  } as const,
};

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 0) return 'Scheduled / UTC sync';
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function formatReadableTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function SitemapStatusWidget({
  externalStatus,
  selectedCategory = 'all',
  onSelectCategory,
  onStatusLoaded,
  onRegenerate,
  regenerating = false,
}: SitemapStatusWidgetProps) {
  const [statusData, setStatusData] = useState<SitemapStatusData | null>(externalStatus ?? null);
  const [loading, setLoading] = useState<boolean>(!externalStatus);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  const loadSitemapStatusJson = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setFetchError('');
      try {
        const data = await api.fetchSitemapStatusJson();
        setStatusData(data);
        onStatusLoaded?.(data);
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : 'Unable to fetch /sitemap-status.json'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onStatusLoaded]
  );

  useEffect(() => {
    void loadSitemapStatusJson(false);
  }, [loadSitemapStatusJson]);

  useEffect(() => {
    if (externalStatus) {
      setStatusData(externalStatus);
      setLoading(false);
      setFetchError('');
    }
  }, [externalStatus]);

  const totalUrls = statusData?.counts?.total ?? 0;
  const totalImages = (statusData?.urls ?? []).reduce(
    (sum, item) => sum + (item.image_count || 0),
    0
  );

  const segments: Array<{
    key: SitemapCategoryFilter;
    label: string;
    count: number;
    color: string;
  }> = [
    {
      key: 'properties',
      label: 'Properties',
      count: statusData?.counts?.properties ?? 0,
      color: '#0F172A',
    },
    {
      key: 'projects',
      label: 'Projects',
      count: statusData?.counts?.projects ?? 0,
      color: '#38BDF8',
    },
    {
      key: 'careers',
      label: 'Careers',
      count: statusData?.counts?.careers ?? 0,
      color: '#34D399',
    },
    {
      key: 'agents',
      label: 'Agents',
      count: statusData?.counts?.agents ?? 0,
      color: '#A78BFA',
    },
    {
      key: 'static',
      label: 'Core Pages',
      count: statusData?.counts?.static ?? 0,
      color: '#94A3B8',
    },
  ];

  return (
    <div style={S.widget} data-testid="sitemap-status-widget">
      <div style={S.topBar}>
        <div>
          <div style={S.badgeRow}>
            <p style={S.overline}>Sitemap Index Monitor • sitemap-status.json</p>
            <span style={S.statusPill(!fetchError && Boolean(statusData))}>
              {loading
                ? 'Fetching Status…'
                : fetchError
                  ? 'Status Unavailable'
                  : 'Indexed & Live'}
            </span>
          </div>
          <h2 style={S.heading}>Search Engine Sitemap Telemetry</h2>
          <p style={S.subText}>
            Live snapshot fetched from <code>/sitemap-status.json</code> tracking indexed URLs and last generation timestamp.
          </p>
        </div>

        <div style={S.actionsRow}>
          <a
            href="/sitemap-status.json"
            target="_blank"
            rel="noopener noreferrer"
            style={S.btnGhost}
          >
            View sitemap-status.json ↗
          </a>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            style={S.btnGhost}
          >
            Open /sitemap.xml ↗
          </a>
          <button
            type="button"
            style={S.btnGhost}
            onClick={() => void loadSitemapStatusJson(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh Status'}
          </button>
          {onRegenerate && (
            <button
              type="button"
              style={S.btnGold}
              onClick={onRegenerate}
              disabled={regenerating}
            >
              {regenerating ? 'Crawling…' : 'Crawl & Rebuild Now'}
            </button>
          )}
        </div>
      </div>

      {fetchError && <div style={S.errorBox}>✕ {fetchError}</div>}

      <div style={S.kpiGrid}>
        {/* Total Indexed URLs KPI */}
        <div
          style={{
            ...S.kpiCard,
            cursor: onSelectCategory ? 'pointer' : 'default',
            border:
              selectedCategory === 'all'
                ? '1px solid #0F172A'
                : '1px solid #E2E8F0',
          }}
          onClick={() => onSelectCategory?.('all')}
        >
          <div style={S.kpiLabel}>Total Indexed URLs</div>
          <div style={S.kpiMainValue}>
            <span>{loading && !statusData ? '—' : totalUrls.toLocaleString()}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>
              URLs in sitemap.xml
            </span>
          </div>
          <div style={S.kpiMeta}>
            Includes <strong>{totalImages}</strong> indexed Google Image Sitemap entries
          </div>
        </div>

        {/* Last Generation Timestamp KPI */}
        <div style={S.kpiCard}>
          <div style={S.kpiLabel}>Last Generation Timestamp</div>
          <div style={S.kpiTimestampValue}>
            {statusData?.generated_at
              ? formatReadableTimestamp(statusData.generated_at)
              : loading
                ? 'Loading timestamp…'
                : 'Not generated yet'}
          </div>
          <div style={S.kpiMeta}>
            {statusData?.generated_at ? (
              <>
                <span style={{ color: '#047857', fontWeight: 600 }}>
                  {formatRelativeTime(statusData.generated_at)}
                </span>{' '}
                • <code style={{ fontSize: '0.7rem', color: '#64748B' }}>{statusData.generated_at}</code>
              </>
            ) : (
              'Awaiting initial crawl'
            )}
          </div>
        </div>

        {/* Canonical Endpoint KPI */}
        <div style={S.kpiCard}>
          <div style={S.kpiLabel}>Canonical Sitemap Endpoint</div>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#0F172A',
              wordBreak: 'break-all',
              lineHeight: 1.35,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {statusData?.sitemap_url || 'https://www.attaieproperties.com/sitemap.xml'}
          </div>
          <div style={S.kpiMeta}>
            Base domain:{' '}
            <strong>
              {statusData?.canonical_base_url || 'https://www.attaieproperties.com'}
            </strong>
          </div>
        </div>
      </div>

      {statusData && (
        <>
          {/* Proportional Distribution Bar */}
          <div style={S.progressWrap} title="Indexed URL distribution by content type">
            {segments.map(seg => {
              const widthPct = totalUrls > 0 ? (seg.count / totalUrls) * 100 : 0;
              if (widthPct <= 0) return null;
              return (
                <div
                  key={seg.key}
                  style={{
                    width: `${widthPct}%`,
                    background: seg.color,
                    height: '100%',
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Category Breakdown Pills */}
          <div style={S.breakdownRow}>
            {segments.map(seg => (
              <div
                key={seg.key}
                style={S.breakdownChip(selectedCategory === seg.key)}
                onClick={() =>
                  onSelectCategory?.(selectedCategory === seg.key ? 'all' : seg.key)
                }
              >
                <span style={S.chipLabel}>{seg.label}</span>
                <span style={S.chipCount}>{seg.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
