import React, { useState } from 'react';
import type {
  InventoryApartment,
  InventoryProject,
  ProjectSeller,
  Role,
  StaffUser,
} from '../../../../packages/staff-contracts/types';
import {
  generateFloorApartmentBatch,
  isManagerRole,
} from '../../../../packages/staff-contracts/workflow.mjs';

export interface ProjectInventoryWizardProps {
  projects: InventoryProject[];
  staffUsers: StaffUser[];
  actorRole: Role;
  onSaveProject: (project: Partial<InventoryProject>) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function ProjectInventoryWizard({
  projects,
  staffUsers,
  actorRole,
  onSaveProject,
  onNotice,
  onError,
}: ProjectInventoryWizardProps) {
  const canManage = isManagerRole(actorRole);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  // Step 1: Project Identity
  const [code, setCode] = useState('MR01');
  const [name, setName] = useState('Moon Residency');
  const [location, setLocation] = useState('Street 10, Wazir Akbar Khan, Kabul');
  const [description, setDescription] = useState(
    'Pre-sale luxury residential project with seismic-grade frame, central heating, and underground parking.'
  );
  const [floors, setFloors] = useState(10);

  // Step 2: Multiple Sellers & Construction Company
  const [sellers, setSellers] = useState<ProjectSeller[]>([
    {
      name: 'Haji Abdul Qadir Attaie',
      fatherName: 'Haji Ghulam Sakhi',
      grandfatherName: 'Mohammad Kabir',
      tazkiraNumber: '1398-0102-44912',
      phone: '+93782222279',
      address: 'Street 13, Wazir Akbar Khan, Kabul',
      sharePercentage: 100,
    },
  ]);
  const [companyName, setCompanyName] = useState(
    'Attaie High-Rise Development & Construction Co.'
  );
  const [licenseNumber, setLicenseNumber] = useState('D-44891-KBL');
  const [representativeName, setRepresentativeName] = useState('Eng. Khalid Mansoori');
  const [representativeFatherName, setRepresentativeFatherName] = useState('Mohammad Zahir');
  const [representativeTazkira, setRepresentativeTazkira] = useState('1400-0201-88120');
  const [companyPhone, setCompanyPhone] = useState('+93782222280');
  const [companyAddress, setCompanyAddress] = useState('Street 13, Wazir Akbar Khan, Kabul');

  // Step 3: Apartments & Floor Batch Generator
  const [batchFloor, setBatchFloor] = useState(2);
  const [batchUnitsCount, setBatchUnitsCount] = useState(3);
  const [batchRooms, setBatchRooms] = useState(3);
  const [batchAreaSqm, setBatchAreaSqm] = useState(140);
  const [batchPricePerSqm, setBatchPricePerSqm] = useState(800);
  const [batchDirection, setBatchDirection] = useState('South-East');
  const [batchNorth, setBatchNorth] = useState('Central Corridor');
  const [batchSouth, setBatchSouth] = useState('Main Street');
  const [batchEast, setBatchEast] = useState('Adjacent Apartment');
  const [batchWest, setBatchWest] = useState('Open Courtyard');
  const [apartments, setApartments] = useState<InventoryApartment[]>([]);

  // Step 4: Sales Team Leader & Sales Agents Assignment
  const [assignedTeamLeaderId, setAssignedTeamLeaderId] = useState<number | null>(4);
  const [assignedSalesAgentIds, setAssignedSalesAgentIds] = useState<number[]>([2]);

  const teamLeaders = staffUsers.filter((u) => u.role === 'sales_leader');
  const salesAgents = staffUsers.filter((u) => u.role === 'sales');

  const startNewProject = () => {
    setEditingId(undefined);
    setCode('MR01');
    setName('Moon Residency');
    setLocation('Street 10, Wazir Akbar Khan, Kabul');
    setFloors(10);
    const defaultBatch = generateFloorApartmentBatch({
      projectId: 99,
      projectCode: 'MR01',
      floor: 1,
      unitsCount: 2,
      rooms: 3,
      areaSqm: 140,
      pricePerSqm: 800,
    });
    setApartments(defaultBatch);
    setStep(1);
    setShowWizard(true);
  };

  const handleGenerateBatch = () => {
    try {
      const generated = generateFloorApartmentBatch({
        projectId: editingId || 99,
        projectCode: code || 'PRJ',
        floor: Number(batchFloor),
        unitsCount: Number(batchUnitsCount),
        rooms: Number(batchRooms),
        areaSqm: Number(batchAreaSqm),
        pricePerSqm: Number(batchPricePerSqm),
        direction: batchDirection,
        boundaryNorth: batchNorth,
        boundarySouth: batchSouth,
        boundaryEast: batchEast,
        boundaryWest: batchWest,
        startIndex:
          apartments.filter((a) => a.floor === Number(batchFloor)).length + 1,
      });
      setApartments((prev) => [...prev, ...generated]);
      onNotice(
        `Added ${generated.length} apartments for Floor ${batchFloor} (${generated
          .map((g) => g.unitNumber)
          .join(', ')}).`
      );
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const handleAddSeller = () => {
    setSellers((prev) => [
      ...prev,
      {
        name: '',
        fatherName: '',
        grandfatherName: '',
        tazkiraNumber: '',
        phone: '',
        address: '',
        sharePercentage: 50,
      },
    ]);
  };

  const handleSave = async () => {
    try {
      await onSaveProject({
        id: editingId,
        code,
        name,
        location,
        description,
        floors: Number(floors),
        sellers,
        constructionCompany: {
          companyName,
          licenseNumber,
          representativeName,
          representativeFatherName,
          representativeTazkira,
          phone: companyPhone,
          address: companyAddress,
        },
        apartments,
        assignedTeamLeaderId,
        assignedSalesAgentIds,
      });
      onNotice(`Pre-sale project ${code} (${name}) saved to Internal Office CRM.`);
      setShowWizard(false);
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <section className="panel" data-testid="inventory-projects-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Internal Office CRM Database (Text & Numeric Only)</p>
          <h2>Pre-Sale Projects & Apartment Inventory</h2>
        </div>
        {canManage && (
          <div className="heading-actions">
            <button
              type="button"
              className="button"
              data-testid="open-project-wizard-btn"
              onClick={() => (showWizard ? setShowWizard(false) : startNewProject())}
            >
              {showWizard ? 'Close Project Wizard' : '+ Add Pre-Sale Project'}
            </button>
          </div>
        )}
      </div>

      {showWizard && canManage && (
        <div
          className="panel"
          style={{ marginTop: 14, borderStyle: 'dashed' }}
          data-testid="project-inventory-wizard"
        >
          <div className="wizard-steps">
            {[
              { s: 1 as const, label: '1. Project Identity' },
              { s: 2 as const, label: '2. Sellers & Construction Co.' },
              { s: 3 as const, label: '3. Apartments & Floor Batch' },
              { s: 4 as const, label: '4. Sales Assignment & Save' },
            ].map((item) => (
              <button
                key={item.s}
                type="button"
                className={`wizard-step ${step === item.s ? 'active' : ''}`}
                onClick={() => setStep(item.s)}
              >
                <span className="wizard-step-num">{item.s}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="form-grid" data-testid="wizard-step-1">
              <div className="field">
                <label>Project Code (e.g. KP12, MR01)</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MR01"
                />
              </div>
              <div className="field">
                <label>Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Moon Residency"
                />
              </div>
              <div className="field">
                <label>Location / District</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Wazir Akbar Khan, Kabul"
                />
              </div>
              <div className="field">
                <label>Total Floors</label>
                <input
                  type="number"
                  min={1}
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                />
              </div>
              <div className="field full">
                <label>Technical & Pre-Sale Summary</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="modal-actions full">
                <button type="button" className="button" onClick={() => setStep(2)}>
                  Next: Sellers & Construction Co.
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="wizard-step-2">
              <div className="panel-heading">
                <h3>Project Sellers / Property Owners ({sellers.length})</h3>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleAddSeller}
                >
                  + Add Co-Seller
                </button>
              </div>
              {sellers.map((s, idx) => (
                <div
                  key={idx}
                  className="form-grid"
                  style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}
                >
                  <div className="field">
                    <label>Seller #{idx + 1} Full Name</label>
                    <input
                      value={s.name}
                      onChange={(e) => {
                        const next = [...sellers];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setSellers(next);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Father Name</label>
                    <input
                      value={s.fatherName}
                      onChange={(e) => {
                        const next = [...sellers];
                        next[idx] = { ...next[idx], fatherName: e.target.value };
                        setSellers(next);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Tazkira Number</label>
                    <input
                      value={s.tazkiraNumber}
                      onChange={(e) => {
                        const next = [...sellers];
                        next[idx] = { ...next[idx], tazkiraNumber: e.target.value };
                        setSellers(next);
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      value={s.phone}
                      onChange={(e) => {
                        const next = [...sellers];
                        next[idx] = { ...next[idx], phone: e.target.value };
                        setSellers(next);
                      }}
                    />
                  </div>
                </div>
              ))}

              <h3 style={{ marginTop: 14, marginBottom: 10 }}>Construction Company Information</h3>
              <div className="form-grid">
                <div className="field">
                  <label>Construction Company Name</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>License Number</label>
                  <input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Authorized Representative Name</label>
                  <input
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Representative Tazkira</label>
                  <input
                    value={representativeTazkira}
                    onChange={(e) => setRepresentativeTazkira(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="button" onClick={() => setStep(3)}>
                  Next: Apartments & Floor Batch
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div data-testid="wizard-step-3">
              <h3>Floor Batch Generator (Auto-Creates Units with 4 Geographic Boundaries)</h3>
              <div className="form-grid" style={{ marginTop: 10 }}>
                <div className="field">
                  <label>Floor Number</label>
                  <input
                    type="number"
                    value={batchFloor}
                    onChange={(e) => setBatchFloor(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Units on Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={batchUnitsCount}
                    onChange={(e) => setBatchUnitsCount(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Rooms</label>
                  <input
                    type="number"
                    min={1}
                    value={batchRooms}
                    onChange={(e) => setBatchRooms(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Area (Sqm)</label>
                  <input
                    type="number"
                    min={20}
                    value={batchAreaSqm}
                    onChange={(e) => setBatchAreaSqm(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Price per Sqm (USD)</label>
                  <input
                    type="number"
                    min={100}
                    value={batchPricePerSqm}
                    onChange={(e) => setBatchPricePerSqm(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Direction / Orientation</label>
                  <input
                    value={batchDirection}
                    onChange={(e) => setBatchDirection(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>North Boundary (شمالاً)</label>
                  <input
                    value={batchNorth}
                    onChange={(e) => setBatchNorth(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>South Boundary (جنوباً)</label>
                  <input
                    value={batchSouth}
                    onChange={(e) => setBatchSouth(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>East Boundary (شرقاً)</label>
                  <input
                    value={batchEast}
                    onChange={(e) => setBatchEast(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>West Boundary (غرباً)</label>
                  <input
                    value={batchWest}
                    onChange={(e) => setBatchWest(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className="button secondary"
                  data-testid="generate-floor-batch-btn"
                  onClick={handleGenerateBatch}
                >
                  + Generate Floor Batch ({batchUnitsCount} Apartments)
                </button>
              </div>

              <div className="table-scroll" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Floor</th>
                      <th>Rooms</th>
                      <th>Area (Sqm)</th>
                      <th>Price/Sqm</th>
                      <th>Total (USD)</th>
                      <th>4 Boundaries (N / S / E / W)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apartments.map((apt, idx) => (
                      <tr key={`${apt.unitNumber}-${idx}`}>
                        <td><strong>{apt.unitNumber}</strong></td>
                        <td>Floor {apt.floor}</td>
                        <td>{apt.rooms}</td>
                        <td>{apt.areaSqm} m²</td>
                        <td>${apt.pricePerSqm.toLocaleString()}</td>
                        <td><strong>${apt.totalPrice.toLocaleString()}</strong></td>
                        <td>
                          <small>
                            N: {apt.boundaryNorth} | S: {apt.boundarySouth} | E: {apt.boundaryEast} | W: {apt.boundaryWest}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button type="button" className="button secondary" onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="button" className="button" onClick={() => setStep(4)}>
                  Next: Assign Sales Team & Save
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div data-testid="wizard-step-4">
              <h3>Assign Sales Team Leader & Sales Agents</h3>
              <div className="form-grid" style={{ marginTop: 10 }}>
                <div className="field">
                  <label>Sales Team Leader</label>
                  <select
                    value={assignedTeamLeaderId || ''}
                    onChange={(e) =>
                      setAssignedTeamLeaderId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">Select Team Leader</option>
                    {teamLeaders.map((tl) => (
                      <option key={tl.id} value={tl.id}>
                        {tl.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Assigned Sales Agents ({assignedSalesAgentIds.length} selected)</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 6 }}>
                    {salesAgents.map((sa) => {
                      const checked = assignedSalesAgentIds.includes(sa.id);
                      return (
                        <label
                          key={sa.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setAssignedSalesAgentIds((prev) =>
                                checked ? prev.filter((id) => id !== sa.id) : [...prev, sa.id]
                              )
                            }
                          />
                          {sa.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button type="button" className="button secondary" onClick={() => setStep(3)}>
                  Back
                </button>
                <button
                  type="button"
                  className="button"
                  data-testid="save-project-inventory-btn"
                  onClick={handleSave}
                >
                  Save Pre-Sale Project ({apartments.length} Apartments)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Pre-Sale Projects & Apartments Table */}
      <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
        {projects.map((proj) => {
          const availCount = proj.apartments.filter((a) => a.status === 'available').length;
          const closedCount = proj.apartments.filter(
            (a) => a.status === 'deal_closed' || a.status === 'sold'
          ).length;
          return (
            <article key={proj.id} className="customer-card" data-testid={`project-card-${proj.code}`}>
              <div className="customer-top">
                <div>
                  <span className="serial">{proj.code}</span>
                  <h3 style={{ margin: '4px 0' }}>{proj.name}</h3>
                  <small>{proj.location} • {proj.floors} Floors</small>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge active">{availCount} Available</span>
                  <span className="badge closed">{closedCount} Closed / Sold</span>
                </div>
              </div>

              <p style={{ margin: '8px 0', fontSize: 13 }}>
                <strong>Sellers:</strong> {proj.sellers.map((s) => `${s.name} (Tazkira: ${s.tazkiraNumber})`).join(' • ')}{' '}
                | <strong>Construction Co.:</strong> {proj.constructionCompany.companyName} (Rep: {proj.constructionCompany.representativeName})
              </p>

              <div className="table-scroll" style={{ marginTop: 10 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Apartment</th>
                      <th>Floor</th>
                      <th>Rooms</th>
                      <th>Area</th>
                      <th>Direction</th>
                      <th>4 Geographic Boundaries</th>
                      <th>Price/Sqm</th>
                      <th>Total Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proj.apartments.map((apt) => (
                      <tr key={apt.id}>
                        <td>
                          <strong>{apt.unitNumber}</strong>
                          <small>{apt.serialNumber}</small>
                        </td>
                        <td>Floor {apt.floor}</td>
                        <td>{apt.rooms} Rooms</td>
                        <td>{apt.areaSqm} m²</td>
                        <td>{apt.direction}</td>
                        <td>
                          <small>
                            N: {apt.boundaryNorth} • S: {apt.boundarySouth} • E: {apt.boundaryEast} • W: {apt.boundaryWest}
                          </small>
                        </td>
                        <td>${apt.pricePerSqm.toLocaleString()}</td>
                        <td>
                          <strong>
                            ${apt.totalPrice.toLocaleString()} {apt.currency}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${apt.status}`}>{apt.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
