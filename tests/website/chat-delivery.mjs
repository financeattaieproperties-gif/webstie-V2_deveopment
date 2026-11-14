import assert from 'node:assert/strict';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {chromium} from 'playwright';
import {startWebsiteFixture} from './support/server.mjs';

const backend=await startWebsiteFixture();
const web=await createServer({configFile:false,envDir:backend.dir,plugins:[react(),tailwind()],resolve:{alias:{'@':`${process.cwd()}/src`}},server:{host:'127.0.0.1',port:0,proxy:{'/api':backend.origin,'/chat-service.php':backend.origin}},logLevel:'error'});
const admin=await createServer({root:`${process.cwd()}/admin-panel`,configFile:'admin-panel/vite.config.ts',envDir:backend.dir,server:{host:'127.0.0.1',port:0,proxy:{'/api':backend.origin,'/chat-service.php':backend.origin}},logLevel:'error'});
await web.listen();await admin.listen();const origin=web.resolvedUrls.local[0],adminOrigin=admin.resolvedUrls.local[0].replace(/\/admin\/$/,'');
const browser=await chromium.launch({headless:true});let checks=0;
const equal=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
try {
  const customer=await browser.newContext(),advisor=await browser.newContext();
  const page=await customer.newPage(),inbox=await advisor.newPage();
  await page.goto(`${origin}contact`);
  await inbox.goto(`${adminOrigin}/admin/chat`);
  await advisor.request.post(`${adminOrigin}/api/admin-login.php`,{data:{username:'admin',password:'choose_a_strong_password'}});
  await inbox.evaluate(()=>sessionStorage.setItem('admin_logged_in','true'));await inbox.reload();
  equal(await inbox.getByRole('button',{name:'Test Incoming Alert',exact:true}).count(),0);
  equal(await inbox.locator('text=chat_demo_kabul_1').count(),0);
  let offline=true;
  await customer.route('**/chat-service.php?action=customer_message',route=>offline?route.abort('internetdisconnected'):route.continue());
  await page.getByRole('button',{name:'Messages',exact:true}).click();
  await page.getByRole('textbox',{name:'Message',exact:true}).fill('Fictional durable chat message');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await page.getByText('Pending delivery', {exact:true}).waitFor();
  equal(await page.getByText('Sent',{exact:true}).count(),0);
  equal(backend.fixture('count'),'0');
  await page.reload();await page.getByRole('button',{name:'Messages',exact:true}).click();
  await page.getByText('Pending delivery',{exact:true}).waitFor();
  offline=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await inbox.getByText('Fictional durable chat message').first().waitFor({timeout:15000});
  await inbox.getByText('Fictional durable chat message').first().click();
  await inbox.locator('textarea').last().fill('Fictional confirmed Admin answer');
  await inbox.getByRole('button',{name:/Send Reply/}).click();
  await page.getByText('Fictional confirmed Admin answer',{exact:true}).waitFor({timeout:15000});
  const thread=await page.evaluate(async()=>{const chat=await import('/src/lib/chatService.ts');return chat.fetchCustomerThread(chat.getStoredCustomerSession().sessionId);});
  equal(thread.messages.filter(message=>message.text==='Fictional durable chat message').length,1);
  equal(thread.messages.filter(message=>message.text==='Fictional durable chat message')[0].delivery_status,'confirmed');
  equal(backend.fixture('count'),'0');
  // Admin transport failure must leave the reply draft visible and display an error.
  await advisor.route('**/chat-service.php?action=admin_reply',route=>route.fulfill({status:503,json:{error:'Fixture unavailable'}}));
  await inbox.locator('textarea').last().fill('Fictional unsent draft');await inbox.getByRole('button',{name:/Send Reply/}).click();
  await inbox.getByRole('alert').first().waitFor();equal(await inbox.locator('textarea').last().inputValue(),'Fictional unsent draft');
  await customer.close();await advisor.close();
  console.log(`${checks} cross-context customer/Admin chat delivery assertions passed.`);
} finally {await browser.close();await web.close();await admin.close();await backend.close();}
