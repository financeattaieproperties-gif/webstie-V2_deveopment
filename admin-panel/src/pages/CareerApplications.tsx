import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type CareerApplication, type CareerJob } from '../api';

const S = {
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' as const, gap: '0.75rem' } as const,
  title:   { fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0F172A' } as const,
  backBtn: { padding: '0.55rem 1.1rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' } as const,
  filterBar: { display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' as const } as const,
  select:  { padding: '0.55rem 0.85rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', background: '#FFFFFF', minWidth: 260, color: '#0F172A' } as const,
  card:    { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '1rem' } as const,
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' } as const,
  btn:     (bg: string, color = '#fff', border = 'none') => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.42rem 0.8rem', background: bg, color, border, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'none', whiteSpace: 'nowrap' as const,
  }),
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.72)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' } as const,
  modalCard: { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', width: '100%', maxWidth: 880, maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' } as const,
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CareerApplications() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<number>(id ? Number(id) : 0);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [apps, setApps] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<{ title: string; url: string; mime: string; downloadUrl: string } | null>(null);

  useEffect(() => {
    api.getCareers().then(setJobs).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getCareerApplications(selectedJobId > 0 ? selectedJobId : undefined)
      .then(setApps)
      .catch((err: Error) => setError(err.message || 'Failed to load applications'))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  return (
    <div>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Submitted Job Applications</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            Review applicant details, photos, and CVs submitted through the public Careers portal.
          </p>
        </div>
        <button style={S.backBtn} onClick={() => navigate('/careers')}>
          ← Back to Job Announcements
        </button>
      </div>

      <div style={S.filterBar}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Filter by Job Opening:</label>
        <select
          style={S.select}
          value={selectedJobId}
          onChange={e => setSelectedJobId(Number(e.target.value))}
        >
          <option value={0}>All Job Announcements ({apps.length})</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.location})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontSize: '0.85rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ ...S.card, padding: '2rem', color: '#64748B' }}>Loading applications…</div>
      ) : apps.length === 0 ? (
        <div style={{ ...S.card, padding: '3rem 2rem', textAlign: 'center', color: '#64748B' }}>
          No job applications found for the selected filter.
        </div>
      ) : (
        <div style={S.grid}>
          {apps.map(app => {
            const photoViewUrl = api.getCareerFileUrl(app.id, 'photo', false);
            const photoDlUrl   = api.getCareerFileUrl(app.id, 'photo', true);
            const cvViewUrl    = api.getCareerFileUrl(app.id, 'cv', false);
            const cvDlUrl      = api.getCareerFileUrl(app.id, 'cv', true);

            return (
              <div key={app.id} style={{ ...S.card, padding: '1.25rem 1.5rem', marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <img
                    src={photoViewUrl}
                    alt={app.name}
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => setPreviewItem({
                      title: `${app.name} — Applicant Photo`,
                      url: photoViewUrl,
                      mime: app.photo_mime_type,
                      downloadUrl: photoDlUrl,
                    })}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      {app.job_title}
                    </div>
                    <h3 style={{ margin: '0.15rem 0', fontSize: '1.02rem', fontWeight: 700, color: '#0F172A' }}>
                      {app.name}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Father&apos;s Name: <strong style={{ color: '#334155' }}>{app.father_name}</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' }}>
                      Submitted: {app.created_at.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.83rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, marginBottom: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                  <div><strong>Email:</strong> <a href={`mailto:${app.email}`} style={{ color: '#0F172A', textDecoration: 'underline' }}>{app.email}</a></div>
                  <div><strong>Phone:</strong> <a href={`tel:${app.phone}`} style={{ color: '#0F172A', textDecoration: 'underline' }}>{app.phone}</a></div>
                  <div><strong>Address:</strong> {app.address}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontVariantNumeric: 'tabular-nums' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569' }}>
                    <span>Photo ({formatBytes(app.photo_size)})</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        style={S.btn('#F8FAFC', '#0F172A', '1px solid #E2E8F0')}
                        onClick={() => setPreviewItem({
                          title: `${app.name} — Applicant Photo`,
                          url: photoViewUrl,
                          mime: app.photo_mime_type,
                          downloadUrl: photoDlUrl,
                        })}
                      >
                        Preview
                      </button>
                      <a href={photoDlUrl} download={app.photo_original_name} style={S.btn('#0F172A')}>
                        Download
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {app.cv_original_name} ({formatBytes(app.cv_size)})
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {app.cv_mime_type === 'application/pdf' && (
                        <button
                          type="button"
                          style={S.btn('#F8FAFC', '#0F172A', '1px solid #E2E8F0')}
                          onClick={() => setPreviewItem({
                            title: `${app.name} — CV (${app.cv_original_name})`,
                            url: cvViewUrl,
                            mime: app.cv_mime_type,
                            downloadUrl: cvDlUrl,
                          })}
                        >
                          Preview PDF
                        </button>
                      )}
                      <a href={cvDlUrl} download={app.cv_original_name} style={S.btn('#0F172A')}>
                        Download CV
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewItem && (
        <div style={S.modalOverlay} onClick={() => setPreviewItem(null)}>
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{previewItem.title}</strong>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={previewItem.downloadUrl} download style={S.btn('#0F172A')}>
                  Download File
                </a>
                <button type="button" style={S.btn('#F8FAFC', '#334155', '1px solid #E2E8F0')} onClick={() => setPreviewItem(null)}>
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, overflow: 'auto', padding: '1rem' }}>
              {previewItem.mime.startsWith('image/') ? (
                <img src={previewItem.url} alt={previewItem.title} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <iframe src={previewItem.url} title={previewItem.title} style={{ width: '100%', height: '75vh', border: 'none', background: '#fff', borderRadius: 8 }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
