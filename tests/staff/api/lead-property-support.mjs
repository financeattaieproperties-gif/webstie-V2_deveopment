import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';

export async function startLeadFixture() {
  const php=path.resolve('releases/validation/php/php.exe'),args=['-d',`extension_dir=${path.resolve('releases/validation/php/ext')}`,'-d','extension=pdo_mysql','-d','extension=fileinfo'];
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'attaie-lead-fixture-'));
  const database=`attaie_v2_test_${crypto.randomUUID().replaceAll('-','').slice(0,20)}`;
  const listener=net.createServer();await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
  const origin=`http://127.0.0.1:${port}`;
  const env={...process.env,STAFF_LOCAL_TEST:'1',STAFF_LEAD_TEST_DATABASE:database,STAFF_LEAD_TEST_DIR:dir,STAFF_LEAD_TEST_ORIGIN:origin};
  const fixture=action=>{const result=spawnSync(php,[...args,'staff-service/tests/lead-property-http-fixture.php',action],{env,encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);return result.stdout;};
  const {sessions}=JSON.parse(fixture('setup'));
  const server=spawn(php,[...args,'-S',`127.0.0.1:${port}`,'-t','public','tests/staff/api/completion-router.php'],{env:{...env,STAFF_CONFIG_FILE:path.join(dir,'config.php')},stdio:['ignore','ignore','pipe']});
  let logs='';server.stderr.on('data',chunk=>logs+=chunk);
  for(let i=0;i<50;i++){try{await fetch(origin);break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}if(i===49)throw new Error(logs);}
  const request=async(actor,route,body,key=crypto.randomUUID())=>{const session=sessions[actor];const response=await fetch(`${origin}/staff-api/v1/${route}`,{method:body?'POST':'GET',headers:{Origin:origin,...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{}),...(body?{'Content-Type':'application/json','Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});const json=await response.json();return {status:response.status,...json};};
  return {origin,dir,database,sessions,request,fixture,worker(actor,route,body,key=crypto.randomUUID()){
    return new Promise((resolve,reject)=>{const child=spawn(php,[...args,'staff-service/tests/lead-property-http-fixture.php','worker'],{env:{...env,STAFF_LEAD_TEST_ACTOR:String(actor),STAFF_LEAD_TEST_ROUTE:route,STAFF_LEAD_TEST_BODY:JSON.stringify(body),STAFF_LEAD_TEST_KEY:key}});let output='',errors='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>errors+=chunk);child.on('error',reject);child.on('exit',code=>{if(code!==0)return reject(new Error(output+errors));try{resolve(JSON.parse(output));}catch{reject(new Error(output+errors));}});});
  },async close(){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;fixture('drop');fs.rmSync(dir,{recursive:true,force:true});}};
}
