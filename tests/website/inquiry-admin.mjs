import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {startWebsiteFixture} from './support/server.mjs';

const backend=await startWebsiteFixture();
const vite=await createServer({root:`${process.cwd()}/admin-panel`,configFile:'admin-panel/vite.config.ts',envDir:backend.dir,server:{host:'127.0.0.1',port:0,proxy:{'/api':backend.origin}},logLevel:'error'});
await vite.listen();const origin=vite.resolvedUrls.local[0].replace(/\/admin\/$/,'');
const browser=await chromium.launch({headless:true});let checks=0;
const equal=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(`${origin}/admin/leads`);
  const submit=await context.request.post(`${origin}/api/submit-lead.php`,{data:{name:'Fictional Admin Browser',email:'admin-browser@example.test',phone:'0700000000',propertyName:'Fictional admin property',clientRequestId:crypto.randomUUID()}});
  const inquiry=await submit.json();equal(submit.status(),200);
  const login=await context.request.post(`${origin}/api/admin-login.php`,{data:{username:'admin',password:'choose_a_strong_password'}});equal(login.status(),200);
  await page.evaluate(()=>sessionStorage.setItem('admin_logged_in','true'));await page.reload();
  await page.getByRole('searchbox',{name:'Search leads'}).fill(inquiry.receipt.reference);
  await page.getByRole('button',{name:'Manage follow-up',exact:true}).click();
  const editor=page.getByRole('form',{name:'Inquiry follow-up'});
  await editor.getByLabel('Follow-up status').selectOption('in_progress');
  await editor.getByLabel('Follow-up notes').fill('Fictional persisted browser note');
  await editor.getByLabel('Next follow-up (local time)').fill('2099-01-01T12:30');
  await editor.getByRole('button',{name:'Save follow-up',exact:true}).click();
  await editor.waitFor({state:'detached'});
  await page.reload();await page.getByRole('searchbox',{name:'Search leads'}).fill(inquiry.receipt.reference);
  equal(await page.locator('tbody tr').count(),1);
  await page.getByRole('button',{name:'Manage follow-up',exact:true}).click();
  equal(await editor.getByLabel('Follow-up notes').inputValue(),'Fictional persisted browser note');
  equal(await editor.getByLabel('Follow-up status').inputValue(),'in_progress');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  equal(await page.locator('time').count(),1);
  // Scanning into search is plain authenticated input; unknown references disclose no rows.
  await page.getByRole('searchbox',{name:'Search leads'}).fill('INQ-UNKNOWN');equal(await page.locator('tbody tr').innerText(),'No leads match the current view.');
  await context.close();
  console.log(`${checks} website Admin follow-up/browser/search assertions passed.`);
} finally {await browser.close();await vite.close();await backend.close();}
