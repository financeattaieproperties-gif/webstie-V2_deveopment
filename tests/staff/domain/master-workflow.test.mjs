import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceMarketingProduction,
  canAccessDatabase,
  canAssignTask,
  canManageDepartmentsAndUsers,
  canViewLead,
  createCustomerSerial,
  createDealClosedSerial,
  createLeadStageSerial,
  formatDateSuffix,
  formatLeadsToCsv,
  generateFloorApartmentBatch,
  generateLeadsPdfDocument,
  isManagerRole,
  issueContractSnapshot,
  processFinanceDeposit,
  reconcileInstallments,
  resolveCustomerRegistration,
  reviewDeliverableVersion,
  submitDeliverableVersion,
  summarizeLeadsPipeline,
  transitionSubmissionStatus,
  validateDealClosedSubmission,
  validateMarketingEntryCreation,
  validateProjectInventory,
} from '../../../packages/staff-contracts/workflow.mjs';

test('Phase 1: UDR-001..003 three-database isolation and CEO authority', () => {
  // Admin can access website and submissions, NEVER internal crm
  assert.equal(canAccessDatabase('admin', 'website'), true);
  assert.equal(canAccessDatabase('admin', 'submissions'), 'review_and_publish');
  assert.equal(canAccessDatabase('admin', 'crm'), false);

  // Manager and staff can access crm, NEVER website
  assert.equal(canAccessDatabase('manager', 'website'), false);
  assert.equal(canAccessDatabase('manager', 'crm'), true);
  assert.equal(canAccessDatabase('manager', 'submissions'), 'read_only');

  // Marketing roles can submit and read submissions; Engineering has no submission DB access
  assert.equal(canAccessDatabase('marketing_manager', 'submissions'), 'submit_and_read');
  assert.equal(canAccessDatabase('editor', 'submissions'), 'submit_and_read');
  assert.equal(canAccessDatabase('sales', 'submissions'), 'read_only');
  assert.equal(canAccessDatabase('architect', 'submissions'), false);

  // Manager role & department/user management
  assert.equal(isManagerRole('manager'), false);
  assert.equal(isManagerRole('ceo'), true);
  assert.equal(canManageDepartmentsAndUsers('manager'), false);
  assert.equal(canManageDepartmentsAndUsers('ceo'), true);
  assert.equal(canManageDepartmentsAndUsers('admin'), false);
  assert.equal(canManageDepartmentsAndUsers('sales_leader'), false);

  // Task assignment rules
  assert.equal(
    canAssignTask(
      { id: 1, role: 'ceo', active: true, branchId: null },
      { id: 10, role: 'architect', active: true, branchId: 2 }
    ),
    true
  );
  assert.equal(
    canAssignTask(
      { id: 3, role: 'sales_leader' },
      { id: 4, role: 'sales', teamLeaderId: 3, active: true }
    ),
    true
  );
  assert.equal(
    canAssignTask(
      { id: 3, role: 'sales_leader' },
      { id: 8, role: 'editor', active: true }
    ),
    false
  );
});

test('retired Finance Assistant cannot access databases, receive tasks, or draft deposits', () => {
  for (const database of ['crm', 'submissions', 'website']) {
    assert.equal(canAccessDatabase('finance_assistant', database), false);
  }
  for (const role of ['manager', 'finance_manager']) {
    assert.equal(canAssignTask(
      { id: 1, role },
      { id: 2, role: 'finance_assistant', active: true }
    ), false);
  }
  assert.throws(() => processFinanceDeposit({
    action: 'draft', actorRole: 'finance_assistant',
    deposit: { amount: 100 }, installment: { paidAmount: 0 },
  }), /Only Finance Manager/);
});

test('Phase 1 & 3: UDR-004 agent lead privacy and referral sharing', () => {
  const lead = {
    id: 101,
    originAgentId: 2,
    assigneeId: 4,
    sharedAgentIds: [],
  };

  assert.equal(canViewLead({ id: 1, role: 'ceo', active: true, branchId: null }, lead), true);
  assert.equal(canViewLead({ id: 3, role: 'sales_leader' }, lead, [4, 5]), true);
  assert.equal(canViewLead({ id: 2, role: 'callcenter' }, lead), true);
  assert.equal(canViewLead({ id: 4, role: 'sales' }, lead), true);
  assert.equal(canViewLead({ id: 9, role: 'callcenter' }, lead), false);
  assert.equal(canViewLead({ id: 5, role: 'sales' }, lead), false);

  // Explicit referral sharing grants visibility to receiving agent
  const sharedLead = {
    ...lead,
    sharedAgentIds: [5],
  };
  assert.equal(canViewLead({ id: 5, role: 'sales' }, sharedLead), true);
});

test('Phase 2: Manager project inventory validation and floor apartment batch generation', () => {
  const batch = generateFloorApartmentBatch({
    projectId: 1,
    projectCode: 'KP12',
    floor: 4,
    unitsCount: 3,
    rooms: 4,
    areaSqm: 145,
    pricePerSqm: 850,
    direction: 'North-East',
    boundaryNorth: 'Main Street',
    boundarySouth: 'Courtyard',
    boundaryEast: 'Unit B',
    boundaryWest: 'Park',
  });

  assert.equal(batch.length, 3);
  assert.equal(batch[0].unitNumber, 'F4-A1');
  assert.equal(batch[2].unitNumber, 'F4-A3');
  assert.equal(batch[0].totalPrice, 145 * 850);

  const validProject = validateProjectInventory(
    {
      id: 1,
      code: 'KP12',
      name: 'Kabul Plaza 12',
      location: 'Shahr-e-Naw, Kabul',
      sellers: [{ name: 'Haji Ahmad', phone: '0782222279', tazkiraNumber: '1400-01-9988' }],
      constructionCompany: { companyName: 'Attaie Builders', representativeName: 'Eng. Tariq' },
      apartments: batch,
    },
    [],
    'ceo'
  );
  assert.equal(validProject.code, 'KP12');

  // Duplicate apartment number on same project must fail
  assert.throws(
    () =>
      validateProjectInventory(
        {
          id: 1,
          code: 'KP12',
          name: 'Kabul Plaza 12',
          location: 'Shahr-e-Naw, Kabul',
          sellers: [{ name: 'Haji Ahmad', phone: '0782222279', tazkiraNumber: '1400-01-9988' }],
          constructionCompany: { companyName: 'Attaie Builders', representativeName: 'Eng. Tariq' },
          apartments: [...batch, { ...batch[0] }],
        },
        [],
          'ceo'
      ),
    /Duplicate apartment number/
  );
});

test('Phase 3: Serial generation, customer deduplication, and Deal Closed validation', () => {
  assert.equal(formatDateSuffix('2026-11-11T09:00:00Z'), '111126');
  assert.equal(createCustomerSerial('CA', 1, 12, '2026-11-11T09:00:00Z'), 'CA01-C12-111126');
  assert.equal(
    createLeadStageSerial({
      prefix: 'SA',
      agentId: 1,
      sequence: 5,
      stage: 'V',
      date: '2026-11-11T09:00:00Z',
    }),
    'SA01-V5-111126'
  );
  assert.equal(
    createDealClosedSerial(1, 'KP12', 'F4-A1', '2026-11-11T09:00:00Z'),
    'SA01PRC-KP12-F4-A1-111126'
  );

  const existingCustomers = [
    {
      id: 1,
      serial: 'CA01-C1-101126',
      name: 'Mirwais Azizi',
      phone: '+93700112233',
      requirements: '3-bed apartment',
      leadCount: 1,
      ownerAgentId: 2,
      sharedAgentIds: [],
    },
  ];

  // Different agent registering existing customer triggers redacted conflict + Manager Review Request
  const dupResult = resolveCustomerRegistration(existingCustomers, {
    name: 'Mirwais Azizi',
    phone: '+93 700 112 233',
    requirements: 'Looking for 4-bed in KP12',
    agentId: 4,
    agentName: 'Samiullah',
    agentPrefix: 'SA',
    date: '2026-11-11T10:00:00Z',
  });
  assert.equal(dupResult.outcome, 'duplicate_conflict');
  assert.equal(dupResult.redacted, true);
  assert.equal(dupResult.customer, null);
  assert.equal(dupResult.reviewRequest.status, 'pending_review');
  assert.equal(dupResult.reviewRequest.requestingAgentId, 4);

  // Deal closed validation requires buyer Photo and Tazkira
  assert.throws(
    () =>
      validateDealClosedSubmission({
        actorRole: 'sales',
        agentId: 1,
        projectCode: 'KP12',
        apartmentNumber: 'F4-A1',
        totalAmount: 120000,
        buyerPhotoUrl: '',
        tazkiraPhotoUrl: '',
      }),
    /Buyer portrait photo and buyer Tazkira photo are required/
  );

  const completeDeal = validateDealClosedSubmission({
    actorRole: 'sales',
    agentId: 1,
    projectCode: 'KP12',
    apartmentNumber: 'F4-A1',
    totalAmount: 120000,
    buyerPhotoUrl: '/uploads/buyers/photo.jpg',
    tazkiraPhotoUrl: '/uploads/buyers/tazkira.jpg',
    date: '2026-11-11T10:00:00Z',
  });
  assert.equal(completeDeal.dealSerial, 'SA01PRC-KP12-F4-A1-111126');
  assert.equal(completeDeal.agreedAmount, 120000);
});

test('Phase 4: HR contract 100% installment reconciliation, direct issuance, and Finance deposit approval/reversal', () => {
  assert.throws(
    () =>
      reconcileInstallments(100000, [
        { description: 'Downpayment', percentage: 30, dueDate: '2026-11-15' },
        { description: 'Installment 1', percentage: 50, dueDate: '2026-12-15' },
      ]),
    /Installment percentages must total exactly 100%/
  );

  const balanced = reconcileInstallments(100000, [
    { description: 'Downpayment', percentage: 30, dueDate: '2026-11-15' },
    { description: 'Installment 1', percentage: 35, dueDate: '2027-02-15' },
    { description: 'Handover', percentage: 35, dueDate: '2027-06-15' },
  ]);
  assert.equal(balanced.length, 3);
  assert.equal(balanced[0].scheduledAmount, 30000);

  const project = {
    id: 1,
    code: 'KP12',
    name: 'Kabul Plaza 12',
    sellers: [{ name: 'Haji Ahmad', fatherName: 'Karim', tazkiraNumber: '1400-01-9988', phone: '0782222279' }],
    constructionCompany: { companyName: 'Attaie Builders', representativeName: 'Eng. Tariq', licenseNumber: 'LIC-901', address: 'Shahr-e-Naw' },
  };
  const apartment = {
    id: 401,
    unitNumber: 'F4-A1',
    serialNumber: 'KP12-F4-A1',
    floor: 4,
    rooms: 4,
    areaSqm: 125,
    direction: 'South-East',
    boundaryNorth: 'Street',
    boundarySouth: 'Courtyard',
    boundaryEast: 'F4-A2',
    boundaryWest: 'Garden',
    pricePerSqm: 800,
    totalPrice: 100000,
    currency: 'USD',
    status: 'available',
  };

  const issued = issueContractSnapshot({
    actorRole: 'manager',
    project,
    apartment,
    buyers: [
      {
        name: 'Farhad Noori',
        fatherName: 'Aziz Noori',
        grandfatherName: 'Noor',
        tazkiraNumber: '1400-04-1122',
        phone: '0782222279',
        address: 'Karte 4, Kabul',
        photo3x4Url: '/uploads/buyers/farhad-3x4.jpg',
      },
    ],
    installments: balanced,
    salesAgentName: 'Samiullah',
    now: '2026-11-11T12:00:00Z',
  });
  assert.equal(issued.status, 'issued');
  assert.equal(issued.contractSerial, 'CNT-KP12-F4-A1-111126');

  // Finance Manager drafts and posts deposits as the only Finance role.
  const managerDraft = processFinanceDeposit({
    action: 'draft',
    actorRole: 'finance_manager',
    deposit: {
      id: 1,
      contractId: 1,
      installmentId: issued.installments[0].id,
      amount: 30000,
      currency: 'USD',
      receiptNumber: 'RCP-1001',
    },
    installment: issued.installments[0],
    now: '2026-11-11T13:00:00Z',
  });
  assert.equal(managerDraft.deposit.status, 'draft');

  assert.throws(
    () =>
      processFinanceDeposit({
        action: 'approve',
        actorRole: 'finance_assistant',
        deposit: managerDraft.deposit,
        installment: managerDraft.installment,
      }),
    /Only Finance Manager/
  );

  // Finance Manager approves deposit and updates installment balance
  const managerPost = processFinanceDeposit({
    action: 'approve',
    actorRole: 'finance_manager',
    deposit: managerDraft.deposit,
    installment: managerDraft.installment,
    now: '2026-11-11T14:00:00Z',
  });
  assert.equal(managerPost.deposit.status, 'posted');
  assert.equal(managerPost.installment.status, 'paid');
  assert.equal(managerPost.installment.paidAmount, 30000);

  // Finance Manager reverses with required reason
  const managerReverse = processFinanceDeposit({
    action: 'reverse',
    actorRole: 'finance_manager',
    deposit: managerPost.deposit,
    installment: managerPost.installment,
    reason: 'Duplicate receipt entry',
    now: '2026-11-11T15:00:00Z',
  });
  assert.equal(managerReverse.deposit.status, 'reversed');
  assert.equal(managerReverse.installment.status, 'pending');
  assert.equal(managerReverse.installment.paidAmount, 0);
});

test('Phase 5: Marketing production stages, Posted -> Submission DB handoff, and Admin publishing transitions', () => {
  const created = validateMarketingEntryCreation(
    {
      customerName: 'Haji Khalid',
      address: 'Street 10, Wazir Akbar Khan',
      propertyType: 'Villa',
    },
    'sales'
  );
  assert.equal(created.propertyType, 'Villa');

  let entry = {
    id: 1,
    customerName: created.customerName,
    address: created.address,
    propertyType: created.propertyType,
    stage: 'submitted',
    version: 1,
  };

  entry = advanceMarketingProduction(
    entry,
    'schedule_filming',
    { filmingDate: '2026-11-12', videographerId: 7 },
    'marketing_manager'
  );
  assert.equal(entry.stage, 'filming_scheduled');

  entry = advanceMarketingProduction(
    entry,
    'complete_filming',
    { completedAt: '2026-11-12T14:00:00Z' },
    'videographer'
  );
  assert.equal(entry.stage, 'filming_completed');

  entry = advanceMarketingProduction(
    entry,
    'schedule_editing',
    { editingDeadlineAt: '2026-11-13' },
    'editor'
  );
  assert.equal(entry.stage, 'editing_scheduled');

  entry = advanceMarketingProduction(
    entry,
    'ready_for_post',
    { contentType: 'Ad Video' },
    'editor'
  );
  assert.equal(entry.stage, 'ready_for_post');

  // Marking Posted requires AP - XXXX serial and exactly 5 photos
  assert.throws(
    () =>
      advanceMarketingProduction(
        entry,
        'mark_posted',
        {
          serialNumber: 'BAD-SERIAL',
          propertyInfoNote: 'Short',
          photos: ['1.jpg', '2.jpg'],
          platform: 'Instagram',
        },
        'editor'
      ),
    /Enter a valid post serial number/
  );

  const validPosted = advanceMarketingProduction(
    entry,
    'mark_posted',
    {
      serialNumber: 'AP - 1765',
      propertyInfoNote: 'Luxury 6-bedroom villa in Wazir Akbar Khan with courtyard and solar backup',
      photos: ['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'],
      platform: 'Instagram',
    },
    'editor'
  );
  assert.equal(validPosted.entry.stage, 'posted');
  assert.equal(validPosted.submission.serialNumber, 'AP - 1765');
  assert.equal(validPosted.submission.publishStatus, 'Submitted');
  assert.equal(validPosted.submission.photos.length, 5);

  // Admin transitions Submitted -> Approved -> Published
  const approved = transitionSubmissionStatus(validPosted.submission, 'approve', 'admin');
  assert.equal(approved.publishStatus, 'Approved');

  const published = transitionSubmissionStatus(approved, 'publish', 'admin', {
    websitePropertyId: 99,
  });
  assert.equal(published.publishStatus, 'Published');
  assert.equal(published.websitePropertyId, 99);
});

test('Phase 6: Engineering versioned deliverables and CEO review', () => {
  const initialDeliverable = {
    id: 1,
    projectId: 1,
    role: 'architect',
    versions: [],
    version: 1,
  };

  const v1 = submitDeliverableVersion(initialDeliverable, {
    actorRole: 'architect',
    actorName: 'Eng. Omar',
    fileUrl: '/uploads/eng/kp12-v1.pdf',
    fileName: 'kp12-floorplan-v1.pdf',
    format: '2D Floor Plan (PDF)',
    notes: 'Initial CAD layout',
    submittedAt: '2026-11-11T15:00:00Z',
  });
  assert.equal(v1.versions.length, 1);
  assert.equal(v1.versions[0].versionNumber, 1);

  const revisionReq = reviewDeliverableVersion(v1, {
    actorRole: 'ceo',
    reviewerName: 'Ahmad (CEO)',
    versionNumber: 1,
    decision: 'revision_requested',
    comment: 'Widen corridor on Floor 4 by 30cm',
    reviewedAt: '2026-11-11T16:00:00Z',
  });
  assert.equal(revisionReq.versions[0].status, 'revision_requested');

  const v2 = submitDeliverableVersion(revisionReq, {
    actorRole: 'architect',
    actorName: 'Eng. Omar',
    fileUrl: '/uploads/eng/kp12-v2.pdf',
    fileName: 'kp12-floorplan-v2.pdf',
    format: '2D Floor Plan (PDF)',
    notes: 'Widened corridor by 30cm per Manager note',
    submittedAt: '2026-11-12T10:00:00Z',
  });
  assert.equal(v2.versions.length, 2);
  assert.equal(v2.versions[1].versionNumber, 2);

  const approvedV2 = reviewDeliverableVersion(v2, {
    actorRole: 'ceo',
    reviewerName: 'Ahmad (CEO)',
    versionNumber: 2,
    decision: 'approved',
    comment: 'Approved for construction package',
    reviewedAt: '2026-11-12T11:00:00Z',
  });
  assert.equal(approvedV2.versions[0].status, 'revision_requested');
  assert.equal(approvedV2.versions[1].status, 'approved');
});

test('Leads Management Export: formatLeadsToCsv and generateLeadsPdfDocument export current view leads cleanly', () => {
  const sampleLeads = [
    {
      id: 101,
      serial: 'CA01-L1-111126',
      customerName: 'Ahmad Rahimi',
      phone: '+93700112233',
      projectName: 'Kabul Plaza 12',
      apartmentNumber: 'F3-A1',
      requirements: '3-bed apartment, bright view, "high floor" preferred',
      source: 'manual',
      status: 'active',
      callAt: '2026-11-11T10:30:00Z',
    },
    {
      id: 102,
      serial: 'SA02PRC-KP12-F4-A1-111126',
      customerName: 'Zahra Azizi',
      phone: '+93799445566',
      projectName: 'Kabul Plaza 12',
      apartmentNumber: 'F4-A1',
      requirements: '4-bed luxury corner unit',
      source: 'provider',
      status: 'closed',
      callAt: '2026-11-11T14:15:00Z',
    },
  ];

  const csv = formatLeadsToCsv(sampleLeads, { includeBom: false });
  const lines = csv.trim().split('\r\n');
  assert.equal(lines.length, 3);
  assert.match(lines[0], /Serial \/ ID,Customer Name,Phone,Email,Project \/ Property/);
  assert.match(lines[1], /CA01-L1-111126,Ahmad Rahimi,\+93700112233,,Kabul Plaza 12 \(F3-A1\)/);
  assert.match(lines[1], /"3-bed apartment, bright view, ""high floor"" preferred"/);
  assert.match(lines[2], /SA02PRC-KP12-F4-A1-111126,Zahra Azizi,\+93799445566/);

  const pdf = generateLeadsPdfDocument(sampleLeads, {
    title: 'Attaie Properties — Leads Export Test',
    subtitle: 'Current View: 2 Leads',
  });
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('Attaie Properties'));
  assert.ok(pdf.includes('CA01-L1-111126'));
  assert.ok(pdf.includes('Ahmad Rahimi'));
  assert.ok(pdf.includes('Zahra Azizi'));
  assert.ok(pdf.trim().endsWith('%%EOF'));

  const summary = summarizeLeadsPipeline([
    ...sampleLeads,
    { id: 103, status: 'draft', customerName: 'New Inquiry' },
    { id: 104, status: 'lost', customerName: 'Lost Inquiry' },
    { id: 105, status: 'active', customerName: 'Second Active' },
  ]);
  assert.equal(summary.total, 5);
  assert.equal(summary.active, 2);
  assert.equal(summary.draft, 1);
  assert.equal(summary.closed, 1);
  assert.equal(summary.lost, 1);
  assert.equal(summary.percentages.activePct, 40);
  assert.equal(summary.percentages.draftPct, 20);
  assert.equal(summary.percentages.closedPct, 20);
  assert.equal(summary.percentages.lostPct, 20);
});


