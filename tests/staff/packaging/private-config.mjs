import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..');
const fixture=path.join(root,'staff-service/config/package-test-secret.php');
if(fs.existsSync(fixture))throw new Error('Refusing to overwrite an existing file.');
const output=path.join(root,'releases',`staff-package-privacy-${Date.now()}`);
try{
 fs.writeFileSync(fixture,"<?php return ['dummy_test_marker'=>'DO_NOT_PACKAGE_PRIVATE_CONFIG'];\n");
 const run=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','scripts/package-staff.ps1','-OutputDirectory',output,'-PhpExecutable',process.env.STAFF_PHP],{cwd:root,encoding:'utf8'});
 if(run.status!==0)throw new Error(run.stderr||run.stdout);
 assert.equal(fs.existsSync(path.join(output,'private-app/config/package-test-secret.php')),false,'Unallowlisted private configuration must not enter a release');
 assert.equal(fs.existsSync(path.join(output,'webroot/sales')),false);
 assert.equal(fs.existsSync(path.join(output,'webroot/api')),false);
 assert.ok(fs.existsSync(path.join(output,'private-setup/FIREBASE-SETUP.txt')));
 assert.ok(fs.existsSync(path.join(output,'database/001-core.sql')));
 assert.ok(fs.existsSync(path.join(output,'database/010-callcenter.sql')));
 assert.ok(fs.existsSync(path.join(output,'private-app/src/FirebaseAuth.php')));
 assert.equal(fs.existsSync(path.join(output,'webroot/FIREBASE-SETUP.txt')),false);
 assert.equal(fs.existsSync(path.join(output,'database/001-initial.sql')),false);
 console.log(`Private config packaging passed. Test package: ${output}`);
}finally{fs.unlinkSync(fixture);}
