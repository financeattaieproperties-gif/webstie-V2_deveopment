import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('branch upgrade uses portable MySQL/MariaDB column guards',()=>{
 const sql=fs.readFileSync('staff-service/database/110-ceo-manager-branch-model.sql','utf8');
 assert.doesNotMatch(sql,/ADD COLUMN IF NOT EXISTS/i);
 assert.match(sql,/information_schema\.COLUMNS/);
});
test('branch migration preserves identities and only remaps legacy roles once',()=>{
 const php=path.resolve('releases/validation/php/php.exe');
 const result=spawnSync(php,['-d',`extension_dir=${path.resolve('releases/validation/php/ext')}`,'-d','extension=pdo_mysql','staff-service/tests/branch-migration.php'],{env:{...process.env,STAFF_LOCAL_TEST:'1'},encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
});
