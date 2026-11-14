export type Role =
  | "ceo"
  | "manager"
  | "callcenter"
  | "sales_leader"
  | "sales"
  | "marketing_manager"
  | "editor"
  | "videographer"
  | "finance_manager"
  | "architect"
  | "graphic_designer"
  | "visual_designer_3d";

export type RetiredInternalRole =
  | "admin"
  | "hr_manager"
  | "branch_manager"
  | "assistant_manager"
  | "production_manager"
  | "photographer"
  | "customer"
  | "finance_assistant";

export type DepartmentCode =
  | "administration"
  | "management"
  | "hr"
  | "callcenter"
  | "sales"
  | "production"
  | "branches"
  | "finance"
  | "engineering"
  | "customers"
  | string;

export interface Department {
  code: DepartmentCode;
  name: string;
  createdAt?: string;
}

export interface StaffUser {
  id: number;
  name: string;
  role: Role;
  departmentCode?: DepartmentCode;
  username?: string;
  firebaseUid?: string;
  teamLeaderId?: number | null;
  assignedProjectIds?: number[];
  branchId: number | null;
  branchName?: string | null;
  active?: boolean;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  version: number;
}

export interface BranchAssignment {
  branchId: number;
  userId: number;
  role: Exclude<Role, "ceo">;
  assignedBy: number;
  assignedAt: string;
}

export interface Customer {
  id: number;
  serial?: string;
  name: string;
  phone: string;
  requirements: string;
  leadCount: number;
  ownerAgentId?: number;
  sharedAgentIds?: number[];
}

export interface CustomerReviewRequest {
  id: number;
  customerId: number;
  phone: string;
  requestingAgentId: number;
  requestingAgentName: string;
  submittedName: string;
  submittedRequirements: string;
  status: "pending_review" | "approved_shared" | "reassigned" | "rejected";
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string;
}

export interface Activity {
  id: number;
  actorName: string;
  type: string;
  stageCode?: string;
  notes: string;
  at: string;
}

export type LeadSource =
  | "manual"
  | "provider"
  | "fixture"
  | "walk_in"
  | "direct_call"
  | "company_referral"
  | "callcenter"
  | "social_media";

export type LeadPropertyReference = { kind: "project" | "unit"; id: number };

export interface Lead {
  property?: LeadPropertyReference | null;
  id: number;
  serial: string;
  stageSerial?: string;
  stageCode?: "L" | "F" | "V" | "DC" | "DL";
  sequenceNumber?: number;
  customerId: number | null;
  customerName: string;
  phone: string;
  projectId?: number | null;
  projectCode?: string | null;
  projectName?: string | null;
  apartmentId?: number | null;
  apartmentNumber?: string | null;
  requirements: string;
  status: "draft" | "active" | "closed" | "lost";
  originAgentId: number;
  assigneeId?: number;
  sharedAgentIds?: number[];
  callAt: string;
  source: LeadSource;
  version: number;
  activities?: Activity[];
  deal?: {
    dealSerial?: string;
    projectId?: number;
    apartmentId?: number;
    hrContractId?: number | null;
    amount: string;
    pricePerSqm?: string;
    currency: string;
    salesAgent: string;
    projectCode?: string;
    apartmentNumber?: string;
    buyerPhotoUrl?: string;
    tazkiraPhotoUrl?: string;
    closedAt: string;
  } | null;
}

export interface Followup {
  id: number;
  leadId: number;
  serial: string;
  stageSerial?: string;
  customerName: string;
  phone: string;
  projectName?: string;
  requirements: string;
  assigneeId: number;
  scheduledAt: string;
  completedAt: string | null;
  notes: string;
  version: number;
}

export interface ManagementTask {
  id: number;
  title: string;
  instructions: string;
  departmentCode?: DepartmentCode;
  projectId?: number | null;
  projectName?: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  assigneeId: number;
  assigneeName?: string;
  assignedBy: string;
  assignedById?: number;
  deadlineAt: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  version: number;
  completedAt?: string | null;
}

export interface ProjectSeller {
  name: string;
  fatherName: string;
  grandfatherName?: string;
  tazkiraNumber: string;
  sharePercentage?: number;
  birthDate?: string;
  address: string;
  phone: string;
  photo3x4Url?: string;
  permanentAddress?: string;
  currentAddress?: string;
}

export interface ConstructionCompanyInfo {
  companyName: string;
  licenseNumber: string;
  representativeName: string;
  representativeFatherName: string;
  representativeTazkira: string;
  representativePhotoUrl?: string;
  representativeBirthDate?: string;
  representativeGrandfatherName?: string;
  representativePermanentAddress?: string;
  representativeCurrentAddress?: string;
  address: string;
  phone: string;
}

export interface InventoryApartment {
  id: number;
  projectId: number;
  unitNumber: string;
  serialNumber: string;
  floor: number;
  kind?: "apartment" | "shop" | "supermarket";
  corridor?: string;
  unitSuffix?: string;
  roofAreaSqm?: number;
  isVip?: boolean;
  rooms: number;
  areaSqm: number;
  direction: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;
  pricePerSqm: number;
  totalPrice: number;
  currency: "USD" | "AFN";
  status: "available" | "reserved" | "deal_closed" | "sold";
}

export interface InventoryProject {
  id: number;
  code: string;
  name: string;
  location: string;
  description: string;
  status: "draft" | "presale" | "active" | "completed";
  totalAreaSqm: number;
  floors: number;
  commercialFloors: number[];
  residentialFloors: number[];
  corridorCount: number;
  coverPhotoUrl: string;
  assignedTeamLeaderId: number | null;
  sellers: ProjectSeller[];
  constructionCompany: ConstructionCompanyInfo | null;
  apartments: InventoryApartment[];
  assignedSalesAgentIds: number[];
  version: number;
  createdAt: string;
}

export interface ContractBuyer {
  name: string;
  fatherName: string;
  grandfatherName?: string;
  tazkiraNumber: string;
  sharePercentage?: number;
  birthDate?: string;
  address: string;
  phone: string;
  photo3x4Url?: string;
  permanentAddress?: string;
  currentAddress?: string;
  portraitUrl?: string;
  tazkiraPhotoUrl?: string;
}

export interface ContractInstallment {
  id: number;
  number: number;
  description: string;
  percentage: number;
  dueDate: string | null;
  scheduledAmount: number;
  paidAmount: number;
  status: "pending" | "partially_paid" | "paid" | "overdue";
}

export interface HrContract {
  id: number;
  contractSerial: string;
  dealSerial?: string | null;
  projectId: number;
  projectCode: string;
  projectName: string;
  apartmentId: number;
  apartmentNumber: string;
  apartmentSerial: string;
  floor: number;
  rooms: number;
  areaSqm: number;
  direction: string;
  boundaries: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  sellersSnapshot: ProjectSeller[];
  constructionSnapshot: ConstructionCompanyInfo | null;
  buyers: ContractBuyer[];
  pricePerSqm: number;
  totalPrice: number;
  currency: "USD" | "AFN";
  salesAgentName: string;
  gregorianDate: string;
  jalaliDate: string;
  clauses: string[];
  notes: string;
  installments: ContractInstallment[];
  status: "draft" | "issued" | "amended" | "cancelled";
  verificationToken?: string;
  verificationUrl?: string;
  amendmentVersion: number;
  issuedBy: string;
  issuedAt: string | null;
  version: number;
}

export interface FinanceDeposit {
  id: number;
  voucherNumber?: string;
  installmentId: number;
  receiptNumber: string;
  receiptPaidToDate?: number | null;
  receiptRemainingBalance?: number | null;
  paymentMethod: "Cash" | "Bank Transfer" | "Cheque";
  notes: string;
  paymentDate?: string;
  enteredBy: string;
  approvedBy?: string | null;
  contractId: number;
  contractSerial: string;
  installmentNumber: number;
  customerName: string;
  amount: number;
  currency: "USD" | "AFN";
  status: "draft" | "posted" | "returned" | "reversed";
  draftedBy?: string;
  reviewedBy?: string | null;
  reversalReason?: string | null;
  createdAt?: string;
  postedAt?: string | null;
  version: number;
}

export interface MarketingProductionEntry {
  id: number;
  customerName: string;
  address: string;
  propertyType: "Villa" | "Block" | "Building" | "Apartment";
  submittedByName: string;
  submittedAt: string;
  submissionId: number | null;
  submittedByRole: Role;
  filmingDate: string | null;
  videographerId: number | null;
  videographerName?: string | null;
  filmingCompletedAt: string | null;
  editorId: number | null;
  editorName?: string | null;
  editingDeadlineAt: string | null;
  contentType: string | null;
  serialNumber: string | null;
  propertyInfoNote: string | null;
  photos: string[];
  platform: "Facebook" | "YouTube" | "Instagram" | null;
  stage:
    | "submitted"
    | "filming_scheduled"
    | "filming_completed"
    | "editing_scheduled"
    | "ready_for_post"
    | "posted";
  version: number;
}

export interface SubmissionPost {
  id: number;
  marketingEntryId: number;
  serialNumber: string;
  customerName: string;
  address: string;
  propertyType: "Villa" | "Block" | "Building" | "Apartment";
  propertyInfoNote: string;
  photos: string[];
  socialPlatform: "Facebook" | "YouTube" | "Instagram";
  publishStatus: "Submitted" | "Approved" | "Published" | "Rejected";
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  rejectionReason?: string | null;
  websitePropertyId?: number | null;
  version: number;
}

export interface EngineeringDeliverableVersion {
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  format: string;
  notes: string;
  submittedBy: string;
  submittedAt: string;
  status: "submitted" | "approved" | "revision_requested";
  reviewerComment?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface EngineeringDeliverable {
  id: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  taskId?: number | null;
  title: string;
  category:
    | "plan_2d"
    | "furnished_3d"
    | "poster"
    | "flyer"
    | "brochure"
    | "banner"
    | "booklet"
    | "visualization";
  assigneeId: number;
  assigneeName: string;
  apartmentNumber?: string | null;
  role: "architect" | "graphic_designer" | "visual_designer_3d";
  deadlineAt: string;
  versions: EngineeringDeliverableVersion[];
  version: number;
}

export interface Session {
  user: StaffUser;
  csrfToken: string;
  serverTime: string;
}

export interface Feedback {
  outcome: "followup" | "visit" | "closed" | "lost";
  notes?: string;
  reason?: string;
  amount?: string;
  pricePerSqm?: string;
  currency?: string;
  projectId?: number;
  apartmentId?: number;
  buyerPhotoUrl?: string;
  tazkiraPhotoUrl?: string;
  nextScheduledAt?: string;
  nextAssigneeId?: number;
  version: number;
}

export interface DashboardData {
  leads: Lead[];
  followups: Followup[];
  tasks: ManagementTask[];
  customers: Customer[];
  customerReviewRequests?: CustomerReviewRequest[];
  departments?: Department[];
  projects?: InventoryProject[];
  hrWorkItems?: Array<{
    id: number;
    dealSerial: string;
    leadId: number;
    customerName: string;
    phone: string;
    projectId: number;
    projectCode: string;
    projectName: string;
    apartmentId: number;
    apartmentNumber: string;
    agreedAmount: number;
    currency: "USD" | "AFN";
    salesAgentName: string;
    buyerPhotoUrl: string;
    tazkiraPhotoUrl: string;
    status: "pending_contract" | "contract_issued";
    createdAt: string;
  }>;
  hrContracts?: HrContract[];
  financeDeposits?: FinanceDeposit[];
  marketingEntries?: MarketingProductionEntry[];
  submissions?: SubmissionPost[];
  engineeringDeliverables?: EngineeringDeliverable[];
  assignees: StaffUser[];
  counts: Record<string, number>;
  page: number;
  integration: { enabled: boolean; message: string };
  serverTime: string;
}

export interface ProjectPreparationInput {
  version: number;
  sellers: ProjectSeller[];
  constructionCompany: ConstructionCompanyInfo;
  apartments: Array<Pick<InventoryApartment, "id" | "boundaryNorth" | "boundarySouth" | "boundaryEast" | "boundaryWest">>;
}
export interface ContractIssueInput {
  projectId: number; apartmentId: number; buyers: ContractBuyer[];
  installments: Array<Pick<ContractInstallment, "description" | "percentage" | "dueDate">>;
  salesAgentName: string; clauses: string[]; notes: string;
  contractDate?: string;
  draft?: boolean;
  contractId?: number;
  version?: number;
  dealHandoffId?: number;
  leadId?: number;
  dealSerial?: string; gregorianDate?: string; jalaliDate?: string;
}
export interface ContractVerification {
  contractSerial: string; status: HrContract["status"]; amendmentVersion: number;
}

export interface ContractAmendInput { version: number; clauses: string[]; notes: string; reason: string; }
