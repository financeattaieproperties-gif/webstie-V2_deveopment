import { ACTIVE_INTERNAL_ROLES } from "./branch-policy.mjs";

export const STAFF_PREFERRED_ROLE_KEY = "attaie_staff_preferred_role";
export const UNIFIED_PREFERRED_ROLE_KEY = "attaie_unified_preferred_role";

const activeRoleSet = new Set(ACTIVE_INTERNAL_ROLES);

export const PANEL_SPECS = Object.freeze({
  ceo: Object.freeze({
    panelId: "ceo",
    basePath: "/ceo",
    allowedRoles: Object.freeze(["ceo"]),
    defaultRole: "ceo",
    defaultPage: "overview",
    loginEyebrow: "ATTAIE EXECUTIVE COMMAND",
    loginTitle: "CEO Executive Workspace",
    loginSubtitle: "Sign in to your executive command and global oversight workspace.",
    fixedRoleLabel: "CEO (Global Authority)",
  }),
  management: Object.freeze({
    panelId: "management",
    basePath: "/management",
    allowedRoles: Object.freeze(["manager", "ceo"]),
    defaultRole: "manager",
    defaultPage: "overview",
    loginEyebrow: "ATTAIE BRANCH MANAGEMENT",
    loginTitle: "Branch Manager Workspace",
    loginSubtitle: "Sign in to manage branch operations, HR contracts, and pre-sale inventory.",
    fixedRoleLabel: "Branch & Operations Manager",
  }),
  "sales-leader": Object.freeze({
    panelId: "sales-leader",
    basePath: "/sales-leader",
    allowedRoles: Object.freeze(["sales_leader"]),
    defaultRole: "sales_leader",
    defaultPage: "leads",
    loginEyebrow: "ATTAIE SALES LEADERSHIP",
    loginTitle: "Sales Team Leader Workspace",
    loginSubtitle: "Sign in to oversee team leads, follow-up SLAs, and advisor assignments.",
    fixedRoleLabel: "Sales Team Leader",
  }),
  sales: Object.freeze({
    panelId: "sales",
    basePath: "/sales",
    allowedRoles: Object.freeze(["sales"]),
    defaultRole: "sales",
    defaultPage: "leads",
    loginEyebrow: "ATTAIE SALES CRM",
    loginTitle: "Sales Agent Workspace",
    loginSubtitle: "Sign in to manage your assigned leads, site visits, and deal closures.",
    fixedRoleLabel: "Sales Agent",
  }),
  callcenter: Object.freeze({
    panelId: "callcenter",
    basePath: "/callcenter",
    allowedRoles: Object.freeze(["callcenter"]),
    defaultRole: "callcenter",
    defaultPage: "overview",
    loginEyebrow: "ATTAIE CALL CENTER",
    loginTitle: "Call Center Workspace",
    loginSubtitle: "Sign in to log incoming inquiries and schedule 24-hour customer follow-ups.",
    fixedRoleLabel: "Call Center Agent",
  }),
  finance: Object.freeze({
    panelId: "finance",
    basePath: "/finance",
    allowedRoles: Object.freeze(["finance_manager"]),
    defaultRole: "finance_manager",
    defaultPage: "finance",
    loginEyebrow: "ATTAIE FINANCE DEPARTMENT",
    loginTitle: "Finance Manager Workspace",
    loginSubtitle: "Sign in to verify HR contract installments, customer deposits, and approvals.",
    fixedRoleLabel: "Finance Manager",
  }),
  marketing: Object.freeze({
    panelId: "marketing",
    basePath: "/marketing",
    allowedRoles: Object.freeze(["marketing_manager", "videographer", "editor"]),
    defaultRole: "marketing_manager",
    defaultPage: "marketing",
    loginEyebrow: "ATTAIE MEDIA & MARKETING",
    loginTitle: "Marketing & Media Workspace",
    loginSubtitle: "Sign in to manage property filming schedules, editing, and social publishing.",
    fixedRoleLabel: "Marketing · Videography · Editing",
  }),
  engineering: Object.freeze({
    panelId: "engineering",
    basePath: "/engineering",
    allowedRoles: Object.freeze(["architect", "graphic_designer", "visual_designer_3d"]),
    defaultRole: "architect",
    defaultPage: "deliverables",
    loginEyebrow: "ATTAIE ENGINEERING & 3D",
    loginTitle: "Engineering & 3D Workspace",
    loginSubtitle: "Sign in to manage 2D floor plans, print brochures, and 3D architectural renders.",
    fixedRoleLabel: "Architect · Graphic Designer · 3D Engineer",
  }),
  dashboard: Object.freeze({
    panelId: "dashboard",
    basePath: "/dashboard",
    allowedRoles: Object.freeze([...ACTIVE_INTERNAL_ROLES]),
    defaultRole: "sales",
    defaultPage: "overview",
    loginEyebrow: "ATTAIE INTERNAL CRM",
    loginTitle: "Internal Staff Workspace",
    loginSubtitle: "Sign in with your assigned staff account to open your department workspace.",
    fixedRoleLabel: "Assigned Staff Account",
  }),
});

/**
 * Resolves the dedicated panel specification from the URL path, subdomain, or build target.
 * @param {string} [pathname]
 * @param {string} [hostname]
 * @param {string} [buildRole]
 */
export function resolvePanelSpec(
  pathname = "",
  hostname = "",
  buildRole = "callcenter",
) {
  const cleanPath = String(pathname || "");
  const pathMatch = cleanPath.match(
    /^\/(ceo|management|sales-leader|sales|callcenter|finance|marketing|engineering|dashboard)(?:\/|$)/,
  );
  if (pathMatch && PANEL_SPECS[pathMatch[1]]) {
    return PANEL_SPECS[pathMatch[1]];
  }
  const subMatch = String(hostname || "")
    .toLowerCase()
    .match(/^(ceo|management|sales-leader|sales|callcenter|finance|marketing|engineering)\./);
  if (subMatch && PANEL_SPECS[subMatch[1]]) {
    return PANEL_SPECS[subMatch[1]];
  }
  if (PANEL_SPECS[buildRole]) {
    return PANEL_SPECS[buildRole];
  }
  return PANEL_SPECS.callcenter;
}

export const ROLE_DASHBOARD_LAYOUT_MAP = Object.freeze({
  ceo: Object.freeze({
    role: "ceo",
    defaultPage: "overview",
    defaultPillar: "command",
    workspacePath: "/ceo",
    allowedPages: Object.freeze([
      "overview",
      "customers",
      "leads",
      "projects",
      "contracts",
      "finance",
      "marketing",
      "deliverables",
      "submissions",
      "tasks",
      "team",
      "profile",
    ]),
  }),
  manager: Object.freeze({
    role: "manager",
    defaultPage: "overview",
    defaultPillar: "command",
    workspacePath: "/management",
    allowedPages: Object.freeze([
      "overview",
      "customers",
      "leads",
      "projects",
      "contracts",
      "finance",
      "marketing",
      "deliverables",
      "submissions",
      "tasks",
      "team",
      "profile",
    ]),
  }),
  sales_leader: Object.freeze({
    role: "sales_leader",
    defaultPage: "leads",
    defaultPillar: "sales",
    workspacePath: "/sales-leader",
    allowedPages: Object.freeze([
      "overview",
      "followups",
      "customers",
      "leads",
      "projects",
      "marketing",
      "submissions",
      "tasks",
      "team",
      "profile",
    ]),
  }),
  sales: Object.freeze({
    role: "sales",
    defaultPage: "leads",
    defaultPillar: "sales",
    workspacePath: "/sales",
    allowedPages: Object.freeze([
      "overview",
      "followups",
      "customers",
      "leads",
      "projects",
      "marketing",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  callcenter: Object.freeze({
    role: "callcenter",
    defaultPage: "followups",
    defaultPillar: "sales",
    workspacePath: "/callcenter",
    allowedPages: Object.freeze([
      "overview",
      "followups",
      "customers",
      "leads",
      "projects",
      "marketing",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  finance_manager: Object.freeze({
    role: "finance_manager",
    defaultPage: "finance",
    defaultPillar: "operations",
    workspacePath: "/finance",
    allowedPages: Object.freeze([
      "overview",
      "projects",
      "contracts",
      "finance",
      "submissions",
      "tasks",
      "team",
      "profile",
    ]),
  }),
  marketing_manager: Object.freeze({
    role: "marketing_manager",
    defaultPage: "marketing",
    defaultPillar: "operations",
    workspacePath: "/marketing",
    allowedPages: Object.freeze([
      "overview",
      "marketing",
      "submissions",
      "tasks",
      "team",
      "profile",
    ]),
  }),
  videographer: Object.freeze({
    role: "videographer",
    defaultPage: "marketing",
    defaultPillar: "operations",
    workspacePath: "/marketing",
    allowedPages: Object.freeze([
      "overview",
      "marketing",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  editor: Object.freeze({
    role: "editor",
    defaultPage: "marketing",
    defaultPillar: "operations",
    workspacePath: "/marketing",
    allowedPages: Object.freeze([
      "overview",
      "marketing",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  architect: Object.freeze({
    role: "architect",
    defaultPage: "deliverables",
    defaultPillar: "operations",
    workspacePath: "/engineering",
    allowedPages: Object.freeze([
      "overview",
      "projects",
      "deliverables",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  graphic_designer: Object.freeze({
    role: "graphic_designer",
    defaultPage: "deliverables",
    defaultPillar: "operations",
    workspacePath: "/engineering",
    allowedPages: Object.freeze([
      "overview",
      "projects",
      "deliverables",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
  visual_designer_3d: Object.freeze({
    role: "visual_designer_3d",
    defaultPage: "deliverables",
    defaultPillar: "operations",
    workspacePath: "/engineering",
    allowedPages: Object.freeze([
      "overview",
      "projects",
      "deliverables",
      "submissions",
      "tasks",
      "profile",
    ]),
  }),
});

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function isValidWorkspaceRole(role) {
  return typeof role === "string" && activeRoleSet.has(role);
}

export function mapStaffRoleToUnifiedLens(role) {
  switch (role) {
    case "sales":
    case "sales_leader":
    case "callcenter":
      return "sales";
    case "manager":
      return "manager";
    case "finance_manager":
      return "finance";
    case "marketing_manager":
    case "videographer":
    case "editor":
    case "architect":
    case "graphic_designer":
    case "visual_designer_3d":
      return "media";
    case "ceo":
    default:
      return "all";
  }
}

/**
 * @param {any} [storage]
 * @param {string | null} [fallbackRole]
 * @param {string} [key]
 */
export function readPreferredWorkspaceRole(
  storage = undefined,
  fallbackRole = undefined,
  key = STAFF_PREFERRED_ROLE_KEY,
) {
  try {
    const store = resolveStorage(storage);
    const raw = store?.getItem(key);
    if (isValidWorkspaceRole(raw)) {
      return raw;
    }
    return fallbackRole ?? null;
  } catch {
    return fallbackRole ?? null;
  }
}

export function writePreferredWorkspaceRole(
  role,
  storage = undefined,
  key = STAFF_PREFERRED_ROLE_KEY,
) {
  if (!isValidWorkspaceRole(role)) {
    return false;
  }
  try {
    const store = resolveStorage(storage);
    store?.setItem(key, role);
    if (key === STAFF_PREFERRED_ROLE_KEY) {
      store?.setItem(UNIFIED_PREFERRED_ROLE_KEY, mapStaffRoleToUnifiedLens(role));
    }
    return true;
  } catch {
    return false;
  }
}

export function clearPreferredWorkspaceRole(
  storage = undefined,
  key = STAFF_PREFERRED_ROLE_KEY,
) {
  try {
    const store = resolveStorage(storage);
    store?.removeItem?.(key);
  } catch {
    // Ignore storage removal errors
  }
}

export function getRoleDashboardLayout(role) {
  if (isValidWorkspaceRole(role) && ROLE_DASHBOARD_LAYOUT_MAP[role]) {
    return ROLE_DASHBOARD_LAYOUT_MAP[role];
  }
  return ROLE_DASHBOARD_LAYOUT_MAP.ceo;
}

export function resolvePageForRole(role, requestedPage, useRoleDefaultOnOverview = false) {
  const layout = getRoleDashboardLayout(role);
  if (
    requestedPage &&
    requestedPage !== "overview" &&
    layout.allowedPages.includes(requestedPage)
  ) {
    return requestedPage;
  }
  if (useRoleDefaultOnOverview) {
    return layout.defaultPage;
  }
  return layout.allowedPages.includes(requestedPage) ? requestedPage : "overview";
}

/**
 * @param {{ urlRoleParam?: string | null; sessionRole?: string | null; management?: boolean; storage?: any }} [options]
 */
export function resolveWorkspaceRoleOnSignIn({
  urlRoleParam = undefined,
  sessionRole = undefined,
  management = false,
  storage = undefined,
} = {}) {
  if (isValidWorkspaceRole(urlRoleParam)) {
    writePreferredWorkspaceRole(urlRoleParam, storage);
    return urlRoleParam;
  }
  const storedRole = readPreferredWorkspaceRole(storage, null);
  if (isValidWorkspaceRole(storedRole)) {
    return storedRole;
  }
  if (isValidWorkspaceRole(sessionRole)) {
    writePreferredWorkspaceRole(sessionRole, storage);
    return sessionRole;
  }
  return management ? "ceo" : "callcenter";
}

/**
 * Returns deterministic input and accessibility attributes for a Login password show/hide toggle.
 * @param {boolean} [showPassword]
 */
export function getPasswordVisibilityProps(showPassword = false) {
  const visible = Boolean(showPassword);
  return {
    inputType: visible ? "text" : "password",
    buttonLabel: visible ? "Hide password" : "Show password",
    ariaPressed: visible,
  };
}

