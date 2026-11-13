import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  api,
  DEFAULT_SEO_SETTINGS,
  type SeoKeywordItem,
  type SeoKeywordsResponse,
  type SeoSettingsInput,
  type SitemapCrawlReport,
  type SitemapStatusData,
} from '../api';
import ImageUpload from '../components/ImageUpload';
import SitemapStatusWidget, {
  type SitemapCategoryFilter,
} from '../components/SitemapStatusWidget';
import SeoContentManagementPanel from '../components/SeoContentManagementPanel';
import {
  getActiveSeoKeywordsString,
  toggleSeoKeywordRecord,
} from '../lib/seoKeywords';

const S = {
  page:         { maxWidth: 1020 } as const,
  headerRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '1rem', marginBottom: '1.75rem' } as const,
  title:        { fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' } as const,
  sub:          { color: '#64748B', fontSize: '0.85rem', margin: 0 } as const,
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', alignItems: 'start' } as const,
  card:         { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '1.25rem' } as const,
  section:      { padding: '1.35rem 1.5rem' } as const,
  divider:      { borderTop: '1px solid #F1F5F9' } as const,
  secHdr:       { fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: '1rem' } as const,
  fieldGroup:   { marginBottom: '1.1rem' } as const,
  labelRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' } as const,
  label:        { fontSize: '0.8rem', fontWeight: 600, color: '#334155' } as const,
  counter:      (len: number, min: number, max: number): React.CSSProperties => ({
    fontSize: '0.73rem',
    fontWeight: 600,
    color: len >= min && len <= max ? '#059669' : len > max ? '#DC2626' : '#D97706',
  }),
  input:        { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box' as const, color: '#0F172A', background: '#FFFFFF' } as const,
  textarea:     { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box' as const, minHeight: 92, resize: 'vertical' as const, fontFamily: 'inherit', color: '#0F172A', background: '#FFFFFF' } as const,
  help:         { fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', lineHeight: 1.4 } as const,
  row:          { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' as const } as const,
  btnPrimary:   { padding: '0.55rem 1.25rem', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' } as const,
  btnNavy:      { padding: '0.55rem 1.15rem', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' } as const,
  btnSecondary: { padding: '0.55rem 1.1rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' } as const,
  alertSuccess: { padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' } as const,
  alertError:   { padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' } as const,
  tagWrap:      { display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem', marginTop: '0.5rem' } as const,
  tag:          { fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 6, background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0' } as const,
  serpBox:      { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '1rem 1.15rem' } as const,
  serpUrl:      { fontSize: '0.78rem', color: '#475569', marginBottom: '0.2rem', wordBreak: 'break-all' as const } as const,
  serpTitle:    { fontSize: '1.05rem', color: '#1D4ED8', fontWeight: 600, marginBottom: '0.25rem', lineHeight: 1.3 } as const,
  serpDesc:     { fontSize: '0.83rem', color: '#475569', lineHeight: 1.45, margin: 0 } as const,
  socialCard:   { border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', background: '#FFFFFF' } as const,
  socialImgBox: { height: 180, background: '#F1F5F9', position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } as const,
  socialBody:   { padding: '0.85rem 1rem', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' } as const,
  socialDomain: { fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: '0.2rem' } as const,
  socialTitle:  { fontSize: '0.92rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.2rem', lineHeight: 1.3 } as const,
  socialDesc:   { fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, margin: 0 } as const,
  statGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' } as const,
  statBox:      (active: boolean): React.CSSProperties => ({
    padding: '0.85rem 1rem',
    borderRadius: 8,
    background: active ? '#F1F5F9' : '#FFFFFF',
    border: active ? '1px solid #0F172A' : '1px solid #E2E8F0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }),
  statLabel:    { fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: '0.25rem' } as const,
  statValue:    { fontSize: '1.35rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as const,
  xmlPre:       { background: '#F8FAFC', color: '#0F172A', border: '1px solid #E2E8F0', padding: '1rem 1.15rem', borderRadius: 8, fontSize: '0.76rem', lineHeight: 1.55, overflowX: 'auto' as const, maxHeight: 320, margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } as const,
  urlTableWrap: { border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto' as const } as const,
  urlTable:     { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.8rem' } as const,
  th:           { textAlign: 'left' as const, padding: '0.6rem 0.85rem', background: '#F8FAFC', color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' as const, borderBottom: '1px solid #E2E8F0', position: 'sticky' as const, top: 0 } as const,
  td:           { padding: '0.55rem 0.85rem', borderBottom: '1px solid #F1F5F9', color: '#0F172A', fontVariantNumeric: 'tabular-nums' } as const,
};

export default function SeoPage() {
  const [form, setForm] = useState<SeoSettingsInput>({
    site_name: DEFAULT_SEO_SETTINGS.site_name,
    default_title: DEFAULT_SEO_SETTINGS.default_title,
    title_template: DEFAULT_SEO_SETTINGS.title_template,
    default_description: DEFAULT_SEO_SETTINGS.default_description,
    keywords: DEFAULT_SEO_SETTINGS.keywords,
    og_image: DEFAULT_SEO_SETTINGS.og_image,
    twitter_image: DEFAULT_SEO_SETTINGS.twitter_image,
    twitter_card: DEFAULT_SEO_SETTINGS.twitter_card,
    twitter_site: DEFAULT_SEO_SETTINGS.twitter_site,
    canonical_base_url: DEFAULT_SEO_SETTINGS.canonical_base_url,
    robots_index: DEFAULT_SEO_SETTINGS.robots_index,
  });

  const [loading, setLoading] = useState(true);
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [keywordItems, setKeywordItems] = useState<SeoKeywordItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncingKeywords, setSyncingKeywords] = useState(false);
  const [keywordSyncError, setKeywordSyncError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sitemap crawler state
  const [sitemapReport, setSitemapReport] = useState<SitemapCrawlReport | null>(null);
  const [crawlingSitemap, setCrawlingSitemap] = useState(false);
  const [sitemapCategoryFilter, setSitemapCategoryFilter] =
    useState<SitemapCategoryFilter>('all');
  const [showRawXml, setShowRawXml] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const handleWidgetStatusLoaded = useCallback((statusData: SitemapStatusData) => {
    setSitemapReport(prev => ({
      ...statusData,
      xml: statusData.xml || prev?.xml || '',
    }));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getSeoSettings(),
      api.getSeoKeywords(),
      api.getSitemapStatus().catch(() => null),
    ])
      .then(([data, keywordsData, sitemapData]) => {
        if (!active) return;
        const resolvedKeywords =
          keywordsData && Array.isArray(keywordsData.keywords)
            ? keywordsData.active_keywords
            : (data.keywords !== undefined && data.keywords !== null
                ? data.keywords
                : (DEFAULT_SEO_SETTINGS.keywords ?? ''));

        if (keywordsData && Array.isArray(keywordsData.keywords)) {
          setKeywordItems(keywordsData.keywords);
        }

        setForm({
          site_name: data.site_name || DEFAULT_SEO_SETTINGS.site_name,
          default_title: data.default_title || DEFAULT_SEO_SETTINGS.default_title,
          title_template: data.title_template || DEFAULT_SEO_SETTINGS.title_template,
          default_description: data.default_description || DEFAULT_SEO_SETTINGS.default_description,
          keywords: resolvedKeywords,
          og_image: data.og_image || DEFAULT_SEO_SETTINGS.og_image,
          twitter_image: data.twitter_image ?? null,
          twitter_card: data.twitter_card || 'summary_large_image',
          twitter_site: data.twitter_site ?? '@AttaieProps',
          canonical_base_url: data.canonical_base_url || DEFAULT_SEO_SETTINGS.canonical_base_url,
          robots_index: data.robots_index !== undefined ? Boolean(data.robots_index) : true,
        });
        if (sitemapData) {
          setSitemapReport(sitemapData);
        }
      })
      .catch(err => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load SEO settings');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingKeywords(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');

    try {
      await api.updateSeoSettings(form);
      const freshSitemap = await api.generateSitemap(form.canonical_base_url).catch(() => null);
      if (freshSitemap) {
        setSitemapReport(freshSitemap);
      }
      setSavedMsg('Site-wide SEO metadata saved and sitemap.xml automatically regenerated.');
      window.electronAPI?.notify('SEO & Sitemap Updated', 'Site-wide SEO settings and sitemap.xml have been updated.');
      setTimeout(() => setSavedMsg(''), 4500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCrawlSitemap = async () => {
    setCrawlingSitemap(true);
    setSavedMsg('');
    setErrorMsg('');
    try {
      const report = await api.generateSitemap(form.canonical_base_url);
      setSitemapReport(report);
      setSavedMsg(
        `Sitemap.xml crawled & regenerated: ${report.counts.total} URLs indexed (${report.counts.properties} properties, ${report.counts.projects} projects, ${report.counts.careers} careers, ${report.counts.agents} agents).`
      );
      window.electronAPI?.notify(
        'Sitemap.xml Regenerated',
        `Indexed ${report.counts.total} URLs across properties, projects, careers, and agents.`
      );
      setTimeout(() => setSavedMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to crawl and generate sitemap.xml');
    } finally {
      setCrawlingSitemap(false);
    }
  };

  const handleToggleRawXml = async () => {
    const next = !showRawXml;
    setShowRawXml(next);
    if (next && sitemapReport && !sitemapReport.xml) {
      const xmlText = await api.fetchSitemapXmlText();
      if (xmlText) {
        setSitemapReport(prev => (prev ? { ...prev, xml: xmlText } : prev));
      }
    }
  };

  const handleCopyXml = async () => {
    if (!sitemapReport?.xml) return;
    try {
      await navigator.clipboard.writeText(sitemapReport.xml);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const applyKeywordsResponse = useCallback((resp: SeoKeywordsResponse) => {
    setKeywordItems(resp.keywords);
    setForm(prev => ({ ...prev, keywords: resp.active_keywords }));
  }, []);

  const handleToggleKeyword = useCallback(async (id: number, enabled: boolean) => {
    setKeywordSyncError('');
    setSyncingKeywords(true);
    const previousItems = keywordItems;
    const optimistic = toggleSeoKeywordRecord(keywordItems, id, enabled);
    setKeywordItems(optimistic);
    setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(optimistic) }));
    try {
      const resp = await api.toggleSeoKeyword(id, enabled);
      applyKeywordsResponse(resp);
    } catch (err) {
      setKeywordItems(previousItems);
      setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(previousItems) }));
      setKeywordSyncError(
        err instanceof Error ? err.message : 'Failed to toggle SEO keyword',
      );
    } finally {
      setSyncingKeywords(false);
    }
  }, [keywordItems, applyKeywordsResponse]);

  const handleToggleAllKeywords = useCallback(async (enabled: boolean) => {
    setKeywordSyncError('');
    setSyncingKeywords(true);
    const previousItems = keywordItems;
    const optimistic = keywordItems.map(item => ({ ...item, enabled }));
    setKeywordItems(optimistic);
    setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(optimistic) }));
    try {
      const resp = await api.toggleAllSeoKeywords(enabled);
      applyKeywordsResponse(resp);
    } catch (err) {
      setKeywordItems(previousItems);
      setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(previousItems) }));
      setKeywordSyncError(
        err instanceof Error ? err.message : 'Failed to update all SEO keywords',
      );
    } finally {
      setSyncingKeywords(false);
    }
  }, [keywordItems, applyKeywordsResponse]);

  const handleAddKeyword = useCallback(async (keyword: string) => {
    setKeywordSyncError('');
    setSyncingKeywords(true);
    try {
      const resp = await api.addSeoKeyword(keyword, true);
      applyKeywordsResponse(resp);
    } catch (err) {
      setKeywordSyncError(
        err instanceof Error ? err.message : 'Failed to add SEO keyword',
      );
    } finally {
      setSyncingKeywords(false);
    }
  }, [applyKeywordsResponse]);

  const handleDeleteKeyword = useCallback(async (id: number) => {
    setKeywordSyncError('');
    setSyncingKeywords(true);
    const previousItems = keywordItems;
    const optimistic = keywordItems.filter(item => item.id !== id);
    setKeywordItems(optimistic);
    setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(optimistic) }));
    try {
      const resp = await api.deleteSeoKeyword(id);
      applyKeywordsResponse(resp);
    } catch (err) {
      setKeywordItems(previousItems);
      setForm(prev => ({ ...prev, keywords: getActiveSeoKeywordsString(previousItems) }));
      setKeywordSyncError(
        err instanceof Error ? err.message : 'Failed to remove SEO keyword',
      );
    } finally {
      setSyncingKeywords(false);
    }
  }, [keywordItems, applyKeywordsResponse]);

  const handleRestoreDefaultKeywords = useCallback(async () => {
    setKeywordSyncError('');
    setSyncingKeywords(true);
    try {
      const resp = await api.restoreDefaultSeoKeywords();
      applyKeywordsResponse(resp);
    } catch (err) {
      setKeywordSyncError(
        err instanceof Error ? err.message : 'Failed to restore default SEO keywords',
      );
    } finally {
      setSyncingKeywords(false);
    }
  }, [applyKeywordsResponse]);

  const handleResetDefaults = () => {
    setForm({
      site_name: DEFAULT_SEO_SETTINGS.site_name,
      default_title: DEFAULT_SEO_SETTINGS.default_title,
      title_template: DEFAULT_SEO_SETTINGS.title_template,
      default_description: DEFAULT_SEO_SETTINGS.default_description,
      keywords: DEFAULT_SEO_SETTINGS.keywords,
      og_image: DEFAULT_SEO_SETTINGS.og_image,
      twitter_image: DEFAULT_SEO_SETTINGS.twitter_image,
      twitter_card: DEFAULT_SEO_SETTINGS.twitter_card,
      twitter_site: DEFAULT_SEO_SETTINGS.twitter_site,
      canonical_base_url: DEFAULT_SEO_SETTINGS.canonical_base_url,
      robots_index: DEFAULT_SEO_SETTINGS.robots_index,
    });
    void handleRestoreDefaultKeywords();
  };

  const previewSocialImage = form.og_image || '/logo.png';
  const cleanDomain = (form.canonical_base_url || 'https://www.attaieproperties.com')
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

  const filteredSitemapUrls = (sitemapReport?.urls || []).filter(u =>
    sitemapCategoryFilter === 'all' ? true : u.category === sitemapCategoryFilter
  );

  if (loading) {
    return (
      <div style={S.page}>
        <h1 style={S.title}>SEO & Sitemap Crawler</h1>
        <p style={S.sub}>Loading site-wide SEO configuration & sitemap index…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={S.page}>
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>SEO, Social Metadata & Sitemap Crawler</h1>
          <p style={S.sub}>
            Manage site-wide title, meta description, OpenGraph cards, and automatic <code>sitemap.xml</code> crawling across properties, projects, and careers.
          </p>
        </div>

        <div style={S.row}>
          <button type="button" style={S.btnSecondary} onClick={handleResetDefaults}>
            Reset Defaults
          </button>
          <button type="submit" style={S.btnPrimary} disabled={saving}>
            {saving ? 'Saving…' : 'Save SEO Metadata'}
          </button>
        </div>
      </div>

      {savedMsg && <div style={S.alertSuccess}>✓ {savedMsg}</div>}
      {errorMsg && <div style={S.alertError}>✕ {errorMsg}</div>}

      {/* SEO Content Management Panel (/api/admin/seo-keywords.php + Toggle On/Off) */}
      <SeoContentManagementPanel
        items={keywordItems}
        onToggleKeyword={handleToggleKeyword}
        onToggleAll={handleToggleAllKeywords}
        onAddKeyword={handleAddKeyword}
        onDeleteKeyword={id => handleDeleteKeyword(id)}
        onRestoreDefaults={handleRestoreDefaultKeywords}
        defaultKeywordsValue={DEFAULT_SEO_SETTINGS.keywords ?? ''}
        loading={loadingKeywords}
        syncing={syncingKeywords}
        syncError={keywordSyncError}
      />

      {/* Dashboard Widget fetching and displaying /sitemap-status.json */}
      <SitemapStatusWidget
        externalStatus={sitemapReport}
        selectedCategory={sitemapCategoryFilter}
        onSelectCategory={setSitemapCategoryFilter}
        onStatusLoaded={handleWidgetStatusLoaded}
        onRegenerate={handleCrawlSitemap}
        regenerating={crawlingSitemap}
      />

      {/* Automatic Sitemap.xml Crawler & Generator Card */}
      <div style={S.card}>
        <div style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.15rem' }}>
            <div>
              <p style={{ ...S.secHdr, marginBottom: '0.35rem' }}>
                Automatic XML Sitemap Crawler & Search Engine Index
              </p>
              <div style={{ fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.45 }}>
                Automatically crawls published <strong>Properties</strong>, <strong>Projects</strong>, <strong>Careers</strong>, and <strong>Agents</strong> (with Google Image Sitemap metadata) whenever records change.
                {sitemapReport?.generated_at && (
                  <span style={{ marginLeft: '0.5rem', color: '#6B7280', fontSize: '0.78rem' }}>
                    • Last crawled: <strong>{new Date(sitemapReport.generated_at).toLocaleString()}</strong>
                  </span>
                )}
              </div>
            </div>

            <div style={S.row}>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                style={S.btnSecondary}
              >
                Open /sitemap.xml ↗
              </a>
              <button
                type="button"
                style={S.btnSecondary}
                onClick={() => void handleToggleRawXml()}
              >
                {showRawXml ? 'Hide XML Source' : 'Inspect XML Source'}
              </button>
              <button
                type="button"
                style={S.btnNavy}
                onClick={handleCrawlSitemap}
                disabled={crawlingSitemap}
              >
                {crawlingSitemap ? 'Crawling Data…' : 'Crawl & Regenerate Sitemap.xml'}
              </button>
            </div>
          </div>

          {sitemapReport && (
            <>
              <div style={S.statGrid}>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'all')}
                  onClick={() => setSitemapCategoryFilter('all')}
                >
                  <div style={S.statLabel}>Total Indexed URLs</div>
                  <div style={S.statValue}>{sitemapReport.counts.total}</div>
                </div>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'properties')}
                  onClick={() => setSitemapCategoryFilter('properties')}
                >
                  <div style={S.statLabel}>Properties</div>
                  <div style={S.statValue}>{sitemapReport.counts.properties}</div>
                </div>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'projects')}
                  onClick={() => setSitemapCategoryFilter('projects')}
                >
                  <div style={S.statLabel}>Projects</div>
                  <div style={S.statValue}>{sitemapReport.counts.projects}</div>
                </div>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'careers')}
                  onClick={() => setSitemapCategoryFilter('careers')}
                >
                  <div style={S.statLabel}>Careers</div>
                  <div style={S.statValue}>{sitemapReport.counts.careers}</div>
                </div>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'agents')}
                  onClick={() => setSitemapCategoryFilter('agents')}
                >
                  <div style={S.statLabel}>Agents</div>
                  <div style={S.statValue}>{sitemapReport.counts.agents}</div>
                </div>
                <div
                  style={S.statBox(sitemapCategoryFilter === 'static')}
                  onClick={() => setSitemapCategoryFilter('static')}
                >
                  <div style={S.statLabel}>Core Pages</div>
                  <div style={S.statValue}>{sitemapReport.counts.static}</div>
                </div>
              </div>

              <div style={S.urlTableWrap}>
                <table style={S.urlTable}>
                  <thead>
                    <tr>
                      <th style={S.th}>Crawled URL & Page Title</th>
                      <th style={S.th}>Type</th>
                      <th style={S.th}>Priority</th>
                      <th style={S.th}>Frequency</th>
                      <th style={S.th}>Images</th>
                      <th style={S.th}>Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSitemapUrls.map(item => (
                      <tr key={item.loc}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.1rem' }}>
                            {item.title}
                          </div>
                          <a
                            href={item.loc}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.74rem', color: '#2563EB', textDecoration: 'none', wordBreak: 'break-all' }}
                          >
                            {item.loc}
                          </a>
                        </td>
                        <td style={S.td}>
                          <span style={S.tag}>{item.category}</span>
                        </td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{item.priority}</td>
                        <td style={S.td}>{item.changefreq}</td>
                        <td style={S.td}>{item.image_count > 0 ? `${item.image_count} img` : '—'}</td>
                        <td style={{ ...S.td, color: '#6B7280', fontSize: '0.75rem' }}>{item.lastmod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showRawXml && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>
                      Generated /sitemap.xml Output ({sitemapReport.xml.length.toLocaleString()} bytes)
                    </span>
                    <button type="button" style={S.btnSecondary} onClick={handleCopyXml}>
                      {copiedXml ? '✓ Copied XML' : 'Copy XML'}
                    </button>
                  </div>
                  <pre style={S.xmlPre}>{sitemapReport.xml}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={S.grid}>
        {/* Left Column: Core SEO & Indexing */}
        <div>
          <div style={S.card}>
            <div style={S.section}>
              <p style={S.secHdr}>Core Search Engine Metadata</p>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Brand / Site Name</label>
                </div>
                <input
                  style={S.input}
                  value={form.site_name}
                  onChange={e => setForm(f => ({ ...f, site_name: e.target.value }))}
                  placeholder="Attaie Properties"
                  required
                />
                <p style={S.help}>Used in <code>og:site_name</code> and Schema.org Organization structured data.</p>
              </div>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Default Site Title</label>
                  <span style={S.counter(form.default_title.length, 30, 65)}>
                    {form.default_title.length} / 60 chars
                  </span>
                </div>
                <input
                  style={S.input}
                  value={form.default_title}
                  onChange={e => setForm(f => ({ ...f, default_title: e.target.value }))}
                  placeholder="Attaie Properties — Premier Real Estate in Kabul, Afghanistan"
                  required
                />
                <p style={S.help}>Primary <code>&lt;title&gt;</code> and <code>og:title</code> for the home page and fallback routes (recommended: 30–60 characters).</p>
              </div>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Page Title Template</label>
                </div>
                <input
                  style={S.input}
                  value={form.title_template}
                  onChange={e => setForm(f => ({ ...f, title_template: e.target.value }))}
                  placeholder="%s | Attaie Properties"
                />
                <p style={S.help}>Use <code>%s</code> as the placeholder for sub-page titles (e.g., <code>%s | Attaie Properties</code>).</p>
              </div>

              <div style={{ ...S.fieldGroup, marginBottom: 0 }}>
                <div style={S.labelRow}>
                  <label style={S.label}>Default Meta Description</label>
                  <span style={S.counter(form.default_description.length, 110, 165)}>
                    {form.default_description.length} / 160 chars
                  </span>
                </div>
                <textarea
                  style={S.textarea}
                  value={form.default_description}
                  onChange={e => setForm(f => ({ ...f, default_description: e.target.value }))}
                  placeholder="Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul..."
                  required
                />
                <p style={S.help}>Injected into <code>&lt;meta name="description"&gt;</code>, <code>og:description</code>, and <code>twitter:description</code> (recommended: 120–160 characters).</p>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.section}>
              <p style={S.secHdr}>Canonical URL & Crawler Indexing</p>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Canonical Base Domain URL</label>
                </div>
                <input
                  style={S.input}
                  value={form.canonical_base_url}
                  onChange={e => setForm(f => ({ ...f, canonical_base_url: e.target.value }))}
                  placeholder="https://www.attaieproperties.com"
                  spellCheck={false}
                />
                <p style={S.help}>Base origin used to resolve canonical URLs, <code>sitemap.xml</code> entries, and absolute OpenGraph image URLs.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                    Allow Search Engine Indexing
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    When enabled, sets <code>index, follow, max-image-preview:large</code>. Disable on staging subdomains if needed.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.robots_index}
                  onChange={e => setForm(f => ({ ...f, robots_index: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: '#0F172A', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Social Sharing Images & Live Previews */}
        <div>
          <div style={S.card}>
            <div style={S.section}>
              <p style={S.secHdr}>Social Sharing Images (OpenGraph & Twitter / X)</p>

              <div style={S.fieldGroup}>
                <div style={S.labelRow}>
                  <label style={S.label}>Default OpenGraph Image (1200 × 630 px recommended)</label>
                </div>
                <ImageUpload
                  value={form.og_image}
                  onChange={url => setForm(f => ({ ...f, og_image: url || '/logo.png' }))}
                />
                <div style={{ marginTop: '0.6rem' }}>
                  <input
                    style={S.input}
                    value={form.og_image ?? ''}
                    onChange={e => setForm(f => ({ ...f, og_image: e.target.value }))}
                    placeholder="/logo.png or https://www.attaieproperties.com/uploads/og-banner.jpg"
                    spellCheck={false}
                  />
                  <p style={S.help}>Upload an image above or paste a path/URL. Used across WhatsApp, Facebook, LinkedIn, Telegram, and iMessage link previews.</p>
                </div>
              </div>

              <div style={{ ...S.fieldGroup, paddingTop: '0.5rem', borderTop: '1px solid #F3F4F6' }}>
                <div style={S.labelRow}>
                  <label style={S.label}>Twitter / X Card Image Override (Optional)</label>
                </div>
                <ImageUpload
                  value={form.twitter_image}
                  onChange={url => setForm(f => ({ ...f, twitter_image: url }))}
                />
                <div style={{ marginTop: '0.6rem' }}>
                  <input
                    style={S.input}
                    value={form.twitter_image ?? ''}
                    onChange={e => setForm(f => ({ ...f, twitter_image: e.target.value || null }))}
                    placeholder="Leave blank to use OpenGraph image"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ ...S.label, display: 'block', marginBottom: '0.35rem' }}>Twitter Card Style</label>
                  <select
                    style={S.input}
                    value={form.twitter_card}
                    onChange={e => setForm(f => ({ ...f, twitter_card: e.target.value as 'summary_large_image' | 'summary' }))}
                  >
                    <option value="summary_large_image">Large Image (summary_large_image)</option>
                    <option value="summary">Compact Square (summary)</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...S.label, display: 'block', marginBottom: '0.35rem' }}>Twitter / X Handle</label>
                  <input
                    style={S.input}
                    value={form.twitter_site ?? ''}
                    onChange={e => setForm(f => ({ ...f, twitter_site: e.target.value }))}
                    placeholder="@AttaieProps"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live SERP & Social Card Previews */}
          <div style={S.card}>
            <div style={S.section}>
              <p style={S.secHdr}>Live Google Search & Social Card Preview</p>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.4rem' }}>
                  Google Search Result Snippet
                </div>
                <div style={S.serpBox}>
                  <div style={S.serpUrl}>{form.canonical_base_url || 'https://www.attaieproperties.com'}</div>
                  <div style={S.serpTitle}>{form.default_title || 'Attaie Properties'}</div>
                  <p style={S.serpDesc}>{form.default_description || 'No meta description provided.'}</p>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', marginBottom: '0.4rem' }}>
                  OpenGraph / WhatsApp / Social Share Card
                </div>
                <div style={S.socialCard}>
                  <div style={S.socialImgBox}>
                    {previewSocialImage ? (
                      <img
                        src={previewSocialImage}
                        alt="Social share preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>No Social Image</span>
                    )}
                  </div>
                  <div style={S.socialBody}>
                    <div style={S.socialDomain}>{cleanDomain}</div>
                    <div style={S.socialTitle}>{form.default_title || form.site_name}</div>
                    <p style={S.socialDesc}>
                      {(form.default_description || '').slice(0, 140)}
                      {(form.default_description || '').length > 140 ? '…' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
