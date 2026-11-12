import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACTIVE_INTERNAL_ROLES,
  RETIRED_INTERNAL_ROLES,
  canProvisionRole,
  canReadBranch,
  isGlobalRole,
  requiresBranch,
  validateBranchAssignment,
} from '../../../packages/staff-contracts/branch-policy.mjs';

const activeRoles = [
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

test('canonical role catalog exposes only approved internal CRM roles', () => {
  assert.deepEqual([...ACTIVE_INTERNAL_ROLES], activeRoles);
  for (const role of ['admin', 'hr_manager', 'branch_manager', 'assistant_manager']) {
    assert.equal(ACTIVE_INTERNAL_ROLES.includes(role), false, role);
    assert.equal(RETIRED_INTERNAL_ROLES.includes(role), true, role);
  }
});

test('CEO is the only global role and every active non-CEO role requires a branch', () => {
  assert.equal(isGlobalRole('ceo'), true);
  assert.equal(requiresBranch('ceo'), false);
  for (const role of activeRoles.filter((role) => role !== 'ceo')) {
    assert.equal(isGlobalRole(role), false, role);
    assert.equal(requiresBranch(role), true, role);
  }
  for (const retiredRole of ['admin', 'hr_manager', 'branch_manager', 'assistant_manager']) {
    assert.equal(isGlobalRole(retiredRole), false, retiredRole);
    assert.equal(requiresBranch(retiredRole), false, retiredRole);
  }
});

test('CEO can provision Manager and ordinary staff but no CEO, Admin, or retired role', () => {
  assert.equal(canProvisionRole('ceo', 'manager'), true);
  assert.equal(canProvisionRole('ceo', 'sales'), true);
  assert.equal(canProvisionRole('ceo', 'ceo'), false);
  assert.equal(canProvisionRole('ceo', 'admin'), false);
  assert.equal(canProvisionRole('ceo', 'hr_manager'), false);
  assert.equal(canProvisionRole('manager', 'sales'), false);
  assert.equal(canProvisionRole('admin', 'sales'), false);
});

test('branch reads are global for CEO and exact-match for active branch staff', () => {
  assert.equal(canReadBranch({ role: 'ceo', branchId: null, active: true }, 9), true);
  assert.equal(canReadBranch({ role: 'manager', branchId: 9, active: true }, 9), true);
  assert.equal(canReadBranch({ role: 'manager', branchId: 9, active: true }, 10), false);
  assert.equal(canReadBranch({ role: 'sales', branchId: 9, active: false }, 9), false);
  assert.equal(canReadBranch({ role: 'sales', branchId: null, active: true }, 9), false);
  assert.equal(canReadBranch({ role: 'branch_manager', branchId: 9, active: true }, 9), false);
});

test('branch assignment validation rejects CEO branches, missing branches, and inactive branches', () => {
  assert.deepEqual(
    validateBranchAssignment({ role: 'ceo', branchId: null, branchActive: false }),
    { role: 'ceo', branchId: null },
  );
  assert.deepEqual(
    validateBranchAssignment({ role: 'manager', branchId: 4, branchActive: true }),
    { role: 'manager', branchId: 4 },
  );
  assert.throws(
    () => validateBranchAssignment({ role: 'ceo', branchId: 4, branchActive: true }),
    /CEO cannot belong to a branch/,
  );
  assert.throws(
    () => validateBranchAssignment({ role: 'sales', branchId: null, branchActive: true }),
    /active branch/,
  );
  assert.throws(
    () => validateBranchAssignment({ role: 'sales', branchId: 4, branchActive: false }),
    /active branch/,
  );
  assert.throws(
    () => validateBranchAssignment({ role: 'admin', branchId: 4, branchActive: true }),
    /active internal role/,
  );
});
