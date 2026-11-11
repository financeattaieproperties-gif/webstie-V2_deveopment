import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tokens=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'attaie-staff-v2-test/tokens.json'),'utf8'));
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true});
const agentContext=await browser.newContext({viewport:{width:1440,height:1000}});
const ownerContext=await browser.newContext();
const agent=await agentContext.newPage(),owner=await ownerContext.newPage();
for (const context of [agentContext,ownerContext]) await context.route('https://identitytoolkit.googleapis.com/**',async route=>{const data=route.request().postDataJSON();const username=data.email.split('@')[0];await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({idToken:tokens[username],expiresIn:'3600'})});});
const name=`Browser Customer ${Date.now()}`;
const title=`Browser management task ${Date.now()}`;
async function login(page,path,username){await page.goto(`http://127.0.0.1:5175/${path}/`);await page.getByLabel('Email',{exact:true}).first().fill(username+'@example.test');await page.getByLabel('Password',{exact:true}).fill('Fixture-only-pass-2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();}
try{
  await login(agent,'callcenter','agent');
  assert.equal(await agent.getByText('Sample preview',{exact:true}).count(),0);
  await agent.getByRole('button',{name:'New entry',exact:true}).click();
  await agent.getByLabel('Customer name',{exact:true}).fill(name);
  await agent.getByLabel('Phone',{exact:true}).fill('0700000101');
  await agent.getByLabel('Requirements',{exact:true}).fill('Isolated browser test inquiry; never a real customer.');
  await agent.getByLabel('Next follow-up · Kabul',{exact:true}).fill('2099-01-01T10:00');
  await agent.getByRole('button',{name:'Save entry',exact:true}).click();
  await agent.locator('dialog').waitFor({state:'detached'});
  await agent.getByRole('button',{name:'Customers',exact:true}).click();
  await agent.getByLabel('Search',{exact:true}).fill(name);
  await agent.getByRole('heading',{name,exact:true}).waitFor();
  await login(owner,'management','owner');
  await owner.getByRole('button',{name:'Assign task',exact:true}).click();
  await owner.getByLabel('Task title',{exact:true}).fill(title);
  await owner.getByLabel('Instructions',{exact:true}).fill('Isolated task assigned through the real PHP service.');
  await owner.getByLabel('Assign to',{exact:true}).selectOption('1');
  await owner.getByLabel('Deadline · Kabul',{exact:true}).fill('2099-01-02T10:00');
  await owner.locator('dialog').getByRole('button',{name:'Assign task',exact:true}).click();
  await owner.locator('dialog').waitFor({state:'detached'});
  await agent.getByRole('button',{name:'My Tasks',exact:true}).click();
  await agent.getByLabel('Search',{exact:true}).fill(title);
  await agent.getByRole('button',{name:new RegExp(title)}).click();
  let dropped=false;
  await agent.route('**/staff-api/v1/tasks/*',async route=>{
    if(route.request().method()==='PATCH' && !dropped){dropped=true;await route.fetch();await route.abort('failed');}else await route.continue();
  });
  await agent.getByRole('button',{name:'Mark complete',exact:true}).click();
  await agent.locator('dialog [role="alert"]').waitFor();
  const [retryResponse]=await Promise.all([agent.waitForResponse(r=>r.url().includes('/staff-api/v1/tasks/') && r.request().method()==='PATCH'),agent.getByRole('button',{name:'Mark complete',exact:true}).click()]);
  assert.equal(retryResponse.status(),200,'Retry after committed task completion must replay its result');
  await agent.locator('dialog').waitFor({state:'detached'});
  await agent.getByText('Completed',{exact:true}).waitFor();
  await agent.screenshot({path:'test-results/staff/server-tasks.png',fullPage:true});
  console.log('Real browser/PHP/MariaDB flow passed: login, lead submission, automatic customer creation, CEO assignment, agent task completion.');
} catch (error) {
 console.error('Agent alert:', await agent.locator('[role="alert"]').allTextContents());
 console.error('Owner alert:', await owner.locator('[role="alert"]').allTextContents());
 await agent.screenshot({path:'test-results/staff/server-failure.png',fullPage:true});
 throw error;
} finally { await browser.close(); }
