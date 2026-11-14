import assert from 'node:assert/strict';
import {startWebsiteFixture} from './support/server.mjs';

const site = await startWebsiteFixture();
let checks = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const post = async body => {
  const response = await fetch(`${site.origin}/api/submit-lead.php`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
  });
  return {status:response.status, data:await response.json()};
};
try {
  const body = {name:'Fictional Customer', email:'fixture@example.test', phone:'0700000000', message:'Fixture only', propertyId:'fixture-1', propertyName:'Fictional property', clientRequestId:crypto.randomUUID()};
  const first = await post(body);
  equal(first.status, 200);
  assert.ok(first.data.receipt?.reference, 'Committed inquiry must return a receipt'); checks++;
  equal(first.data.receipt.customerName, body.name);
  equal(first.data.receipt.propertyName, body.propertyName);
  assert.match(first.data.receipt.reference, /^INQ-[A-F0-9]{32}$/); checks++;
  assert.ok(Number.isFinite(Date.parse(first.data.receipt.submittedAt))); checks++;
  equal(await post(body), first);
  equal(site.fixture('count'), '1');
  equal((await post({...body, message:'Changed payload'})).status, 409);
  equal(site.fixture('count'), '1');
  const raceBody = {...body, clientRequestId:crypto.randomUUID()};
  const racing = await Promise.all(Array.from({length:6}, () => post(raceBody)));
  racing.forEach(result => equal(result, racing[0]));
  equal(site.fixture('count'), '2');
  // Drop the response at the transport boundary after the server committed the request.
  const lostBody = {...body, clientRequestId:crypto.randomUUID()};
  const lost = await fetch(`${site.origin}/api/submit-lead.php`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(lostBody)});
  await lost.body.cancel();
  const recovered = await post(lostBody);
  equal(recovered.status, 200); equal(await post(lostBody), recovered); equal(site.fixture('count'), '3');
  for (const invalid of [{name:''}, {email:'invalid'}, {phone:[]}, {clientRequestId:'not-a-uuid'}, {name:'x'.repeat(256)}]) {
    equal((await post({...body, ...invalid})).status, 422);
  }
  equal(site.fixture('count'), '3');
  const {clientRequestId, ...legacy} = body;
  equal((await post(legacy)).status, 200); equal(site.fixture('count'), '4');
  equal(await post({...body, name:` ${body.name} `}), first);
  const concurrentBody = {...body, clientRequestId:crypto.randomUUID()};
  const connections = await Promise.all(Array.from({length:8}, () => site.race(concurrentBody)));
  connections.forEach(result => equal(result, connections[0]));
  equal(site.fixture('count'), '5');
  equal(JSON.parse(site.fixture('upgrade')), {name:'Legacy fixture', stage:'Contacted', status:'Existing', receipt_reference:null, client_request_id:null, followup_status:'new', version:'1'});
  const fresh = await post({...body, clientRequestId:crypto.randomUUID()}); equal(fresh.status, 200);
  const login = await fetch(`${site.origin}/api/admin-login.php`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'choose_a_strong_password'})});
  equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const csrf=(await login.json()).csrf_token;
  const followup={id:fresh.data.id,version:1,status:'in_progress',notes:'Fictional follow-up note',followupAt:'2099-01-01T12:30:00Z'};
  const admin = async (method, payload, headers={Cookie:cookie,'X-CSRF-Token':csrf}, query='') => {
    const response=await fetch(`${site.origin}/api/admin/leads.php${query}`,{method,headers:{'Content-Type':'application/json',...headers},...(payload?{body:JSON.stringify(payload)}:{})});
    return {status:response.status,data:await response.json()};
  };
  equal((await admin('GET',null,{})).status,401);
  equal((await admin('PUT',followup,{})).status,401);
  equal((await admin('PUT',followup,{Cookie:'attaie_staff_session=fictional','Authorization':'Bearer fictional-firebase-token'})).status,401);
  equal((await admin('PUT',followup,{Cookie:cookie})).status,403);
  const updated=await admin('PUT',followup);equal(updated.status,200);
  equal(updated.data.followup_status,'in_progress');equal(Number(updated.data.version),2);
  equal(updated.data.followup_notes,followup.notes);equal(updated.data.followup_at,'2099-01-01 12:30:00');
  equal((await admin('PUT',followup)).status,409);
  equal((await admin('PUT',{...followup,version:2,status:'invalid'})).status,422);
  equal((await admin('PUT',{...followup,version:2,followupAt:'not-a-date'})).status,422);
  const events=JSON.parse(site.fixture('events'));equal(events.length,1);equal(events[0].previous_status,'new');equal(events[0].next_status,'in_progress');equal(events[0].notes,followup.notes);
  const search=await admin('GET',null,undefined,`?search=${fresh.data.receipt.reference}`);
  equal(search.status,200);equal(search.data.length,1);equal(Number(search.data[0].id),fresh.data.id);
  equal(search.data[0].followup_notes,followup.notes);
  equal(search.data[0].version,2);equal(search.data[0].id,fresh.data.id);
  equal(search.data[0].stage,'New');equal(search.data[0].status,'Pending');
  const legacyRead=await admin('GET',null,undefined,'?search=Legacy%20fixture');
  equal(legacyRead.data.length,1);equal(legacyRead.data[0].receipt_reference,null);
  console.log(`${checks} website inquiry HTTP/MySQL assertions passed (${site.database}).`);
} finally { await site.close(); }
