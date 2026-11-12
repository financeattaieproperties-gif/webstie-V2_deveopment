import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('completion delivery supplies website publication ledger and isolated asset upgrade', () => {
  const script = fs.readFileSync('scripts/package-dashboard-completion.mjs', 'utf8');
  assert.match(script, /read\('staff-service\/database\/102-website-submission-map\.sql'\)/,
    'Fresh website schema must include the retry ledger used by publishing');
  assert.match(script, /database\/upgrade\/website\/102-website-submission-map\.sql/);
  assert.match(script, /database\/upgrade\/submissions\/101-submission-assets\.sql/);
  assert.doesNotMatch(script, /No website\/submission upgrade is required/);
});

test('consolidated V2 schema carries Phase 7 canonical roles and branch boundaries', () => {
  const sql = fs.readFileSync('deployment/v2/complete-v2-mysql-schema.sql', 'utf8');
  assert.match(sql, /core_branch_managers/);
  assert.match(sql, /manager_user_id[\s\S]*UNIQUE/);
  assert.match(sql, /origin_branch_id/);
  assert.match(sql, /\('core',3,UTC_TIMESTAMP\(\)\)/);
  assert.match(sql, /\('ceo','management','CEO'\)/);
  assert.match(sql, /\('manager','management','Manager'\)/);
  assert.doesNotMatch(sql, /\('hr_manager',/);
  assert.doesNotMatch(sql, /\('branch_manager',/);
  assert.doesNotMatch(sql, /\('assistant_manager',/);
});
