import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {startWebsiteFixture} from './support/server.mjs';

const backend=await startWebsiteFixture();
const fixturePage={name:'delivery-race-page',configureServer(server){server.middlewares.use('/__fixture__',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Fictional delivery fixture</title>');});}};
const vite=await createServer({configFile:false,envDir:backend.dir,plugins:[fixturePage],server:{host:'127.0.0.1',port:0,proxy:{'/api':backend.origin,'/chat-service.php':backend.origin}},logLevel:'error'});
await vite.listen();const origin=vite.resolvedUrls.local[0];
const browser=await chromium.launch({headless:true});
const deferred=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const context=async()=>{const context=await browser.newContext();const page=await context.newPage();await page.goto(`${origin}__fixture__`);return {context,page};};
try {
  await test('an inquiry queued during delivery is sent without another online/startup event',async()=>{
    const {context:ctx,page}=await context();const arrived=deferred(),release=deferred();let requests=0;
    await ctx.route('**/api/submit-lead.php',async route=>{if(++requests===1){arrived.resolve();await release.promise;}await route.continue();});
    try {
      await page.evaluate(async()=>{const outbox=await import('/src/lib/inquiryOutbox.ts');await outbox.enqueueInquiry({name:'Fictional Race One',email:'race1@example.test',phone:'0700000000'});});
      await arrived.promise;
      await page.evaluate(async()=>{const outbox=await import('/src/lib/inquiryOutbox.ts');await outbox.enqueueInquiry({name:'Fictional Race Two',email:'race2@example.test',phone:'0700000001'});});
      release.resolve();
      let rows;
      for(let i=0;i<50;i++){rows=await page.evaluate(async()=>(await import('/src/lib/inquiryOutbox.ts')).listInquiryDeliveries());if(rows.every(row=>row.status==='confirmed'))break;await new Promise(resolve=>setTimeout(resolve,100));}
      assert.equal(rows.filter(row=>row.status==='confirmed').length,2,'The second persisted inquiry must not remain stranded');
      assert.equal(requests,2);
    } finally {release.resolve();await ctx.close();}
  });
  await test('a stale chat GET cannot erase a newer pending customer message',async()=>{
    const {context:ctx,page}=await context();const arrived=deferred(),release=deferred();
    try {
      await page.evaluate(async()=>{const chat=await import('/src/lib/chatService.ts');const session=chat.getStoredCustomerSession();await chat.sendCustomerChatMessage({sessionId:session.sessionId,message:'Fictional confirmed history'});});
      await ctx.route('**/chat-service.php?action=thread*',async route=>{const response=await route.fetch();arrived.resolve();await release.promise;await route.fulfill({response});});
      const stale=page.evaluate(async()=>{const chat=await import('/src/lib/chatService.ts');await chat.fetchCustomerThread(chat.getStoredCustomerSession().sessionId);});
      await arrived.promise;
      await ctx.route('**/chat-service.php?action=customer_message',route=>route.abort('internetdisconnected'));
      await page.evaluate(async()=>{const chat=await import('/src/lib/chatService.ts');await chat.sendCustomerChatMessage({sessionId:chat.getStoredCustomerSession().sessionId,message:'Fictional pending message that must survive'});});
      release.resolve();await stale;
      const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('attaie_customer_chat_cache_v2')));
      const message=rows[0].messages.find(message=>message.text==='Fictional pending message that must survive');
      assert.ok(message,'A previously started GET must not overwrite a committed local pending message');
      assert.equal(message.delivery_status,'pending');
    } finally {release.resolve();await ctx.close();}
  });
  await test('chat mutations recover after another Admin tab rotates the shared session',async()=>{
    const {context:ctx,page}=await context();
    try {
      const threadId=await page.evaluate(async()=>{const chat=await import('/src/lib/chatService.ts');const session=chat.getStoredCustomerSession();await chat.sendCustomerChatMessage({sessionId:session.sessionId,message:'Fictional shared-session fixture'});return session.sessionId;});
      const login=async target=>target.evaluate(async()=>{const {api}=await import('/admin-panel/src/api.ts');await api.login('admin','choose_a_strong_password');return sessionStorage.getItem('admin_csrf_token');});
      const oldToken=await login(page);
      const other=await ctx.newPage();await other.goto(`${origin}__fixture__`);assert.notEqual(await login(other),oldToken);
      await page.evaluate(async id=>{const {api}=await import('/admin-panel/src/api.ts');await api.replyToChat(id,'Fictional reply after second login','Fixture Admin',crypto.randomUUID());},threadId);
      assert.notEqual(await page.evaluate(()=>sessionStorage.getItem('admin_csrf_token')),oldToken);
      const thread=await page.evaluate(async id=>(await import('/src/lib/chatService.ts')).fetchCustomerThread(id),threadId);
      assert.equal(thread.messages.filter(message=>message.text==='Fictional reply after second login').length,1);
    } finally {await ctx.close();}
  });
} finally {await browser.close();await vite.close();await backend.close();}
