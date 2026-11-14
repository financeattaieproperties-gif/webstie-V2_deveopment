import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();const page=await browser.newPage();
try {
  await page.goto('http://127.0.0.1:5175/dashboard/projects?preview=1&role=ceo',{waitUntil:'networkidle'});
  await page.getByTestId('open-project-wizard-btn').waitFor({timeout:5000});
  await page.getByTestId('open-project-wizard-btn').click();
  const branch=page.getByLabel('Branch',{exact:true});
  await branch.selectOption('1');assert.equal(await branch.inputValue(),'1');
  await page.goto('http://127.0.0.1:5175/dashboard/projects?preview=1&role=manager',{waitUntil:'networkidle'});
  assert.equal(await page.getByTestId('open-project-wizard-btn').count(),0);
  console.log('PASS CEO inventory authority and explicit branch selector; Manager read-only inventory');
}finally{await browser.close();}
