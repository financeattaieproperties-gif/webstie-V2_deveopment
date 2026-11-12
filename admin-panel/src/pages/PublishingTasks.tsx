import { useEffect, useState } from 'react';
import { api, type SubmissionPost } from '../api';

const S = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1.5rem',
  } as const,
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1A2335',
    margin: 0,
  } as const,
  subtitle: {
    fontSize: '0.88rem',
    color: '#6B7280',
    marginTop: '0.3rem',
  } as const,
  isolationBanner: {
    background: '#F0FDFA',
    border: '1px solid #99F6E4',
    borderRadius: 12,
    padding: '0.85rem 1.1rem',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    color: '#0B3D3B',
    fontSize: '0.84rem',
  } as const,
  filterRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1.25rem',
  } as const,
  pill: (active: boolean) =>
    ({
      padding: '0.45rem 0.9rem',
      borderRadius: 8,
      border: active ? '1.5px solid #B8944A' : '1px solid #E5E7EB',
      background: active ? '#FFF8EE' : '#FFFFFF',
      color: active ? '#B8944A' : '#4B5563',
      fontWeight: 700,
      fontSize: '0.82rem',
      cursor: 'pointer',
    }) as const,
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 14,
    padding: '1.35rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  } as const,
  serialBadge: {
    display: 'inline-block',
    background: '#1A2335',
    color: '#F5EFE6',
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: '0.82rem',
    padding: '0.25rem 0.65rem',
    borderRadius: 6,
    letterSpacing: '0.03em',
  } as const,
  statusBadge: (status: SubmissionPost['submission_status']) => {
    const map: Record<SubmissionPost['submission_status'], { bg: string; color: string; border: string }> = {
      Submitted: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
      Approved: { bg: '#E0F2FE', color: '#075985', border: '#BAE6FD' },
      Published: { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
      Rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    };
    const c = map[status] || map.Submitted;
    return {
      display: 'inline-block',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      fontWeight: 700,
      fontSize: '0.76rem',
      padding: '0.2rem 0.65rem',
      borderRadius: 6,
    } as const;
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.6rem',
    marginTop: '0.85rem',
  } as const,
  photoThumb: {
    width: '100%',
    height: 86,
    objectFit: 'cover' as const,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
  } as const,
  btnApprove: {
    padding: '0.55rem 1rem',
    background: '#0284C7',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as const,
  btnPublish: {
    padding: '0.55rem 1.1rem',
    background: '#B8944A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as const,
  btnReject: {
    padding: '0.55rem 0.95rem',
    background: '#FFFFFF',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
  } as const,
  input: {
    padding: '0.45rem 0.7rem',
    border: '1px solid #D1D5DB',
    borderRadius: 7,
    fontSize: '0.82rem',
  } as const,
};

export default function PublishingTasks() {
  const [submissions, setSubmissions] = useState<SubmissionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | SubmissionPost['submission_status']>('ALL');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishPrice, setPublishPrice] = useState<Record<number, string>>({});
  const [publishListingType, setPublishListingType] = useState<Record<number, 'sale' | 'rent'>>({});
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await api.getSubmissions();
      setSubmissions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load submission queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAction = async (
    item: SubmissionPost,
    action: 'approve' | 'publish' | 'reject'
  ) => {
    setNotice('');
    setError('');
    setPublishingId(item.id);
    try {
      const priceVal = Number(publishPrice[item.id] ?? 245000);
      const lType = publishListingType[item.id] ?? 'sale';
      const reason = rejectReason[item.id] ?? 'Requires updated property photos or verified address.';
      const res = await api.updateSubmissionStatus({
        id: item.id,
        action,
        price: Number.isFinite(priceVal) && priceVal > 0 ? priceVal : 245000,
        listing_type: lType,
        beds: 3,
        baths: 2,
        area: 165,
        floor: 4,
        reason,
      });
      setNotice(
        action === 'publish'
          ? `Published ${item.property_serial} to Public Website Database (Property #${res.website_property_id ?? 'new'}).`
          : `Updated ${item.property_serial} status to ${res.submission_status}.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update submission.');
    } finally {
      setPublishingId(null);
    }
  };

  const filtered = submissions.filter(
    (s) => filter === 'ALL' || s.submission_status === filter
  );

  return (
    <div>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Website Publishing Tasks (Isolated Submission DB)</h1>
          <p style={S.subtitle}>
            Review completed Marketing &amp; Production posts from the isolated 3rd Submission Database and publish approved listings to the Website.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            background: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          ↻ Refresh Queue
        </button>
      </div>

      <div style={S.isolationBanner}>
        <div>
          <strong>Three-Database Isolation Boundary (UDR-003 / UDR-004):</strong> This view reads only from the isolated{' '}
          <code>Submission Database</code> and writes approved listings into the <code>Website Database</code>. No connection to the Internal Office CRM Database exists.
        </div>
        <span
          style={{
            background: '#0B3D3B',
            color: '#99F6E4',
            padding: '0.25rem 0.65rem',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        >
          Submission DB → Website DB
        </span>
      </div>

      {notice && (
        <div
          style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: 10,
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.86rem',
          }}
        >
          ✓ {notice}
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: 10,
            marginBottom: '1rem',
            fontWeight: 600,
            fontSize: '0.86rem',
          }}
        >
          ⚠ {error}
        </div>
      )}

      <div style={S.filterRow}>
        {(['ALL', 'Submitted', 'Approved', 'Published', 'Rejected'] as const).map((st) => (
          <button
            key={st}
            type="button"
            style={S.pill(filter === st)}
            onClick={() => setFilter(st)}
          >
            {st === 'ALL' ? `All Submissions (${submissions.length})` : `${st} (${submissions.filter((s) => s.submission_status === st).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Loading isolated submission queue…</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', color: '#6B7280', padding: '2.5rem' }}>
          No submission posts match the selected status filter.
        </div>
      ) : (
        filtered.map((item) => (
          <div key={item.id} style={S.card} data-testid={`submission-card-${item.id}`}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.85rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={S.serialBadge}>{item.property_serial}</span>
                  <span style={S.statusBadge(item.submission_status)}>{item.submission_status}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
                    Platform: {item.social_platform}
                  </span>
                </div>
                <h3 style={{ margin: '0.5rem 0 0.2rem', fontSize: '1.08rem', color: '#1A2335' }}>
                  {item.property_type} — {item.address}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                  Customer / Owner: <strong>{item.customer_name}</strong> · Submitted by:{' '}
                  <strong>{item.submitted_by}</strong>
                  {item.website_property_id ? (
                    <>
                      {' '}
                      · Website Listing ID: <strong>#{item.website_property_id}</strong>
                    </>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {item.submission_status === 'Submitted' && (
                  <button
                    type="button"
                    style={S.btnApprove}
                    disabled={publishingId === item.id}
                    onClick={() => void handleAction(item, 'approve')}
                  >
                    ✓ Approve Submission
                  </button>
                )}
                {(item.submission_status === 'Submitted' || item.submission_status === 'Approved') && (
                  <>
                    <input
                      type="number"
                      placeholder="Price USD (e.g. 245000)"
                      value={publishPrice[item.id] ?? '245000'}
                      onChange={(e) =>
                        setPublishPrice((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      style={{ ...S.input, width: 135 }}
                      aria-label="Listing price USD"
                    />
                    <select
                      value={publishListingType[item.id] ?? 'sale'}
                      onChange={(e) =>
                        setPublishListingType((prev) => ({
                          ...prev,
                          [item.id]: e.target.value as 'sale' | 'rent',
                        }))
                      }
                      style={S.input}
                      aria-label="Listing type"
                    >
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                    <button
                      type="button"
                      style={S.btnPublish}
                      disabled={publishingId === item.id}
                      onClick={() => void handleAction(item, 'publish')}
                    >
                      🌐 Publish to Website
                    </button>
                  </>
                )}
                {item.submission_status !== 'Published' && item.submission_status !== 'Rejected' && (
                  <>
                    <input
                      type="text"
                      placeholder="Reject reason (optional)"
                      value={rejectReason[item.id] ?? ''}
                      onChange={(e) =>
                        setRejectReason((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      style={{ ...S.input, width: 170 }}
                      aria-label="Rejection reason"
                    />
                    <button
                      type="button"
                      style={S.btnReject}
                      disabled={publishingId === item.id}
                      onClick={() => void handleAction(item, 'reject')}
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                borderRadius: 8,
                padding: '0.75rem 0.95rem',
                fontSize: '0.85rem',
                color: '#374151',
                lineHeight: 1.5,
              }}
            >
              <strong>Property Information Note:</strong> {item.property_info_note}
            </div>

            {item.rejected_reason && (
              <div
                style={{
                  marginTop: '0.6rem',
                  color: '#991B1B',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Rejected Reason: {item.rejected_reason}
              </div>
            )}

            <div style={S.photoGrid}>
              {(item.photos || []).map((photoUrl, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img
                    src={photoUrl}
                    alt={`${item.property_serial} photo ${idx + 1}`}
                    style={S.photoThumb}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      background: 'rgba(26,35,53,0.82)',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 4,
                    }}
                  >
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
