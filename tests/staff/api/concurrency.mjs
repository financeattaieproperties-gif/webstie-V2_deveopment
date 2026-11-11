import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
const php=process.env.STAFF_PHP;
const env={...process.env,STAFF_LOCAL_TEST:'1'};
const tokens=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'attaie-staff-v2-test/tokens.json'),'utf8'));
const base='http://127.0.0.1:8891/staff-api/v1/';
let cookie='',csrf='';
async function send(route,method='GET',body){const res=await fetch(base+route,{method,headers:{Origin:'http://127.0.0.1:5175',Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':csrf,'Idempotency-Key':crypto.randomUUID()},...(body?{body:JSON.stringify(body)}:{})});for(const item of res.headers.getSetCookie())cookie=item.split(';')[0];return {status:res.status,body:await res.json()};}
csrf=(await send('session')).body.data.csrfToken;
csrf=(await send('auth/login','POST',{idToken:tokens.owner})).body.data.csrfToken;
async function race(mode,request,expected){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'attaie-staff-lock-'));
 const child=spawn(php,['-n','-d','extension_dir="C:/Users/RoheenAhmadi/AppData/Local/Temp/attaie-staff-php84/ext"','-d','extension=pdo_mysql','staff-service/tests/lock-user.php',mode,dir],{env,stdio:['ignore','pipe','pipe']});let output='';child.stderr.on('data',x=>output+=x);
 const done=new Promise((resolve,reject)=>child.on('exit',code=>code===0?resolve():reject(new Error(output))));
 const start=Date.now();while(!fs.existsSync(path.join(dir,'ready'))){if(Date.now()-start>10000)throw new Error('Fixture lock not acquired');await new Promise(r=>setTimeout(r,20));}
 const response=request();await new Promise(r=>setTimeout(r,200));fs.writeFileSync(path.join(dir,'release'),'1');
 const result=await response;await done;assert.equal(result.status,expected,JSON.stringify(result.body));
}
await race('deactivate',()=>send('tasks','POST',{title:'Should not assign',instructions:'Inactive recipient fixture.',priority:'normal',assigneeId:4,deadlineAt:'2099-01-01T00:00:00Z'}),422);
assert.equal(spawnSync(php,['-n','-d','extension_dir="C:/Users/RoheenAhmadi/AppData/Local/Temp/attaie-staff-php84/ext"','-d','extension=pdo_mysql','staff-service/tests/lock-user.php','reset'],{env}).status,0);
await race('assign',()=>send('staff/4','PATCH',{active:false}),409);
assert.equal(spawnSync(php,['-n','-d','extension_dir="C:/Users/RoheenAhmadi/AppData/Local/Temp/attaie-staff-php84/ext"','-d','extension=pdo_mysql','staff-service/tests/lock-user.php','reset'],{env}).status,0);
console.log('Two-connection lock tests passed: deactivation prevents assignment; committed assignment prevents deactivation.');
