import React, { useState, useEffect } from 'react';
import type { LandingHeroConfig, NormalizedPoint } from '../../../../shared/visual-config';
import { visualConfigApi } from '../../visualConfigApi';
import ImageUpload from '../ImageUpload';

const FOCAL_POINTS: { label: string; point: NormalizedPoint }[] = [
  { label: 'Top-Left', point: { x: 0.1, y: 0.2 } },
  { label: 'Top-Center', point: { x: 0.5, y: 0.2 } },
  { label: 'Top-Right', point: { x: 0.9, y: 0.2 } },
  { label: 'Middle-Left', point: { x: 0.1, y: 0.5 } },
  { label: 'Center (Default)', point: { x: 0.5, y: 0.5 } },
  { label: 'Middle-Right', point: { x: 0.9, y: 0.5 } },
  { label: 'Bottom-Left', point: { x: 0.1, y: 0.8 } },
  { label: 'Bottom-Center', point: { x: 0.5, y: 0.8 } },
  { label: 'Bottom-Right', point: { x: 0.9, y: 0.8 } },
];

export const LandingBackgroundSettings: React.FC = () => {
  const [heroConfig, setHeroConfig] = useState<LandingHeroConfig>({
    imageUrl: null,
    focalPoint: { x: 0.5, y: 0.5 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    visualConfigApi
      .getConfig()
      .then((cfg) => {
        if (cfg.landingHero) {
          setHeroConfig(cfg.landingHero);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await visualConfigApi.updateLandingHero(heroConfig);
      showToast(true, 'Landing page background updated and published.');
    } catch (err) {
      showToast(false, (err as Error).message || 'Failed to update background.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const resetConfig: LandingHeroConfig = {
      imageUrl: null,
      focalPoint: { x: 0.5, y: 0.5 },
    };
    setHeroConfig(resetConfig);
    setSaving(true);
    try {
      await visualConfigApi.updateLandingHero(resetConfig);
      showToast(true, 'Reset to default theme hero background.');
    } catch (err) {
      showToast(false, (err as Error).message || 'Failed to reset.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading hero background settings…</p>;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
          Public Landing Page Hero Background
        </h3>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
          Customize the high-resolution background photo displayed across the main homepage hero banner.
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
          Hero Image (1920x1080 Recommended)
        </label>
        <ImageUpload
          value={heroConfig.imageUrl}
          onChange={(url) => setHeroConfig((prev) => ({ ...prev, imageUrl: url }))}
          purpose="gallery"
        />
      </div>

      {heroConfig.imageUrl && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
            Focal Point Alignment (for mobile & tablet responsive cropping)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxWidth: 360 }}>
            {FOCAL_POINTS.map((fp) => {
              const isSelected =
                Math.abs(heroConfig.focalPoint.x - fp.point.x) < 0.1 &&
                Math.abs(heroConfig.focalPoint.y - fp.point.y) < 0.1;

              return (
                <button
                  key={fp.label}
                  type="button"
                  onClick={() => setHeroConfig((prev) => ({ ...prev, focalPoint: fp.point }))}
                  style={{
                    padding: '0.45rem',
                    borderRadius: 6,
                    border: isSelected ? '2px solid #0145F2' : '1px solid #cbd5e1',
                    background: isSelected ? '#dbeafe' : '#f8fafc',
                    color: isSelected ? '#1e40af' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {fp.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.55rem 1.4rem',
            borderRadius: 8,
            border: 'none',
            background: '#0145F2',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : '✓ Save & Apply Background'}
        </button>

        {heroConfig.imageUrl && (
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Reset to Default Theme Image
          </button>
        )}

        {toast && (
          <span
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              background: toast.ok ? '#dcfce7' : '#fee2e2',
              color: toast.ok ? '#166534' : '#dc2626',
            }}
          >
            {toast.msg}
          </span>
        )}
      </div>
    </div>
  );
};

export default LandingBackgroundSettings;
