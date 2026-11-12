import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.resolve('releases/validation/completion-http');
const php=path.resolve('releases/validation/php/php.exe');
const args=['-d',`extension_dir=${path.resolve('releases/validation/php/ext')}`,'-d','extension=pdo_mysql','-d','extension=fileinfo'];
const setup=spawnSync(php,[...args,'staff-service/tests/completion-database.php'],{env:{...process.env,STAFF_LOCAL_TEST:'1',STAFF_COMPLETION_HTTP_DIR:dir},encoding:'utf8'});
assert.equal(setup.status,0,setup.stdout+setup.stderr);process.stdout.write(setup.stdout);
const fixture=JSON.parse(fs.readFileSync(path.join(dir,'fixture.json'),'utf8'));
const server=spawn(php,[...args,'-S','127.0.0.1:8898','-t','public','tests/staff/api/completion-router.php'],{env:{...process.env,STAFF_CONFIG_FILE:path.join(dir,'config.php')},stdio:['ignore','ignore','pipe']});
let logs='';server.stderr.on('data',x=>logs+=x);
const origin='http://127.0.0.1:8898';let checks=0;
const check=(actual,expected)=>{assert.equal(actual,expected);checks++;};
async function req(id,route,body,key=crypto.randomUUID()) {const s=fixture.sessions[id];const response=await fetch(`${origin}/staff-api/v1/${route}`,{method:body?'POST':'GET',headers:{Origin:origin,...(s?{Cookie:s.cookie,'X-CSRF-Token':s.csrf}:{}),...(body?{'Content-Type':'application/json','Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,json:await response.json()};}
try {
 for(let i=0;i<30;i++){try{await fetch(origin);break;}catch{await new Promise(r=>setTimeout(r,100));}}
 check((await req(3,'dashboard?view=finance')).status,200);
 check((await req(2,'dashboard?view=contracts')).status,200);
 check((await req(3,'dashboard?view=contracts')).status,403);
 check((await req(2,'finance/deposits',{action:'draft'})).status,403);
 check((await req(3,'inventory/projects',{})).status,403);
 const verification=await req(null,`hr/contracts/verify?token=${fixture.verificationToken}`);check(verification.status,200);check(Object.keys(verification.json.data).sort().join(','),'amendmentVersion,contractSerial,status');
 check((await req(null,'dashboard?view=finance')).status,401);
 check((await req(3,'dashboard?view=marketing')).status,403);
 const body={action:'draft',contractId:fixture.contractId,installmentId:1,amount:10,paymentMethod:'Cash',receiptNumber:'HTTP-FICTIONAL'};const key=crypto.randomUUID();
 const first=await req(3,'finance/deposits',body,key);check(first.status,200);const retry=await req(3,'finance/deposits',body,key);check(retry.json.data.id,first.json.data.id);
 check((await req(3,'finance/deposits',{...body,amount:11},key)).status,409);
 const deniedCsrf=await fetch(`${origin}/staff-api/v1/finance/deposits`,{method:'POST',headers:{Origin:origin,Cookie:fixture.sessions['3'].cookie,'Content-Type':'application/json','X-CSRF-Token':'wrong','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)});check(deniedCsrf.status,403);
 console.log(`${checks} real HTTP/session/CSRF/idempotency assertions passed.`);
} finally {server.kill();if(logs.includes('Fatal error'))process.stderr.write(logs);}
