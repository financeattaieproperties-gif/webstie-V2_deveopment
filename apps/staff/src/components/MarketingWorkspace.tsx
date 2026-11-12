import React, { useState } from 'react';
import { readUpload } from './readUpload';
import type {
  MarketingProductionEntry,
  Role,
  StaffUser,
  SubmissionPost,
} from '../../../../packages/staff-contracts/types';

export interface MarketingWorkspaceProps {
  entries: MarketingProductionEntry[];
  submissions: SubmissionPost[];
  staffUsers: StaffUser[];
  actorRole: Role;
  onUpload: (dataUrl: string, fileName: string, purpose: string) => Promise<{url: string}>;
  onCreateEntry: (payload: {
    customerName: string;
    address: string;
    propertyType: 'Villa' | 'Block' | 'Building' | 'Apartment';
  }) => Promise<unknown>;
  onAdvanceEntry: (
    entryId: number,
    action:
      | 'schedule_filming'
      | 'complete_filming'
      | 'schedule_editing'
      | 'ready_for_post'
      | 'mark_posted',
    payload: Record<string, unknown>
  ) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function MarketingWorkspace({
  entries,
  submissions,
  staffUsers,
  actorRole,
  onUpload,
  onCreateEntry,
  onAdvanceEntry,
  onNotice,
  onError,
}: MarketingWorkspaceProps) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<
    'Villa' | 'Block' | 'Building' | 'Apartment'
  >('Villa');

  // Editor "Mark Posted" modal/inline state
  const [postingEntryId, setPostingEntryId] = useState<number | null>(null);
  const [postSerial, setPostSerial] = useState('');
  const [postNote, setPostNote] = useState('');
  const [postPlatform, setPostPlatform] = useState<
    'Facebook' | 'YouTube' | 'Instagram'
  >('Instagram');
  const [postPhotos, setPostPhotos] = useState<string[]>([]);

  const videographers = staffUsers.filter(
    (u) => u.role === 'videographer'
  );

  const canScheduleFilming = [
    'marketing_manager',
    'manager',
    'ceo',
  ].includes(actorRole);
  const canCompleteFilming = [
    'videographer',
    'marketing_manager',
  ].includes(actorRole);
  const isEditor = actorRole === 'editor';

  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateEntry({ customerName, address, propertyType });
      setCustomerName('');
      setAddress('');
      onNotice('Property submitted to Marketing & Production queue.');
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const handleCompletePosted = async (entryId: number) => {
    try {
      await onAdvanceEntry(entryId, 'mark_posted', {
        version: entries.find(e => e.id === entryId)?.version,
        serialNumber: postSerial,
        propertyInfoNote: postNote,
        photos: postPhotos,
        platform: postPlatform,
      });
      setPostingEntryId(null);
      onNotice(
        `Entry marked Posted (${postSerial}) and queued as 'Submitted' in the isolated Submission Database for Admin publishing.`
      );
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <section className="panel" data-testid="marketing-workspace">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Marketing & Media Production Department</p>
          <h2>Filming, Editing & Social Post Production Pipeline</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge active">
            Active Production: {entries.filter((e) => e.stage !== 'posted').length}
          </span>
          <span className="badge closed">
            Posted & Sent to Submissions DB: {entries.filter((e) => e.stage === 'posted').length}
          </span>
        </div>
      </div>

      {/* Submit Property for Marketing Production */}
      <form
        className="panel"
        style={{ marginTop: 12, marginBottom: 16, borderStyle: 'dashed' }}
        onSubmit={handleSubmitProperty}
        data-testid="marketing-submit-property-form"
      >
        <h3 style={{ marginTop: 0 }}>
          Submit Property for Filming & Media Production
        </h3>
        <div className="form-grid">
          <div className="field">
            <label>Customer / Owner Name</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Haji Mirwais"
            />
          </div>
          <div className="field">
            <label>Property Address</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street 10, Wazir Akbar Khan, Kabul"
            />
          </div>
          <div className="field">
            <label>Property Type</label>
            <select
              value={propertyType}
              onChange={(e) =>
                setPropertyType(
                  e.target.value as 'Villa' | 'Block' | 'Building' | 'Apartment'
                )
              }
            >
              <option value="Villa">Villa</option>
              <option value="Block">Block</option>
              <option value="Building">Building</option>
              <option value="Apartment">Apartment</option>
            </select>
          </div>
        </div>
        <div className="modal-actions" style={{ marginTop: 10 }}>
          <button
            type="submit"
            className="button"
            data-testid="submit-marketing-property-btn"
          >
            Submit Property to Marketing Queue
          </button>
        </div>
      </form>

      {/* Production Pipeline Table */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Property & Owner</th>
              <th>Type</th>
              <th>Filming Schedule</th>
              <th>Editing & Content Type</th>
              <th>Post Serial & Platform</th>
              <th>Stage</th>
              <th>Role Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} data-testid={`marketing-row-${entry.id}`}>
                <td>
                  <strong>{entry.customerName}</strong>
                  <small>{entry.address}</small>
                </td>
                <td>{entry.propertyType}</td>
                <td>
                  {entry.filmingDate ? (
                    <>
                      <strong>{entry.filmingDate}</strong>
                      <small>Videographer: {entry.videographerName || 'Jawad Noori'}</small>
                    </>
                  ) : (
                    <small>Unscheduled</small>
                  )}
                </td>
                <td>
                  {entry.editingDeadlineAt ? (
                    <>
                      <strong>Due: {entry.editingDeadlineAt}</strong>
                      <small>{entry.contentType || 'Editing in progress'}</small>
                    </>
                  ) : (
                    <small>Awaiting filming</small>
                  )}
                </td>
                <td>
                  {entry.serialNumber ? (
                    <>
                      <strong>{entry.serialNumber}</strong>
                      <small>{entry.platform} ({entry.photos.length} photos)</small>
                    </>
                  ) : (
                    <small>Not posted yet</small>
                  )}
                </td>
                <td>
                  <span className={`badge ${entry.stage}`}>{entry.stage}</span>
                </td>
                <td>
                  {entry.stage === 'submitted' && canScheduleFilming && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await onAdvanceEntry(entry.id, 'schedule_filming', {
                            version: entry.version,
                            filmingDate: window.prompt('Filming date (YYYY-MM-DD)') || '',
                            videographerId: Number(window.prompt('Videographer staff ID: ' + videographers.map(u => `${u.id}: ${u.name}`).join(', ')) || 0),
                          });
                          onNotice(`Scheduled filming for ${entry.customerName}.`);
                        } catch (err) {
                          onError((err as Error).message);
                        }
                      }}
                    >
                      Schedule Filming
                    </button>
                  )}
                  {entry.stage === 'filming_scheduled' && canCompleteFilming && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await onAdvanceEntry(entry.id, 'complete_filming', {version: entry.version});
                          onNotice(`Filming completed for ${entry.customerName}; sent to Editor queue.`);
                        } catch (err) {
                          onError((err as Error).message);
                        }
                      }}
                    >
                      Mark Filming Completed
                    </button>
                  )}
                  {entry.stage === 'filming_completed' && isEditor && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await onAdvanceEntry(entry.id, 'schedule_editing', {
                            version: entry.version,
                            editingDeadlineAt: window.prompt('Editing deadline (YYYY-MM-DD)') || '',
                          });
                          onNotice('Editing deadline set.');
                        } catch (err) {
                          onError((err as Error).message);
                        }
                      }}
                    >
                      Set Editing Date
                    </button>
                  )}
                  {entry.stage === 'editing_scheduled' && isEditor && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={async () => {
                        try {
                          await onAdvanceEntry(entry.id, 'ready_for_post', {
                            version: entry.version,
                            contentType: window.prompt('Content type (for example Reel or Ad Video)') || '',
                          });
                          onNotice('Marked Ready for Post.');
                        } catch (err) {
                          onError((err as Error).message);
                        }
                      }}
                    >
                      Mark Ready for Post
                    </button>
                  )}
                  {entry.stage === 'ready_for_post' && isEditor && (
                    <button
                      type="button"
                      className="button"
                      data-testid={`open-mark-posted-btn-${entry.id}`}
                      onClick={() => { setPostingEntryId(entry.id); setPostSerial(''); setPostNote(''); setPostPhotos([]); }}
                    >
                      Complete & Mark Posted
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Complete & Mark Posted Panel (Requires AP - 1765 Serial, Note, 5 Photos, Platform) */}
      {postingEntryId !== null && isEditor && (
        <div
          className="panel"
          style={{ marginTop: 16, borderStyle: 'dashed' }}
          data-testid="editor-mark-posted-panel"
        >
          <h3>
            Complete & Mark Posted (Entry #{postingEntryId} — Sends to Isolated Submission DB)
          </h3>
          <div className="form-grid">
            <div className="field">
              <label>Post Serial Number (Format: AP - 1765)</label>
              <input
                value={postSerial}
                onChange={(e) => setPostSerial(e.target.value)}
                placeholder="AP - 1766"
              />
            </div>
            <div className="field">
              <label>Social Platform</label>
              <select
                value={postPlatform}
                onChange={(e) =>
                  setPostPlatform(
                    e.target.value as 'Facebook' | 'YouTube' | 'Instagram'
                  )
                }
              >
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <div className="field full">
              <label>Property Information Note (Pasted for Admin Website Publishing)</label>
              <textarea
                rows={2}
                value={postNote}
                onChange={(e) => setPostNote(e.target.value)}
              />
            </div>
            <div className="field full">
              <label>Five Property Photos (Exactly 5 Required)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="Five property photos" onChange={async e => {
                const files = Array.from(e.target.files || []);
                setPostPhotos([]);
                if (files.length !== 5) { onError('Select exactly five property photos.'); return; }
                try { const urls = []; for (const file of files) { const uploaded = await onUpload(await readUpload(file), file.name, 'marketing_photo'); urls.push(uploaded.url); } setPostPhotos(urls); }
                catch (error) { onError((error as Error).message); }
              }} />
              <small>{postPhotos.length} / 5 photos uploaded</small>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setPostingEntryId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              disabled={postPhotos.length !== 5 || !postSerial.trim() || !postNote.trim()}
              data-testid="confirm-mark-posted-btn"
              onClick={() => handleCompletePosted(postingEntryId)}
            >
              Mark Posted & Submit 5 Photos to Submission DB
            </button>
          </div>
        </div>
      )}

      {/* Read-Only Submission DB Status Preview inside Marketing */}
      <div style={{ marginTop: 20 }}>
        <SubmissionsStatusView submissions={submissions} />
      </div>
    </section>
  );
}

export function SubmissionsStatusView({
  submissions,
}: {
  submissions: SubmissionPost[];
}) {
  return (
    <section className="panel" data-testid="submissions-status-view">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Isolated Third Database (Submission DB — Read-Only for Internal Staff)</p>
          <h2>Website Publishing Submissions Status</h2>
        </div>
        <span className="badge active">{submissions.length} Submissions</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Post Serial</th>
              <th>Customer & Address</th>
              <th>Type & Platform</th>
              <th>Property Info Note</th>
              <th>Photos</th>
              <th>Publish Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} data-testid={`submission-row-${sub.serialNumber}`}>
                <td>
                  <strong>{sub.serialNumber}</strong>
                  <small>By {sub.submittedBy}</small>
                </td>
                <td>
                  <strong>{sub.customerName}</strong>
                  <small>{sub.address}</small>
                </td>
                <td>
                  <strong>{sub.propertyType}</strong>
                  <small>{sub.socialPlatform}</small>
                </td>
                <td>
                  <small>{sub.propertyInfoNote}</small>
                </td>
                <td>{sub.photos.length} Photos</td>
                <td>
                  <span className={`badge ${sub.publishStatus}`}>
                    {sub.publishStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
