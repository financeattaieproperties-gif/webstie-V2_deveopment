import assert from 'node:assert/strict';
import {ACTIVE_INTERNAL_ROLES} from '../../../packages/staff-contracts/branch-policy.mjs';
import {startLeadFixture} from './lead-property-support.mjs';
const f=await startLeadFixture();let checks=0;
const check=(actual,expected,message)=>{checks++;assert.deepEqual(actual,expected,message);};
try {
 Object.assign(f.sessions,JSON.parse(f.fixture('branch-setup')).sessions);
 const roles={ceo:7,manager:6,callcenter:3,sales:1,sales_leader:11,marketing_manager:12,editor:13,videographer:14,finance_manager:15,architect:16,graphic_designer:17,visual_designer_3d:18};
 check(Object.keys(roles).sort(),[...ACTIVE_INTERNAL_ROLES].sort(),'Every active role must have explicit acceptance coverage');
 for (const [role,id] of Object.entries(roles)) {
   check((await f.request(id,'session')).data.user.role,role,`${role} session`);
   check((await f.request(id,'dashboard?view=tasks')).status,200,`${role} permitted own tasks`);
   check((await f.request(id,'branches')).data.map(b=>b.id),role==='ceo'?[1,2]:[1],`${role} branch scope`);
   check((await f.request(id,'finance/deposits',{action:'draft'})).status,role==='finance_manager'?404:403,`${role} cannot write finance without its role and a scoped contract`);
   if(role!=='ceo')check((await f.request(id,'staff',{name:'Forbidden role matrix',username:`denied-${role}@example.test`,firebaseUid:`denied-${role}`,role:'sales',branchId:1})).status,403,`${role} cannot provision`);
 }
 check((await f.request(19,'dashboard')).status,401,'Retired HR role cannot restore session');
 check((await f.request(20,'dashboard')).status,401,'Website Admin is not an internal role');
 check((await f.request(null,'dashboard')).status,401,'Anonymous requests denied');
 console.log(`${checks} real HTTP/MySQL acceptance assertions across all ${Object.keys(roles).length} active staff roles passed (fixture sessions; live Firebase remains a hosted check).`);
}finally{await f.close();}
