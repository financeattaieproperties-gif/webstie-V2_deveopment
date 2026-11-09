import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type ProjectInput, type ProjectUnit, type ProjectUnitInput } from '../api';
import ImageUpload from '../components/ImageUpload';

const S = {
  page:     { maxWidth: 840 } as const,
  topBar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } as const,
  title:    { fontSize: '1.5rem', fontWeight: 700, margin: 0 } as const,
  card:     { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden', marginBottom: '1.5rem' } as const,
  section:  { padding: '1.5rem 2rem' } as const,
  divider:  { borderTop: '1px solid #f1f5f9' } as const,
  secTitle: { fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: '1rem' } as const,
  grid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' } as const,
  full:     { gridColumn: '1 / -1' } as const,
  label:    { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' } as const,
  input:    { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const } as const,
  select:   { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#fff', boxSizing: 'border-box' as const } as const,
  textarea: { width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.9rem', minHeight: 120, resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const } as const,
  footer:   { padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.75rem', alignItems: 'center' } as const,
  save:     { padding: '0.7rem 1.8rem', background: '#b8960c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' } as const,
  cancel:   { padding: '0.7rem 1.4rem', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' } as const,
  toast:    (ok: boolean): React.CSSProperties => ({
    padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
    background: ok ? '#d1fae5' : '#fee2e2',
    color:      ok ? '#065f46' : '#dc2626',
  }),
};

const blank: ProjectInput = {
  name: '', location: '', delivery_date: null,
  status: 'Coming Soon', available_units: 0,
  total_units: 0, image_url: null, gallery_images: [], video_url: null, masterplan_image: null, description: null,
};

const blankUnit = (projectId: number): ProjectUnitInput => ({
  project_id: projectId,
  unit_number: '',
  title: null,
  beds: null,
  baths: null,
  area: null,
  floor: null,
  price: null,
  currency: 'USD',
  status: 'available',
  image_url: null,
  technical_plan_url: null,
  description: null,
});

type StagedUnit = ProjectUnitInput & { _tempId: string };

export default function ProjectForm() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);
  const projectId = Number(id || 0);

  const [form, setForm]       = useState<ProjectInput>(blank);
  const [busy, setBusy]       = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [toast, setToast]     = useState<{ ok: boolean; msg: string } | null>(null);

  // Project apartments / units state
  const [units, setUnits]             = useState<ProjectUnit[]>([]);
  const [stagedUnits, setStagedUnits] = useState<StagedUnit[]>([]);
  const [unitsError, setUnitsError]   = useState<string | null>(null);
  const [unitForm, setUnitForm]       = useState<ProjectUnitInput>(blankUnit(projectId));
  const [editingUnitId, setEditingUnitId] = useState<number | string | null>(null);
  const [unitBusy, setUnitBusy]       = useState(false);
  const [unitToast, setUnitToast]     = useState<{ ok: boolean; msg: string } | null>(null);

  const loadUnits = async (pid: number) => {
    setUnitsError(null);
    try {
      const unitList = await api.getProjectUnits(pid);
      setUnits(unitList);
    } catch (err) {
      setUnitsError((err as Error).message || 'Could not load project apartments.');
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    setUnitsError(null);
    Promise.all([
      api.getProjects(),
      api.getProjectUnits(projectId).catch((err: Error) => {
        setUnitsError(err.message || 'Could not load project apartments.');
        return [] as ProjectUnit[];
      }),
    ]).then(([list, unitList]) => {
      const found = list.find(p => Number(p.id) === projectId);
      if (found) {
        const { id: _id, created_at: _ca, ...rest } = found;
        setForm({ ...rest, gallery_images: Array.isArray(rest.gallery_images) ? rest.gallery_images : [] });
      }
      setUnits(unitList);
      setUnitForm(blankUnit(projectId));
    }).finally(() => setLoading(false));
  }, [id, isEdit, projectId]);

  const set = (k: keyof ProjectInput, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const showUnitToast = (ok: boolean, msg: string) => {
    setUnitToast({ ok, msg });
    setTimeout(() => setUnitToast(null), 3000);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) {
        await api.updateProject({ ...form, id: projectId });
        showToast(true, 'Project updated successfully.');
      } else {
        const res = await api.createProject(form);
        const newPid = Number(res.id);
        
        // If the admin staged any apartments during creation, save them now
        if (stagedUnits.length > 0) {
          showToast(true, `Project created! Saving ${stagedUnits.length} staged apartment(s)…`);
          for (const u of stagedUnits) {
            const { _tempId: _discard, ...unitData } = u;
            await api.createProjectUnit({ ...unitData, project_id: newPid });
          }
        }
        showToast(true, 'Project and apartments created successfully!');
        setTimeout(() => navigate(`/projects/${newPid}/edit`), 900);
      }
    } catch (err) {
      showToast(false, (err as Error).message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const saveUnit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unitForm.unit_number.trim()) {
      showUnitToast(false, 'Unit number is required.');
      return;
    }

    if (!isEdit) {
      // Staging mode for a brand new project before it is saved
      if (editingUnitId && typeof editingUnitId === 'string') {
        setStagedUnits(prev => prev.map(u => u._tempId === editingUnitId ? { ...unitForm, _tempId: editingUnitId } : u));
        showUnitToast(true, 'Staged apartment updated.');
      } else {
        const newStaged: StagedUnit = {
          ...unitForm,
          _tempId: `staged_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
        setStagedUnits(prev => [...prev, newStaged]);
        showUnitToast(true, 'Apartment staged. It will be saved when you click "+ Create Project".');
      }
      setEditingUnitId(null);
      setUnitForm(blankUnit(0));
      return;
    }

    // Live mode for an existing project
    setUnitBusy(true);
    try {
      if (editingUnitId && typeof editingUnitId === 'number') {
        await api.updateProjectUnit({ ...unitForm, project_id: projectId, id: editingUnitId });
        showUnitToast(true, 'Apartment updated.');
      } else {
        await api.createProjectUnit({ ...unitForm, project_id: projectId });
        showUnitToast(true, 'Apartment added.');
      }
      const refreshed = await api.getProjectUnits(projectId);
      setUnits(refreshed);
      setEditingUnitId(null);
      setUnitForm(blankUnit(projectId));
    } catch (err) {
      showUnitToast(false, (err as Error).message || 'Failed to save apartment.');
    } finally {
      setUnitBusy(false);
    }
  };

  const startEditUnit = (u: ProjectUnit) => {
    const { id: uId, ...rest } = u;
    setEditingUnitId(uId);
    setUnitForm(rest);
  };

  const startEditStagedUnit = (su: StagedUnit) => {
    setEditingUnitId(su._tempId);
    const { _tempId: _discard, ...rest } = su;
    setUnitForm(rest);
  };

  const removeUnit = async (u: ProjectUnit) => {
    if (!confirm(`Delete apartment "${u.unit_number}"?`)) return;
    await api.deleteProjectUnit(u.id);
    setUnits(prev => prev.filter(x => x.id !== u.id));
  };

  const removeStagedUnit = (tempId: string) => {
    setStagedUnits(prev => prev.filter(x => x._tempId !== tempId));
  };

  const totalApartmentsCount = isEdit ? units.length : stagedUnits.length;

  if (loading) return <p style={{ padding: '2rem' }}>Loading…</p>;

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <h1 style={S.title}>{isEdit ? 'Edit Project' : 'New Project'}</h1>
        <button type="button" style={{ ...S.cancel, padding: '0.5rem 1rem' }} onClick={() => navigate('/projects')}>
          ← Back to list
        </button>
      </div>

      <form onSubmit={submit}>
        <div style={S.card}>

          {/* Building Exterior Elevation Image — used by Interactive Explorer & Cover */}
          <div style={S.section}>
            <p style={S.secTitle}>Building Exterior Elevation Image (Interactive Explorer & Cover)</p>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 0, marginBottom: '0.85rem' }}>
              Upload the building's front elevation photo or architectural 3D render. In the public project explorer, visitors can hover and select floors directly on this image.
            </p>
            <ImageUpload
              value={form.image_url}
              onChange={url => set('image_url', url)}
            />
          </div>

          {/* Core details */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Core Details</p>
            <div style={S.grid}>
              <div style={S.full}>
                <label style={S.label}>Project Name *</label>
                <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Aria Residences" />
              </div>
              <div style={S.full}>
                <label style={S.label}>Location *</label>
                <input style={S.input} value={form.location} onChange={e => set('location', e.target.value)} required placeholder="e.g. Macroyan, Kabul" />
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.select} value={form.status} onChange={e => set('status', e.target.value as ProjectInput['status'])}>
                  <option>Coming Soon</option>
                  <option>In Progress</option>
                  <option>Under Construction</option>
                  <option>Ready</option>
                  <option>Sold Out</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Delivery Date</label>
                <input style={S.input} value={form.delivery_date ?? ''} onChange={e => set('delivery_date', e.target.value || null)} placeholder="e.g. Q2 2027" />
              </div>
            </div>
          </div>

          {/* Units */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Unit Count Summary</p>
            <div style={S.grid}>
              <div>
                <label style={S.label}>Available Units</label>
                <input style={S.input} type="number" min={0} value={form.available_units} onChange={e => set('available_units', Number(e.target.value))} />
              </div>
              <div>
                <label style={S.label}>Total Units</label>
                <input style={S.input} type="number" min={0} value={form.total_units} onChange={e => set('total_units', Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Masterplan / Building Floor Plan Image */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Building Floor Plan / Masterplan (Typical Floor Layout)</p>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 0, marginBottom: '0.85rem' }}>
              Upload the general floor plate or architectural masterplan. Displayed in the Dual-Pane Blueprint Viewer when inspecting floor levels.
            </p>
            <ImageUpload
              value={form.masterplan_image}
              onChange={url => set('masterplan_image', url)}
              purpose="blueprint"
            />
          </div>

          {/* Gallery Images */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Project Photo Gallery (up to 8 images)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...(form.gallery_images ?? []), null].slice(0, 8).map((url, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <ImageUpload
                      value={url ?? null}
                      onChange={newUrl => {
                        const imgs = [...(form.gallery_images ?? [])];
                        if (newUrl) imgs[i] = newUrl;
                        else imgs.splice(i, 1);
                        set('gallery_images', imgs.filter(Boolean));
                      }}
                      purpose="gallery"
                    />
                  </div>
                  {url && (
                    <button
                      type="button"
                      style={{ ...S.cancel, padding: '0.4rem 0.8rem', marginTop: '0.5rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        const imgs = [...(form.gallery_images ?? [])];
                        imgs.splice(i, 1);
                        set('gallery_images', imgs);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video URL */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Project Video URL</p>
            <input
              style={S.input}
              value={form.video_url ?? ''}
              onChange={e => set('video_url', e.target.value || null)}
              placeholder="YouTube, Vimeo, or direct MP4 URL"
            />
          </div>

          {/* Description */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Description</p>
            <textarea
              style={S.textarea}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Describe the project, highlights, amenities, location advantages…"
            />
          </div>

          {/* Footer */}
          <div style={S.footer}>
            <button type="submit" style={S.save} disabled={busy}>
              {busy ? 'Saving…' : isEdit ? '✓ Save Changes' : `+ Create Project ${stagedUnits.length > 0 ? `(with ${stagedUnits.length} apartments)` : ''}`}
            </button>
            <button type="button" style={S.cancel} onClick={() => navigate('/projects')}>
              Cancel
            </button>
            {toast && <span style={S.toast(toast.ok)}>{toast.msg}</span>}
          </div>

        </div>
      </form>

      {/* Project Apartments / Units Management (Available on both new and existing projects) */}
      <div style={S.card}>
        <div style={S.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p style={{ ...S.secTitle, margin: 0 }}>
              Project Apartments / Units ({totalApartmentsCount})
            </p>
            {!isEdit && stagedUnits.length > 0 && (
              <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: 6, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                {stagedUnits.length} staged to save with project
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 0, marginBottom: '1.25rem' }}>
            Add individual apartments for each floor. For each unit, you can attach both a <strong>2D Furnished Floor Plan</strong> (with furniture and dimensions) and a <strong>2D Technical Blueprint</strong> (architectural/CAD layout) for the public Interactive Explorer.
          </p>

          {unitsError && (
            <div style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              borderRadius: 8,
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}>
              <span>Failed to load apartments: {unitsError}</span>
              <button
                type="button"
                onClick={() => loadUnits(projectId)}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table of units (live or staged) */}
          {(isEdit ? units.length > 0 : stagedUnits.length > 0) && (
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Unit #</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Title</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Specs</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Plans</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Price</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isEdit ? units.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0145F2' }}>{u.unit_number}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{u.title || '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>
                        {[
                          u.floor !== null ? `Fl ${u.floor}` : null,
                          u.beds !== null ? `${u.beds} bd` : null,
                          u.baths !== null ? `${u.baths} ba` : null,
                          u.area !== null ? `${u.area} m²` : null,
                        ].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4,
                            background: u.image_url ? '#dcfce7' : '#f1f5f9',
                            color: u.image_url ? '#166534' : '#94a3b8',
                            fontWeight: 600,
                          }}>
                            {u.image_url ? '✓ 2D Furnished' : '— Furnished'}
                          </span>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4,
                            background: u.technical_plan_url ? '#dbeafe' : '#f1f5f9',
                            color: u.technical_plan_url ? '#1e40af' : '#94a3b8',
                            fontWeight: 600,
                          }}>
                            {u.technical_plan_url ? '✓ 2D Technical' : '— Technical'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                        {u.price !== null ? `${u.currency} ${Number(u.price).toLocaleString()}` : 'On request'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{u.status}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            style={{ padding: '0.25rem 0.65rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                            onClick={() => startEditUnit(u)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ padding: '0.25rem 0.65rem', background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                            onClick={() => removeUnit(u)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : stagedUnits.map(su => (
                    <tr key={su._tempId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0145F2' }}>{su.unit_number}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{su.title || '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>
                        {[
                          su.floor !== null ? `Fl ${su.floor}` : null,
                          su.beds !== null ? `${su.beds} bd` : null,
                          su.baths !== null ? `${su.baths} ba` : null,
                          su.area !== null ? `${su.area} m²` : null,
                        ].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4,
                            background: su.image_url ? '#dcfce7' : '#f1f5f9',
                            color: su.image_url ? '#166534' : '#94a3b8',
                            fontWeight: 600,
                          }}>
                            {su.image_url ? '✓ 2D Furnished' : '— Furnished'}
                          </span>
                          <span style={{
                            fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 4,
                            background: su.technical_plan_url ? '#dbeafe' : '#f1f5f9',
                            color: su.technical_plan_url ? '#1e40af' : '#94a3b8',
                            fontWeight: 600,
                          }}>
                            {su.technical_plan_url ? '✓ 2D Technical' : '— Technical'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                        {su.price !== null ? `${su.currency} ${Number(su.price).toLocaleString()}` : 'On request'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize', fontWeight: 600 }}>{su.status}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            style={{ padding: '0.25rem 0.65rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                            onClick={() => startEditStagedUnit(su)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ padding: '0.25rem 0.65rem', background: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                            onClick={() => removeStagedUnit(su._tempId)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Unit Form */}
          <form onSubmit={saveUnit} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <p style={{ ...S.secTitle, marginBottom: '0.85rem', color: '#334155' }}>
              {editingUnitId ? 'Edit Apartment / Unit' : '+ Add Apartment / Unit'}
            </p>
            <div style={S.grid}>
              <div>
                <label style={S.label}>Unit Number *</label>
                <input
                  style={S.input}
                  value={unitForm.unit_number}
                  onChange={e => setUnitForm(prev => ({ ...prev, unit_number: e.target.value }))}
                  required
                  placeholder="e.g. A-302"
                />
              </div>
              <div>
                <label style={S.label}>Title / Layout Name</label>
                <input
                  style={S.input}
                  value={unitForm.title ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, title: e.target.value || null }))}
                  placeholder="e.g. 3-Bedroom Corner Suite"
                />
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select
                  style={S.select}
                  value={unitForm.status}
                  onChange={e => setUnitForm(prev => ({ ...prev, status: e.target.value as ProjectUnit['status'] }))}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Price (USD)</label>
                <input
                  style={S.input}
                  type="number"
                  min={0}
                  value={unitForm.price ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Leave blank for 'Price on request'"
                />
              </div>
              <div>
                <label style={S.label}>Floor Number</label>
                <input
                  style={S.input}
                  type="number"
                  value={unitForm.floor ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, floor: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label style={S.label}>Area (m²)</label>
                <input
                  style={S.input}
                  type="number"
                  min={0}
                  value={unitForm.area ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, area: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="e.g. 145"
                />
              </div>
              <div>
                <label style={S.label}>Bedrooms</label>
                <input
                  style={S.input}
                  type="number"
                  min={0}
                  value={unitForm.beds ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, beds: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label style={S.label}>Bathrooms</label>
                <input
                  style={S.input}
                  type="number"
                  min={0}
                  value={unitForm.baths ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, baths: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="e.g. 2"
                />
              </div>

              {/* 2D Furnished Plan */}
              <div>
                <label style={S.label}>
                  🎨 2D Furnished Floor Plan (Interactive 3D / Furnished Layout)
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 0, marginBottom: '0.4rem' }}>
                  Colored or furnished 2D/3D floor plan with interior furniture layout.
                </p>
                <ImageUpload
                  value={unitForm.image_url}
                  onChange={url => setUnitForm(prev => ({ ...prev, image_url: url }))}
                  purpose="blueprint"
                />
              </div>

              {/* 2D Technical Blueprint */}
              <div>
                <label style={S.label}>
                  📐 2D Technical Blueprint (Architectural CAD / Engineering Layout)
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 0, marginBottom: '0.4rem' }}>
                  Architectural line blueprint, CAD, wall dimensions & MEP technical layout.
                </p>
                <ImageUpload
                  value={unitForm.technical_plan_url ?? null}
                  onChange={url => setUnitForm(prev => ({ ...prev, technical_plan_url: url }))}
                  purpose="blueprint"
                />
              </div>

              <div style={S.full}>
                <label style={S.label}>Unit Description & Notes</label>
                <textarea
                  style={{ ...S.textarea, minHeight: 70 }}
                  value={unitForm.description ?? ''}
                  onChange={e => setUnitForm(prev => ({ ...prev, description: e.target.value || null }))}
                  placeholder="Optional details: balcony view, sunrise/sunset orientation, included finishes…"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
              <button type="submit" style={S.save} disabled={unitBusy}>
                {unitBusy ? 'Saving…' : editingUnitId ? '✓ Update Apartment' : '+ Add Apartment'}
              </button>
              {editingUnitId && (
                <button
                  type="button"
                  style={S.cancel}
                  onClick={() => { setEditingUnitId(null); setUnitForm(blankUnit(isEdit ? projectId : 0)); }}
                >
                  Cancel Edit
                </button>
              )}
              {unitToast && <span style={S.toast(unitToast.ok)}>{unitToast.msg}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

