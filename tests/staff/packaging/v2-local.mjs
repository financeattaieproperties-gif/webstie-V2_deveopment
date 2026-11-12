import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';

const [release, php] = process.argv.slice(2);
assert.ok(release && php, 'Usage: node tests/staff/packaging/v2-local.mjs RELEASE PHP');
const setup = spawnSync(php, ['tests/staff/packaging/setup-v2-local.php', release], {
  encoding: 'utf8', env: {...process.env, STAFF_LOCAL_TEST: '1'},
});
assert.equal(setup.status, 0, setup.stderr || setup.stdout);
const fixture = JSON.parse(setup.stdout);
const server = spawn(php, ['-d','extension=mysqli','-d','extension=curl','-S','127.0.0.1:8893','-t',fixture.directory+'/webroot',fixture.directory+'/router.php'], {stdio:'ignore'});
const base = 'http://127.0.0.1:8893';
let checks = fixture.checks;
const check = (value, expected) => {assert.deepEqual(value, expected); checks++;};
try {
  let ready = false;
  for(let i=0;i<40;i++) {
    try {if((await fetch(base+'/index.html')).ok) {ready=true;break;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready, 'Local PHP server did not start.');
  for(const file of ['/index.html','/admin/','/callcenter/','/management/']) check((await fetch(base+file)).status,200);
  const projects = await (await fetch(base+'/api/get-projects.php')).json();
  const rows = Array.isArray(projects) ? projects : projects.projects ?? projects.data;
  check(rows.length,0);
  for(const id of [1,2,3,4,5]) check((await fetch(base+'/api/get-project.php?id='+id)).status,404);
  check((await fetch(base+'/api/admin/properties.php')).status,401);
  check((await fetch(base+'/staff-api/v1/dashboard')).status,401);
  const loginText=fs.readFileSync(path.join(release,'private-setup/WEBSITE-ADMIN-LOGIN-PRIVATE.txt'),'utf8');
  const password=loginText.match(/^Password: (.+)$/m)[1].trim();
  const login=await fetch(base+'/api/admin-login.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'owner',password})});
  check(login.status,200);
  const cookie=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
  check((await login.json()).success,true);
  check((await fetch(base+'/api/admin/properties.php',{headers:{Cookie:cookie}})).status,200);
  check((await fetch(base+'/staff-api/v1/dashboard',{headers:{Cookie:cookie}})).status,401);
  const session=await fetch(base+'/staff-api/v1/session');
  check(session.status,200);
  check(session.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  const data=await session.json();
  check(Boolean(data.data.csrfToken),true);
  console.log(`Packaged local V2 checks passed: ${checks}; NEW fictional database ${fixture.database}.`);
  console.log('Verified SQL imports, CEO mapping, matching private admin password, empty project catalog, static shells, API access and admin/staff session isolation.');
  console.log('Local PHP server stopped; fixture database retained. Apache/Firebase/hosting checks remain manual.');
} finally {server.kill();}
