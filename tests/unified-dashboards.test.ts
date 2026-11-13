import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIFIED_METRICS,
  UNIFIED_MODULE_DESCRIPTIONS,
  UNIFIED_NAV_GROUPS,
  UNIFIED_PIPELINE_STAGES,
  UNIFIED_RECORDS,
  filterUnifiedRecords,
  getDefaultModuleForRoleLens,
  getUnifiedModuleById,
  readPreferredRoleLens,
  readPreferredWorkspaceRole,
  readSidebarCompactPreference,
  toggleSidebarCompactPreference,
  writePreferredRoleLens,
  writePreferredWorkspaceRole,
  writeSidebarCompactPreference,
  type SidebarStorageLike,
  type UnifiedDashboardModuleId,
} from '../src/components/ui/unified-dashboards/unifiedData';

test('unified dashboard navigation includes all Admin CRM and Staff Workspace modules', () => {
  const allIds = UNIFIED_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id));
  const expected: UnifiedDashboardModuleId[] = [
    'overview',
    'properties',
    'projects',
    'leads',
    'followups',
    'visits',
    'chat',
    'contracts',
    'finance',
    'marketing',
    'engineering',
    'team',
    'seo',
  ];

  for (const id of expected) {
    assert.ok(allIds.includes(id), `Expected module "${id}" in unified nav groups`);
    assert.ok(UNIFIED_MODULE_DESCRIPTIONS[id], `Expected description for "${id}"`);
    assert.ok(getUnifiedModuleById(id), `Expected lookup for "${id}"`);
  }
});

test('unified pipeline stages sum to 100% and match total leads count', () => {
  const totalPct = UNIFIED_PIPELINE_STAGES.reduce((acc, s) => acc + s.pct, 0);
  const totalCount = UNIFIED_PIPELINE_STAGES.reduce((acc, s) => acc + s.count, 0);
  assert.equal(totalPct, 100);
  assert.equal(totalCount, 48);
  assert.ok(UNIFIED_METRICS.length === 4);
});

test('filterUnifiedRecords filters by department module, status, and search query', () => {
  const all = filterUnifiedRecords(UNIFIED_RECORDS, 'overview', '', 'All');
  assert.equal(all.length, UNIFIED_RECORDS.length);

  const financeOnly = filterUnifiedRecords(UNIFIED_RECORDS, 'finance', '', 'All');
  assert.ok(financeOnly.length >= 1);
  assert.ok(financeOnly.every((r) => r.department === 'finance'));

  const needsReview = filterUnifiedRecords(UNIFIED_RECORDS, 'overview', '', 'Needs Review');
  assert.ok(needsReview.length >= 1);
  assert.ok(needsReview.every((r) => r.status === 'Needs Review'));

  const byReference = filterUnifiedRecords(UNIFIED_RECORDS, 'overview', 'SUB-1765', 'All');
  assert.equal(byReference.length, 1);
  assert.equal(byReference[0].department, 'marketing');
});

test('sidebar compact preference helpers persist expanded/compact state safely', () => {
  const store = new Map<string, string>();
  const memoryStorage: SidebarStorageLike = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };

  // Defaults to full expanded view when unset
  assert.equal(readSidebarCompactPreference(memoryStorage), false);

  // Toggle switches to icon-only compact view and persists across reads
  const compactState = toggleSidebarCompactPreference(false, memoryStorage);
  assert.equal(compactState, true);
  assert.equal(readSidebarCompactPreference(memoryStorage), true);

  // Toggle again returns to full expanded view and persists
  const expandedState = toggleSidebarCompactPreference(compactState, memoryStorage);
  assert.equal(expandedState, false);
  assert.equal(readSidebarCompactPreference(memoryStorage), false);

  // Explicit write and fallback when storage throws
  writeSidebarCompactPreference(true, memoryStorage);
  assert.equal(readSidebarCompactPreference(memoryStorage), true);

  const throwingStorage: SidebarStorageLike = {
    getItem: () => {
      throw new Error('storage blocked');
    },
    setItem: () => {
      throw new Error('storage blocked');
    },
  };
  assert.equal(readSidebarCompactPreference(throwingStorage), false);
  assert.equal(toggleSidebarCompactPreference(false, throwingStorage), true);
});

test('preferred workspace role persistence syncs between Staff CRM and Unified Dashboard across sessions', () => {
  const store = new Map<string, string>();
  const memoryStorage: SidebarStorageLike = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };

  assert.equal(readPreferredWorkspaceRole(memoryStorage), null);
  assert.equal(readPreferredRoleLens(memoryStorage), 'all');

  // Selecting Sales in Staff CRM persists 'sales' and maps to 'sales' lens -> Leads Pipeline
  assert.equal(writePreferredWorkspaceRole('sales', memoryStorage), true);
  assert.equal(readPreferredWorkspaceRole(memoryStorage), 'sales');
  assert.equal(readPreferredRoleLens(memoryStorage), 'sales');
  assert.deepEqual(getDefaultModuleForRoleLens('sales'), {
    groupId: 'sales-crm',
    moduleId: 'leads',
  });

  // Selecting Manager lens in Unified Dashboard persists 'manager' -> Pre-Sale Projects
  assert.equal(writePreferredRoleLens('manager', memoryStorage), true);
  assert.equal(readPreferredRoleLens(memoryStorage), 'manager');
  assert.equal(readPreferredWorkspaceRole(memoryStorage), 'manager');
  assert.deepEqual(getDefaultModuleForRoleLens('manager'), {
    groupId: 'command',
    moduleId: 'projects',
  });
});


