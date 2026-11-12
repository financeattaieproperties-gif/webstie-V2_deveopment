import {
  ACTIVE_INTERNAL_ROLES,
  canReadBranch,
  isGlobalRole,
} from './branch-policy.mjs';

export const DAY = 86_400_000;

export function feedbackDeadline(scheduledAt) {
  return new Date(Date.parse(scheduledAt) + DAY).toISOString();
}

export function followupState(task, now = new Date().toISOString()) {
  const deadline = Date.parse(task.scheduledAt) + DAY;
  if (task.completedAt)
    return Date.parse(task.completedAt) > deadline
      ? "completed_late"
      : "completed";
  const time = Date.parse(now);
  return time < Date.parse(task.scheduledAt)
    ? "upcoming"
    : time > deadline
      ? "overtime"
      : "due";
}

export function taskState(task, now = new Date().toISOString()) {
  return ["completed", "cancelled"].includes(task.status)
    ? task.status
    : Date.parse(now) > Date.parse(task.deadlineAt)
      ? "overdue"
      : task.status;
}

export function normalizePhone(raw) {
  let number = String(raw).replace(/[^0-9]/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (/^07\d{8}$/.test(number)) number = `93${number.slice(1)}`;
  if (!/^937\d{8}$/.test(number))
    throw new Error("Enter a valid Afghan mobile number.");
  return `+${number}`;
}

export function formatDateSuffix(dateInput = new Date().toISOString()) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date for serial.");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kabul",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value || "01";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const year = parts.find((p) => p.type === "year")?.value || "26";
  return `${day}${month}${year}`;
}

export function createSerial(agentId, sequence, options = undefined) {
  if (
    !Number.isSafeInteger(agentId) ||
    agentId < 1 ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  )
    throw new Error("Invalid serial counter.");
  if (!options) {
    return `CA${String(agentId).padStart(2, "0")}-L${sequence}`;
  }
  const prefix = options.prefix || "CA";
  const stage = options.stage || "L";
  const suffix = options.date ? `-${formatDateSuffix(options.date)}` : "";
  return `${prefix}${String(agentId).padStart(2, "0")}-${stage}${sequence}${suffix}`;
}

export function createLeadStageSerial({
  prefix = "SA",
  agentId,
  sequence,
  stage = "L",
  date,
}) {
  if (!["SA", "CA"].includes(prefix))
    throw new Error("Agent prefix must be SA or CA.");
  if (!["L", "F", "V", "DC", "DL"].includes(stage))
    throw new Error("Stage code must be L, F, V, DC, or DL.");
  if (
    !Number.isSafeInteger(agentId) ||
    agentId < 1 ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  )
    throw new Error("Invalid lead serial counter.");
  const ddmmyy = formatDateSuffix(date);
  return `${prefix}${String(agentId).padStart(2, "0")}-${stage}${sequence}-${ddmmyy}`;
}

export function createCustomerSerial(prefix, agentId, customerSeq, date) {
  if (!["SA", "CA"].includes(prefix))
    throw new Error("Customer serial prefix must be SA or CA.");
  if (
    !Number.isSafeInteger(agentId) ||
    agentId < 1 ||
    !Number.isSafeInteger(customerSeq) ||
    customerSeq < 1
  )
    throw new Error("Invalid customer serial counter.");
  const ddmmyy = formatDateSuffix(date);
  return `${prefix}${String(agentId).padStart(2, "0")}-C${customerSeq}-${ddmmyy}`;
}

export function createDealClosedSerial(
  agentId,
  projectCode,
  apartmentNumber,
  date,
) {
  if (!Number.isSafeInteger(agentId) || agentId < 1)
    throw new Error("Invalid sales agent ID.");
  const cleanProject = String(projectCode || "").trim();
  const cleanApt = String(apartmentNumber || "").trim();
  if (!cleanProject || !cleanApt)
    throw new Error("Project code and apartment number are required.");
  const ddmmyy = formatDateSuffix(date);
  return `SA${String(agentId).padStart(2, "0")}PRC-${cleanProject}-${cleanApt}-${ddmmyy}`;
}

export function validateFeedback(input, role, now = new Date().toISOString()) {
  if (!["followup", "visit", "closed", "lost"].includes(input.outcome))
    throw new Error("Select an outcome.");
  if (input.outcome === "closed") {
    if (role !== "sales")
      throw new Error("Only a sales agent can close a deal.");
    if (
      !/^\d{1,12}(\.\d{1,2})?$/.test(String(input.amount)) ||
      Number(input.amount) <= 0
    )
      throw new Error(
        "Enter a positive deal amount with at most two decimals.",
      );
    if (!["AFN", "USD"].includes(input.currency))
      throw new Error("Choose deal currency.");
  } else if (input.outcome === "lost") {
    if (!String(input.reason || "").trim())
      throw new Error("A loss reason is required.");
  } else {
    if (!String(input.notes || "").trim())
      throw new Error("Feedback is required.");
    if (
      !Number.isFinite(Date.parse(input.nextScheduledAt)) ||
      Date.parse(input.nextScheduledAt) <= Date.parse(now)
    )
      throw new Error("Choose a next follow-up date and time in the future.");
    if (!Number.isInteger(input.nextAssigneeId) || input.nextAssigneeId < 1)
      throw new Error("Select the next agent.");
  }
  return input;
}

// ============================================================================
// Phase 1: Three-Database Access Boundaries & Role Permissions (UDR-001..004)
// ============================================================================

const INTERNAL_CRM_ROLES = new Set(ACTIVE_INTERNAL_ROLES);

export function isManagerRole(role) {
  return isGlobalRole(role);
}

export function canAccessDatabase(role, database) {
  if (database === "website") {
    return role === "admin";
  }
  if (database === "crm") {
    if (role === "admin" || role === "customer") return false;
    return INTERNAL_CRM_ROLES.has(role);
  }
  if (database === "submissions") {
    if (role === "admin") return "review_and_publish";
    if (
      [
        "marketing_manager",
        "editor",
        "videographer",
      ].includes(role)
    ) {
      return "submit_and_read";
    }
    if (
      [
        "ceo",
        "manager",
        "finance_manager",
        "sales_leader",
        "sales",
        "callcenter",
      ].includes(role)
    ) {
      return "read_only";
    }
    return false;
  }
  return false;
}

export function canManageDepartmentsAndUsers(role) {
  return isGlobalRole(role);
}

export function canAssignTask(actor, targetUser) {
  if (!actor || !targetUser || !targetUser.active) return false;
  if (!INTERNAL_CRM_ROLES.has(actor.role) || !INTERNAL_CRM_ROLES.has(targetUser.role)) return false;
  if (actor.role === "admin" || targetUser.role === "admin") return false;
  if (isGlobalRole(actor.role)) return true;
  if (actor.role === "manager") {
    return canReadBranch(actor, targetUser.branchId);
  }
  if (actor.role === "sales_leader") {
    return (
      targetUser.role === "sales" &&
      (targetUser.teamLeaderId === actor.id || !targetUser.teamLeaderId)
    );
  }
  if (
    actor.role === "marketing_manager"
  ) {
    return [
      "editor",
      "videographer",
      "marketing_manager",
    ].includes(targetUser.role);
  }
  if (actor.role === "finance_manager") {
    return targetUser.role === "finance_manager";
  }
  return false;
}

export function canViewLead(actor, lead, assignedSalesAgentIds = []) {
  if (!actor || !lead) return false;
  if (actor.role === "admin") return false;
  if (isGlobalRole(actor.role)) return true;
  if (actor.role === "manager") return canReadBranch(actor, lead.branchId);
  if (actor.role === "sales_leader") {
    const teamSet = new Set(assignedSalesAgentIds);
    return (
      teamSet.has(lead.originAgentId) ||
      teamSet.has(lead.assigneeId) ||
      (lead.sharedAgentIds || []).some((id) => teamSet.has(id))
    );
  }
  if (actor.role === "callcenter" || actor.role === "sales") {
    return (
      lead.originAgentId === actor.id ||
      lead.assigneeId === actor.id ||
      (lead.sharedAgentIds || []).includes(actor.id)
    );
  }
  return false;
}

// ============================================================================
// Phase 2: Manager Project & Apartment Inventory Wizard Validation
// ============================================================================

export function generateFloorApartmentBatch({
  projectId,
  projectCode,
  floor,
  unitsCount,
  rooms,
  areaSqm,
  direction = "South-East",
  boundaryNorth = "Corridor",
  boundarySouth = "Main Street",
  boundaryEast = "Adjacent Unit",
  boundaryWest = "Open Courtyard",
  pricePerSqm,
  currency = "USD",
  startIndex = 1,
}) {
  if (!Number.isInteger(floor) || !Number.isInteger(unitsCount) || unitsCount < 1)
    throw new Error("Enter a valid floor number and apartment count.");
  if (!(Number(areaSqm) > 0) || !(Number(pricePerSqm) > 0))
    throw new Error("Apartment area and price per square meter must be positive.");
  const batch = [];
  for (let i = 0; i < unitsCount; i++) {
    const unitNum = `F${floor}-A${startIndex + i}`;
    const total = Math.round(Number(areaSqm) * Number(pricePerSqm) * 100) / 100;
    batch.push({
      id: floor * 100 + startIndex + i,
      projectId,
      unitNumber: unitNum,
      serialNumber: `${projectCode}-${unitNum}`,
      floor,
      rooms: Number(rooms) || 3,
      areaSqm: Number(areaSqm),
      direction,
      boundaryNorth,
      boundarySouth,
      boundaryEast,
      boundaryWest,
      pricePerSqm: Number(pricePerSqm),
      totalPrice: total,
      currency,
      status: "available",
    });
  }
  return batch;
}

export function validateProjectInventory(projectInput, existingProjects = [], actorRole = "ceo") {
  if (!isGlobalRole(actorRole)) {
    throw new Error("Only CEO may add or update project inventory.");
  }
  const code = String(projectInput.code || "").trim().toUpperCase();
  const name = String(projectInput.name || "").trim();
  const location = String(projectInput.location || "").trim();
  if (!code || !name || !location) {
    throw new Error("Project code, name, and location are required.");
  }
  if (
    existingProjects.some(
      (p) => p.code.toUpperCase() === code && p.id !== projectInput.id,
    )
  ) {
    throw new Error(`Project code ${code} already exists.`);
  }
  if (!Array.isArray(projectInput.sellers) || projectInput.sellers.length < 1) {
    throw new Error("At least one project seller is required.");
  }
  for (const seller of projectInput.sellers) {
    if (!String(seller.name || "").trim() || !String(seller.tazkiraNumber || "").trim()) {
      throw new Error("Every seller requires a full name and Tazkira number.");
    }
  }
  const cc = projectInput.constructionCompany || {};
  if (!String(cc.companyName || "").trim() || !String(cc.representativeName || "").trim()) {
    throw new Error("Construction company name and authorized representative are required.");
  }
  if (!Array.isArray(projectInput.apartments) || projectInput.apartments.length < 1) {
    throw new Error("Add at least one apartment to the project.");
  }
  const seenUnits = new Set();
  for (const apt of projectInput.apartments) {
    const unitNo = String(apt.unitNumber || "").trim().toUpperCase();
    if (!unitNo) throw new Error("Every apartment must have a unit number.");
    if (seenUnits.has(unitNo)) {
      throw new Error(`Duplicate apartment number ${unitNo} in project ${code}.`);
    }
    seenUnits.add(unitNo);
    if (!(Number(apt.areaSqm) > 0) || !(Number(apt.totalPrice) > 0)) {
      throw new Error(`Apartment ${unitNo} requires a positive area and total price.`);
    }
    if (
      !String(apt.boundaryNorth || "").trim() ||
      !String(apt.boundarySouth || "").trim() ||
      !String(apt.boundaryEast || "").trim() ||
      !String(apt.boundaryWest || "").trim()
    ) {
      throw new Error(`Apartment ${unitNo} requires all four geographic boundaries.`);
    }
  }
  return { ...projectInput, code, name, location };
}

// ============================================================================
// Phase 3: Master Customer Registry Deduplication & Deal Closed Validation
// ============================================================================

export function resolveCustomerRegistration(
  masterCustomers,
  { name, phone, requirements = "", agentId, agentName = "Agent", agentPrefix = "CA", date = new Date().toISOString() },
) {
  const normalizedPhone = normalizePhone(phone);
  const existing = masterCustomers.find((c) => c.phone === normalizedPhone);
  if (!existing) {
    const seq = masterCustomers.length + 1;
    const customer = {
      id: seq,
      serial: createCustomerSerial(agentPrefix, agentId, seq, date),
      name: String(name || "").trim(),
      phone: normalizedPhone,
      requirements: String(requirements || "").trim(),
      leadCount: 1,
      ownerAgentId: agentId,
      sharedAgentIds: [],
    };
    return {
      outcome: "created",
      customer,
      redacted: false,
      reviewRequest: null,
    };
  }
  const isAuthorized =
    existing.ownerAgentId === agentId ||
    (existing.sharedAgentIds || []).includes(agentId);
  if (isAuthorized) {
    return {
      outcome: "linked_owned",
      customer: existing,
      redacted: false,
      reviewRequest: null,
    };
  }
  // Owned by another agent: hide details and create a Manager review request
  return {
    outcome: "duplicate_conflict",
    customer: null,
    redacted: true,
    reviewRequest: {
      customerId: existing.id,
      phone: normalizedPhone,
      requestingAgentId: agentId,
      requestingAgentName: agentName,
      submittedName: String(name || "").trim(),
      submittedRequirements: String(requirements || "").trim(),
      status: "pending_review",
      createdAt: date,
    },
  };
}

export function validateDealClosedSubmission({
  actorRole,
  agentId,
  projectCode,
  apartmentNumber,
  areaSqm,
  pricePerSqm,
  totalAmount,
  currency = "USD",
  buyerPhotoUrl,
  tazkiraPhotoUrl,
  date = new Date().toISOString(),
}) {
  if (actorRole !== "sales") {
    throw new Error("Only a Sales Agent can submit a Deal Closed entry.");
  }
  if (!String(projectCode || "").trim() || !String(apartmentNumber || "").trim()) {
    throw new Error("Select a project and apartment for Deal Closed.");
  }
  if (!String(buyerPhotoUrl || "").trim() || !String(tazkiraPhotoUrl || "").trim()) {
    throw new Error("Buyer portrait photo and buyer Tazkira photo are required.");
  }
  const computedTotal =
    Number(totalAmount) > 0
      ? Math.round(Number(totalAmount) * 100) / 100
      : Number(pricePerSqm) > 0 && Number(areaSqm) > 0
        ? Math.round(Number(pricePerSqm) * Number(areaSqm) * 100) / 100
        : 0;
  if (!(computedTotal > 0)) {
    throw new Error("Enter a positive total amount or price per square meter.");
  }
  const dealSerial = createDealClosedSerial(
    agentId,
    projectCode,
    apartmentNumber,
    date,
  );
  return {
    dealSerial,
    agreedAmount: computedTotal,
    currency,
    buyerPhotoUrl: String(buyerPhotoUrl).trim(),
    tazkiraPhotoUrl: String(tazkiraPhotoUrl).trim(),
  };
}

// ============================================================================
// Phase 4: HR Contracts, Installments Reconciliation & Finance Deposits
// ============================================================================

export function reconcileInstallments(totalPrice, rawInstallments) {
  const total = Math.round(Number(totalPrice) * 100) / 100;
  if (!(total > 0)) throw new Error("Contract total price must be positive.");
  if (!Array.isArray(rawInstallments) || rawInstallments.length < 1) {
    throw new Error("Provide at least one contract installment.");
  }
  let pctSum = 0;
  for (const inst of rawInstallments) {
    const pct = Number(inst.percentage);
    if (!(pct > 0) || pct > 100) {
      throw new Error("Every installment must have a percentage between 0 and 100.");
    }
    pctSum += Math.round(pct * 100);
  }
  if (pctSum !== 10000) {
    throw new Error("Installment percentages must total exactly 100%.");
  }
  let runningCents = 0;
  const totalCents = Math.round(total * 100);
  return rawInstallments.map((inst, idx) => {
    const isLast = idx === rawInstallments.length - 1;
    const rawCents = Math.round((totalCents * Number(inst.percentage)) / 100);
    const scheduledCents = isLast ? totalCents - runningCents : rawCents;
    runningCents += scheduledCents;
    const paidCents = Math.round(Number(inst.paidAmount || 0) * 100);
    const scheduledAmount = scheduledCents / 100;
    const paidAmount = paidCents / 100;
    return {
      id: inst.id || idx + 1,
      number: idx + 1,
      description: String(inst.description || `Installment ${idx + 1}`).trim(),
      percentage: Number(inst.percentage),
      dueDate: inst.dueDate || null,
      scheduledAmount,
      paidAmount,
      status:
        paidCents >= scheduledCents
          ? "paid"
          : paidCents > 0
            ? "partially_paid"
            : "pending",
    };
  });
}

/** @param {{actorRole: string, project: import("./types").InventoryProject | undefined, apartment: import("./types").InventoryApartment | undefined, buyers: import("./types").ContractBuyer[], installments: import("./types").ContractIssueInput["installments"], salesAgentName: string, clauses?: string[], notes?: string, existingContracts?: Array<{projectId: number, apartmentId: number, status: string, contractSerial: string}>, issuedBy?: string, now?: string}} input */
export function issueContractSnapshot({
  actorRole,
  project,
  apartment,
  buyers,
  installments,
  salesAgentName,
  clauses = [],
  notes = "",
  existingContracts = [],
  issuedBy = "Manager",
  now = new Date().toISOString(),
}) {
  if (actorRole !== "manager") {
    throw new Error("Only Manager may create and issue deal contracts.");
  }
  if (!project || !apartment) {
    throw new Error("Select a valid project and apartment from Manager inventory.");
  }
  const conflicting = existingContracts.find(
    (c) =>
      c.projectId === project.id &&
      c.apartmentId === apartment.id &&
      c.status !== "cancelled",
  );
  if (conflicting) {
    throw new Error(
      `Apartment ${apartment.unitNumber} already has an active contract (${conflicting.contractSerial}).`,
    );
  }
  if (!Array.isArray(buyers) || buyers.length < 1) {
    throw new Error("At least one buyer with Tazkira details is required.");
  }
  const reconciled = reconcileInstallments(apartment.totalPrice, installments);
  return {
    contractSerial: `CNT-${project.code}-${apartment.unitNumber}-${formatDateSuffix(now)}`,
    projectId: project.id,
    projectCode: project.code,
    projectName: project.name,
    apartmentId: apartment.id,
    apartmentNumber: apartment.unitNumber,
    apartmentSerial: apartment.serialNumber,
    floor: apartment.floor,
    rooms: apartment.rooms,
    areaSqm: apartment.areaSqm,
    direction: apartment.direction,
    boundaries: {
      north: apartment.boundaryNorth,
      south: apartment.boundarySouth,
      east: apartment.boundaryEast,
      west: apartment.boundaryWest,
    },
    sellersSnapshot: structuredClone(project.sellers),
    constructionSnapshot: structuredClone(project.constructionCompany),
    buyers: structuredClone(buyers),
    pricePerSqm: apartment.pricePerSqm,
    totalPrice: apartment.totalPrice,
    currency: apartment.currency,
    salesAgentName: String(salesAgentName || "").trim(),
    gregorianDate: now.slice(0, 10),
    jalaliDate: "1405/08/20",
    clauses: [...clauses],
    notes: String(notes || "").trim(),
    installments: reconciled,
    status: "issued",
    amendmentVersion: 1,
    issuedBy,
    issuedAt: now,
    version: 1,
  };
}

export function processFinanceDeposit({
  action,
  actorRole,
  deposit,
  installment,
  reason = "",
  now = new Date().toISOString(),
}) {
  if (actorRole !== "finance_manager") {
    throw new Error("Only Finance Manager can draft or manage customer deposits.");
  }
  if (action === "draft") {
    if (!(Number(deposit.amount) > 0)) {
      throw new Error("Deposit amount must be positive.");
    }
    return {
      deposit: {
        ...deposit,
        status: "draft",
        createdAt: now,
        version: 1,
      },
      installment: { ...installment },
    };
  }
  if (actorRole !== "finance_manager") {
    throw new Error("Only Finance Manager can post, return, or reverse deposits.");
  }
  if (action === "approve") {
    if (deposit.status === "posted") {
      throw new Error("Deposit is already posted.");
    }
    if (deposit.status !== "draft") {
      throw new Error("Only draft deposits can be approved for posting.");
    }
    const nextPaid =
      Math.round((Number(installment.paidAmount) + Number(deposit.amount)) * 100) /
      100;
    const nextStatus =
      nextPaid >= Number(installment.scheduledAmount)
        ? "paid"
        : nextPaid > 0
          ? "partially_paid"
          : "pending";
    return {
      deposit: {
        ...deposit,
        status: "posted",
        postedAt: now,
        version: (deposit.version || 1) + 1,
      },
      installment: {
        ...installment,
        paidAmount: nextPaid,
        status: nextStatus,
      },
    };
  }
  if (action === "return") {
    if (deposit.status !== "draft") {
      throw new Error("Only draft deposits can be returned for correction.");
    }
    return {
      deposit: {
        ...deposit,
        status: "returned",
        reversalReason: String(reason || "Returned for correction").trim(),
        version: (deposit.version || 1) + 1,
      },
      installment: { ...installment },
    };
  }
  if (action === "reverse") {
    if (deposit.status !== "posted") {
      throw new Error("Only posted deposits can be reversed.");
    }
    if (!String(reason || "").trim()) {
      throw new Error("A reversal reason is required to reverse a posted deposit.");
    }
    const nextPaid = Math.max(
      0,
      Math.round((Number(installment.paidAmount) - Number(deposit.amount)) * 100) /
        100,
    );
    const nextStatus =
      nextPaid >= Number(installment.scheduledAmount)
        ? "paid"
        : nextPaid > 0
          ? "partially_paid"
          : "pending";
    return {
      deposit: {
        ...deposit,
        status: "reversed",
        reversalReason: String(reason).trim(),
        version: (deposit.version || 1) + 1,
      },
      installment: {
        ...installment,
        paidAmount: nextPaid,
        status: nextStatus,
      },
    };
  }
  throw new Error("Unknown deposit action.");
}

// ============================================================================
// Phase 5: Marketing Production Workflow & Isolated Submission Handoff
// ============================================================================

export function validateMarketingEntryCreation(input, actorRole) {
  const allowed = [
    "sales",
    "sales_leader",
    "callcenter",
    "manager",
    "ceo",
    "marketing_manager",
    "editor",
    "videographer",
  ];
  if (!allowed.includes(actorRole)) {
    throw new Error("This role cannot submit marketing property entries.");
  }
  const customerName = String(input.customerName || "").trim();
  const address = String(input.address || "").trim();
  const propertyType = input.propertyType;
  if (!customerName || !address) {
    throw new Error("Customer name and property address are required.");
  }
  if (!["Villa", "Block", "Building", "Apartment"].includes(propertyType)) {
    throw new Error("Property type must be Villa, Block, Building, or Apartment.");
  }
  return { customerName, address, propertyType };
}

export function advanceMarketingProduction(entry, action, payload = {}, actorRole) {
  if (action === "schedule_filming") {
    if (!["marketing_manager", "manager", "ceo"].includes(actorRole)) {
      throw new Error("Only Marketing Manager can schedule filming.");
    }
    if (!payload.filmingDate || !payload.videographerId) {
      throw new Error("Select a filming date and Videographer.");
    }
    return {
      ...entry,
      filmingDate: payload.filmingDate,
      videographerId: Number(payload.videographerId),
      stage: "filming_scheduled",
      version: (entry.version || 1) + 1,
    };
  }
  if (action === "complete_filming") {
    if (!["videographer", "marketing_manager"].includes(actorRole)) {
      throw new Error("Only Videographer or Marketing Manager can record filming completion.");
    }
    return {
      ...entry,
      filmingCompletedAt: payload.completedAt || new Date().toISOString(),
      stage: "filming_completed",
      version: (entry.version || 1) + 1,
    };
  }
  if (action === "schedule_editing") {
    if (!["editor", "marketing_manager"].includes(actorRole)) {
      throw new Error("Only Editor can set the editing completion date.");
    }
    if (!entry.filmingCompletedAt) {
      throw new Error("Filming must be completed before scheduling editing.");
    }
    if (!payload.editingDeadlineAt) {
      throw new Error("Select an editing completion date.");
    }
    return {
      ...entry,
      editingDeadlineAt: payload.editingDeadlineAt,
      stage: "editing_scheduled",
      version: (entry.version || 1) + 1,
    };
  }
  if (action === "ready_for_post") {
    if (actorRole !== "editor") {
      throw new Error("Only Editor can mark content as Ready for Post.");
    }
    const contentType = String(payload.contentType || "").trim();
    if (!contentType) {
      throw new Error("Specify the content type (e.g., Reel, Ad Video) before Ready for Post.");
    }
    return {
      ...entry,
      contentType,
      stage: "ready_for_post",
      version: (entry.version || 1) + 1,
    };
  }
  if (action === "mark_posted") {
    if (actorRole !== "editor") {
      throw new Error("Only Editor can complete and close the entry as Posted.");
    }
    if (entry.stage !== "ready_for_post" && !entry.contentType) {
      throw new Error("Content must have a content type and be Ready for Post first.");
    }
    const serialNumber = String(payload.serialNumber || "").trim();
    if (!/^AP\s*-\s*\d+$/i.test(serialNumber)) {
      throw new Error("Enter a valid post serial number in format AP - 1765.");
    }
    const propertyInfoNote = String(payload.propertyInfoNote || "").trim();
    if (!propertyInfoNote) {
      throw new Error("Paste the property information into the note before posting.");
    }
    const photos = Array.isArray(payload.photos)
      ? payload.photos.map((p) => String(p).trim()).filter(Boolean)
      : [];
    if (photos.length !== 5) {
      throw new Error("Exactly five property photos are required before marking Posted.");
    }
    const platform = payload.platform;
    if (!["Facebook", "YouTube", "Instagram"].includes(platform)) {
      throw new Error("Select a posting platform: Facebook, YouTube, or Instagram.");
    }
    const updatedEntry = {
      ...entry,
      serialNumber,
      propertyInfoNote,
      photos,
      platform,
      stage: "posted",
      version: (entry.version || 1) + 1,
    };
    const submissionRecord = {
      marketingEntryId: entry.id,
      serialNumber,
      customerName: entry.customerName,
      address: entry.address,
      propertyType: entry.propertyType,
      propertyInfoNote,
      photos,
      socialPlatform: platform,
      publishStatus: "Submitted",
      submittedAt: new Date().toISOString(),
      version: 1,
    };
    return { entry: updatedEntry, submission: submissionRecord };
  }
  throw new Error("Unknown marketing workflow action.");
}

export function transitionSubmissionStatus(submission, action, actorRole, payload = {}) {
  if (actorRole !== "admin") {
    throw new Error("Only Admin can review or publish submissions to the website.");
  }
  if (action === "approve") {
    if (submission.publishStatus !== "Submitted") {
      throw new Error("Only Submitted entries can be approved.");
    }
    return {
      ...submission,
      publishStatus: "Approved",
      reviewedAt: new Date().toISOString(),
      version: (submission.version || 1) + 1,
    };
  }
  if (action === "publish") {
    if (submission.publishStatus !== "Approved") {
      throw new Error("A submission must be Approved before it can be Published to the website.");
    }
    return {
      ...submission,
      publishStatus: "Published",
      publishedAt: new Date().toISOString(),
      websitePropertyId: payload.websitePropertyId || submission.id,
      version: (submission.version || 1) + 1,
    };
  }
  if (action === "reject") {
    if (submission.publishStatus === "Published") {
      throw new Error("Published entries cannot be rejected.");
    }
    return {
      ...submission,
      publishStatus: "Rejected",
      rejectionReason: String(payload.reason || "Rejected by Admin").trim(),
      reviewedAt: new Date().toISOString(),
      version: (submission.version || 1) + 1,
    };
  }
  throw new Error("Unknown submission review action.");
}

// ============================================================================
// Phase 6: Engineering Versioned Deliverables & Manager Review
// ============================================================================

export function submitDeliverableVersion(
  deliverable,
  { actorRole, actorName, fileUrl, fileName, format, notes = "", submittedAt = new Date().toISOString() },
) {
  if (!["architect", "graphic_designer", "visual_designer_3d"].includes(actorRole)) {
    throw new Error("Only Engineering roles can upload deliverable versions.");
  }
  if (!String(fileUrl || "").trim() || !String(fileName || "").trim()) {
    throw new Error("Deliverable file URL and file name are required.");
  }
  const existingVersions = Array.isArray(deliverable.versions)
    ? deliverable.versions
    : [];
  const nextVersionNumber = existingVersions.length + 1;
  const newVersion = {
    versionNumber: nextVersionNumber,
    fileUrl: String(fileUrl).trim(),
    fileName: String(fileName).trim(),
    format: String(format || "PDF/Render").trim(),
    notes: String(notes).trim(),
    submittedBy: actorName || actorRole,
    submittedAt,
    status: "submitted",
    reviewerComment: null,
    reviewedBy: null,
    reviewedAt: null,
  };
  return {
    ...deliverable,
    versions: [...existingVersions, newVersion],
    version: (deliverable.version || 1) + 1,
  };
}

export function reviewDeliverableVersion(
  deliverable,
  { actorRole, reviewerName = "Manager", versionNumber, decision, comment = "", reviewedAt = new Date().toISOString() },
) {
  if (!isGlobalRole(actorRole)) {
    throw new Error("Only CEO can approve or request revisions on Engineering deliverables.");
  }
  if (!["approved", "revision_requested"].includes(decision)) {
    throw new Error("Decision must be approved or revision_requested.");
  }
  const target = (deliverable.versions || []).find(
    (v) => v.versionNumber === Number(versionNumber),
  );
  if (!target) {
    throw new Error(`Deliverable version ${versionNumber} not found.`);
  }
  return {
    ...deliverable,
    versions: deliverable.versions.map((v) =>
      v.versionNumber === Number(versionNumber)
        ? {
            ...v,
            status: decision,
            reviewerComment: String(comment).trim() || null,
            reviewedBy: reviewerName,
            reviewedAt,
          }
        : v,
    ),
    version: (deliverable.version || 1) + 1,
  };
}

// ============================================================================
// Leads Management Table Export (CSV & PDF)
// ============================================================================

export function escapeCsvCell(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function normalizeLeadForExport(lead, index = 0) {
  const serial =
    lead.serial ||
    lead.stageSerial ||
    (lead.id ? `LEAD-${lead.id}` : `LEAD-${index + 1}`);
  const customerName = lead.customerName || lead.name || "New inquiry";
  const phone = lead.phone || "—";
  const email = lead.email || "";
  const contact = email ? `${phone} (${email})` : phone;
  const projectOrProperty =
    lead.projectName
      ? `${lead.projectName}${lead.apartmentNumber ? ` (${lead.apartmentNumber})` : ""}`
      : lead.property_name || lead.propertyName || "—";
  const requirements =
    lead.requirements || lead.message || "—";
  const source = lead.salesSource || lead.source || "manual";
  const status = lead.stage || lead.status || "active";
  const dateRaw = lead.callAt || lead.created_at || lead.createdAt || "";
  const dateFormatted = dateRaw ? String(dateRaw).slice(0, 16).replace("T", " ") : "—";

  return {
    serial: String(serial),
    customerName: String(customerName),
    phone: String(phone),
    email: String(email),
    contact: String(contact),
    projectOrProperty: String(projectOrProperty),
    requirements: String(requirements),
    source: String(source),
    status: String(status),
    date: String(dateFormatted),
  };
}

export function formatLeadsToCsv(leads = [], options = {}) {
  const includeBom = options.includeBom !== false;
  const headers = [
    "Serial / ID",
    "Customer Name",
    "Phone",
    "Email",
    "Project / Property",
    "Requirements / Inquiry",
    "Source",
    "Stage / Status",
    "Date",
  ];
  const rows = [headers.map(escapeCsvCell).join(",")];
  for (let i = 0; i < leads.length; i++) {
    const item = normalizeLeadForExport(leads[i], i);
    rows.push(
      [
        item.serial,
        item.customerName,
        item.phone,
        item.email,
        item.projectOrProperty,
        item.requirements,
        item.source,
        item.status,
        item.date,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return `${includeBom ? "\uFEFF" : ""}${rows.join("\r\n")}\r\n`;
}

function escapePdfText(text) {
  return String(text ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncatePdfCell(text, maxChars) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 3))}...`;
}

export function generateLeadsPdfDocument(leads = [], options = {}) {
  const title = options.title || "Attaie Properties — Leads Management Export";
  const subtitle =
    options.subtitle ||
    `Exported View · Total Leads: ${leads.length} · Generated: ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;

  const normalized = leads.map((l, idx) => normalizeLeadForExport(l, idx));
  const rowsPerPage = 18;
  const pageChunks = [];
  if (normalized.length === 0) {
    pageChunks.push([]);
  } else {
    for (let i = 0; i < normalized.length; i += rowsPerPage) {
      pageChunks.push(normalized.slice(i, i + rowsPerPage));
    }
  }

  const columns = [
    { label: "Serial / ID", x: 36, maxChars: 16 },
    { label: "Customer Name", x: 132, maxChars: 20 },
    { label: "Phone / Contact", x: 255, maxChars: 20 },
    { label: "Project / Property", x: 380, maxChars: 22 },
    { label: "Requirements / Note", x: 515, maxChars: 28 },
    { label: "Status", x: 685, maxChars: 12 },
    { label: "Date", x: 750, maxChars: 14 },
  ];

  // Object IDs:
  // 1: Catalog
  // 2: Pages
  // 3: Font Helvetica
  // 4: Font Helvetica-Bold
  // 5..(4 + pageCount * 2): Page and Content objects
  const objects = [];
  const addObject = (id, body) => {
    objects.push({ id, body });
  };

  const pageIds = [];
  pageChunks.forEach((chunk, pageIndex) => {
    const pageObjId = 5 + pageIndex * 2;
    const contentObjId = pageObjId + 1;
    pageIds.push(pageObjId);

    const ops = [];
    // Header banner (#0B3D3B -> RGB 0.043, 0.239, 0.231)
    ops.push("0.043 0.239 0.231 rg");
    ops.push("28 525 786 46 re f");

    // Title text in white
    ops.push("BT /F2 14 Tf 1 1 1 rg 40 550 Td");
    ops.push(`(${escapePdfText(title)}) Tj ET`);

    // Subtitle in light teal
    ops.push("BT /F1 9 Tf 0.85 0.98 0.96 rg 40 534 Td");
    ops.push(
      `(${escapePdfText(`${subtitle} (Page ${pageIndex + 1} of ${pageChunks.length})`)}) Tj ET`,
    );

    // Table header bar
    ops.push("0.90 0.98 0.96 rg");
    ops.push("28 496 786 22 re f");
    ops.push("0.043 0.239 0.231 rg");
    for (const col of columns) {
      ops.push(`BT /F2 8.5 Tf ${col.x} 504 Td (${escapePdfText(col.label)}) Tj ET`);
    }

    if (chunk.length === 0) {
      ops.push("BT /F1 10 Tf 0.3 0.35 0.35 rg 40 468 Td (No leads in current view.) Tj ET");
    } else {
      chunk.forEach((row, rIdx) => {
        const rowTop = 474 - rIdx * 23;
        if (rIdx % 2 === 1) {
          ops.push("0.97 0.995 0.99 rg");
          ops.push(`28 ${rowTop - 5} 786 21 re f`);
        }
        ops.push("0.1 0.16 0.16 rg");
        const cells = [
          truncatePdfCell(row.serial, columns[0].maxChars),
          truncatePdfCell(row.customerName, columns[1].maxChars),
          truncatePdfCell(row.contact, columns[2].maxChars),
          truncatePdfCell(row.projectOrProperty, columns[3].maxChars),
          truncatePdfCell(row.requirements, columns[4].maxChars),
          truncatePdfCell(row.status, columns[5].maxChars),
          truncatePdfCell(row.date, columns[6].maxChars),
        ];
        cells.forEach((cellText, cIdx) => {
          const fontRef = cIdx === 0 || cIdx === 1 ? "/F2" : "/F1";
          ops.push(
            `BT ${fontRef} 8 Tf ${columns[cIdx].x} ${rowTop + 2} Td (${escapePdfText(cellText)}) Tj ET`,
          );
        });
      });
    }

    const streamContent = ops.join("\n");
    addObject(
      pageObjId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`,
    );
    addObject(
      contentObjId,
      `<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream`,
    );
  });

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(
    2,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  );
  addObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObject(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  objects.sort((a, b) => a.id - b.id);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets[obj.id] = pdf.length;
    pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i] || 0).padStart(10, "0");
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

export function summarizeLeadsPipeline(leads = []) {
  const list = Array.isArray(leads) ? leads : [];
  let active = 0;
  let draft = 0;
  let closed = 0;
  let lost = 0;
  let closedAmount = 0;

  for (const lead of list) {
    const rawStatus = String(lead?.status || lead?.stage || "active")
      .trim()
      .toLowerCase();
    if (
      rawStatus === "draft" ||
      rawStatus === "new" ||
      rawStatus === "pending" ||
      rawStatus === "needs details"
    ) {
      draft += 1;
    } else if (
      rawStatus === "closed" ||
      rawStatus === "deal closed" ||
      rawStatus === "won"
    ) {
      closed += 1;
      const amt = Number(lead?.deal?.amount || lead?.agreedAmount || 0);
      if (Number.isFinite(amt) && amt > 0) {
        closedAmount += amt;
      }
    } else if (rawStatus === "lost" || rawStatus === "deal lost") {
      lost += 1;
    } else {
      active += 1;
    }
  }

  const total = list.length;
  const pct = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return {
    total,
    active,
    draft,
    closed,
    lost,
    closedAmount,
    percentages: {
      activePct: pct(active),
      draftPct: pct(draft),
      closedPct: pct(closed),
      lostPct: pct(lost),
    },
  };
}

