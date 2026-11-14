import assert from 'node:assert/strict';
import {startLeadFixture} from './lead-property-support.mjs';
const site=await startLeadFixture();let checks=0;
const equal=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const body={phone:'0700000000',customerName:'Fictional shared customer',requirements:'Fictional requirement',property:{kind:'unit',id:1},nextScheduledAt:'2099-01-01T00:00:00Z'};
try {
  const key=crypto.randomUUID(),first=await site.request(1,'sales/leads',body,key);equal(first.status,200);
  equal(first.data.property,body.property);equal((await site.request(1,'sales/leads',body,key)).data.id,first.data.id);
  const before=site.fixture('counts');
  equal((await site.request(1,'sales/leads',body)).status,409);
  equal((await site.request(2,'sales/leads',{...body,phone:'+93 700 000 000'})).status,409);
  equal(site.fixture('counts'),before);
  const second=await site.request(1,'sales/leads',{...body,property:{kind:'unit',id:2}});equal(second.status,200);
  equal((await site.request(1,'sales/leads',{...body,property:{kind:'project',id:1}})).status,200);
  equal((await site.request(1,'sales/leads',{...body,projectId:2})).status,422);
  equal((await site.request(1,'sales/leads',{...body,property:{kind:'unit',id:4}})).status,404);
  site.fixture('close-first');equal((await site.request(2,'sales/leads',body)).status,409);
  site.fixture('closed-first');equal((await site.request(2,'sales/leads',body)).status,409);
  const hidden=await site.request(4,'sales/leads',body);equal(hidden.status,200);equal(hidden.data.duplicateConflict,true);equal('customerId' in hidden.data,false);
  const call=await site.request(3,'call-drafts',{phone:'0700000000',callAt:new Date(Date.now()-1000).toISOString()});equal(call.status,200);
  const submit={version:call.data.version,customerName:body.customerName,requirements:body.requirements,nextScheduledAt:body.nextScheduledAt};
  equal((await site.request(3,`leads/${call.data.id}/submit-entry`,submit)).status,422);
  const callBefore=site.fixture('counts');equal((await site.request(3,`leads/${call.data.id}/submit-entry`,{...submit,property:{kind:'unit',id:1}})).status,409);equal(site.fixture('counts'),callBefore);
  equal((await site.request(3,`leads/${call.data.id}`)).data.status,'draft');
  const changed=await site.request(1,`leads/${second.data.id}/property`,{version:second.data.version,property:{kind:'unit',id:3}});equal(changed.status,200);
  equal(changed.data.property,{kind:'unit',id:3});
  equal((await site.request(1,`leads/${second.data.id}/property`,{version:changed.data.version,property:{kind:'unit',id:1}})).status,409);
  equal((await site.request(1,`leads/${second.data.id}`)).data.property,{kind:'unit',id:3});
  // Closing a project-level interest cannot silently take an already claimed unit.
  const projectLead=await site.request(1,'sales/leads',{...body,property:{kind:'project',id:2}});equal(projectLead.status,200);
  const workspace=await site.request(1,'dashboard?view=followups');
  const task=workspace.data.followups.find(item=>item.leadId===projectLead.data.id);assert.ok(task);checks++;
  const closureBefore=site.fixture('counts');
  const closure=await site.request(1,`followups/${task.id}/feedback`,{version:task.version,outcome:'closed',amount:'1000',currency:'USD',projectId:2,apartmentId:3});
  equal(closure.status,409);equal(site.fixture('counts'),closureBefore);
  console.log(`${checks} real staff customer/property HTTP assertions passed.`);
}finally{await site.close();}
