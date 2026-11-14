import test from "node:test";
import assert from "node:assert/strict";
import {
  PANEL_SPECS,
  STAFF_PREFERRED_ROLE_KEY,
  UNIFIED_PREFERRED_ROLE_KEY,
  clearPreferredWorkspaceRole,
  formatMobileContactLinks,
  getMobilePrimaryTabs,
  getPasswordVisibilityProps,
  getRoleDashboardLayout,
  isValidWorkspaceRole,
  mapStaffRoleToUnifiedLens,
  parseBiometricBridgeStatus,
  readPreferredWorkspaceRole,
  readQuickSignInPreference,
  resolvePageForRole,
  resolvePanelSpec,
  resolveStaffApiEndpoint,
  resolveWorkspaceRoleOnSignIn,
  shouldAutoPromptBiometric,
  writePreferredWorkspaceRole,
  writeQuickSignInPreference,
} from "../../../packages/staff-contracts/role-preference.mjs";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("getPasswordVisibilityProps toggles inputType, buttonLabel, and ariaPressed cleanly", () => {
  const hidden = getPasswordVisibilityProps(false);
  assert.equal(hidden.inputType, "password");
  assert.equal(hidden.buttonLabel, "Show password");
  assert.equal(hidden.ariaPressed, false);

  const visible = getPasswordVisibilityProps(true);
  assert.equal(visible.inputType, "text");
  assert.equal(visible.buttonLabel, "Hide password");
  assert.equal(visible.ariaPressed, true);
});

test("resolveStaffApiEndpoint, getMobilePrimaryTabs, and formatMobileContactLinks support Android Sales Agent app", () => {
  const webEndpoint = resolveStaffApiEndpoint("dashboard?view=leads");
  assert.equal(webEndpoint.url, "/staff-api/v1/dashboard?view=leads");
  assert.equal(webEndpoint.credentials, "same-origin");
  assert.equal(webEndpoint.isCrossOrigin, false);

  const androidEndpoint = resolveStaffApiEndpoint(
    "/auth/login",
    "https://website.attaieproperties.com/staff-api/v1/",
  );
  assert.equal(
    androidEndpoint.url,
    "https://website.attaieproperties.com/staff-api/v1/auth/login",
  );
  assert.equal(androidEndpoint.credentials, "include");
  assert.equal(androidEndpoint.isCrossOrigin, true);

  const localPhone = formatMobileContactLinks("078 222 2279");
  assert.equal(localPhone.telHref, "tel:+93782222279");
  assert.equal(localPhone.whatsappHref, "https://wa.me/93782222279");

  const intlPhone = formatMobileContactLinks("+93700112233");
  assert.equal(intlPhone.telHref, "tel:+93700112233");
  assert.equal(intlPhone.whatsappHref, "https://wa.me/93700112233");

  const emptyPhone = formatMobileContactLinks("");
  assert.equal(emptyPhone.telHref, "");
  assert.equal(emptyPhone.whatsappHref, "");

  const salesTabs = [
    { id: "overview", label: "Overview" },
    { id: "followups", label: "Follow-ups" },
    { id: "customers", label: "Customers" },
    { id: "leads", label: "Leads" },
    { id: "projects", label: "Pre-Sale Projects" },
    { id: "marketing", label: "Marketing & Media" },
    { id: "submissions", label: "Submissions" },
    { id: "tasks", label: "My Tasks" },
  ];
  const mobileTabs = getMobilePrimaryTabs(salesTabs);
  assert.equal(mobileTabs.length, 5);
  assert.deepEqual(
    mobileTabs.map((t) => t.id),
    ["leads", "followups", "customers", "projects", "overview"],
  );
  assert.equal(mobileTabs[3].mobileLabel, "Projects");
});

test("workspace role persistence reads, writes, validates, and syncs Sales vs Manager roles across sessions", () => {
  const storage = createMemoryStorage();

  // Returns fallback when nothing is stored
  assert.equal(readPreferredWorkspaceRole(storage, "sales"), "sales");
  assert.equal(readPreferredWorkspaceRole(storage), null);

  // Persists Sales role and syncs Unified Role Lens
  assert.equal(writePreferredWorkspaceRole("sales", storage), true);
  assert.equal(readPreferredWorkspaceRole(storage), "sales");
  assert.equal(storage.getItem(STAFF_PREFERRED_ROLE_KEY), "sales");
  assert.equal(storage.getItem(UNIFIED_PREFERRED_ROLE_KEY), "sales");

  // Switching to Manager overwrites preference and updates Unified Role Lens
  assert.equal(writePreferredWorkspaceRole("manager", storage), true);
  assert.equal(readPreferredWorkspaceRole(storage), "manager");
  assert.equal(storage.getItem(UNIFIED_PREFERRED_ROLE_KEY), "manager");

  // Rejects retired or invalid roles without corrupting storage
  assert.equal(writePreferredWorkspaceRole("hr_manager", storage), false);
  assert.equal(writePreferredWorkspaceRole("invalid_role", storage), false);
  assert.equal(readPreferredWorkspaceRole(storage), "manager");

  // Clearing preference removes stored role
  clearPreferredWorkspaceRole(storage);
  assert.equal(readPreferredWorkspaceRole(storage), null);
});

test("resolveWorkspaceRoleOnSignIn prioritizes URL role param, then stored localStorage role, then session role", () => {
  const storage = createMemoryStorage();

  // 1. Session role is used and persisted when storage is empty
  const firstSignInRole = resolveWorkspaceRoleOnSignIn({
    sessionRole: "sales",
    management: false,
    storage,
  });
  assert.equal(firstSignInRole, "sales");
  assert.equal(readPreferredWorkspaceRole(storage), "sales");

  // 2. Subsequent session remembers stored role ("sales") even if default is different
  const rememberedRole = resolveWorkspaceRoleOnSignIn({
    sessionRole: "ceo",
    management: true,
    storage,
  });
  assert.equal(rememberedRole, "sales");

  // 3. Explicit URL ?role=manager overrides and updates localStorage for future sessions
  const overriddenRole = resolveWorkspaceRoleOnSignIn({
    urlRoleParam: "manager",
    sessionRole: "sales",
    management: true,
    storage,
  });
  assert.equal(overriddenRole, "manager");
  assert.equal(readPreferredWorkspaceRole(storage), "manager");
});

test("getRoleDashboardLayout, resolvePageForRole, and resolvePanelSpec map each role and /address endpoint to its dedicated panel and login screen", () => {
  const salesLayout = getRoleDashboardLayout("sales");
  assert.equal(salesLayout.defaultPage, "leads");
  assert.equal(salesLayout.defaultPillar, "sales");
  assert.equal(salesLayout.workspacePath, "/sales");
  assert.ok(salesLayout.allowedPages.includes("followups"));
  assert.ok(!salesLayout.allowedPages.includes("contracts"));

  const managerLayout = getRoleDashboardLayout("manager");
  assert.equal(managerLayout.defaultPage, "overview");
  assert.equal(managerLayout.defaultPillar, "command");
  assert.equal(managerLayout.workspacePath, "/management");
  assert.ok(managerLayout.allowedPages.includes("contracts"));
  assert.ok(managerLayout.allowedPages.includes("projects"));

  const financeLayout = getRoleDashboardLayout("finance_manager");
  assert.equal(financeLayout.defaultPage, "finance");
  assert.equal(financeLayout.defaultPillar, "operations");
  assert.equal(financeLayout.workspacePath, "/finance");

  // Every dedicated panel endpoint resolves its fixed role and separate login screen spec
  assert.equal(resolvePanelSpec("/ceo/").defaultRole, "ceo");
  assert.equal(resolvePanelSpec("/management/").defaultRole, "manager");
  assert.equal(resolvePanelSpec("/sales-leader/").defaultRole, "sales_leader");
  assert.equal(resolvePanelSpec("/sales/").defaultRole, "sales");
  assert.equal(resolvePanelSpec("/callcenter/").defaultRole, "callcenter");
  assert.equal(resolvePanelSpec("/finance/").defaultRole, "finance_manager");
  assert.equal(resolvePanelSpec("/marketing/").defaultRole, "marketing_manager");
  assert.equal(resolvePanelSpec("/engineering/").defaultRole, "architect");

  // Subdomain resolution works for standalone web / PC / Android / Xcode builds
  assert.equal(resolvePanelSpec("/", "sales.attaieproperties.com").panelId, "sales");
  assert.equal(resolvePanelSpec("/", "finance.attaieproperties.com").panelId, "finance");
  assert.ok(Object.keys(PANEL_SPECS).length >= 9);

  // When a Sales user is on a page they cannot access (e.g. "contracts"), resolvePageForRole redirects to a valid page
  assert.equal(resolvePageForRole("sales", "contracts", false), "overview");
  assert.equal(resolvePageForRole("sales", "overview", true), "leads");
  assert.equal(resolvePageForRole("manager", "contracts", false), "contracts");
  assert.equal(isValidWorkspaceRole("finance_manager"), true);
  assert.equal(mapStaffRoleToUnifiedLens("finance_manager"), "finance");
});

test("parseBiometricBridgeStatus and shouldAutoPromptBiometric validate native AndroidX Biometric state", () => {
  const unavail = parseBiometricBridgeStatus(null);
  assert.deepEqual(unavail, {
    available: false,
    enrolled: false,
    email: "",
    quickSignInEnabled: true,
    statusCode: -1,
  });

  const malformed = parseBiometricBridgeStatus("{bad-json");
  assert.equal(malformed.available, false);
  assert.equal(malformed.enrolled, false);

  const notEnrolled = parseBiometricBridgeStatus(
    JSON.stringify({ available: true, enrolled: false, email: "", statusCode: 0 }),
  );
  assert.equal(notEnrolled.available, true);
  assert.equal(notEnrolled.enrolled, false);
  assert.equal(notEnrolled.email, "");
  assert.equal(notEnrolled.statusCode, 0);

  const enrolled = parseBiometricBridgeStatus(
    JSON.stringify({
      available: true,
      enrolled: true,
      email: "  ahmad.sales@attaieproperties.com ",
      quickSignInEnabled: false,
      statusCode: 0,
    }),
  );
  assert.equal(enrolled.available, true);
  assert.equal(enrolled.enrolled, true);
  assert.equal(enrolled.email, "ahmad.sales@attaieproperties.com");
  assert.equal(enrolled.quickSignInEnabled, false);

  // Quick Sign-in preference defaults to true, persists false/true, and gates auto-prompt on launch
  const quickStorage = createMemoryStorage();
  assert.equal(readQuickSignInPreference(quickStorage), true);
  assert.equal(writeQuickSignInPreference(false, quickStorage), true);
  assert.equal(readQuickSignInPreference(quickStorage), false);
  assert.equal(
    shouldAutoPromptBiometric({
      available: true,
      enrolled: true,
      quickSignInEnabled: readQuickSignInPreference(quickStorage),
    }),
    false,
  );
  assert.equal(writeQuickSignInPreference(true, quickStorage), true);
  assert.equal(
    shouldAutoPromptBiometric({
      available: true,
      enrolled: true,
      quickSignInEnabled: readQuickSignInPreference(quickStorage),
    }),
    true,
  );

  // Auto-prompt fires on normal app launch when enrolled, suppressed right after sign-out or failure
  assert.equal(
    shouldAutoPromptBiometric({ available: true, enrolled: true }),
    true,
  );
  assert.equal(
    shouldAutoPromptBiometric({
      available: true,
      enrolled: true,
      justSignedOut: true,
    }),
    false,
  );
  assert.equal(
    shouldAutoPromptBiometric({
      available: true,
      enrolled: true,
      attemptFailed: true,
    }),
    false,
  );
});

