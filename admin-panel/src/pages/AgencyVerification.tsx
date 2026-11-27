import { useCallback, useEffect, useState } from 'react';
import { api, type CustomerAgencyReview } from '../api';

type Filter = 'pending' | 'verified' | 'rejected' | 'all';

export default function AgencyVerification() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [items, setItems] = useState<CustomerAgencyReview[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [documents, setDocuments] = useState<Record<number, Array<{id:number;document_type:string;original_filename:string;byte_size:number}>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getCustomerAgencies(filter);
      setItems(response.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load agency applications.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  async function inspect(agencyId: number) {
    setError('');
    try {
      const response = await api.getCustomerAgencyDocuments(agencyId);
      setDocuments((current) => ({ ...current, [agencyId]: response.documents }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to inspect documents.');
    }
  }

  async function review(item: CustomerAgencyReview, decision: 'verified' | 'rejected') {
    const reason = (reasons[item.id] ?? '').trim();
    if (decision === 'rejected' && !reason) {
      setError('Enter a rejection reason before rejecting an agency.');
      return;
    }
    const confirmed = window.confirm(
      decision === 'verified'
        ? `Verify ${item.public_name}? Ensure the representative, verified contact and business document have been checked.`
        : `Reject ${item.public_name} with the stated reason?`
    );
    if (!confirmed) return;
    setBusy(item.id);
    setError('');
    setNotice('');
    try {
      await api.reviewCustomerAgency({ agency_id: item.id, version: item.version, decision, reason });
      setNotice(`Agency ${decision === 'verified' ? 'verified' : 'rejected'} successfully.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review could not be confirmed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="p-4 md:p-7 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Agency verification</h1>
        <p className="text-sm text-slate-600 mt-1">Review agency documents and verified representative contact details. Only authorized Website Admin users can decide.</p>
      </header>

      <div className="flex gap-2 flex-wrap" aria-label="Filter agency verification status">
        {(['pending', 'verified', 'rejected', 'all'] as const).map((option) => (
          <button key={option} type="button" onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`px-4 py-2 rounded-lg border text-sm capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${filter === option ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-300'}`}>
            {option}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">{notice}</p>}
      {loading ? <p role="status">Loading agencies…</p> : items.length === 0 ? <p>No matching agencies.</p> :
        <div className="grid gap-4">
          {items.map((agency) => (
            <article key={agency.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold text-lg">{agency.public_name}</h2>
                  <p className="text-sm text-slate-600">{agency.legal_name} · {agency.registration_reference || 'No registration reference provided'}</p>
                </div>
                <span className="text-sm font-semibold capitalize">{agency.verification_status}</span>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div><dt className="font-medium">Representative</dt><dd>{agency.representative_name || 'Not provided'} — {agency.representative_position || 'Role missing'}</dd></div>
                <div><dt className="font-medium">Contact method</dt><dd>{agency.representative_contact_method || 'Missing'} · {agency.representative_contact_method === 'email' ? (agency.email_verified ? 'Verified' : 'Unverified') : agency.representative_contact_method === 'phone' ? (agency.phone_verified ? 'Verified' : 'Unverified') : 'Not selected'}</dd></div>
                <div><dt className="font-medium">Owner</dt><dd>{agency.owner_name || 'Customer'} · {agency.owner_status}</dd></div>
                <div><dt className="font-medium">Uploaded documents</dt><dd>{agency.document_count}</dd></div>
              </dl>
              <button type="button" onClick={() => void inspect(agency.id)} className="text-sm font-semibold underline underline-offset-4">
                Inspect private documents
              </button>
              {documents[agency.id] && <ul className="text-sm space-y-2">
                {documents[agency.id].map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg p-2">
                    <span>{doc.document_type}: {doc.original_filename} ({Math.ceil(doc.byte_size / 1024)} KB)</span>
                    <button type="button" className="text-blue-800 underline" onClick={() => void api.downloadCustomerAgencyDocument(agency.id, doc.id, doc.original_filename)}>Download</button>
                  </li>
                ))}
              </ul>}
              {agency.verification_status === 'pending' && <div className="border-t border-slate-200 pt-3 space-y-2">
                <label htmlFor={`reason-${agency.id}`} className="block text-sm font-medium">Review reason (required for rejection)</label>
                <textarea id={`reason-${agency.id}`} maxLength={1000} rows={2}
                  value={reasons[agency.id] ?? ''} onChange={(e) => setReasons((old) => ({ ...old, [agency.id]: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="Explain missing documents or why this agency cannot be verified." />
                <div className="flex gap-2 flex-wrap">
                  <button type="button" disabled={busy !== null} onClick={() => void review(agency, 'verified')}
                    className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50">Approve agency</button>
                  <button type="button" disabled={busy !== null} onClick={() => void review(agency, 'rejected')}
                    className="rounded-lg border border-red-300 text-red-800 px-4 py-2 text-sm disabled:opacity-50">Reject agency</button>
                </div>
              </div>}
            </article>
          ))}
        </div>}
    </section>
  );
}
