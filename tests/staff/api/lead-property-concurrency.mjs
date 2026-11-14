import assert from 'node:assert/strict';
import {startLeadFixture} from './lead-property-support.mjs';
const site=await startLeadFixture();let checks=0;
const equal=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const body={phone:'0700000000',customerName:'Fictional shared customer',requirements:'Fictional race',property:{kind:'unit',id:1},nextScheduledAt:'2099-01-01T00:00:00Z'};
try{
  const keys=[crypto.randomUUID(),crypto.randomUUID()];
  const result=await Promise.all([site.worker(1,'sales/leads',body,keys[0]),site.worker(2,'sales/leads',body,keys[1])]);
  equal(result.map(row=>row.status).sort(),[200,409]);
  const winner=result.findIndex(row=>row.status===200);
  equal((await site.worker(winner+1,'sales/leads',body,keys[winner])).data.id,result[winner].data.id);
  const counts=JSON.parse(site.fixture('counts'));equal(counts.cc_leads,1);equal(counts.cc_followup_tasks,1);equal(counts.crm_customer_property_leads,1);
  const draft=await site.request(3,'call-drafts',{phone:'0700000000',callAt:new Date(Date.now()-1000).toISOString()});equal(draft.status,200);
  const activation={version:draft.data.version,customerName:body.customerName,requirements:body.requirements,property:{kind:'unit',id:2},nextScheduledAt:body.nextScheduledAt};
  const qualified=await Promise.all([site.worker(3,`leads/${draft.data.id}/submit-entry`,activation),site.worker(2,'sales/leads',{...body,property:{kind:'unit',id:2}})]);
  equal(qualified.map(row=>row.status).sort(),[200,409]);
  equal(JSON.parse(site.fixture('counts')).qualified_leads,2);
  equal(JSON.parse(site.fixture('counts')).cc_followup_tasks,2);
  const independent=await Promise.all([site.worker(1,'sales/leads',{...body,phone:'0700000001',property:{kind:'unit',id:3}}),site.worker(2,'sales/leads',{...body,phone:'0700000002',property:{kind:'unit',id:3}})]);
  equal(independent.map(row=>row.status),[200,200]);
  console.log(`${checks} separate-connection staff lead race assertions passed.`);
}finally{await site.close();}
