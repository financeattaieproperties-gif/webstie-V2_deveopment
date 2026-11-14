import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
page.setDefaultTimeout(7000);
try {
 await page.goto('http://127.0.0.1:5175/dashboard/?preview=1&role=ceo');
 await page.locator('.nav-item').filter({hasText:'Marketing & Media'}).click();
 const form=page.getByTestId('marketing-submit-property-form');
 const branch=form.getByLabel('Branch',{exact:true});
 await branch.waitFor();
 assert.equal(await branch.evaluate(element=>element.required),true);
 assert.ok(await branch.locator('option').count()>1);
 await form.locator('input').nth(0).fill('Fictional branch owner');
 await form.locator('input').nth(1).fill('Fictional property address');
 await form.getByRole('button',{name:'Submit Property to Marketing Queue'}).click();
 assert.equal(await branch.evaluate(element=>element.validity.valueMissing),true);
 const id=await branch.locator('option').nth(1).getAttribute('value');
 await branch.selectOption(id);
 await form.getByRole('button',{name:'Submit Property to Marketing Queue'}).click();
 await page.getByTestId('marketing-workspace').getByText('Fictional branch owner',{exact:true}).waitFor();
 console.log('CEO marketing branch selection: required field and successful scoped create passed.');
} finally {await browser.close();}
