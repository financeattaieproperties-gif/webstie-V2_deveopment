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
