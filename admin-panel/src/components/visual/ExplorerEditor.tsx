import React, { useState, useEffect } from 'react';
import type { VisualConfig, ExplorerProject, ExplorerFloor, ApartmentPlacement } from '../../../../shared/visual-config';
import { visualConfigApi } from '../../visualConfigApi';
import { ImageRegionEditor } from './ImageRegionEditor';

export interface ExplorerEditorProps {
  projectId: number;
  projectName: string;
  exteriorImageUrl: string | null;
}

export const ExplorerEditor: React.FC<ExplorerEditorProps> = ({
  projectId,
  projectName,
  exteriorImageUrl,
}) => {
  const [fullConfig, setFullConfig] = useState<VisualConfig | null>(null);
  const [projectData, setProjectData] = useState<ExplorerProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Calibration state
  const [activeCalibratingFloor, setActiveCalibratingFloor] = useState<ExplorerFloor | null>(null);
  const [activeCalibratingApartment, setActiveCalibratingApartment] = useState<ApartmentPlacement | null>(null);

  useEffect(() => {
    setLoading(true);
    visualConfigApi
      .getConfig()
      .then((cfg) => {
        setFullConfig(cfg);
        if (cfg.projects[projectId]) {
          setProjectData(cfg.projects[projectId]);
        } else {
          // Initialize project entry if missing
          const newProj: ExplorerProject = {
            projectId,
            projectName,
            exteriorImageUrl: exteriorImageUrl || '',
            floors: [],
          };
          setProjectData(newProj);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId, projectName, exteriorImageUrl]);

  const showStatus = (ok: boolean, text: string) => {
    setStatusMsg({ ok, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSaveDraft = async () => {
    if (!fullConfig || !projectData) return;
    setSaving(true);
    try {
      const updatedConfig: VisualConfig = {
        ...fullConfig,
        projects: {
          ...fullConfig.projects,
          [projectId]: projectData,
        },
      };
      await visualConfigApi.saveDraft(updatedConfig);
      setFullConfig(updatedConfig);
      showStatus(true, 'Draft saved successfully.');
    } catch (err) {
      showStatus(false, (err as Error).message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!fullConfig || !projectData) return;
    setSaving(true);
    try {
      const updatedConfig: VisualConfig = {
        ...fullConfig,
        projects: {
          ...fullConfig.projects,
          [projectId]: projectData,
        },
      };
      await visualConfigApi.publish(updatedConfig);
      setFullConfig(updatedConfig);
      showStatus(true, 'Published to live website successfully!');
    } catch (err) {
      showStatus(false, (err as Error).message || 'Failed to publish.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading explorer visual data…</p>;
  if (!projectData) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #e2e8f0', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            Interactive Photo-Based Apartment Explorer Calibration
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Calibrate exterior floor window lighting and apartment polygon boundaries on the masterplan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: 8,
              border: 'none',
              background: '#0145F2',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Publishing…' : '✓ Publish to Public Site'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 8,
            marginBottom: '1rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: statusMsg.ok ? '#dcfce7' : '#fee2e2',
            color: statusMsg.ok ? '#166534' : '#dc2626',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Calibration Sub-view 1: Calibrating a floor's exterior hit region */}
      {activeCalibratingFloor && (
        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0145F2' }}>
              Calibrating Exterior Polygon: {activeCalibratingFloor.label.en}
            </h4>
            <button
              type="button"
              onClick={() => setActiveCalibratingFloor(null)}
              style={{ padding: '0.3rem 0.7rem', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Done Calibrating
            </button>
          </div>

          <ImageRegionEditor
            imageUrl={projectData.exteriorImageUrl || exteriorImageUrl || ''}
            points={activeCalibratingFloor.hitRegions[0] || []}
            onChangePoints={(pts) => {
              const updatedFloors = projectData.floors.map((fl) =>
                fl.id === activeCalibratingFloor.id ? { ...fl, hitRegions: [pts] } : fl
              );
              setProjectData({ ...projectData, floors: updatedFloors });
              setActiveCalibratingFloor({ ...activeCalibratingFloor, hitRegions: [pts] });
            }}
            title="Exterior Photo Floor Region"
            instructions="Place 4 corner points bounding the floor's exterior facade & windows."
          />
        </div>
      )}

      {/* Calibration Sub-view 2: Calibrating an apartment's masterplan polygon */}
      {activeCalibratingApartment && (
        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #cbd5e1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0145F2' }}>
              Calibrating Apartment Polygon: {activeCalibratingApartment.unitNumber}
            </h4>
            <button
              type="button"
              onClick={() => setActiveCalibratingApartment(null)}
              style={{ padding: '0.3rem 0.7rem', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Done Calibrating
            </button>
          </div>

          <ImageRegionEditor
            imageUrl={activeCalibratingApartment.plan.twoDUrl || ''}
            points={activeCalibratingApartment.polygon}
            onChangePoints={(pts) => {
              const updatedFloors = projectData.floors.map((fl) => ({
                ...fl,
                apartments: fl.apartments.map((apt) =>
                  apt.id === activeCalibratingApartment.id ? { ...apt, polygon: pts } : apt
                ),
              }));
              setProjectData({ ...projectData, floors: updatedFloors });
              setActiveCalibratingApartment({ ...activeCalibratingApartment, polygon: pts });
            }}
            labelAnchor={activeCalibratingApartment.labelAnchor}
            onChangeLabelAnchor={(anchor) => {
              const updatedFloors = projectData.floors.map((fl) => ({
                ...fl,
                apartments: fl.apartments.map((apt) =>
                  apt.id === activeCalibratingApartment.id ? { ...apt, labelAnchor: anchor } : apt
                ),
              }));
              setProjectData({ ...projectData, floors: updatedFloors });
              setActiveCalibratingApartment({ ...activeCalibratingApartment, labelAnchor: anchor });
            }}
            title="Masterplan Apartment Footprint"
            instructions="Outline the perimeter of this apartment unit and place the label anchor."
          />
        </div>
      )}

      {/* Floor Levels Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Floor Level</th>
              <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Kind</th>
              <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Exterior Hit Region</th>
              <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Units</th>
              <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectData.floors.map((floor) => (
              <tr key={floor.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0145F2' }}>
                  {floor.label.en}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>
                  {floor.kind}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>
                  {floor.hitRegions[0]?.length || 0} vertices mapped
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {floor.apartments.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setActiveCalibratingApartment(u)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 4,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        title="Click to calibrate unit polygon"
                      >
                        {u.unitNumber} ✏️
                      </button>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveCalibratingFloor(floor)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      background: '#0f172a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Calibrate Exterior Facade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExplorerEditor;
