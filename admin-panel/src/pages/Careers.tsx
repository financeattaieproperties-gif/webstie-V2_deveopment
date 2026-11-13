import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type CareerJob } from '../api';

const S = {
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' as const, gap: '0.75rem' } as const,
  title:   { fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#0F172A' } as const,
  btnRow:  { display: 'flex', gap: '0.6rem', alignItems: 'center' } as const,
  addBtn:  { padding: '0.55rem 1.1rem', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' } as const,
  appsBtn: { padding: '0.55rem 1.1rem', background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.84rem' } as const,
  card:    { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' } as const,
  table:   { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.88rem' } as const,
  th:      { textAlign: 'left' as const, padding: '0.75rem 1rem', background: '#F8FAFC', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0', fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: 0.5 } as const,
  td:      { padding: '0.85rem 1rem', borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' as const, fontVariantNumeric: 'tabular-nums' } as const,
  actBtn:  (bg: string, color = '#fff', border = 'none') => ({
    padding: '0.35rem 0.7rem', background: bg, color, border, borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' as const,
  }),
  badge:   (status: string, isExpired?: boolean) => {
    if (status === 'draft') {
      return { display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, background: '#F1F5F9', color: '#475569' };
    }
    if (status === 'closed' || isExpired) {
      return { display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, background: '#FEE2E2', color: '#DC2626' };
    }
    return { display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, background: '#DCFCE7', color: '#15803D' };
  },
  errBox:  { padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, background: '#FEE2E2', color: '#DC2626', fontSize: '0.85rem', fontWeight: 600 } as const,
};

export default function Careers() {
  const [jobs, setJobs]       = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const navigate              = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    api.getCareers()
      .then(setJobs)
      .catch((err: Error) => setError(err.message || 'Failed to load career announcements'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const quickStatus = async (job: CareerJob, nextStatus: CareerJob['status']) => {
    setError(null);
    try {
      await api.updateCareer({
        id: job.id,
        title: job.title,
        location: job.location,
        employment_type: job.employment_type,
        description: job.description,
        qualifications: job.qualifications,
        deadline_at: job.deadline_at,
        status: nextStatus,
      });
      load();
    } catch (err) {
      setError((err as Error).message || 'Failed to update status');
    }
  };

  const remove = async (job: CareerJob) => {
    setError(null);
    try {
      await api.deleteCareer(job.id);
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (err) {
      setError((err as Error).message || 'Could not delete job announcement');
    }
  };

  return (
    <div>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Careers & Job Announcements</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Publish job openings, manage deadlines, and review candidate applications.
          </p>
        </div>
        <div style={S.btnRow}>
          <button style={S.appsBtn} onClick={() => navigate('/careers/applications')}>
            View All Applications
          </button>
          <button style={S.addBtn} onClick={() => navigate('/careers/new')}>
            + Post Job Opening
          </button>
        </div>
      </div>

      {error && <div style={S.errBox}>{error}</div>}

      <div style={S.card}>
        {loading ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>Loading career announcements…</p>
        ) : jobs.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ marginBottom: '1rem', fontWeight: 600 }}>No job announcements posted yet.</p>
            <button style={S.addBtn} onClick={() => navigate('/careers/new')}>+ Create First Job Announcement</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Title & Location</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Deadline (Kabul)</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Applications</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const statusLabel =
                    job.status === 'draft'
                      ? 'Draft'
                      : job.status === 'closed'
                      ? 'Closed'
                      : job.is_expired
                      ? 'Expired'
                      : 'Published';

                  return (
                    <tr key={job.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{job.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{job.location}</div>
                      </td>
                      <td style={S.td}>{job.employment_type}</td>
                      <td style={S.td}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem' }}>
                          {job.deadline_at.slice(0, 16).replace('T', ' ')}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={S.badge(job.status, job.is_expired)}>{statusLabel}</span>
                      </td>
                      <td style={S.td}>
                        <button
                          style={S.actBtn('#F1F5F9', '#0F172A', '1px solid #E2E8F0')}
                          onClick={() => navigate(`/careers/${job.id}/applications`)}
                        >
                          {job.application_count ?? 0} Applicants →
                        </button>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            style={S.actBtn('#0F172A')}
                            onClick={() => navigate(`/careers/${job.id}/edit`)}
                          >
                            Edit
                          </button>
                          {job.status !== 'published' && (
                            <button
                              style={S.actBtn('#15803d')}
                              onClick={() => quickStatus(job, 'published')}
                            >
                              Publish
                            </button>
                          )}
                          {job.status === 'published' && (
                            <button
                              style={S.actBtn('#d97706')}
                              onClick={() => quickStatus(job, 'closed')}
                            >
                              Close
                            </button>
                          )}
                          {job.status !== 'draft' && (
                            <button
                              style={S.actBtn('#e2e8f0', '#334155')}
                              onClick={() => quickStatus(job, 'draft')}
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            style={S.actBtn('#fee2e2', '#dc2626')}
                            onClick={() => remove(job)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
