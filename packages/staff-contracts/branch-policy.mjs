export const ACTIVE_INTERNAL_ROLES = Object.freeze([
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
]);

export const RETIRED_INTERNAL_ROLES = Object.freeze([
  'admin',
  'hr_manager',
  'branch_manager',
  'assistant_manager',
  'production_manager',
  'photographer',
  'customer',
  'finance_assistant',
]);

const activeRoleSet = new Set(ACTIVE_INTERNAL_ROLES);

export function isGlobalRole(role) {
  return role === 'ceo';
}

export function requiresBranch(role) {
  return activeRoleSet.has(role) && !isGlobalRole(role);
}

export function canProvisionRole(actorRole, targetRole) {
  return actorRole === 'ceo' && targetRole !== 'ceo' && requiresBranch(targetRole);
}

export function canReadBranch(actor, branchId) {
  if (!actor?.active || !activeRoleSet.has(actor.role)) return false;
  if (!Number.isSafeInteger(branchId) || branchId < 1) return false;
  if (isGlobalRole(actor.role)) return true;
  return Number.isSafeInteger(actor.branchId) && actor.branchId === branchId;
}

export function validateBranchAssignment({ role, branchId, branchActive }) {
  if (!activeRoleSet.has(role)) {
    throw new Error('Select an active internal role.');
  }
  if (isGlobalRole(role)) {
    if (branchId !== null && branchId !== undefined) {
      throw new Error('CEO cannot belong to a branch.');
    }
    return { role, branchId: null };
  }
  if (!Number.isSafeInteger(branchId) || branchId < 1 || branchActive !== true) {
    throw new Error('Every active staff account requires one active branch.');
  }
  return { role, branchId };
}
