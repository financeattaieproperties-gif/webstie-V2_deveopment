import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {startWebsiteFixture} from './support/server.mjs';

const site=await startWebsiteFixture();let checks=0;
const equal=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
const id=`chat_${crypto.randomUUID()}`;
const message={session_id:id,customer_name:'Fictional Chat Customer',customer_phone:'0700000000',message:'Fictional customer message',client_message_id:crypto.randomUUID()};
async function chat(action,body,headers={}) {
  const response=await fetch(`${site.origin}/chat-service.php?action=${action}${body?'':`&session_id=${id}`}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();let data;try{data=JSON.parse(text);}catch{throw new Error(`Non-JSON chat response ${response.status}: ${text.slice(0,300)}`);}
  return {status:response.status,data};
}
try {
  const first=await chat('customer_message',message,{'X-Chat-Token':token});equal(first.status,200);
  const replay=await chat('customer_message',message,{'X-Chat-Token':token});equal(replay,first);
  equal(first.data.conversation.messages[0].delivery_status,'confirmed');
  equal((await chat('customer_message',{...message,message:'Changed'}, {'X-Chat-Token':token})).status,409);
  equal((await chat('thread')).status,403);
  equal((await chat('thread',null,{'X-Chat-Token':'a'.repeat(64)})).status,403);
  equal((await chat('thread',null,{'X-Chat-Token':token})).data.conversation.messages.length,1);
  for(const action of ['typing','customer_mark_read','customer_message']) {
    equal((await chat(action,{...message,actor:'customer',client_message_id:crypto.randomUUID()})).status,403);
  }
  equal((await chat('admin_list')).status,401);
  equal((await chat('admin_list',null,{Cookie:'attaie_staff_session=fictional',Authorization:'Bearer fictional-firebase-token'})).status,401);
  const login=await fetch(`${site.origin}/api/admin-login.php`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'choose_a_strong_password'})});
  const cookie=login.headers.get('set-cookie').split(';')[0],csrf=(await login.json()).csrf_token;
  const adminHeaders={Cookie:cookie,'X-CSRF-Token':csrf};
  equal((await chat('admin_list',null,adminHeaders)).data.conversations.length,1);
  const reply={session_id:id,message:'Fictional Admin reply',client_message_id:crypto.randomUUID()};
  equal((await chat('admin_reply',reply,{Cookie:cookie})).status,403);
  const replied=await chat('admin_reply',reply,adminHeaders);equal(replied.status,200);
  equal(await chat('admin_reply',reply,adminHeaders),replied);
  equal(replied.data.conversation.messages.length,2);
  const fetched=await chat('thread',null,{'X-Chat-Token':token});equal(fetched.data.conversation.messages[1].text,reply.message);
  equal('owner_token_hash' in fetched.data.conversation,false);
  equal((await chat('customer_mark_read',{session_id:id},{'X-Chat-Token':token})).status,200);
  equal((await chat('thread',null,{'X-Chat-Token':token})).data.conversation.messages[1].read_status,'read');
  equal(site.fixture('count'),'0');
  assert.ok(fs.existsSync(path.join(site.dir,'private-chat/conversations.json')),'Private chat store must exist outside document root');checks++;
  equal(fs.existsSync(path.join(site.publicDir,'uploads/chat_store/conversations.json')),false);
  // Corruption must fail closed rather than return success or replace the original data.
  const storePath=path.join(site.dir,'private-chat/conversations.json');
  fs.writeFileSync(storePath,'{"corrupt":');
  equal((await chat('customer_message',{...message,client_message_id:crypto.randomUUID()},{'X-Chat-Token':token})).status,503);
  equal(fs.readFileSync(storePath,'utf8'),'{"corrupt":');
  console.log(`${checks} private chat HTTP/auth/deduplication assertions passed.`);
} finally {await site.close();}
