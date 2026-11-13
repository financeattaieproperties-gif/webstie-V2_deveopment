import test from "node:test";
import assert from "node:assert/strict";
import {
  STAFF_PREFERRED_ROLE_KEY,
  UNIFIED_PREFERRED_ROLE_KEY,
  clearPreferredWorkspaceRole,
  getRoleDashboardLayout,
  isValidWorkspaceRole,
  mapStaffRoleToUnifiedLens,
  readPreferredWorkspaceRole,
  resolvePageForRole,
  resolveWorkspaceRoleOnSignIn,
  writePreferredWorkspaceRole,
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

test("getRoleDashboardLayout and resolvePageForRole map each role to its appropriate dashboard layout", () => {
  const salesLayout = getRoleDashboardLayout("sales");
  assert.equal(salesLayout.defaultPage, "leads");
  assert.equal(salesLayout.defaultPillar, "sales");
  assert.ok(salesLayout.allowedPages.includes("followups"));
  assert.ok(!salesLayout.allowedPages.includes("contracts"));

  const managerLayout = getRoleDashboardLayout("manager");
  assert.equal(managerLayout.defaultPage, "overview");
  assert.equal(managerLayout.defaultPillar, "command");
  assert.ok(managerLayout.allowedPages.includes("contracts"));
  assert.ok(managerLayout.allowedPages.includes("projects"));

  const financeLayout = getRoleDashboardLayout("finance_manager");
  assert.equal(financeLayout.defaultPage, "finance");
  assert.equal(financeLayout.defaultPillar, "operations");

  // When a Sales user is on a page they cannot access (e.g. "contracts"), resolvePageForRole redirects to a valid page
  assert.equal(resolvePageForRole("sales", "contracts", false), "overview");
  assert.equal(resolvePageForRole("sales", "overview", true), "leads");
  assert.equal(resolvePageForRole("manager", "contracts", false), "contracts");
  assert.equal(isValidWorkspaceRole("finance_manager"), true);
  assert.equal(mapStaffRoleToUnifiedLens("finance_manager"), "finance");
});
