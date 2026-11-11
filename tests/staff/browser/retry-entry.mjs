import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tokens=JSON.parse(fs.readFileSync(path.join(os.tmpdir(),'attaie-staff-v2-test/tokens.json'),'utf8'));
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.route('https://identitytoolkit.googleapis.com/**',async route=>{const data=route.request().postDataJSON();const username=data.email.split('@')[0];await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({idToken:tokens[username],expiresIn:'3600'})});});
let releaseDashboard;
const dashboardGate=new Promise(resolve=>releaseDashboard=resolve);
await page.route('**/staff-api/v1/dashboard?*',async route=>{await dashboardGate;await route.continue();});
try{
 await page.goto('http://127.0.0.1:5175/callcenter/');
 await page.getByLabel('Email',{exact:true}).first().fill('agent@example.test');await page.getByLabel('Password',{exact:true}).fill('Fixture-only-pass-2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('button',{name:'New entry',exact:true}).waitFor();await page.getByRole('button',{name:'New entry',exact:true}).click();
 assert.equal(await page.getByLabel('Next agent',{exact:true}).inputValue(),'1','Self-assignment must be available before roster loading completes');releaseDashboard();
 await page.getByLabel('Customer name',{exact:true}).fill('Retry fixture customer');await page.getByLabel('Phone',{exact:true}).fill('0700000102');await page.getByLabel('Requirements',{exact:true}).fill('Fixture retry after network failure.');await page.getByLabel('Next follow-up · Kabul',{exact:true}).fill('2099-01-01T10:00');
 let failed=false;await page.route('**/staff-api/v1/leads/*/submit-entry',async route=>{if(!failed){failed=true;await route.abort('failed');}else await route.continue();});
 await page.getByRole('button',{name:'Save entry',exact:true}).click();await page.locator('dialog [role="alert"]').waitFor();
 assert.equal(await page.getByLabel('Phone',{exact:true}).getAttribute('readonly'),'','Created draft phone is locked on retry');
 assert.equal(await page.getByLabel('Call date and time · Kabul',{exact:true}).getAttribute('readonly'),'','Created draft call time is locked on retry');
 await page.getByRole('button',{name:'Save entry',exact:true}).click();await page.locator('dialog').waitFor({state:'detached'});
 console.log('Draft retry passed: original phone/time remain visible and immutable after failed entry submission.');
} catch(error) {
 console.error('Form validation:',await page.locator('dialog input, dialog select, dialog textarea').evaluateAll(fields=>fields.filter(f=>!f.checkValidity()).map(f=>({name:f.name,value:f.value,message:f.validationMessage}))));
 console.error('Dialog:',await page.locator('dialog').allTextContents());
 await page.screenshot({path:'test-results/staff/retry-failure.png',fullPage:true});throw error;
} finally {releaseDashboard();await browser.close();}
