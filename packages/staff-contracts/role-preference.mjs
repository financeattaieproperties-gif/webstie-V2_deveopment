import { ACTIVE_INTERNAL_ROLES } from "./branch-policy.mjs";

export const STAFF_PREFERRED_ROLE_KEY = "attaie_staff_preferred_role";
export const UNIFIED_PREFERRED_ROLE_KEY = "attaie_unified_preferred_role";

const activeRoleSet = new Set(ACTIVE_INTERNAL_ROLES);

export const ROLE_DASHBOARD_LAYOUT_MAP = Object.freeze({
  ceo: Object.freeze({
    role: "ceo",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
    workspacePath: "/dashboard",
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
