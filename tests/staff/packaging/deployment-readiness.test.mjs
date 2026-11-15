import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('missing Firebase public configuration fails before creating a release', () => {
  const env={...process.env}; delete env.VITE_STAFF_FIREBASE_API_KEY;
  const result=spawnSync(process.execPath,['scripts/package-dashboard-completion.mjs'],{env,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/VITE_STAFF_FIREBASE_API_KEY/);
});

test('missing private role map fails before creating a release', () => {
  const env={...process.env,VITE_STAFF_FIREBASE_API_KEY:`AIza${'a'.repeat(35)}`};
  delete env.V2_TESTING_ROLE_MAP_FILE;
  const output=path.join(os.tmpdir(),`manual-staging-dashboard-completion-${Date.now()}`);
  const result=spawnSync(process.execPath,['scripts/package-dashboard-completion.mjs',output],{env,encoding:'utf8'});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/V2_TESTING_ROLE_MAP_FILE/);
  assert.equal(fs.existsSync(output),false);
});

test('deployment includes current schemas, private chat and manual onboarding', () => {
  const source=fs.readFileSync('scripts/package-dashboard-completion.mjs','utf8');
  for(const required of ['103-customer-property-leads.sql','105-submission-revisions-internal.sql','106-submission-revisions-third.sql','dist/chat-service.php','v2-cpanel-database-user-setup.md','create-website-admin-hash.py']) assert.ok(source.includes(required),required);
  assert.ok(!source.includes('ai-chat(?:/|$)|chat-service'));
  assert.match(source,/private\/chat/);
  assert.match(source,/mbstring/);
});
