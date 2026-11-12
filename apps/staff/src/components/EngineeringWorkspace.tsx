import React, { useState } from 'react';
import type {
  EngineeringDeliverable,
  Role,
} from '../../../../packages/staff-contracts/types';
import { isManagerRole } from '../../../../packages/staff-contracts/workflow.mjs';

export interface EngineeringWorkspaceProps {
  deliverables: EngineeringDeliverable[];
  actorRole: Role;
  onUploadVersion: (
    deliverableId: number,
    payload: { fileUrl: string; fileName: string; format: string; notes: string }
  ) => Promise<unknown>;
  onReviewVersion: (
    deliverableId: number,
    payload: {
      versionNumber: number;
      decision: 'approved' | 'revision_requested';
      comment: string;
    }
  ) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function EngineeringWorkspace({
  deliverables,
  actorRole,
  onUploadVersion,
  onReviewVersion,
  onNotice,
  onError,
}: EngineeringWorkspaceProps) {
  const canReview = isManagerRole(actorRole);
  const canUpload = [
    'architect',
    'graphic_designer',
    'visual_designer_3d',
  ].includes(actorRole);

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fileName, setFileName] = useState('KP12-Floor-Plan-Revision.pdf');
  const [fileUrl, setFileUrl] = useState('/logo.png');
  const [format, setFormat] = useState('2D Floor Plan (CAD/PDF)');
  const [notes, setNotes] = useState(
    'Updated room dimensions and corridor clearance per Manager feedback.'
  );

  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const visibleDeliverables = canReview
    ? deliverables
    : deliverables.filter((d) => d.role === actorRole || !canUpload);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingId === null) return;
    try {
      await onUploadVersion(uploadingId, { fileUrl, fileName, format, notes });
      setUploadingId(null);
      onNotice(`Uploaded new deliverable version (${fileName}) to version history.`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <section className="panel" data-testid="engineering-workspace">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            Engineering & Graphic Department • {canReview ? 'Manager Deliverable Review' : `Role: ${actorRole.replace(/_/g, ' ')}`}
          </p>
          <h2>Project-Linked Tasks & Versioned Deliverables</h2>
        </div>
        <span className="badge active">
          {visibleDeliverables.length} Deliverable Packages
        </span>
      </div>

      {uploadingId !== null && canUpload && (
        <form
          className="panel"
          style={{ marginTop: 12, marginBottom: 16, borderStyle: 'dashed' }}
          onSubmit={handleUploadSubmit}
          data-testid="engineering-upload-version-form"
        >
          <h3 style={{ marginTop: 0 }}>
            Upload New Deliverable Version (Preserves All Prior Versions)
          </h3>
          <div className="form-grid">
            <div className="field">
              <label>Deliverable File Name</label>
              <input
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Deliverable Format / Asset Type</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="2D Floor Plan (CAD/PDF)">2D Floor Plan (CAD/PDF)</option>
                <option value="Brochure / Print Asset">Brochure / Print Asset</option>
                <option value="3D Exterior / Interior Render">3D Exterior / Interior Render</option>
              </select>
            </div>
            <div className="field">
              <label>File URL / Attachment Path</label>
              <input
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Revision & Technical Notes</label>
              <input
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => setUploadingId(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button"
              data-testid="submit-deliverable-version-btn"
            >
              Submit Version to Manager Review
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
        {visibleDeliverables.map((deliv) => (
          <article
            key={deliv.id}
            className="customer-card"
            data-testid={`deliverable-card-${deliv.id}`}
          >
            <div className="customer-top">
              <div>
                <span className="serial">
                  {deliv.projectCode} {deliv.apartmentNumber ? `• ${deliv.apartmentNumber}` : ''}
                </span>
                <h3 style={{ margin: '4px 0' }}>{deliv.title}</h3>
                <small>
                  Project: <strong>{deliv.projectName}</strong> • Assigned Role:{' '}
                  <strong>{deliv.role.replace(/_/g, ' ')}</strong> ({deliv.assigneeName})
                </small>
              </div>
              {canUpload && deliv.role === actorRole && (
                <button
                  type="button"
                  className="button"
                  data-testid={`open-upload-version-btn-${deliv.id}`}
                  onClick={() => setUploadingId(deliv.id)}
                >
                  + Upload New Version (v{deliv.versions.length + 1})
                </button>
              )}
            </div>

            <div className="table-scroll" style={{ marginTop: 10 }}>
              <table>
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>File & Format</th>
                    <th>Technical Notes</th>
                    <th>Submitted By</th>
                    <th>Status & Reviewer Comment</th>
                    {canReview && <th>Manager Review Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {deliv.versions.length === 0 ? (
                    <tr>
                      <td colSpan={canReview ? 6 : 5}>
                        <small>No versions uploaded yet. Waiting for v1 upload.</small>
                      </td>
                    </tr>
                  ) : (
                    deliv.versions.map((ver) => {
                      const key = `${deliv.id}-${ver.versionNumber}`;
                      return (
                        <tr key={ver.versionNumber}>
                          <td>
                            <strong>v{ver.versionNumber}</strong>
                          </td>
                          <td>
                            <strong>{ver.fileName}</strong>
                            <small>{ver.format}</small>
                          </td>
                          <td>{ver.notes}</td>
                          <td>
                            <strong>{ver.submittedBy}</strong>
                          </td>
                          <td>
                            <span className={`badge ${ver.status}`}>
                              {ver.status}
                            </span>
                            {ver.reviewerComment && (
                              <small style={{ display: 'block', marginTop: 4 }}>
                                Manager: {ver.reviewerComment}
                              </small>
                            )}
                          </td>
                          {canReview && (
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                  placeholder="Manager review note..."
                                  value={reviewComments[key] || ''}
                                  onChange={(e) =>
                                    setReviewComments((prev) => ({
                                      ...prev,
                                      [key]: e.target.value,
                                    }))
                                  }
                                  style={{ padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}
                                />
                                <button
                                  type="button"
                                  className="button"
                                  data-testid={`approve-deliverable-${deliv.id}-v${ver.versionNumber}`}
                                  onClick={async () => {
                                    try {
                                      await onReviewVersion(deliv.id, {
                                        versionNumber: ver.versionNumber,
                                        decision: 'approved',
                                        comment:
                                          reviewComments[key] ||
                                          'Approved by Manager',
                                      });
                                      onNotice(
                                        `Approved ${deliv.title} v${ver.versionNumber}.`
                                      );
                                    } catch (err) {
                                      onError((err as Error).message);
                                    }
                                  }}
                                >
                                  Approve v{ver.versionNumber}
                                </button>
                                <button
                                  type="button"
                                  className="button secondary"
                                  data-testid={`revision-deliverable-${deliv.id}-v${ver.versionNumber}`}
                                  onClick={async () => {
                                    try {
                                      await onReviewVersion(deliv.id, {
                                        versionNumber: ver.versionNumber,
                                        decision: 'revision_requested',
                                        comment:
                                          reviewComments[key] ||
                                          'Please revise and upload next version.',
                                      });
                                      onNotice(
                                        `Requested revision on ${deliv.title} v${ver.versionNumber}.`
                                      );
                                    } catch (err) {
                                      onError((err as Error).message);
                                    }
                                  }}
                                >
                                  Request Revision
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
