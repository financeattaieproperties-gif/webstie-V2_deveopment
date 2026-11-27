import { useCallback, useEffect, useState } from 'react';
import {
  customerAgencyApi,
  type AgencyApplication,
  type AgencyDocument,
  type RepresentativeInfo,
} from '../../lib/customerAgencyClient';

/**
 * Private, authenticated customer onboarding component.
 *
 * Not routed publicly until the customer Firebase login UI and token lifecycle
 * are implemented. Parent must pass a short-lived, refreshed Firebase ID token.
 */
export function AgencyOnboarding({ idToken }: { idToken: string }) {
  const [agency, setAgency] = useState<AgencyApplication | null>(null);
  const [documents, setDocuments] = useState<AgencyDocument[]>([]);
  const [agencyName, setAgencyName] = useState('');
  const [publicName, setPublicName] = useState('');
  const [registrationReference, setRegistrationReference] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState<RepresentativeInfo>({
    representative_name: '', representative_position: '',
    representative_contact_method: 'email', business_email: '', business_phone_e164: '',
  });
  const [documentType, setDocumentType] = useState<'registration' | 'license'>('license');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    setError('');
    const result = await customerAgencyApi.getApplication(idToken);
    setAgency(result.agency);
    if (result.agency) {
      const [rep, docs] = await Promise.all([
        customerAgencyApi.getRepresentative(idToken),
        customerAgencyApi.getDocuments(idToken),
      ]);
      setContact({
        representative_name: rep.agency.representative_name ?? '',
        representative_position: rep.agency.representative_position ?? '',
        representative_contact_method: rep.agency.representative_contact_method ?? 'email',
        business_email: rep.agency.business_email ?? '',
        business_phone_e164: rep.agency.business_phone_e164 ?? '',
      });
      setDocuments(docs.documents);
      setAgencyName(result.agency.legal_name);
      setPublicName(result.agency.public_name);
      setRegistrationReference(result.agency.registration_reference ?? '');
      setDescription(result.agency.description ?? '');
    }
  }, [idToken]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    reload().catch((reason: unknown) => {
      if (current) setError(reason instanceof Error ? reason.message : 'Could not load your agency.');
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [reload]);

  async function perform(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      await reload();
      setMessage(success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete request.');
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = 'w-full rounded-xl border border-slate-300 p-3 text-slate-950 bg-white focus-visible:outline-2 focus-visible:outline-amber-600';

  if (!idToken) return <p role="alert">Sign in with a verified email or phone to apply for an agency account.</p>;
  return (
    <section className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">Real estate agency registration</h1>
        <p className="text-sm text-slate-600">
          Use your verified personal email or phone for identity. Provide separate business contacts
          for manual Website Admin review.
        </p>
      </header>
      {loading && <p role="status">Loading agency application…</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{message}</p>}
      {!loading && !agency && (
        <form className="space-y-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200"
          onSubmit={(event) => {
            event.preventDefault();
            void perform(() => customerAgencyApi.createApplication(idToken, {
              legal_name: agencyName, public_name: publicName,
              registration_reference: registrationReference, description,
            }), 'Agency application created. Next, add representative details and documents.');
          }}>
          <h2 className="text-lg font-semibold">Business profile</h2>
          <label className="block text-sm font-medium">Registered business name
            <input required maxLength={200} className={fieldClass} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Public agency name
            <input required maxLength={200} className={fieldClass} value={publicName} onChange={(e) => setPublicName(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Registration reference (if applicable)
            <input maxLength={100} className={fieldClass} value={registrationReference} onChange={(e) => setRegistrationReference(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Business description
            <textarea maxLength={2000} rows={3} className={fieldClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50">
            Create agency application
          </button>
        </form>
      )}
      {agency && (
        <>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{agency.public_name}</p>
            <p className="text-sm text-slate-600">Application: <strong className="capitalize">{agency.verification_status}</strong></p>
            {agency.rejection_reason && <p className="mt-2 text-sm text-red-800">Review feedback: {agency.rejection_reason}</p>}
            {agency.verification_status === 'rejected' && (
              <button type="button" disabled={busy} className="mt-3 rounded-xl bg-slate-950 text-white px-4 py-2 disabled:opacity-50"
                onClick={() => void perform(() => customerAgencyApi.startRevision(idToken,agency.version),
                  'Correction window opened. Update your information and documents, then submit for review.')}>
                Correct and resubmit
              </button>
            )}
            {agency.verification_status === 'revision' && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-700">Correction round {agency.review_round}. Your previous review decisions and documents remain in the private audit history.</p>
                <form className="space-y-3" onSubmit={(event) => {
                  event.preventDefault();
                  void perform(() => customerAgencyApi.updateBusinessProfile(idToken,agency.version,{
                    legal_name:agencyName,public_name:publicName,registration_reference:registrationReference,description
                  }), 'Agency business profile updated.');
                }}>
                  <label className="block text-sm font-medium">Registered business name
                    <input required maxLength={200} className={fieldClass} value={agencyName} onChange={(e) => setAgencyName(e.target.value)}/>
                  </label>
                  <label className="block text-sm font-medium">Public agency name
                    <input required maxLength={200} className={fieldClass} value={publicName} onChange={(e) => setPublicName(e.target.value)}/>
                  </label>
                  <label className="block text-sm font-medium">Registration reference
                    <input maxLength={100} className={fieldClass} value={registrationReference} onChange={(e) => setRegistrationReference(e.target.value)}/>
                  </label>
                  <label className="block text-sm font-medium">Description
                    <textarea maxLength={2000} rows={3} className={fieldClass} value={description} onChange={(e) => setDescription(e.target.value)}/>
                  </label>
                  <button disabled={busy} className="rounded-xl border border-slate-900 px-4 py-2 font-semibold disabled:opacity-50">
                    Save corrected business profile
                  </button>
                </form>
                <button type="button" disabled={busy} className="rounded-xl bg-emerald-800 text-white px-5 py-3 font-semibold disabled:opacity-50"
                  onClick={() => void perform(() => customerAgencyApi.resubmit(idToken,agency.version),
                    'Revised agency application submitted to Website Admin for another review.')}>
                  Submit revised application for review
                </button>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">Agency verification does not automatically publish any listing.</p>
          </div>
          {(agency.verification_status === 'pending' || agency.verification_status === 'revision') && (
            <form className="space-y-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200"
              onSubmit={(event) => {
                event.preventDefault();
                void perform(() => customerAgencyApi.saveRepresentative(idToken, contact),
                  'Representative and business contacts saved for manual review.');
              }}>
              <h2 className="text-lg font-semibold">Representative and contacts</h2>
              <label className="block text-sm font-medium">Representative full name
                <input required maxLength={160} className={fieldClass} value={contact.representative_name}
                  onChange={(e) => setContact((old) => ({ ...old, representative_name: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium">Representative position
                <input required maxLength={120} className={fieldClass} value={contact.representative_position}
                  onChange={(e) => setContact((old) => ({ ...old, representative_position: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium">Owner's verified contact method
                <select className={fieldClass} value={contact.representative_contact_method}
                  onChange={(e) => setContact((old) => ({ ...old, representative_contact_method: e.target.value as 'email' | 'phone' }))}>
                  <option value="email">Verified email</option>
                  <option value="phone">Verified phone</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Agency business email
                <input type="email" maxLength={254} className={fieldClass} value={contact.business_email}
                  onChange={(e) => setContact((old) => ({ ...old, business_email: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium">Agency business phone (international format, e.g. +93…)
                <input type="tel" maxLength={16} className={fieldClass} value={contact.business_phone_e164}
                  onChange={(e) => setContact((old) => ({ ...old, business_phone_e164: e.target.value }))} />
              </label>
              <p className="text-xs text-slate-600">Provide at least one business contact; Website Admin must review it. This does not verify it by OTP.</p>
              <button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50">
                Save verification details
              </button>
            </form>
          )}
          <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold">Registration / license documents</h2>
            <p className="text-sm text-slate-600">Private files, visible to authorized Website Admin only. Accepted: PDF, JPEG, PNG; maximum 5 MB each, up to six documents.</p>
            <ul className="space-y-1 text-sm">
              {documents.map((doc) => <li key={doc.id}>{doc.document_type}: {doc.original_filename} ({Math.ceil(doc.byte_size / 1024)} KB)</li>)}
            </ul>
            {agency.verification_status === 'pending' && (
              <form className="space-y-3" onSubmit={(event) => {
                event.preventDefault();
                if (!selectedFile) { setError('Choose a document first.'); return; }
                if (selectedFile.size > 5 * 1024 * 1024) { setError('Document exceeds 5 MB.'); return; }
                void perform(() => customerAgencyApi.uploadDocument(idToken, documentType, selectedFile),
                  'Document uploaded privately for administrator review.');
              }}>
                <label className="block text-sm font-medium">Document category
                  <select className={fieldClass} value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as 'registration' | 'license')}>
                    <option value="registration">Business registration</option>
                    <option value="license">Business license</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">Select document
                  <input required type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    className={fieldClass} onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                </label>
                <button disabled={busy || !selectedFile || documents.length >= 6}
                  className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50">
                  Upload verification document
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </section>
  );
}
