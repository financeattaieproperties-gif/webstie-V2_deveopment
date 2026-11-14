import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {startLeadFixture} from './lead-property-support.mjs';
const f=await startLeadFixture();
Object.assign(f.sessions,JSON.parse(f.fixture('branch-setup')).sessions);
f.fixture('work-lifecycle-setup');
after(async()=>{await f.close();});
const deactivate=async id=>{
 const session=f.sessions[7];const response=await fetch(`${f.origin}/staff-api/v1/staff/${id}`,{method:'PATCH',headers:{Origin:f.origin,Cookie:session.cookie,'X-CSRF-Token':session.csrf,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({active:false})});return {status:response.status,...await response.json()};
};
test('unfinished engineer, editor and videographer cannot deactivate or lose sessions',async()=>{
 for (const id of [16,13,14]) {
   const before=JSON.parse(f.fixture('counts'));
   assert.equal((await deactivate(id)).status,409,`Staff ${id} still has assigned work`);
   const session=await f.request(id,'session');assert.equal(session.data.user.active,true);assert.equal(session.data.user.version,1);
   assert.deepEqual(JSON.parse(f.fixture('counts')),before,'Denied lifecycle changes must not write audit or workflow records');
 }
});
test('engineer with latest version approved can transfer and old session expires',async()=>{
 const result=await f.request(7,'staff/17/branch',{branchId:2,version:1,resolutionNote:'All engineering work approved'});
 assert.equal(result.status,200,JSON.stringify(result));
 assert.equal((await f.request(17,'dashboard')).status,401);
});
test('newer unreviewed engineering version blocks transfer and deactivation',async()=>{
 const before=JSON.parse(f.fixture('counts'));
 assert.equal((await f.request(7,'staff/18/branch',{branchId:2,version:1,resolutionNote:'Must reject unreviewed latest version'})).status,409);
 assert.equal((await deactivate(18)).status,409);
 const session=await f.request(18,'session');assert.equal(session.data.user.branchId,1);assert.equal(session.data.user.active,true);assert.equal(session.data.user.version,1);
 assert.deepEqual(JSON.parse(f.fixture('counts')),before);
});
