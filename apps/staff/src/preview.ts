import type {
  Customer,
  CustomerReviewRequest,
  DashboardData,
  Department,
  EngineeringDeliverable,
  Feedback,
  FinanceDeposit,
  HrContract,
  InventoryProject,
  Lead,
  MarketingProductionEntry,
  Role,
  Session,
  StaffUser,
  SubmissionPost,
} from "../../../packages/staff-contracts/types";
import {
  advanceMarketingProduction,
  canAssignTask,
  canViewLead,
  createDealClosedSerial,
  createLeadStageSerial,
  formatDateSuffix,
  generateFloorApartmentBatch,
  isManagerRole,
  issueContractSnapshot,
  normalizePhone,
  processFinanceDeposit,
  resolveCustomerRegistration,
  reviewDeliverableVersion,
  submitDeliverableVersion,
  validateDealClosedSubmission,
  validateFeedback,
  validateMarketingEntryCreation,
  validateProjectInventory,
} from "../../../packages/staff-contracts/workflow.mjs";

const iso = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();
let next = 200;

export const INITIAL_DEPARTMENTS: Department[] = [
  { code: "management", name: "Management" },
  { code: "hr", name: "Human Resources" },
  { code: "callcenter", name: "Call Center" },
  { code: "sales", name: "Sales Department" },
  { code: "production", name: "Marketing and Production" },
  { code: "finance", name: "Finance" },
  { code: "engineering", name: "Engineering and Graphic Department" },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  { id: 1, name: "Farid Ahmadi", username: "farid.cc@attaieproperties.com", role: "callcenter", departmentCode: "callcenter", active: true },
  { id: 2, name: "Sara Karimi", username: "sara.sales@attaieproperties.com", role: "sales", departmentCode: "sales", teamLeaderId: 4, active: true },
  { id: 3, name: "Attaie Management", username: "manager@attaieproperties.com", role: "manager", departmentCode: "management", active: true },
  { id: 4, name: "Bilal Hotak", username: "bilal.stl@attaieproperties.com", role: "sales_leader", departmentCode: "sales", active: true },
  { id: 5, name: "Nadia Wardak", username: "nadia.hr@attaieproperties.com", role: "hr_manager", departmentCode: "hr", active: true },
  { id: 6, name: "Tariq Mansoor", username: "tariq.mkt@attaieproperties.com", role: "marketing_manager", departmentCode: "production", active: true },
  { id: 7, name: "Ramin Safi", username: "ramin.edit@attaieproperties.com", role: "editor", departmentCode: "production", active: true },
  { id: 8, name: "Jawad Noori", username: "jawad.video@attaieproperties.com", role: "videographer", departmentCode: "production", active: true },
  { id: 9, name: "Hasibullah Zafar", username: "hasib.fin@attaieproperties.com", role: "finance_manager", departmentCode: "finance", active: true },
  { id: 10, name: "Mursal Habibi", username: "mursal.fa@attaieproperties.com", role: "finance_assistant", departmentCode: "finance", active: true },
  { id: 11, name: "Eng. Omar Farooq", username: "omar.arch@attaieproperties.com", role: "architect", departmentCode: "engineering", active: true },
  { id: 12, name: "Laila Popal", username: "laila.design@attaieproperties.com", role: "graphic_designer", departmentCode: "engineering", active: true },
  { id: 13, name: "Zaki Stanikzai", username: "zaki.3d@attaieproperties.com", role: "visual_designer_3d", departmentCode: "engineering", active: true },
  { id: 14, name: "Samiullah Stanikzai", username: "sami.sales@attaieproperties.com", role: "sales", departmentCode: "sales", teamLeaderId: 4, active: true },
];

const kp12Apartments = [
  ...generateFloorApartmentBatch({
    projectId: 1,
    projectCode: "KP12",
    floor: 3,
    unitsCount: 3,
    rooms: 3,
    areaSqm: 135,
    direction: "South-East",
    boundaryNorth: "Central Corridor",
    boundarySouth: "Shahr-e-Naw Main Road",
    boundaryEast: "Adjacent Unit",
    boundaryWest: "Landscaped Courtyard",
    pricePerSqm: 780,
    currency: "USD",
  }),
  ...generateFloorApartmentBatch({
    projectId: 1,
    projectCode: "KP12",
    floor: 4,
    unitsCount: 3,
    rooms: 4,
    areaSqm: 160,
    direction: "North-East",
    boundaryNorth: "Park View Avenue",
    boundarySouth: "Central Corridor",
    boundaryEast: "Corner Plaza",
    boundaryWest: "Adjacent Unit",
    pricePerSqm: 820,
    currency: "USD",
  }),
];
kp12Apartments[0].status = "sold";
kp12Apartments[3].status = "deal_closed";

const saljuqiApartments = generateFloorApartmentBatch({
  projectId: 2,
  projectCode: "KPS",
  floor: 2,
  unitsCount: 4,
  rooms: 3,
  areaSqm: 142,
  direction: "South-West",
  boundaryNorth: "Elevator Lobby",
  boundarySouth: "Saljuqi Boulevard",
  boundaryEast: "East Wing",
  boundaryWest: "Garden Plaza",
  pricePerSqm: 750,
  currency: "USD",
});

const INITIAL_PROJECTS: InventoryProject[] = [
  {
    id: 1,
    code: "KP12",
    name: "Kabul Plaza 12",
    location: "Ansari Square, Shahr-e-Naw, Kabul",
    description: "12-floor pre-sale residential and commercial tower with dual generators, underground parking, and central heating.",
    floors: 12,
    sellers: [
      {
        id: 1,
        name: "Haji Abdul Qadir Attaie",
        fatherName: "Haji Ghulam Sakhi",
        grandfatherName: "Mohammad Kabir",
        tazkiraNumber: "1398-0102-44912",
        phone: "+93782222279",
        address: "Street 13, Wazir Akbar Khan, Kabul",
        sharePercentage: 60,
      },
      {
        id: 2,
        name: "Al-Haj Mirwais Rahmani",
        fatherName: "Haji Abdullah",
        grandfatherName: "Abdul Rahman",
        tazkiraNumber: "1399-0405-77321",
        phone: "+93700112244",
        address: "Shahr-e-Naw, Kabul",
        sharePercentage: 40,
      },
    ],
    constructionCompany: {
      companyName: "Attaie High-Rise Development & Construction Co.",
      licenseNumber: "D-44891-KBL",
      representativeName: "Eng. Khalid Mansoori",
      representativeFatherName: "Mohammad Zahir",
      representativeTazkira: "1400-0201-88120",
      phone: "+93782222280",
      address: "Street 13, Wazir Akbar Khan, Kabul",
    },
    apartments: kp12Apartments,
    assignedTeamLeaderId: 4,
    assignedSalesAgentIds: [2, 14],
    createdAt: iso(-120),
    version: 1,
  },
  {
    id: 2,
    code: "KPS",
    name: "Kabul Plaza Saljuqi",
    location: "Kolola Pushta Main Road, Kabul",
    description: "Pre-sale luxury family apartments with panoramic city views and seismic-grade concrete frame.",
    floors: 10,
    sellers: [
      {
        id: 3,
        name: "Haji Abdul Qadir Attaie",
        fatherName: "Haji Ghulam Sakhi",
        grandfatherName: "Mohammad Kabir",
        tazkiraNumber: "1398-0102-44912",
        phone: "+93782222279",
        address: "Street 13, Wazir Akbar Khan, Kabul",
        sharePercentage: 100,
      },
    ],
    constructionCompany: {
      companyName: "Attaie High-Rise Development & Construction Co.",
      licenseNumber: "D-44891-KBL",
      representativeName: "Eng. Khalid Mansoori",
      representativeFatherName: "Mohammad Zahir",
      representativeTazkira: "1400-0201-88120",
      phone: "+93782222280",
      address: "Street 13, Wazir Akbar Khan, Kabul",
    },
    apartments: saljuqiApartments,
    assignedTeamLeaderId: 4,
    assignedSalesAgentIds: [2],
    createdAt: iso(-96),
    version: 1,
  },
];

const INITIAL_CONTRACTS: HrContract[] = [
  {
    id: 1,
    contractSerial: "CNT-KP12-F3-A1-101126",
    projectId: 1,
    projectCode: "KP12",
    projectName: "Kabul Plaza 12",
    apartmentId: kp12Apartments[0].id,
    apartmentNumber: kp12Apartments[0].unitNumber,
    apartmentSerial: kp12Apartments[0].serialNumber,
    floor: kp12Apartments[0].floor,
    rooms: kp12Apartments[0].rooms,
    areaSqm: kp12Apartments[0].areaSqm,
    direction: kp12Apartments[0].direction,
    boundaries: {
      north: kp12Apartments[0].boundaryNorth,
      south: kp12Apartments[0].boundarySouth,
      east: kp12Apartments[0].boundaryEast,
      west: kp12Apartments[0].boundaryWest,
    },
    sellersSnapshot: INITIAL_PROJECTS[0].sellers,
    constructionSnapshot: INITIAL_PROJECTS[0].constructionCompany,
    buyers: [
      {
        id: 1,
        name: "Ahmad Shah Rahimi",
        fatherName: "Ghulam Farooq",
        grandfatherName: "Abdul Rahim",
        tazkiraNumber: "1401-03-55102",
        phone: "+93700111222",
        address: "Karte Se, District 6, Kabul",
        photo3x4Url: "/logo.png",
        tazkiraPhotoUrl: "/logo.png",
      },
    ],
    pricePerSqm: kp12Apartments[0].pricePerSqm,
    totalPrice: kp12Apartments[0].totalPrice,
    currency: "USD",
    salesAgentId: 2,
    salesAgentName: "Sara Karimi",
    gregorianDate: "2026-11-10",
    jalaliDate: "1405/08/19",
    clauses: [
      "The seller guarantees full legal clearance and transfer of the apartment unit upon completion of the agreed installment schedule.",
      "The buyer agrees to remit each scheduled installment on or before its due date to the Finance Department of Attaie Properties.",
      "Construction handover shall follow the technical specifications of Attaie High-Rise Development & Construction Co.",
    ],
    notes: "Downpayment settled on contract signing; two remaining construction milestone installments.",
    installments: [
      {
        id: 1,
        number: 1,
        description: "30% Signing Downpayment",
        percentage: 30,
        dueDate: "2026-11-10",
        scheduledAmount: 31590,
        paidAmount: 31590,
        status: "paid",
      },
      {
        id: 2,
        number: 2,
        description: "35% Structure Completion Installment",
        percentage: 35,
        dueDate: "2027-02-15",
        scheduledAmount: 36855,
        paidAmount: 0,
        status: "pending",
      },
      {
        id: 3,
        number: 3,
        description: "35% Key Handover Final Installment",
        percentage: 35,
        dueDate: "2027-06-30",
        scheduledAmount: 36855,
        paidAmount: 0,
        status: "pending",
      },
    ],
    status: "issued",
    amendmentVersion: 1,
    issuedBy: "Nadia Wardak (HR Manager)",
    issuedAt: iso(-24),
    version: 1,
  },
];

const INITIAL_DEPOSITS: FinanceDeposit[] = [
  {
    id: 1,
    contractId: 1,
    contractSerial: "CNT-KP12-F3-A1-101126",
    installmentId: 1,
    installmentNumber: 1,
    customerName: "Ahmad Shah Rahimi",
    amount: 31590,
    currency: "USD",
    paymentMethod: "Bank Transfer",
    receiptNumber: "RCP-2026-1001",
    notes: "30% initial downpayment verified via Azizi Bank wire",
    status: "posted",
    enteredBy: "Mursal Habibi",
    approvedBy: "Hasibullah Zafar",
    createdAt: iso(-22),
    postedAt: iso(-21),
    version: 1,
  },
  {
    id: 2,
    contractId: 1,
    contractSerial: "CNT-KP12-F3-A1-101126",
    installmentId: 2,
    installmentNumber: 2,
    customerName: "Ahmad Shah Rahimi",
    amount: 10000,
    currency: "USD",
    paymentMethod: "Cash",
    receiptNumber: "RCP-2026-1042",
    notes: "Partial advance toward Installment #2 drafted by Finance Assistant",
    status: "draft",
    enteredBy: "Mursal Habibi",
    approvedBy: null,
    createdAt: iso(-2),
    postedAt: null,
    version: 1,
  },
];

const INITIAL_MARKETING: MarketingProductionEntry[] = [
  {
    id: 1,
    customerName: "Haji Bismillah",
    address: "Street 14, Wazir Akbar Khan, Kabul",
    propertyType: "Villa",
    submittedByRole: "sales",
    submittedByName: "Sara Karimi",
    submittedAt: iso(-72),
    filmingDate: "2026-11-09",
    videographerId: 8,
    videographerName: "Jawad Noori",
    filmingCompletedAt: iso(-48),
    editingDeadlineAt: "2026-11-11",
    editorId: 7,
    editorName: "Ramin Safi",
    contentType: "Ad Video",
    serialNumber: "AP - 1765",
    propertyInfoNote: "6-Bedroom Diplomatic Villa in Wazir Akbar Khan with landscaped garden, security guardhouse, and solar backup.",
    photos: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    ],
    platform: "Instagram",
    stage: "posted",
    submissionId: 1,
    version: 4,
  },
  {
    id: 2,
    customerName: "Eng. Dawood",
    address: "Ansari Square, Shahr-e-Naw, Kabul",
    propertyType: "Apartment",
    submittedByRole: "callcenter",
    submittedByName: "Farid Ahmadi",
    submittedAt: iso(-28),
    filmingDate: "2026-11-11",
    videographerId: 8,
    videographerName: "Jawad Noori",
    filmingCompletedAt: iso(-6),
    editingDeadlineAt: "2026-11-13",
    editorId: 7,
    editorName: "Ramin Safi",
    contentType: "Reel",
    serialNumber: null,
    propertyInfoNote: null,
    photos: [],
    platform: null,
    stage: "ready_for_post",
    submissionId: null,
    version: 3,
  },
  {
    id: 3,
    customerName: "Sardar Mohammad",
    address: "Kolola Pushta Main Boulevard, Kabul",
    propertyType: "Building",
    submittedByRole: "sales_leader",
    submittedByName: "Bilal Hotak",
    submittedAt: iso(-12),
    filmingDate: "2026-11-14",
    videographerId: 8,
    videographerName: "Jawad Noori",
    filmingCompletedAt: null,
    editingDeadlineAt: null,
    editorId: 7,
    editorName: "Ramin Safi",
    contentType: null,
    serialNumber: null,
    propertyInfoNote: null,
    photos: [],
    platform: null,
    stage: "filming_scheduled",
    submissionId: null,
    version: 1,
  },
];

const INITIAL_SUBMISSIONS: SubmissionPost[] = [
  {
    id: 1,
    marketingEntryId: 1,
    serialNumber: "AP - 1765",
    customerName: "Haji Bismillah",
    address: "Street 14, Wazir Akbar Khan, Kabul",
    propertyType: "Villa",
    propertyInfoNote: "6-Bedroom Diplomatic Villa in Wazir Akbar Khan with landscaped garden, security guardhouse, and solar backup.",
    photos: INITIAL_MARKETING[0].photos,
    socialPlatform: "Instagram",
    publishStatus: "Submitted",
    submittedBy: "Ramin Safi (Editor)",
    submittedAt: iso(-18),
    reviewedAt: null,
    publishedAt: null,
    websitePropertyId: null,
    version: 1,
  },
];

const INITIAL_DELIVERABLES: EngineeringDeliverable[] = [
  {
    id: 1,
    projectId: 1,
    projectCode: "KP12",
    projectName: "Kabul Plaza 12",
    apartmentId: kp12Apartments[3].id,
    apartmentNumber: kp12Apartments[3].unitNumber,
    title: "Floor 4 Architectural 2D CAD Plan & Room Dimensions",
    role: "architect",
    assigneeId: 11,
    assigneeName: "Eng. Omar Farooq",
    deadlineAt: iso(36),
    versions: [
      {
        versionNumber: 1,
        fileUrl: "/logo.png",
        fileName: "KP12-Floor4-2DPlan-v1.pdf",
        format: "2D Floor Plan (CAD/PDF)",
        notes: "Includes all 4 geographic boundaries and corridor width specifications.",
        submittedBy: "Eng. Omar Farooq",
        submittedAt: iso(-14),
        status: "approved",
        reviewerComment: "Approved for HR contract attachment and engineering package.",
        reviewedBy: "Attaie Management",
        reviewedAt: iso(-10),
      },
    ],
    version: 1,
  },
  {
    id: 2,
    projectId: 1,
    projectCode: "KP12",
    projectName: "Kabul Plaza 12",
    apartmentId: null,
    apartmentNumber: null,
    title: "Kabul Plaza 12 Pre-Sale Brochure & Social Campaign Assets",
    role: "graphic_designer",
    assigneeId: 12,
    assigneeName: "Laila Popal",
    deadlineAt: iso(48),
    versions: [
      {
        versionNumber: 1,
        fileUrl: "/logo.png",
        fileName: "KP12-Brochure-Print-v1.pdf",
        format: "Brochure / Print Asset",
        notes: "Bilingual EN/FA print layout with floor table.",
        submittedBy: "Laila Popal",
        submittedAt: iso(-8),
        status: "submitted",
        reviewerComment: null,
        reviewedBy: null,
        reviewedAt: null,
      },
    ],
    version: 1,
  },
  {
    id: 3,
    projectId: 2,
    projectCode: "KPS",
    projectName: "Kabul Plaza Saljuqi",
    apartmentId: null,
    apartmentNumber: null,
    title: "Exterior Night Lighting 3D Render & Interior Living Room Walkthrough",
    role: "visual_designer_3d",
    assigneeId: 13,
    assigneeName: "Zaki Stanikzai",
    deadlineAt: iso(72),
    versions: [],
    version: 1,
  },
];

const names = [
  "Ahmad Rahimi",
  "Maryam Noori",
  "Omar Sadiqi",
  "Zahra Azizi",
  "Hamid Karimi",
];

const phones = [
  "+93700000000",
  "+93700112233",
  "+93700223344",
  "+93700334455",
  "+93700445566",
];

const initialMasterCustomers: Customer[] = names.map((name, index) => ({
  id: index + 1,
  serial: `CA01-C${index + 1}-101126`,
  name,
  phone: phones[index],
  requirements: [
    "Three-bedroom apartment in Shahr-e-Naw. Family home with parking.",
    "Commercial space near a main road. Interested in a viewing.",
    "Two-bedroom apartment in Kart-e-Char. Looking for payment options.",
    "Family apartment with a balcony. Arrange a weekend visit.",
    "Four-bedroom home, ready to move in.",
  ][index],
  leadCount: 1,
  ownerAgentId: index === 4 ? 2 : 1,
  sharedAgentIds: index === 0 ? [2] : [],
}));

const initialReviewRequests: CustomerReviewRequest[] = [
  {
    id: 1,
    customerId: 2,
    phone: "+93700112233",
    requestingAgentId: 2,
    requestingAgentName: "Sara Karimi",
    submittedName: "Maryam Noori",
    submittedRequirements: "Customer walked into Sales office inquiring about Kabul Plaza 12 Floor 4.",
    status: "pending_review",
    createdAt: iso(-5),
  },
];

let data: DashboardData = {
  leads: [
    ...names.map((name, index) => ({
      id: index + 1,
      serial: `CA01-L${index + 1}`,
      stageCode: (index === 3 ? "DC" : index === 1 ? "V" : "L") as "L" | "F" | "V" | "DC" | "DL",
      customerId: index + 1,
      customerName: name,
      phone: phones[index],
      requirements: initialMasterCustomers[index].requirements,
      status: (index === 3 ? "closed" : "active") as "draft" | "active" | "closed" | "lost",
      originAgentId: 1,
      assigneeId: index >= 3 ? 2 : 1,
      sharedAgentIds: index === 0 ? [2] : [],
      projectId: 1,
      projectCode: "KP12",
      projectName: "Kabul Plaza 12",
      apartmentId: index === 3 ? kp12Apartments[3].id : kp12Apartments[1].id,
      apartmentNumber: index === 3 ? kp12Apartments[3].unitNumber : kp12Apartments[1].unitNumber,
      callAt: iso(-48),
      source: "fixture" as const,
      deal:
        index === 3
          ? {
              dealSerial: "SA02PRC-KP12-F4-A1-101126",
              amount: "131200.00",
              currency: "USD" as const,
              closedAt: iso(-16),
              salesAgent: "Sara Karimi",
              projectId: 1,
              projectCode: "KP12",
              apartmentId: kp12Apartments[3].id,
              apartmentNumber: kp12Apartments[3].unitNumber,
              buyerPhotoUrl: "/logo.png",
              tazkiraPhotoUrl: "/logo.png",
              hrContractId: null,
            }
          : null,
      version: 1,
    })),
  ],
  followups: names.map((name, index) => ({
    id: index + 1,
    leadId: index + 1,
    serial: `CA01-L${index + 1}`,
    customerName: name,
    phone: phones[index],
    requirements: "Discuss property options and arrange the next step.",
    assigneeId: index === 4 ? 2 : 1,
    scheduledAt: iso([-2, 3, -28, 22, -4][index]),
    completedAt: null,
    notes: "Customer requested a callback about suitable properties.",
    version: 1,
  })),
  customers: initialMasterCustomers,
  customerReviewRequests: initialReviewRequests,
  tasks: [
    {
      id: 1,
      title: "Review new customer inquiries",
      instructions:
        "Check the latest inquiries and confirm that every customer has a scheduled next step.",
      priority: "high",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(4),
      status: "todo",
      version: 1,
    },
    {
      id: 2,
      title: "Prepare weekly follow-up summary",
      instructions:
        "Summarize this week’s customer follow-ups and flag any cases needing management support.",
      priority: "normal",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(25),
      status: "in_progress",
      version: 1,
    },
    {
      id: 3,
      title: "Follow up Kabul Plaza 12 Floor 4 visits",
      instructions: "Coordinate site visits for assigned pre-sale units in Kabul Plaza 12.",
      priority: "high",
      assigneeId: 2,
      assignedBy: "Bilal Hotak",
      deadlineAt: iso(18),
      status: "todo",
      projectId: 1,
      projectName: "Kabul Plaza 12",
      version: 1,
    },
    {
      id: 4,
      title: "Issue bilingual contract for Deal SA02PRC-KP12-F4-A1-101126",
      instructions: "Complete buyer 3x4 portrait and 100% installment schedule for F4-A1.",
      priority: "urgent",
      assigneeId: 5,
      assignedBy: "Attaie Management",
      deadlineAt: iso(12),
      status: "todo",
      projectId: 1,
      projectName: "Kabul Plaza 12",
      version: 1,
    },
  ],
  assignees: INITIAL_STAFF_USERS,
  departments: INITIAL_DEPARTMENTS,
  projects: INITIAL_PROJECTS,
  hrContracts: INITIAL_CONTRACTS,
  financeDeposits: INITIAL_DEPOSITS,
  marketingEntries: INITIAL_MARKETING,
  submissions: INITIAL_SUBMISSIONS,
  engineeringDeliverables: INITIAL_DELIVERABLES,
  counts: {},
  page: 0,
  integration: {
    enabled: false,
    message: "Etisalat automatic capture is not connected. Manual call entries are labeled.",
  },
  serverTime: iso(0),
};

export function getSharedStaffStore() {
  return data;
}

export function previewClient(management: boolean, initialRoleOverride?: Role) {
  let activeUser: StaffUser = initialRoleOverride
    ? INITIAL_STAFF_USERS.find((u) => u.role === initialRoleOverride) || INITIAL_STAFF_USERS[management ? 2 : 0]
    : INITIAL_STAFF_USERS[management ? 2 : 0];

  const client = {
    getActiveUser() {
      return activeUser;
    },
    setActiveRole(role: Role) {
      const found = data.assignees.find((u) => u.role === role);
      if (found) {
        activeUser = found;
      } else {
        activeUser = {
          id: 99,
          name: `Attaie ${role.replace(/_/g, " ")}`,
          role,
          active: true,
        };
      }
      return activeUser;
    },
    async session() {
      return { user: activeUser, csrfToken: "preview-csrf", serverTime: iso(0) } as Session;
    },
    async load(_view: string, q = "", page = 0) {
      const search = q.toLowerCase();
      const result = structuredClone(data);
      result.serverTime = iso(0);
      result.page = page;

      const teamAgentIds =
        activeUser.role === "sales_leader"
          ? data.assignees
              .filter((u) => u.role === "sales" && u.teamLeaderId === activeUser.id)
              .map((u) => u.id)
          : [];

      result.leads = result.leads
        .filter((l) => {
          const visible =
            isManagerRole(activeUser.role) ||
            activeUser.role === "hr_manager" ||
            canViewLead(activeUser, l, teamAgentIds);
          return (
            visible &&
            `${l.serial} ${l.customerName} ${l.phone} ${l.projectName || ""}`
              .toLowerCase()
              .includes(search)
          );
        })
        .slice(page * 25, (page + 1) * 25);

      result.customers = (result.customers || [])
        .filter((c) => {
          const ownedOrShared =
            isManagerRole(activeUser.role) ||
            c.ownerAgentId === activeUser.id ||
            (c.sharedAgentIds || []).includes(activeUser.id);
          return ownedOrShared && `${c.name} ${c.phone}`.toLowerCase().includes(search);
        })
        .slice(page * 25, (page + 1) * 25);

      result.followups = result.followups
        .filter(
          (f) =>
            (isManagerRole(activeUser.role) ||
              f.assigneeId === activeUser.id ||
              (activeUser.role === "sales_leader" && teamAgentIds.includes(f.assigneeId))) &&
            `${f.serial} ${f.customerName}`.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);

      result.tasks = result.tasks
        .filter(
          (t) =>
            (isManagerRole(activeUser.role) || t.assigneeId === activeUser.id) &&
            t.title.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);

      return result;
    },
    async lead(id: number) {
      const lead = data.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found.");
      return {
        ...lead,
        activities: [
          {
            id: 1,
            actorName: "Farid Ahmadi",
            type: "entry_submitted",
            notes: lead.requirements,
            at: lead.callAt,
          },
        ],
      };
    },
    async draft(body: unknown, _key: string) {
      const input = body as {
        phone: string;
        callAt: string;
        source?: Lead["source"];
        projectId?: number;
        apartmentId?: number;
      };
      const proj = data.projects?.find((p) => p.id === Number(input.projectId));
      const apt = proj?.apartments.find((a) => a.id === Number(input.apartmentId));
      const prefix = activeUser.role === "sales" ? "SA" : "CA";
      const seq = ++next;
      const serial =
        activeUser.role === "sales"
          ? createLeadStageSerial({
              prefix: "SA",
              agentId: activeUser.id,
              sequence: seq,
              stage: "L",
              date: input.callAt || iso(0),
            })
          : `CA01-L${seq}`;
      const lead: Lead = {
        id: seq,
        serial,
        stageCode: "L",
        customerId: null,
        customerName: "",
        phone: normalizePhone(input.phone),
        requirements: "",
        status: "draft",
        originAgentId: activeUser.id,
        assigneeId: activeUser.id,
        projectId: proj?.id || null,
        projectCode: proj?.code || null,
        projectName: proj?.name || null,
        apartmentId: apt?.id || null,
        apartmentNumber: apt?.unitNumber || null,
        callAt: input.callAt || iso(0),
        source: input.source || "fixture",
        version: 1,
      };
      data.leads.unshift(lead);
      return lead;
    },
    async entry(id: number, body: unknown, _key: string) {
      const input = body as {
        customerName: string;
        requirements: string;
        nextScheduledAt: string;
        nextAssigneeId: number;
        projectId?: number;
        apartmentId?: number;
      };
      const lead = data.leads.find((l) => l.id === id)!;
      const reg = resolveCustomerRegistration(data.customers || [], {
        name: input.customerName,
        phone: lead.phone,
        requirements: input.requirements,
        agentId: activeUser.id,
        agentName: activeUser.name,
        agentPrefix: activeUser.role === "sales" ? "SA" : "CA",
        date: iso(0),
      });

      if (reg.outcome === "created" && reg.customer) {
        data.customers.unshift(reg.customer);
      } else if (reg.outcome === "duplicate_conflict" && reg.reviewRequest) {
        data.customerReviewRequests = [
          { id: ++next, ...reg.reviewRequest },
          ...(data.customerReviewRequests || []),
        ];
      }

      const proj = data.projects?.find((p) => p.id === Number(input.projectId || lead.projectId));
      const apt = proj?.apartments.find((a) => a.id === Number(input.apartmentId || lead.apartmentId));

      Object.assign(lead, {
        customerName: input.customerName,
        requirements: input.requirements,
        status: "active",
        customerId: reg.customer?.id || ++next,
        assigneeId: input.nextAssigneeId,
        sharedAgentIds:
          input.nextAssigneeId !== activeUser.id
            ? Array.from(new Set([...(lead.sharedAgentIds || []), input.nextAssigneeId]))
            : lead.sharedAgentIds || [],
        projectId: proj?.id || lead.projectId || null,
        projectCode: proj?.code || lead.projectCode || null,
        projectName: proj?.name || lead.projectName || null,
        apartmentId: apt?.id || lead.apartmentId || null,
        apartmentNumber: apt?.unitNumber || lead.apartmentNumber || null,
        version: lead.version + 1,
      });
      data.followups.unshift({
        id: ++next,
        leadId: id,
        serial: lead.serial,
        customerName: input.customerName,
        phone: lead.phone,
        requirements: input.requirements,
        assigneeId: input.nextAssigneeId,
        scheduledAt: input.nextScheduledAt,
        completedAt: null,
        notes: input.requirements,
        version: 1,
      });
      return { ...lead, duplicateConflict: reg.outcome === "duplicate_conflict" };
    },
    async feedback(id: number, body: Feedback, _key: string) {
      validateFeedback(body, activeUser.role);
      const task = data.followups.find((f) => f.id === id)!;
      task.completedAt = iso(0);
      task.version++;
      const lead = data.leads.find((l) => l.id === task.leadId)!;
      const ddmmyy = formatDateSuffix(iso(0));

      if (body.outcome === "lost") {
        lead.status = "lost";
        lead.stageCode = "DL";
        lead.serial = `SA${String(activeUser.id).padStart(2, "0")}-DL${lead.id}-${ddmmyy}`;
      } else if (body.outcome === "closed") {
        const proj =
          data.projects?.find((p) => p.id === Number(body.projectId || lead.projectId)) ||
          data.projects?.[0];
        const apt =
          proj?.apartments.find((a) => a.id === Number(body.apartmentId || lead.apartmentId)) ||
          proj?.apartments[0];
        const validated = validateDealClosedSubmission({
          actorRole: activeUser.role,
          agentId: activeUser.id,
          projectCode: proj?.code || "KP12",
          apartmentNumber: apt?.unitNumber || "F3-A2",
          areaSqm: apt?.areaSqm,
          pricePerSqm: body.pricePerSqm,
          totalAmount: body.amount,
          currency: body.currency || "USD",
          buyerPhotoUrl: body.buyerPhotoUrl || "/logo.png",
          tazkiraPhotoUrl: body.tazkiraPhotoUrl || "/logo.png",
          date: iso(0),
        });
        lead.status = "closed";
        lead.stageCode = "DC";
        lead.serial = validated.dealSerial;
        lead.deal = {
          dealSerial: validated.dealSerial,
          amount: String(validated.agreedAmount),
          currency: validated.currency as "AFN" | "USD",
          closedAt: iso(0),
          salesAgent: activeUser.name,
          projectId: proj?.id,
          projectCode: proj?.code,
          apartmentId: apt?.id,
          apartmentNumber: apt?.unitNumber,
          buyerPhotoUrl: validated.buyerPhotoUrl,
          tazkiraPhotoUrl: validated.tazkiraPhotoUrl,
          hrContractId: null,
        };
        if (apt) apt.status = "deal_closed";
      } else {
        const stageCode = body.outcome === "visit" ? "V" : "F";
        lead.stageCode = stageCode;
        if (activeUser.role === "sales") {
          lead.serial = createLeadStageSerial({
            prefix: "SA",
            agentId: activeUser.id,
            sequence: lead.id,
            stage: stageCode,
            date: iso(0),
          });
        }
        data.followups.unshift({
          ...task,
          id: ++next,
          serial: lead.serial,
          assigneeId: body.nextAssigneeId!,
          scheduledAt: body.nextScheduledAt!,
          completedAt: null,
          notes: body.notes || "",
          version: 1,
        });
      }
      return { success: true };
    },
    async createTask(body: unknown, _key: string) {
      const input = body as {
        title: string;
        instructions: string;
        assigneeId: number;
        priority: "low" | "normal" | "high" | "urgent";
        deadlineAt: string;
        projectId?: number;
      };
      const targetUser = data.assignees.find((u) => u.id === Number(input.assigneeId));
      if (targetUser && !canAssignTask(activeUser, targetUser)) {
        throw new Error("You do not have permission to assign tasks to this staff member.");
      }
      const proj = data.projects?.find((p) => p.id === Number(input.projectId));
      data.tasks.unshift({
        ...input,
        id: ++next,
        status: "todo",
        assignedBy: activeUser.name,
        projectId: proj?.id || null,
        projectName: proj?.name || null,
        version: 1,
      });
      return { id: next };
    },
    async taskStatus(id: number, status: string, _version: number) {
      const task = data.tasks.find((t) => t.id === id)!;
      task.status = status as typeof task.status;
      task.version++;
      return { success: true };
    },
    async staff() {
      return data.assignees;
    },
    async createDepartment(body: { code: string; name: string }) {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only Manager can create departments.");
      }
      const code = body.code.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      const name = body.name.trim();
      if (!code || !name) throw new Error("Department code and name are required.");
      const existing = data.departments?.find((d) => d.code === code);
      if (existing) {
        existing.name = name;
      } else {
        data.departments = [...(data.departments || []), { code, name }];
      }
      return { code, name };
    },
    async createStaff(body: unknown, _key: string) {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only Manager can create staff user accounts.");
      }
      const input = body as {
        name: string;
        username: string;
        firebaseUid: string;
        role: Role;
        departmentCode?: string;
        teamLeaderId?: number;
      };
      if (!input.name?.trim() || !input.username?.trim() || !input.firebaseUid?.trim()) {
        throw new Error("Name, email, and Firebase UID are required.");
      }
      const newUser: StaffUser = {
        id: ++next,
        name: input.name.trim(),
        username: input.username.trim().toLowerCase(),
        role: input.role,
        departmentCode: input.departmentCode || "sales",
        teamLeaderId: input.teamLeaderId ? Number(input.teamLeaderId) : null,
        active: true,
      };
      data.assignees.push(newUser);
      return { id: newUser.id, user: newUser };
    },
    async saveProject(projectInput: Partial<InventoryProject>) {
      const validated = validateProjectInventory(
        projectInput,
        data.projects || [],
        activeUser.role,
      );
      if (projectInput.id) {
        data.projects = (data.projects || []).map((p) =>
          p.id === projectInput.id
            ? ({ ...p, ...validated, version: p.version + 1 } as InventoryProject)
            : p,
        );
        return data.projects.find((p) => p.id === projectInput.id)!;
      }
      const created: InventoryProject = {
        ...(validated as InventoryProject),
        id: ++next,
        createdAt: iso(0),
        version: 1,
      };
      data.projects = [created, ...(data.projects || [])];
      return created;
    },
    async resolveCustomerReview(reviewId: number, decision: "approved_shared" | "rejected") {
      if (!isManagerRole(activeUser.role)) {
        throw new Error("Only Manager can resolve customer duplicate review requests.");
      }
      const req = data.customerReviewRequests?.find((r) => r.id === reviewId);
      if (!req) throw new Error("Review request not found.");
      req.status = decision;
      if (decision === "approved_shared") {
        const cust = data.customers.find((c) => c.id === req.customerId);
        if (cust) {
          cust.sharedAgentIds = Array.from(
            new Set([...(cust.sharedAgentIds || []), req.requestingAgentId]),
          );
        }
      }
      return req;
    },
    async issueContract(payload: {
      projectId: number;
      apartmentId: number;
      buyers: HrContract["buyers"];
      installments: Array<{ description: string; percentage: number; dueDate: string | null }>;
      salesAgentName: string;
      clauses: string[];
      notes: string;
    }) {
      const project = data.projects?.find((p) => p.id === Number(payload.projectId));
      const apartment = project?.apartments.find((a) => a.id === Number(payload.apartmentId));
      const snapshot = issueContractSnapshot({
        actorRole: activeUser.role,
        project,
        apartment,
        buyers: payload.buyers,
        installments: payload.installments,
        salesAgentName: payload.salesAgentName,
        clauses: payload.clauses,
        notes: payload.notes,
        existingContracts: data.hrContracts || [],
        issuedBy: `${activeUser.name} (HR Manager)`,
        now: iso(0),
      });
      const created: HrContract = {
        ...snapshot,
        id: ++next,
      };
      if (apartment) apartment.status = "sold";
      data.hrContracts = [created, ...(data.hrContracts || [])];
      return created;
    },
    async manageDeposit(payload: {
      action: "draft" | "approve" | "return" | "reverse";
      contractId: number;
      installmentId: number;
      depositId?: number;
      amount?: number;
      paymentMethod?: "Cash" | "Bank Transfer" | "Cheque";
      receiptNumber?: string;
      notes?: string;
      reason?: string;
    }) {
      const contract = data.hrContracts?.find((c) => c.id === Number(payload.contractId));
      if (!contract) throw new Error("Contract not found.");
      const installment = contract.installments.find(
        (i) => i.id === Number(payload.installmentId),
      );
      if (!installment) throw new Error("Installment not found.");

      if (payload.action === "draft") {
        const res = processFinanceDeposit({
          action: "draft",
          actorRole: activeUser.role,
          deposit: {
            id: ++next,
            contractId: contract.id,
            contractSerial: contract.contractSerial,
            installmentId: installment.id,
            installmentNumber: installment.number,
            customerName: contract.buyers[0]?.name || "Buyer",
            amount: Number(payload.amount),
            currency: contract.currency,
            paymentMethod: payload.paymentMethod || "Cash",
            receiptNumber: payload.receiptNumber || `RCP-${next}`,
            notes: payload.notes || "",
            enteredBy: activeUser.name,
            approvedBy: null,
          },
          installment,
          now: iso(0),
        });
        data.financeDeposits = [
          res.deposit as FinanceDeposit,
          ...(data.financeDeposits || []),
        ];
        return res.deposit;
      }

      const existingDep = data.financeDeposits?.find(
        (d) => d.id === Number(payload.depositId),
      );
      if (!existingDep) throw new Error("Deposit record not found.");
      const res = processFinanceDeposit({
        action: payload.action,
        actorRole: activeUser.role,
        deposit: existingDep,
        installment,
        reason: payload.reason,
        now: iso(0),
      });
      Object.assign(existingDep, res.deposit, { approvedBy: activeUser.name });
      Object.assign(installment, res.installment);
      return existingDep;
    },
    async createMarketingEntry(payload: {
      customerName: string;
      address: string;
      propertyType: "Villa" | "Block" | "Building" | "Apartment";
    }) {
      const valid = validateMarketingEntryCreation(payload, activeUser.role);
      const entry: MarketingProductionEntry = {
        id: ++next,
        customerName: valid.customerName,
        address: valid.address,
        propertyType: valid.propertyType,
        submittedByRole: activeUser.role,
        submittedByName: activeUser.name,
        submittedAt: iso(0),
        filmingDate: null,
        videographerId: null,
        videographerName: null,
        filmingCompletedAt: null,
        editingDeadlineAt: null,
        editorId: 7,
        editorName: "Ramin Safi",
        contentType: null,
        serialNumber: null,
        propertyInfoNote: null,
        photos: [],
        platform: null,
        stage: "submitted",
        submissionId: null,
        version: 1,
      };
      data.marketingEntries = [entry, ...(data.marketingEntries || [])];
      return entry;
    },
    async advanceMarketing(
      entryId: number,
      action:
        | "schedule_filming"
        | "complete_filming"
        | "schedule_editing"
        | "ready_for_post"
        | "mark_posted",
      payload: Record<string, any>,
    ) {
      const entry = data.marketingEntries?.find((m) => m.id === entryId);
      if (!entry) throw new Error("Marketing entry not found.");
      const res = advanceMarketingProduction(entry, action, payload, activeUser.role);
      if (action === "mark_posted" && "submission" in res) {
        const subId = ++next;
        const subRecord: SubmissionPost = {
          ...(res.submission as Omit<SubmissionPost, "id" | "submittedBy">),
          id: subId,
          submittedBy: `${activeUser.name} (Editor)`,
        };
        Object.assign(entry, res.entry, { submissionId: subId });
        data.submissions = [subRecord, ...(data.submissions || [])];
        return { entry, submission: subRecord };
      }
      if (action === "schedule_filming") {
        const vidUser = data.assignees.find((u) => u.id === Number(payload.videographerId));
        Object.assign(entry, res, { videographerName: vidUser?.name || "Jawad Noori" });
      } else {
        Object.assign(entry, res);
      }
      return { entry };
    },
    async uploadDeliverableVersion(
      deliverableId: number,
      payload: { fileUrl: string; fileName: string; format: string; notes: string },
    ) {
      const deliv = data.engineeringDeliverables?.find((d) => d.id === deliverableId);
      if (!deliv) throw new Error("Deliverable task not found.");
      const updated = submitDeliverableVersion(deliv, {
        actorRole: activeUser.role,
        actorName: activeUser.name,
        ...payload,
        submittedAt: iso(0),
      });
      Object.assign(deliv, updated);
      return deliv;
    },
    async reviewDeliverable(
      deliverableId: number,
      payload: {
        versionNumber: number;
        decision: "approved" | "revision_requested";
        comment: string;
      },
    ) {
      const deliv = data.engineeringDeliverables?.find((d) => d.id === deliverableId);
      if (!deliv) throw new Error("Deliverable task not found.");
      const updated = reviewDeliverableVersion(deliv, {
        actorRole: activeUser.role,
        reviewerName: activeUser.name,
        ...payload,
        reviewedAt: iso(0),
      });
      Object.assign(deliv, updated);
      return deliv;
    },
    async resetPassword(_email: string) {
      throw new Error("Passwords are not stored in sample preview.");
    },
    async logout() {
      location.href = location.pathname;
    },
  };
  return client;
}
