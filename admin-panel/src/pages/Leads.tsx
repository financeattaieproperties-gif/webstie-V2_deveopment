import { useEffect, useMemo, useState } from 'react';
import { api, type Lead } from '../api';
import InquiryFollowupEditor, { inquiryLabels, inquiryTime } from '../components/InquiryFollowupEditor';

function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function buildAdminLeadsCsv(leads: Lead[]): string {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Property', 'Message / Inquiry', 'Stage', 'Source', 'Date'];
  const rows = [headers.map(escapeCsvCell).join(',')];
  for (const l of leads) {
    rows.push(
      [
        `LEAD-${l.id}`,
        l.name,
        l.email,
        l.phone,
        l.property_name ?? '—',
        l.message ?? '—',
        l.stage,
        l.source || 'Website',
        new Date(l.created_at).toISOString().slice(0, 10),
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  return `\uFEFF${rows.join('\r\n')}\r\n`;
}

function escapePdfText(text: unknown): string {
  return String(text ?? '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncateText(text: unknown, maxChars: number): string {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 3))}...`;
}

function buildAdminLeadsPdf(leads: Lead[], subtitle: string): string {
  const rowsPerPage = 18;
  const pageChunks: Lead[][] = [];
  if (leads.length === 0) {
    pageChunks.push([]);
  } else {
    for (let i = 0; i < leads.length; i += rowsPerPage) {
      pageChunks.push(leads.slice(i, i + rowsPerPage));
    }
  }

  const columns = [
    { label: 'ID', x: 36, maxChars: 10 },
    { label: 'Name', x: 96, maxChars: 20 },
    { label: 'Email', x: 215, maxChars: 24 },
    { label: 'Phone', x: 365, maxChars: 16 },
    { label: 'Property', x: 465, maxChars: 26 },
    { label: 'Stage', x: 645, maxChars: 14 },
    { label: 'Date', x: 735, maxChars: 12 },
  ];

  const objects: Array<{ id: number; body: string }> = [];
  const addObject = (id: number, body: string) => objects.push({ id, body });
  const pageIds: number[] = [];

  pageChunks.forEach((chunk, pageIndex) => {
    const pageObjId = 5 + pageIndex * 2;
    const contentObjId = pageObjId + 1;
    pageIds.push(pageObjId);

    const ops: string[] = [];
    // Navy header banner (#1A2335)
    ops.push('0.102 0.137 0.208 rg');
    ops.push('28 525 786 46 re f');
    ops.push('BT /F2 14 Tf 1 1 1 rg 40 550 Td');
    ops.push('(Attaie Properties — Website Leads Management Export) Tj ET');
    ops.push('BT /F1 9 Tf 0.96 0.93 0.88 rg 40 534 Td');
    ops.push(`(${escapePdfText(`${subtitle} (Page ${pageIndex + 1} of ${pageChunks.length})`)}) Tj ET`);

    // Table header bar
    ops.push('0.97 0.96 0.93 rg');
    ops.push('28 496 786 22 re f');
    ops.push('0.102 0.137 0.208 rg');
    for (const col of columns) {
      ops.push(`BT /F2 8.5 Tf ${col.x} 504 Td (${escapePdfText(col.label)}) Tj ET`);
    }

    if (chunk.length === 0) {
      ops.push('BT /F1 10 Tf 0.4 0.45 0.5 rg 40 468 Td (No leads in current view.) Tj ET');
    } else {
      chunk.forEach((row, rIdx) => {
        const rowTop = 474 - rIdx * 23;
        if (rIdx % 2 === 1) {
          ops.push('0.98 0.985 0.99 rg');
          ops.push(`28 ${rowTop - 5} 786 21 re f`);
        }
        ops.push('0.12 0.16 0.23 rg');
        const cells = [
          truncateText(`LEAD-${row.id}`, columns[0].maxChars),
          truncateText(row.name, columns[1].maxChars),
          truncateText(row.email, columns[2].maxChars),
          truncateText(row.phone, columns[3].maxChars),
          truncateText(row.property_name ?? '—', columns[4].maxChars),
          truncateText(row.stage, columns[5].maxChars),
          truncateText(new Date(row.created_at).toISOString().slice(0, 10), columns[6].maxChars),
        ];
        cells.forEach((cellText, cIdx) => {
          const fontRef = cIdx === 0 || cIdx === 1 ? '/F2' : '/F1';
          ops.push(
            `BT ${fontRef} 8 Tf ${columns[cIdx].x} ${rowTop + 2} Td (${escapePdfText(cellText)}) Tj ET`
          );
        });
      });
    }

    const streamContent = ops.join('\n');
    addObject(
      pageObjId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`
    );
    addObject(
      contentObjId,
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`
    );
  });

  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  );
  addObject(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  objects.sort((a, b) => a.id - b.id);

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets[obj.id] = pdf.length;
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i] || 0).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

const S = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginBottom: '1.25rem',
  } as const,
  title: { fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0F172A' } as const,
  subtitle: { fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' } as const,
  actionsGroup: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' as const } as const,
  exportCsvBtn: {
    padding: '0.5rem 0.95rem',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    color: '#0F172A',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  } as const,
  exportPdfBtn: {
    padding: '0.5rem 0.95rem',
    borderRadius: 6,
    border: 'none',
    background: '#0F172A',
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  } as const,
  toolbarRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1rem',
  } as const,
  searchInput: {
    padding: '0.52rem 0.85rem',
    borderRadius: 6,
    border: '1px solid #CBD5E1',
    fontSize: '0.85rem',
    flex: '1 1 340px',
    maxWidth: 440,
    background: '#FFFFFF',
    color: '#0F172A',
  } as const,
  filterPills: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const } as const,
  pill: (active: boolean) =>
    ({
      padding: '0.38rem 0.78rem',
      borderRadius: 6,
      border: active ? '1px solid #0F172A' : '1px solid #E2E8F0',
      background: active ? '#F1F5F9' : '#FFFFFF',
      color: active ? '#0F172A' : '#475569',
      fontWeight: 600,
      fontSize: '0.78rem',
      cursor: 'pointer',
    }) as const,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    background: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
  },
  th: {
    padding: '0.7rem 1rem',
    background: '#F8FAFC',
    textAlign: 'left' as const,
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    borderBottom: '1px solid #E2E8F0',
  },
  td: { padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', color: '#1E293B', fontVariantNumeric: 'tabular-nums' },
};

export default function Leads() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [exportNotice, setExportNotice] = useState('');
  const [editing, setEditing] = useState<Lead | null>(null);
  const labels = inquiryLabels();
  const t = (key: keyof typeof labels) => labels[key];

  useEffect(() => {
    api
      .getLeads()
      .then((res) => setItems(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, []);

  const stages = useMemo(() => {
    const set = new Set<string>();
    items.forEach((l) => {
      if (l.stage) set.add(l.stage);
    });
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const pipelineSummary = useMemo(() => {
    let active = 0;
    let draft = 0;
    let closed = 0;
    let lost = 0;
    for (const l of items) {
      const st = (l.stage || l.status || '').trim().toLowerCase();
      if (st === 'new' || st === 'draft' || st === 'pending') {
        draft += 1;
      } else if (st === 'closed' || st === 'deal closed' || st === 'won') {
        closed += 1;
      } else if (st === 'lost' || st === 'deal lost') {
        lost += 1;
      } else {
        active += 1;
      }
    }
    const total = items.length;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      active,
      draft,
      closed,
      lost,
      activePct: pct(active),
      draftPct: pct(draft),
      closedPct: pct(closed),
      lostPct: pct(lost),
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((l) => {
      if (stageFilter !== 'ALL') {
        const st = (l.stage || l.status || '').trim().toLowerCase();
        if (stageFilter === 'BUCKET_ACTIVE') {
          if (['new', 'draft', 'pending', 'closed', 'deal closed', 'won', 'lost', 'deal lost'].includes(st)) return false;
        } else if (stageFilter === 'BUCKET_DRAFT') {
          if (!['new', 'draft', 'pending'].includes(st)) return false;
        } else if (stageFilter === 'BUCKET_CLOSED') {
          if (!['closed', 'deal closed', 'won'].includes(st)) return false;
        } else if (stageFilter === 'BUCKET_LOST') {
          if (!['lost', 'deal lost'].includes(st)) return false;
        } else if (l.stage !== stageFilter) {
          return false;
        }
      }
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.property_name ?? '').toLowerCase().includes(q) ||
        (l.message ?? '').toLowerCase().includes(q) ||
        (l.receipt_reference ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, stageFilter]);

  const triggerDownload = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const csv = buildAdminLeadsCsv(filteredItems);
    triggerDownload(csv, 'text/csv;charset=utf-8;', `attaie-admin-leads-${dateStamp}.csv`);
    setExportNotice(`Exported ${filteredItems.length} lead(s) from the current view to CSV.`);
  };

  const handleExportPdf = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const pdf = buildAdminLeadsPdf(
      filteredItems,
      `Filter: ${stageFilter} · Search: "${searchQuery || 'All'}" · Total Leads: ${filteredItems.length}`
    );
    triggerDownload(pdf, 'application/pdf', `attaie-admin-leads-${dateStamp}.pdf`);
    setExportNotice(`Exported ${filteredItems.length} lead(s) from the current view to PDF.`);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>Leads ({filteredItems.length})</h1>
          <p style={S.subtitle}>
            Manage website property inquiries and export the current filtered view to CSV or PDF.
          </p>
        </div>
        <div style={S.actionsGroup}>
          <button
            type="button"
            style={{ ...S.exportCsvBtn, opacity: filteredItems.length ? 1 : 0.5 }}
            data-testid="admin-export-leads-csv-btn"
            onClick={handleExportCsv}
            disabled={filteredItems.length === 0}
          >
            Export CSV ({filteredItems.length})
          </button>
          <button
            type="button"
            style={{ ...S.exportPdfBtn, opacity: filteredItems.length ? 1 : 0.5 }}
            data-testid="admin-export-leads-pdf-btn"
            onClick={handleExportPdf}
            disabled={filteredItems.length === 0}
          >
            Export PDF ({filteredItems.length})
          </button>
        </div>
      </div>

      {/* Pipeline Health Summary Card */}
      <div
        data-testid="admin-leads-pipeline-summary-card"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '1.15rem 1.25rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
              Pipeline Health Summary
            </strong>
            <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: '0.6rem' }}>
              Total leads broken down by status
            </span>
          </div>
          <span
            className="tabular-nums"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#F1F5F9',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              padding: '0.2rem 0.65rem',
              borderRadius: 6,
            }}
          >
            Total Leads: {pipelineSummary.total}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            height: 8,
            borderRadius: 6,
            overflow: 'hidden',
            background: '#F1F5F9',
            marginBottom: '0.9rem',
          }}
        >
          {pipelineSummary.active > 0 && (
            <div style={{ width: `${Math.max(5, pipelineSummary.activePct)}%`, background: '#0ea5e9' }} />
          )}
          {pipelineSummary.draft > 0 && (
            <div style={{ width: `${Math.max(5, pipelineSummary.draftPct)}%`, background: '#f59e0b' }} />
          )}
          {pipelineSummary.closed > 0 && (
            <div style={{ width: `${Math.max(5, pipelineSummary.closedPct)}%`, background: '#16a34a' }} />
          )}
          {pipelineSummary.lost > 0 && (
            <div style={{ width: `${Math.max(5, pipelineSummary.lostPct)}%`, background: '#dc2626' }} />
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            { key: 'ALL', label: 'Total Leads', count: pipelineSummary.total, pct: 100, dot: '#0F172A' },
            { key: 'BUCKET_ACTIVE', label: 'Active', count: pipelineSummary.active, pct: pipelineSummary.activePct, dot: '#0ea5e9' },
            { key: 'BUCKET_DRAFT', label: 'Draft / New', count: pipelineSummary.draft, pct: pipelineSummary.draftPct, dot: '#f59e0b' },
            { key: 'BUCKET_CLOSED', label: 'Closed', count: pipelineSummary.closed, pct: pipelineSummary.closedPct, dot: '#16a34a' },
            { key: 'BUCKET_LOST', label: 'Lost', count: pipelineSummary.lost, pct: pipelineSummary.lostPct, dot: '#dc2626' },
          ].map((stat) => {
            const active = stageFilter === stat.key;
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() => setStageFilter(stat.key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0.75rem 0.9rem',
                  borderRadius: 8,
                  border: active ? '1px solid #0F172A' : '1px solid #E2E8F0',
                  background: active ? '#F1F5F9' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#475569' }}>
                    {stat.label}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <strong className="tabular-nums" style={{ fontSize: '1.35rem', color: '#0F172A' }}>{stat.count}</strong>
                  <span className="tabular-nums" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>
                    {stat.pct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {exportNotice && (
        <div
          role="status"
          style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '0.7rem 1rem',
            borderRadius: 8,
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>✓ {exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#166534',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={S.toolbarRow}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search')}
          style={S.searchInput}
          aria-label="Search leads"
        />
        <div style={S.filterPills}>
          {stages.map((st) => (
            <button
              key={st}
              type="button"
              style={S.pill(stageFilter === st)}
              onClick={() => setStageFilter(st)}
            >
              {st === 'ALL' ? `All (${items.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {editing && <InquiryFollowupEditor key={editing.id} inquiry={editing} onClose={() => setEditing(null)} onSaved={updated => { setItems(current => current.map(item => item.id === updated.id ? updated : item)); setEditing(null); }} />}

      <div style={{ overflowX: 'auto' }}>
        <table style={S.table} data-testid="admin-leads-table">
          <thead>
            <tr>
              {['Name', 'Email', 'Phone', 'Property', 'Stage', 'Date'].map((h) => (
                <th key={h} style={S.th}>
                  {h}
                </th>
              ))}
              <th style={S.th}>{t('reference')}</th><th style={S.th}>{t('title')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((l) => (
              <tr key={l.id}>
                <td style={{ ...S.td, fontWeight: 600 }}>{l.name}</td>
                <td style={S.td}>{l.email}</td>
                <td style={S.td}>{l.phone}</td>
                <td style={S.td}>{l.property_name ?? '—'}</td>
                <td style={S.td}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      background: '#F1F5F9',
                      color: '#0F172A',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {l.stage}
                  </span>
                </td>
                <td style={S.td}>{new Date(l.created_at).toLocaleDateString()}</td>
                <td style={{...S.td,overflowWrap:'anywhere',maxWidth:230}} dir="ltr">{l.receipt_reference || '—'}</td>
                <td style={S.td}>
                  <p>{t(l.followup_status || 'new')}</p>
                  {l.followup_at && <p>{t('nextTime')}: <time dateTime={inquiryTime(l.followup_at)}>{new Date(inquiryTime(l.followup_at)).toLocaleString()}</time></p>}
                  <button type="button" onClick={() => setEditing(l)} style={{minHeight:44,padding:'0.5rem 0.75rem',background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:6,cursor:'pointer'}}>{t('edit')}</button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>
                  No leads match the current view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
