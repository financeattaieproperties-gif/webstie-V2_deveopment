export type UnifiedDashboardModuleId =
  | 'overview'
  | 'properties'
  | 'leads'
  | 'followups'
  | 'visits'
  | 'chat'
  | 'projects'
  | 'contracts'
  | 'finance'
  | 'marketing'
  | 'engineering'
  | 'team'
  | 'seo';

export interface UnifiedNavGroup {
  id: string;
  label: string;
  items: UnifiedNavItem[];
}

export interface UnifiedNavItem {
  id: UnifiedDashboardModuleId;
  label: string;
  sourceApp: 'Admin CRM' | 'Staff Workspace' | 'Unified';
  badgeCount?: number;
}

export interface UnifiedMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  tone: 'neutral' | 'positive' | 'warning';
  context: string;
  targetModule: UnifiedDashboardModuleId;
}

export interface UnifiedRecordRow {
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  department: UnifiedDashboardModuleId;
  departmentLabel: string;
  owner: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Needs Review';
  valueDisplay: string;
  updatedAt: string;
}

export interface UnifiedActivityItem {
  id: string;
  title: string;
  detail: string;
  department: string;
  timestamp: string;
  moduleId: UnifiedDashboardModuleId;
}

export interface UnifiedPipelineStage {
  key: 'active' | 'draft' | 'closed' | 'lost';
  label: string;
  count: number;
  pct: number;
  barClass: string;
}

export interface UnifiedQuickItem {
  id: string;
  label: string;
  meta: string;
  value: string;
  moduleId: UnifiedDashboardModuleId;
}

export const UNIFIED_NAV_GROUPS: UnifiedNavGroup[] = [
  {
    id: 'command',
    label: 'Command',
    items: [
      { id: 'overview', label: 'Executive Overview', sourceApp: 'Unified' },
      { id: 'properties', label: 'Properties & Listings', sourceApp: 'Admin CRM', badgeCount: 6 },
      { id: 'projects', label: 'Pre-Sale Projects', sourceApp: 'Unified' },
    ],
  },
  {
    id: 'sales-crm',
    label: 'Sales & Client CRM',
    items: [
      { id: 'leads', label: 'Leads Pipeline', sourceApp: 'Unified', badgeCount: 14 },
      { id: 'followups', label: 'Call Center & Follow-ups', sourceApp: 'Staff Workspace', badgeCount: 4 },
      { id: 'visits', label: 'Site Visits', sourceApp: 'Admin CRM', badgeCount: 3 },
      { id: 'chat', label: 'Live Chat Inbox', sourceApp: 'Admin CRM', badgeCount: 2 },
    ],
  },
  {
    id: 'operations',
    label: 'Operations & Finance',
    items: [
      { id: 'contracts', label: 'HR Contracts', sourceApp: 'Staff Workspace' },
      { id: 'finance', label: 'Finance Ledger', sourceApp: 'Staff Workspace' },
      { id: 'marketing', label: 'Marketing & Submissions', sourceApp: 'Unified', badgeCount: 5 },
      { id: 'engineering', label: 'Engineering & 3D', sourceApp: 'Staff Workspace' },
    ],
  },
  {
    id: 'organization',
    label: 'Organization & Web',
    items: [
      { id: 'team', label: 'Agents, Branches & Careers', sourceApp: 'Unified' },
      { id: 'seo', label: 'SEO & System', sourceApp: 'Admin CRM' },
    ],
  },
];

export const UNIFIED_MODULE_DESCRIPTIONS: Record<
  UnifiedDashboardModuleId,
  { title: string; subtitle: string; covers: string }
> = {
  overview: {
    title: 'Executive Overview',
    subtitle: 'Cross-department summary uniting Website Admin and Staff CRM operations.',
    covers: 'All 12 staff roles, public inventory, sales pipeline, and pending approvals',
  },
  properties: {
    title: 'Properties & Listings',
    subtitle: 'Active Kabul residential villas, apartments, and commercial premises.',
    covers: 'Website listings, pricing, status lifecycle, and serial inventory',
  },
  projects: {
    title: 'Pre-Sale Projects',
    subtitle: 'Development towers, construction milestones, and floor unit inventory.',
    covers: 'Multi-seller project wizard, masterplans, and apartment allocation',
  },
  leads: {
    title: 'Leads Pipeline',
    subtitle: 'Unified inquiry intake from website forms, WhatsApp, and call center.',
    covers: 'Active, draft, deal closed, and deal lost funnel stages',
  },
  followups: {
    title: 'Call Center & Follow-ups',
    subtitle: '24-hour callback deadlines and customer requirement tracking.',
    covers: 'Due now, overtime alerts, and agent call feedback logs',
  },
  visits: {
    title: 'Site Visits',
    subtitle: 'Scheduled property viewings and branch advisor dispatch.',
    covers: 'Pending confirmations, completed tours, and staff notes',
  },
  chat: {
    title: 'Live Chat Inbox',
    subtitle: 'Real-time customer conversations escalated from the public portal.',
    covers: 'Unread threads, advisor handoffs, and inquiry conversion',
  },
  contracts: {
    title: 'HR Contracts',
    subtitle: 'Bilingual apartment sale agreements and verification records.',
    covers: '4-step contract issuance, amendments, and A4 legal printouts',
  },
  finance: {
    title: 'Finance Ledger',
    subtitle: 'Installment schedules, customer deposits, and approval queue.',
    covers: 'Pending deposit reviews, posted receipts, and reversals',
  },
  marketing: {
    title: 'Marketing & Submissions',
    subtitle: 'Filming schedules, editing milestones, and website publishing tasks.',
    covers: 'Videographer/Editor queue and isolated Submission DB approvals',
  },
  engineering: {
    title: 'Engineering & 3D',
    subtitle: 'Architectural floor plans, graphic brochures, and 3D visualizations.',
    covers: 'Versioned deliverables review across Architect and 3D teams',
  },
  team: {
    title: 'Agents, Branches & Careers',
    subtitle: 'Licensed advisors, Kabul offices, role directory, and open jobs.',
    covers: 'Branch directory, team tasks, and recruitment applications',
  },
  seo: {
    title: 'SEO & System',
    subtitle: 'Global metadata keywords, sitemap index, and workspace configuration.',
    covers: 'Active meta keywords, /sitemap.xml index, and role access',
  },
};

export const UNIFIED_METRICS: UnifiedMetric[] = [
  {
    id: 'active-listings',
    label: 'Active Inventory',
    value: '142',
    delta: '+6 this week',
    tone: 'positive',
    context: 'Properties & pre-sale units',
    targetModule: 'properties',
  },
  {
    id: 'pipeline-leads',
    label: 'Open Pipeline Leads',
    value: '48',
    delta: '4 due today',
    tone: 'warning',
    context: 'Website, chat & call center',
    targetModule: 'leads',
  },
  {
    id: 'monthly-contracts',
    label: 'Contract Volume',
    value: '$1.84M',
    delta: '+14.2% vs prior',
    tone: 'positive',
    context: 'Approved deals & deposits',
    targetModule: 'finance',
  },
  {
    id: 'pending-approvals',
    label: 'Pending Approvals',
    value: '11',
    delta: '5 submissions · 6 deposits',
    tone: 'neutral',
    context: 'Marketing, finance & visits',
    targetModule: 'marketing',
  },
];

export const UNIFIED_PIPELINE_STAGES: UnifiedPipelineStage[] = [
  { key: 'active', label: 'Active Pipeline', count: 29, pct: 60, barClass: 'bg-slate-900' },
  { key: 'draft', label: 'Needs Details', count: 7, pct: 15, barClass: 'bg-amber-500' },
  { key: 'closed', label: 'Deals Closed', count: 9, pct: 19, barClass: 'bg-emerald-600' },
  { key: 'lost', label: 'Closed Lost', count: 3, pct: 6, barClass: 'bg-slate-300' },
];

export const UNIFIED_RECORDS: UnifiedRecordRow[] = [
  {
    id: 'rec-1',
    reference: 'AP-101',
    title: 'Wazir Akbar Khan Diplomatic Villa',
    subtitle: 'Street 13 · 5 Beds · 650 sqm Sale',
    department: 'properties',
    departmentLabel: 'Properties',
    owner: 'Zahra Karimi',
    status: 'Active',
    valueDisplay: '$650,000',
    updatedAt: '12m ago',
  },
  {
    id: 'rec-2',
    reference: 'LD-409',
    title: 'Haji Farid Ahmadzai — Penthouse Inquiry',
    subtitle: 'Shahr-e-Naw · Callback window open',
    department: 'leads',
    departmentLabel: 'Leads',
    owner: 'Samiullah Noor',
    status: 'Pending',
    valueDisplay: '$210,000',
    updatedAt: '24m ago',
  },
  {
    id: 'rec-3',
    reference: 'SUB-1765',
    title: 'Wazir Akbar Khan Villa Social Package',
    subtitle: '5 verified photos · Ready for publish',
    department: 'marketing',
    departmentLabel: 'Marketing',
    owner: 'Omid Rahimi',
    status: 'Needs Review',
    valueDisplay: 'Instagram + FB',
    updatedAt: '41m ago',
  },
  {
    id: 'rec-4',
    reference: 'FIN-882',
    title: 'Installment #3 Deposit — Ansari Tower Unit 7B',
    subtitle: 'Contract HR-2026-019 · Wire receipt attached',
    department: 'finance',
    departmentLabel: 'Finance',
    owner: 'Farhad Waziri',
    status: 'Needs Review',
    valueDisplay: '$45,000',
    updatedAt: '1h ago',
  },
  {
    id: 'rec-5',
    reference: 'CTR-019',
    title: 'Bilingual Sale Contract — Shahr-e-Naw Block B',
    subtitle: 'Buyer & seller verification finalized',
    department: 'contracts',
    departmentLabel: 'HR Contracts',
    owner: 'Ahmad Attaie',
    status: 'Completed',
    valueDisplay: '$185,000',
    updatedAt: '2h ago',
  },
  {
    id: 'rec-6',
    reference: 'ENG-304',
    title: '3D Facade & Floor Plan Revision v3',
    subtitle: 'Kolola Pushta Commercial Tower',
    department: 'engineering',
    departmentLabel: 'Engineering',
    owner: 'Nadia Sadat',
    status: 'Active',
    valueDisplay: 'v3.0 Draft',
    updatedAt: '3h ago',
  },
  {
    id: 'rec-7',
    reference: 'VST-118',
    title: 'Site Tour — Sherpur Compound',
    subtitle: 'Scheduled today 15:30 Kabul time',
    department: 'visits',
    departmentLabel: 'Visits',
    owner: 'Mohammad Ramin',
    status: 'Pending',
    valueDisplay: 'Confirmed',
    updatedAt: '3h ago',
  },
  {
    id: 'rec-8',
    reference: 'CHT-904',
    title: 'Live Chat — Expatriate Furnished Lease',
    subtitle: 'Unread customer reply waiting',
    department: 'chat',
    departmentLabel: 'Live Chat',
    owner: 'Call Center Desk',
    status: 'Pending',
    valueDisplay: '2 unread',
    updatedAt: '9m ago',
  },
  {
    id: 'rec-9',
    reference: 'PRJ-012',
    title: 'Shahr-e-Naw Residence Tower',
    subtitle: 'Pre-Sale Inventory · 18 of 44 units available',
    department: 'projects',
    departmentLabel: 'Projects',
    owner: 'Engineering & Sales',
    status: 'Active',
    valueDisplay: '18 units',
    updatedAt: '4h ago',
  },
  {
    id: 'rec-10',
    reference: 'FU-771',
    title: '24h Follow-up — Karte Se Family House',
    subtitle: 'Manual call log awaiting outcome note',
    department: 'followups',
    departmentLabel: 'Follow-ups',
    owner: 'Samiullah Noor',
    status: 'Needs Review',
    valueDisplay: 'Due 16:00',
    updatedAt: '18m ago',
  },
  {
    id: 'rec-11',
    reference: 'BR-001',
    title: 'Wazir Akbar Khan HQ & 2 Kabul Branches',
    subtitle: '14 licensed advisors · 2 open job postings',
    department: 'team',
    departmentLabel: 'Team',
    owner: 'HR Operations',
    status: 'Active',
    valueDisplay: '14 Staff',
    updatedAt: 'Today',
  },
  {
    id: 'rec-12',
    reference: 'SEO-007',
    title: 'Global Meta Keywords & Sitemap Index',
    subtitle: '7 active keywords · 28 indexed URLs',
    department: 'seo',
    departmentLabel: 'SEO & System',
    owner: 'System Admin',
    status: 'Completed',
    valueDisplay: '7 / 7 On',
    updatedAt: 'Today',
  },
];

export const UNIFIED_ACTIVITY_FEED: UnifiedActivityItem[] = [
  {
    id: 'act-1',
    title: 'New customer chat escalation',
    detail: 'Requesting diplomatic villa tour in Sherpur for next Tuesday',
    department: 'Live Chat',
    timestamp: '9 min ago',
    moduleId: 'chat',
  },
  {
    id: 'act-2',
    title: 'Deposit receipt uploaded for approval',
    detail: '$45,000 installment recorded under Contract HR-2026-019',
    department: 'Finance',
    timestamp: '41 min ago',
    moduleId: 'finance',
  },
  {
    id: 'act-3',
    title: 'Submission AP-1765 ready for web publish',
    detail: 'Editor marked 5 verified photos complete for website intake',
    department: 'Marketing',
    timestamp: '1 hr ago',
    moduleId: 'marketing',
  },
  {
    id: 'act-4',
    title: '3D visualization package updated',
    detail: 'Architect uploaded floor 4–8 revised technical blueprints',
    department: 'Engineering',
    timestamp: '3 hrs ago',
    moduleId: 'engineering',
  },
  {
    id: 'act-5',
    title: 'Global SEO keyword configuration synced',
    detail: '7 active keywords indexed across site-wide metadata headers',
    department: 'SEO',
    timestamp: 'Today',
    moduleId: 'seo',
  },
];

export const UNIFIED_DEPARTMENT_HEALTH: UnifiedQuickItem[] = [
  { id: 'dh-1', label: 'Properties Published', meta: 'Website catalog', value: '142 units', moduleId: 'properties' },
  { id: 'dh-2', label: '24h Follow-up SLA', meta: 'Call center compliance', value: '91.6%', moduleId: 'followups' },
  { id: 'dh-3', label: 'Engineering Revisions', meta: '2D & 3D deliverables', value: '8 active', moduleId: 'engineering' },
  { id: 'dh-4', label: 'Verified Contracts', meta: 'HR & Finance ledger', value: '19 issued', moduleId: 'contracts' },
];

export function filterUnifiedRecords(
  records: ReadonlyArray<UnifiedRecordRow>,
  moduleId: UnifiedDashboardModuleId,
  searchQuery: string,
  statusFilter: 'All' | UnifiedRecordRow['status'],
): UnifiedRecordRow[] {
  const q = searchQuery.trim().toLowerCase();
  return records.filter((row) => {
    if (moduleId !== 'overview' && row.department !== moduleId) {
      return false;
    }
    if (statusFilter !== 'All' && row.status !== statusFilter) {
      return false;
    }
    if (!q) return true;
    return (
      row.title.toLowerCase().includes(q) ||
      row.reference.toLowerCase().includes(q) ||
      row.subtitle.toLowerCase().includes(q) ||
      row.owner.toLowerCase().includes(q) ||
      row.departmentLabel.toLowerCase().includes(q)
    );
  });
}

export function getUnifiedModuleById(id: UnifiedDashboardModuleId): UnifiedNavItem | undefined {
  for (const group of UNIFIED_NAV_GROUPS) {
    const found = group.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

export const UNIFIED_SIDEBAR_COMPACT_KEY = 'attaie_unified_sidebar_compact';
export const STAFF_PREFERRED_ROLE_KEY = 'attaie_staff_preferred_role';
export const UNIFIED_PREFERRED_ROLE_KEY = 'attaie_unified_preferred_role';

export type StaffWorkspaceRoleId =
  | 'ceo'
  | 'manager'
  | 'callcenter'
  | 'sales_leader'
  | 'sales'
  | 'marketing_manager'
  | 'editor'
  | 'videographer'
  | 'finance_manager'
  | 'architect'
  | 'graphic_designer'
  | 'visual_designer_3d';

export type UnifiedRoleLensId = 'all' | 'manager' | 'sales' | 'finance' | 'media';

export const VALID_STAFF_WORKSPACE_ROLES: ReadonlyArray<StaffWorkspaceRoleId> = [
  'ceo',
  'manager',
  'callcenter',
  'sales_leader',
  'sales',
  'marketing_manager',
  'editor',
  'videographer',
  'finance_manager',
  'architect',
  'graphic_designer',
  'visual_designer_3d',
];

export const VALID_UNIFIED_ROLE_LENSES: ReadonlyArray<UnifiedRoleLensId> = [
  'all',
  'manager',
  'sales',
  'finance',
  'media',
];

export interface SidebarStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
}

function resolveSidebarStorage(
  storage?: SidebarStorageLike | null,
): SidebarStorageLike | null {
  if (storage !== undefined) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function readSidebarCompactPreference(
  storage?: SidebarStorageLike | null,
  key = UNIFIED_SIDEBAR_COMPACT_KEY,
): boolean {
  try {
    const store = resolveSidebarStorage(storage);
    return store?.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function writeSidebarCompactPreference(
  compact: boolean,
  storage?: SidebarStorageLike | null,
  key = UNIFIED_SIDEBAR_COMPACT_KEY,
): void {
  try {
    const store = resolveSidebarStorage(storage);
    store?.setItem(key, compact ? 'true' : 'false');
  } catch {
    // Ignore storage write errors (private browsing or quota)
  }
}

export function toggleSidebarCompactPreference(
  current: boolean,
  storage?: SidebarStorageLike | null,
  key = UNIFIED_SIDEBAR_COMPACT_KEY,
): boolean {
  const next = !current;
  writeSidebarCompactPreference(next, storage, key);
  return next;
}

export function isValidStaffWorkspaceRole(role: unknown): role is StaffWorkspaceRoleId {
  return (
    typeof role === 'string' &&
    (VALID_STAFF_WORKSPACE_ROLES as ReadonlyArray<string>).includes(role)
  );
}

export function isValidUnifiedRoleLens(lens: unknown): lens is UnifiedRoleLensId {
  return (
    typeof lens === 'string' &&
    (VALID_UNIFIED_ROLE_LENSES as ReadonlyArray<string>).includes(lens)
  );
}

export function mapStaffRoleToUnifiedLens(role: StaffWorkspaceRoleId): UnifiedRoleLensId {
  switch (role) {
    case 'sales':
    case 'sales_leader':
    case 'callcenter':
      return 'sales';
    case 'manager':
      return 'manager';
    case 'finance_manager':
      return 'finance';
    case 'marketing_manager':
    case 'videographer':
    case 'editor':
    case 'architect':
    case 'graphic_designer':
    case 'visual_designer_3d':
      return 'media';
    case 'ceo':
    default:
      return 'all';
  }
}

export function mapUnifiedLensToStaffRole(lens: UnifiedRoleLensId): StaffWorkspaceRoleId {
  switch (lens) {
    case 'sales':
      return 'sales';
    case 'manager':
      return 'manager';
    case 'finance':
      return 'finance_manager';
    case 'media':
      return 'marketing_manager';
    case 'all':
    default:
      return 'ceo';
  }
}

export function getDefaultModuleForRoleLens(lens: UnifiedRoleLensId): {
  groupId: string;
  moduleId: UnifiedDashboardModuleId;
} {
  switch (lens) {
    case 'sales':
      return { groupId: 'sales-crm', moduleId: 'leads' };
    case 'manager':
      return { groupId: 'command', moduleId: 'projects' };
    case 'finance':
      return { groupId: 'operations', moduleId: 'finance' };
    case 'media':
      return { groupId: 'operations', moduleId: 'marketing' };
    case 'all':
    default:
      return { groupId: 'command', moduleId: 'overview' };
  }
}

export function readPreferredWorkspaceRole(
  storage?: SidebarStorageLike | null,
  fallback: StaffWorkspaceRoleId | null = null,
  key = STAFF_PREFERRED_ROLE_KEY,
): StaffWorkspaceRoleId | null {
  try {
    const store = resolveSidebarStorage(storage);
    const raw = store?.getItem(key);
    if (isValidStaffWorkspaceRole(raw)) {
      return raw;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePreferredWorkspaceRole(
  role: StaffWorkspaceRoleId,
  storage?: SidebarStorageLike | null,
  key = STAFF_PREFERRED_ROLE_KEY,
): boolean {
  if (!isValidStaffWorkspaceRole(role)) return false;
  try {
    const store = resolveSidebarStorage(storage);
    store?.setItem(key, role);
    if (key === STAFF_PREFERRED_ROLE_KEY) {
      store?.setItem(UNIFIED_PREFERRED_ROLE_KEY, mapStaffRoleToUnifiedLens(role));
    }
    return true;
  } catch {
    return false;
  }
}

export function readPreferredRoleLens(
  storage?: SidebarStorageLike | null,
  fallback: UnifiedRoleLensId = 'all',
): UnifiedRoleLensId {
  try {
    const store = resolveSidebarStorage(storage);
    const savedLens = store?.getItem(UNIFIED_PREFERRED_ROLE_KEY);
    if (isValidUnifiedRoleLens(savedLens)) {
      return savedLens;
    }
    const savedStaffRole = store?.getItem(STAFF_PREFERRED_ROLE_KEY);
    if (isValidStaffWorkspaceRole(savedStaffRole)) {
      return mapStaffRoleToUnifiedLens(savedStaffRole);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePreferredRoleLens(
  lens: UnifiedRoleLensId,
  storage?: SidebarStorageLike | null,
): boolean {
  if (!isValidUnifiedRoleLens(lens)) return false;
  try {
    const store = resolveSidebarStorage(storage);
    store?.setItem(UNIFIED_PREFERRED_ROLE_KEY, lens);
    store?.setItem(STAFF_PREFERRED_ROLE_KEY, mapUnifiedLensToStaffRole(lens));
    return true;
  } catch {
    return false;
  }
}


