import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const tokens=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'attaie-staff-v2-test/tokens.json'),'utf8'));
async function account(username='agent') {
 let cookie='',csrf='';
 const send=async(route,method='GET',body)=>{
  const response=await fetch(`http://127.0.0.1:8891/staff-api/v1/${route}`,{method,headers:{Origin:'http://127.0.0.1:5175',Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':csrf,'Idempotency-Key':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});
  for(const item of response.headers.getSetCookie())cookie=item.split(';')[0];
  const payload=await response.json();if(payload.data?.csrfToken)csrf=payload.data.csrfToken;
  return {status:response.status,...payload};
 };
 await send('session');assert.equal((await send('auth/login','POST',{idToken:tokens[username]})).status,200);return send;
}
test('failed Firebase authentication removes previous app identity',async()=>{
 const send=await account(); assert.equal((await send('auth/login','POST',{idToken:'invalid'})).status,401);
 assert.equal((await send('session')).data.user,null);
 assert.equal((await send('dashboard')).status,401);
});
test('POST using an ended session returns unauthenticated instead of CSRF failure',async()=>{
 const send=await account();assert.equal((await send('auth/logout','POST',{})).status,200);
 assert.equal((await send('auth/logout','POST',{})).status,401);
});
test('revoking MySQL permissions removes access on existing Firebase sessions',async()=>{
 const php=process.env.STAFF_PHP;
 assert.ok(php,'Set STAFF_PHP for isolated permission fixture checks.');
 const database=code=>execFileSync(php,['-n','-d',`extension_dir="${path.join(path.dirname(php),'ext').replaceAll('\\','/')}"`,'-d','extension=pdo_mysql','-r',`$c=require sys_get_temp_dir().'/attaie-staff-v2-test/config.php'; $db=new PDO($c['dsn'],$c['database_user'],$c['database_password']); ${code}`]);
 const change=(role,permission,remove)=>database(`$db->prepare('${remove?'DELETE FROM core_role_permissions WHERE role_code=? AND permission_code=?':'INSERT IGNORE INTO core_role_permissions(role_code,permission_code) VALUES (?,?)'}')->execute(['${role}','${permission}']);`);
 const agent=await account(),owner=await account('owner');
 try {
  change('callcenter','core.tasks.read_own',true);
  assert.equal((await agent('dashboard?view=tasks')).status,403);
  assert.equal((await agent('tasks/1','PATCH',{status:'completed',version:1})).status,403);
  change('ceo','core.staff.manage',true);
  assert.equal((await owner('staff')).status,403);
  assert.equal((await owner('staff/4','PATCH',{active:false})).status,403);
  change('ceo','callcenter.manage',true);
  assert.equal((await owner('leads/1')).status,404);
 } finally {
  change('callcenter','core.tasks.read_own',false);change('ceo','core.staff.manage',false);change('ceo','callcenter.manage',false);
 }
});
