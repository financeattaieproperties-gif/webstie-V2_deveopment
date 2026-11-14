import test from "node:test";
import assert from "node:assert/strict";
import {
  clearOfflineSnapshot,
  formatBatteryStatus,
  getOfflineSnapshotKey,
  isNetworkOfflineError,
  parseBatteryBridgePayload,
  readOfflineSnapshot,
  readOfflineViewData,
  writeOfflineSessionUser,
  writeOfflineViewData,
} from "../../../packages/staff-contracts/offline-cache.mjs";

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

test("isNetworkOfflineError separates network dropouts from HTTP 401/403/400 errors", () => {
  const netErr = Object.assign(new Error("Failed to fetch"), {
    isNetworkError: true,
  });
  assert.equal(isNetworkOfflineError(netErr, true), true);
  assert.equal(isNetworkOfflineError(new Error("TypeError: Load failed"), true), true);
  assert.equal(isNetworkOfflineError(null, false), true);

  const authErr = Object.assign(new Error("Session expired"), { status: 401 });
  assert.equal(isNetworkOfflineError(authErr, true), false);

  const validationErr = Object.assign(new Error("Invalid input"), { status: 400 });
  assert.equal(isNetworkOfflineError(validationErr, true), false);
});

test("offline cache persists Sales Agent session and leads, supports offline search, isolates users, and clears on sign-out", () => {
  const storage = createMemoryStorage();
  const salesUser = {
    id: 9,
    name: "Fictional Sales Agent",
    username: "sales9@example.invalid",
    role: "sales",
  };

  assert.equal(writeOfflineSessionUser("sales", salesUser, storage), true);
  const sampleLeadsPayload = {
    leads: [
      {
        id: 101,
        serial: "CA09-L1-141126",
        customerName: "Fictional Buyer Alpha",
        phone: "+93700112233",
        projectName: "Sample Residence",
        requirements: "3-bedroom apartment with parking",
        status: "active",
      },
      {
        id: 102,
        serial: "CA09-L2-141126",
        customerName: "Fictional Buyer Beta",
        phone: "+93788990011",
        projectName: "Sample Villa",
        requirements: "Commercial space ground floor",
        status: "draft",
      },
    ],
    followups: [],
    customers: [],
    tasks: [],
    counts: { newLeads: 1 },
    page: 0,
    serverTime: "2026-11-14T10:00:00.000Z",
  };

  // Should ignore searched/paginated responses so partial search never overwrites full lead list
  assert.equal(
    writeOfflineViewData("sales", "leads", sampleLeadsPayload, {
      query: "Alpha",
      page: 0,
      storage,
    }),
    false,
  );

  // Store clean full leads list
  assert.equal(
    writeOfflineViewData("sales", "leads", sampleLeadsPayload, {
      query: "",
      page: 0,
      storage,
    }),
    true,
  );

  // Reloading offline returns session user and full leads list
  const restored = readOfflineSnapshot("sales", storage);
  assert.equal(restored?.user?.username, "sales9@example.invalid");

  const fullOfflineLeads = readOfflineViewData("sales", "leads", "", storage);
  assert.equal(fullOfflineLeads?.data?.leads.length, 2);

  // Offline search filters cached leads accurately by name or phone
  const filteredByPhone = readOfflineViewData("sales", "leads", "788990011", storage);
  assert.equal(filteredByPhone?.data?.leads.length, 1);
  assert.equal(filteredByPhone?.data?.leads[0].customerName, "Fictional Buyer Beta");

  // Switching to a different user resets prior user's cached leads
  assert.equal(
    writeOfflineSessionUser(
      "sales",
      { id: 14, name: "Other Agent", username: "sales14@example.invalid", role: "sales" },
      storage,
    ),
    true,
  );
  assert.equal(readOfflineViewData("sales", "leads", "", storage), null);

  // Clear on sign out removes storage entry completely
  clearOfflineSnapshot("sales", storage);
  assert.equal(storage.getItem(getOfflineSnapshotKey("sales")), null);
  assert.equal(readOfflineSnapshot("sales", storage), null);
});

test("parseBatteryBridgePayload and formatBatteryStatus handle normal, low, critical, charging, and unavailable states", () => {
  assert.equal(parseBatteryBridgePayload(null).available, false);
  assert.equal(parseBatteryBridgePayload("{broken").available, false);

  const parsed = parseBatteryBridgePayload(
    JSON.stringify({ available: true, level: 0.724, charging: false }),
  );
  assert.equal(parsed.available, true);
  assert.equal(parsed.charging, false);

  const normal = formatBatteryStatus(parsed);
  assert.equal(normal.visible, true);
  assert.equal(normal.percent, 72);
  assert.equal(normal.text, "72%");
  assert.equal(normal.tone, "normal");

  const low = formatBatteryStatus({ available: true, level: 0.22, charging: false });
  assert.equal(low.tone, "low");
  assert.equal(low.text, "22%");

  const critical = formatBatteryStatus({ available: true, level: 0.12, charging: false });
  assert.equal(critical.tone, "critical");
  assert.equal(critical.text, "12%");

  const charging = formatBatteryStatus({ available: true, level: 0.14, charging: true });
  assert.equal(charging.tone, "charging");
  assert.equal(charging.accessibleLabel, "Battery 14%, charging");

  const unavailable = formatBatteryStatus({ available: false });
  assert.equal(unavailable.visible, false);
});

