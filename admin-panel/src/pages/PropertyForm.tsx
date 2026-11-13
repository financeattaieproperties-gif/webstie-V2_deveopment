import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type PropertyInput } from '../api';
import ImageUpload from '../components/ImageUpload';

const S = {
  page:     { maxWidth: 760 } as const,
  topBar:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' } as const,
  title:    { fontSize: '1.5rem', fontWeight: 700, margin: 0 } as const,
  card:     { background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' } as const,
  section:  { padding: '1.5rem 1.75rem' } as const,
  divider:  { borderTop: '1px solid #F1F5F9' } as const,
  secTitle: { fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: '1rem' } as const,
  grid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' } as const,
  full:     { gridColumn: '1 / -1' } as const,
  label:    { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' } as const,
  input:    { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' as const, color: '#0F172A' } as const,
  select:   { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' as const, color: '#0F172A' } as const,
  textarea: { width: '100%', padding: '0.58rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: '0.88rem', minHeight: 120, resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const, color: '#0F172A' } as const,
  footer:   { padding: '1.25rem 1.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '0.75rem', alignItems: 'center' } as const,
  save:     { padding: '0.62rem 1.5rem', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' } as const,
  cancel:   { padding: '0.62rem 1.2rem', background: '#FFFFFF', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' } as const,
  toast:    (ok: boolean): React.CSSProperties => ({
    padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
    background: ok ? '#d1fae5' : '#fee2e2',
    color:      ok ? '#065f46' : '#dc2626',
  }),
};

const blank: PropertyInput = {
  serial_number: '', title: '', price: 0, location: '', beds: null, baths: null,
  area: null, floor: null, status: 'available', type: 'Villa',
  listing_type: 'sale', image_url: null, gallery_images: [], video_url: null,
  floor_plan_url: null, three_d_plan_url: null, description: null,
};

export default function PropertyForm() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const isEdit    = Boolean(id);

  const [form, setForm]       = useState<PropertyInput>(blank);
  const [busy, setBusy]       = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [toast, setToast]     = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    api.getProperties().then(list => {
      const found = list.find(p => Number(p.id) === Number(id));
      if (found) {
        const { id: _id, created_at: _ca, ...rest } = found;
        setForm({
          ...blank,
          ...rest,
          floor_plan_url: rest.floor_plan_url ?? null,
          three_d_plan_url: rest.three_d_plan_url ?? null,
        });
      }
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k: keyof PropertyInput, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isEdit) await api.updateProperty({ ...form, id: Number(id) });
      else await api.createProperty(form);
      const msg = isEdit ? 'Property updated.' : 'Property created.';
      showToast(true, msg);
      window.electronAPI?.notify('Attaie Admin', msg).catch(() => {});
      if (!isEdit) setTimeout(() => navigate('/properties'), 1200);
    } catch (err) {
      showToast(false, (err as Error).message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading…</p>;

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <h1 style={S.title}>{isEdit ? 'Edit Property' : 'New Property'}</h1>
        <button type="button" style={{ ...S.cancel, padding: '0.5rem 1rem' }} onClick={() => navigate('/properties')}>
          ← Back to list
        </button>
      </div>

      <form onSubmit={submit}>
        <div style={S.card}>

          {/* Image section — first for visual prominence */}
          <div style={S.section}>
            <p style={S.secTitle}>Property Image</p>
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
                <label style={S.label}>Property Serial Number *</label>
                <input style={S.input} value={form.serial_number} onChange={e => set('serial_number', e.target.value.trim())} required maxLength={50} placeholder="e.g. AP-KBL-0001" />
                <small style={{ display: 'block', marginTop: 5, color: '#64748b' }}>Unique reference customers can use to find this property.</small>
              </div>
              <div style={S.full}>
                <label style={S.label}>Title *</label>
                <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Modern Villa with Mountain Views" />
              </div>
              <div style={S.full}>
                <label style={S.label}>Location *</label>
                <input style={S.input} value={form.location} onChange={e => set('location', e.target.value)} required placeholder="e.g. Wazir Akbar Khan, Kabul" />
              </div>
              <div>
                <label style={S.label}>Price (USD) *</label>
                <input style={S.input} type="number" min={0} value={form.price} onChange={e => set('price', Number(e.target.value))} required />
              </div>
              <div>
                <label style={S.label}>Listing Type</label>
                <select style={S.select} value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent / month</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Property Type</label>
                <select style={S.select} value={form.type} onChange={e => set('type', e.target.value as PropertyInput['type'])}>
                  {(['Villa', 'Apartment', 'House', 'Commercial', 'Land'] as const).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.select} value={form.status} onChange={e => set('status', e.target.value as PropertyInput['status'])}>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Specifications</p>
            <div style={S.grid}>
              <div>
                <label style={S.label}>Bedrooms</label>
                <input style={S.input} type="number" min={0} value={form.beds ?? ''} onChange={e => set('beds', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
              </div>
              <div>
                <label style={S.label}>Bathrooms</label>
                <input style={S.input} type="number" min={0} value={form.baths ?? ''} onChange={e => set('baths', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
              </div>
              <div>
                <label style={S.label}>Area (m²)</label>
                <input style={S.input} type="number" min={0} value={form.area ?? ''} onChange={e => set('area', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
              </div>
              <div>
                <label style={S.label}>Floor</label>
                <input style={S.input} type="number" min={0} value={form.floor ?? ''} onChange={e => set('floor', e.target.value ? Number(e.target.value) : null)} placeholder="—" />
              </div>
            </div>
          </div>

          {/* Gallery Images */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Photo Gallery (up to 8 images)</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              These appear in the public gallery slider. Main image above is used as fallback if empty.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...(form.gallery_images ?? []), null].slice(0, 8).map((url, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <ImageUpload
                      value={url ?? null}
                      onChange={newUrl => {
                        const imgs = [...(form.gallery_images ?? [])];
                        if (newUrl) {
                          imgs[i] = newUrl;
                        } else {
                          imgs.splice(i, 1);
                        }
                        set('gallery_images', imgs.filter(Boolean));
                      }}
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

          {/* Blueprints: 2D Floor Plan & 3D Plan */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Property Blueprints (Floor Plan & 3D Plan)</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Optional technical drawings (JPEG or PNG only). Shown in a dedicated Blueprint viewer on the property page and kept separate from the photo gallery.
            </p>
            <div style={S.grid}>
              <div>
                <label style={S.label}>2D Floor Plan (JPEG / PNG)</label>
                <ImageUpload
                  purpose="blueprint"
                  value={form.floor_plan_url ?? null}
                  onChange={url => set('floor_plan_url', url)}
                />
              </div>
              <div>
                <label style={S.label}>3D Plan (JPEG / PNG)</label>
                <ImageUpload
                  purpose="blueprint"
                  value={form.three_d_plan_url ?? null}
                  onChange={url => set('three_d_plan_url', url)}
                />
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Video Tour URL</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
              YouTube, Vimeo, or direct MP4 link. Shown as embedded player on property page.
            </p>
            <input
              style={S.input}
              type="url"
              value={form.video_url ?? ''}
              onChange={e => set('video_url', e.target.value || null)}
              placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
            />
          </div>

          {/* Description */}
          <div style={{ ...S.section, ...S.divider }}>
            <p style={S.secTitle}>Description</p>
            <textarea
              style={S.textarea}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value || null)}
              placeholder="Describe the property, highlights, features, neighbourhood…"
            />
          </div>

          {/* Footer */}
          <div style={S.footer}>
            <button type="submit" style={S.save} disabled={busy}>
              {busy ? 'Saving…' : isEdit ? '✓ Save Changes' : '+ Create Property'}
            </button>
            <button type="button" style={S.cancel} onClick={() => navigate('/properties')}>
              Cancel
            </button>
            {toast && <span style={S.toast(toast.ok)}>{toast.msg}</span>}
          </div>

        </div>
      </form>
    </div>
  );
}
