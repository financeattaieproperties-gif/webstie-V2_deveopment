import { useEffect, useMemo, useState } from 'react';
import { api, type VisitRequest } from '../api';

const VALID_TRANSITIONS: Record<VisitRequest['status'], VisitRequest['status'][]> = {
  pending:   ['pending', 'confirmed', 'declined', 'cancelled'],
  confirmed: ['confirmed', 'completed', 'cancelled'],
  declined:  ['declined', 'pending'],
  completed: ['completed'],
  cancelled: ['cancelled', 'pending'],
};

const STATUS_BADGE: Record<VisitRequest['status'], { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#d1fae5', color: '#065f46' },
  declined:  { bg: '#fee2e2', color: '#991b1b' },
  completed: { bg: '#dbeafe', color: '#1e40af' },
  cancelled: { bg: '#f1f5f9', color: '#475569' },
};

const S = {
  title:      { fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', color: '#0F172A', fontVariantNumeric: 'tabular-nums' } as const,
  filterBar:  { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginBottom: '1.25rem', background: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: 8, border: '1px solid #E2E8F0' } as const,
  input:      { padding: '0.5rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', minWidth: 180, color: '#0F172A' } as const,
  select:     { padding: '0.5rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', background: '#FFFFFF', color: '#0F172A' } as const,
  card:       { background: '#FFFFFF', borderRadius: 8, padding: '1.25rem 1.5rem', border: '1px solid #E2E8F0', marginBottom: '1rem' } as const,
  noteInput:  { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.86rem', marginTop: '0.5rem', boxSizing: 'border-box' as const, color: '#0F172A' } as const,
  btn:        { padding: '0.45rem 1rem', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const } as const,
  clearBtn:   { padding: '0.45rem 0.9rem', background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const } as const,
};

export default function Visits() {
  const [items, setItems]               = useState<VisitRequest[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter]     = useState<string>('');
  const [searchQuery, setSearchQuery]   = useState<string>('');
  const [draftNotes, setDraftNotes]     = useState<Record<number, string>>({});
  const [draftStatus, setDraftStatus]   = useState<Record<number, VisitRequest['status']>>({});

  const load = () => {
    setError(null);
    return api.getVisitRequests()
      .then(list => {
        setItems(list);
        const notes: Record<number, string> = {};
        const statuses: Record<number, VisitRequest['status']> = {};
        for (const item of list) {
          notes[item.id] = item.staff_note ?? '';
          statuses[item.id] = item.status;
        }
        setDraftNotes(notes);
        setDraftStatus(statuses);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load visit requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (dateFilter) {
        const itemDate = item.requested_at.slice(0, 10);
        if (itemDate !== dateFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          item.listing_name.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [items, statusFilter, dateFilter, searchQuery]);

  const saveUpdate = async (item: VisitRequest) => {
    const nextStatus = draftStatus[item.id] ?? item.status;
    const nextNote   = draftNotes[item.id] ?? item.staff_note ?? '';
    setSaving(item.id);
    setError(null);
    try {
      await api.updateVisitRequest(item.id, nextStatus, nextNote);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update visit request');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1 style={S.title}>Visit Requests ({filteredItems.length} of {items.length})</h1>

      {/* Filters by status, date, and listing/customer */}
      <div style={S.filterBar}>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={S.select}
        >
          <option value="all">All Statuses</option>
          {(['pending', 'confirmed', 'declined', 'completed', 'cancelled'] as const).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <input
          type="date"
          aria-label="Filter by requested date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={S.input}
        />

        <input
          type="search"
          aria-label="Filter by listing, customer, or phone"
          placeholder="Search listing, name, or phone…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...S.input, flex: 1 }}
        />

        {(statusFilter !== 'all' || dateFilter || searchQuery) && (
          <button
            type="button"
            style={S.clearBtn}
            onClick={() => { setStatusFilter('all'); setDateFilter(''); setSearchQuery(''); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <p style={{ color: '#64748b' }}>No visit requests match the current filters.</p>
      ) : (
        filteredItems.map(item => {
          const allowedStatuses = VALID_TRANSITIONS[item.status] ?? [item.status];
          const currentDraftStatus = draftStatus[item.id] ?? item.status;
          const currentDraftNote = draftNotes[item.id] ?? item.staff_note ?? '';
          const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending;
          const reqDate = new Date(item.requested_at.endsWith('Z') ? item.requested_at : `${item.requested_at}Z`);

          return (
            <article key={item.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1.02rem', color: '#0F172A' }}>{item.name}</strong>
                    <span style={{ padding: '0.2rem 0.55rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', background: badge.bg, color: badge.color }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ margin: '0.35rem 0', color: '#475569', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    {item.listing_name} · <a href={`tel:+${item.phone}`} style={{ color: '#0F172A', fontWeight: 600, textDecoration: 'underline' }}>+{item.phone}</a>
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
                    Requested for (Kabul time): <strong style={{ color: '#0F172A' }}>{reqDate.toLocaleString('en-US', { timeZone: 'Asia/Kabul', dateStyle: 'medium', timeStyle: 'short' })}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    aria-label={`Visit status for ${item.name}`}
                    value={currentDraftStatus}
                    onChange={e => setDraftStatus(prev => ({ ...prev, [item.id]: e.target.value as VisitRequest['status'] }))}
                    disabled={saving === item.id}
                    style={S.select}
                  >
                    {allowedStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => saveUpdate(item)}
                    disabled={saving === item.id}
                    style={S.btn}
                  >
                    {saving === item.id ? 'Saving…' : 'Save Update'}
                  </button>
                </div>
              </div>

              {/* Staff Note Editor */}
              <div style={{ marginTop: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  Staff Note
                  <input
                    type="text"
                    value={currentDraftNote}
                    onChange={e => setDraftNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Add confirmation details, agent assigned, or follow-up notes…"
                    style={S.noteInput}
                  />
                </label>
              </div>

              {/* Audit History */}
              <details style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                  History ({item.events?.length ?? 0} events)
                </summary>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {(item.events ?? []).map((event, index) => (
                    <p key={index} style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      <strong>{event.previous_status ? `${event.previous_status} → ${event.next_status}` : event.next_status}</strong>
                      {' '}by <em>{event.actor}</em>
                      {' · '}{event.note || 'No note'}
                      {' · '}{new Date(event.created_at).toLocaleString()}
                    </p>
                  ))}
                </div>
              </details>
            </article>
          );
        })
      )}
    </div>
  );
}

