import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {chromium} from 'playwright';
import {BitArray, Code128Reader} from '@zxing/library';
import {startWebsiteFixture} from './support/server.mjs';

const backend = await startWebsiteFixture();
const vite = await createServer({configFile:false, envDir:backend.dir, plugins:[react(),tailwind()],
  resolve:{alias:{'@':`${process.cwd()}/src`}},
  server:{host:'127.0.0.1',port:0,proxy:{'/api':backend.origin}}, logLevel:'error'});
await vite.listen();
const origin = vite.resolvedUrls.local[0];
const browser = await chromium.launch({headless:true});
let checks = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const fill = async page => {
  const form = page.locator('form').filter({has:page.locator('input[type="email"]')}).first();
  await form.locator('input[name="name"]').fill('Fictional Customer');
  await form.locator('input[name="email"]').fill('offline@example.test');
  await form.locator('input[name="phone"]').fill('0700000000');
  await form.locator('textarea[name="message"]').fill('Fictional inquiry from offline fixture');
  await form.locator('button[type="submit"]').click();
};
const deliveries = page => page.evaluate(async () => (await import('/src/lib/inquiryOutbox.ts')).listInquiryDeliveries());
async function waitDeliveries(page, predicate) {
  for (let i=0;i<100;i++) {
    const rows=await deliveries(page);
    if (predicate(rows)) return rows;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error(`Delivery state did not settle: ${JSON.stringify(await deliveries(page))}`);
}
try {
  const context = await browser.newContext({viewport:{width:375,height:900}});
  await context.route('**/api/get-property.php*', route => route.fulfill({json:{id:1,serial_number:'FIX-1',title:'Fictional property',price:100,location:'Fixture',beds:1,baths:1,area:100,floor:1,status:'available',type:'Apartment',listing_type:'sale',image_url:'/logo.png',gallery_images:[],video_url:null,description:'Fictional fixture',created_at:'2026-11-14'}}));
  let mode = 'offline', posted = 0, lostResponses = 0;
  await context.route('**/api/submit-lead.php', async route => {
    if (mode === 'offline') return route.abort('internetdisconnected');
    if (mode === '422' || mode === '409') return route.fulfill({status:Number(mode),json:{error:'Fixture validation conflict'}});
    const requestMode = mode;
    posted++;
    const response = await route.fetch();
    // Model a proxy losing the upstream success after commit. Chromium can silently retry
    // connectionreset, bypassing route interception; a 502 makes application recovery observable.
    if (requestMode === 'lost') { lostResponses++; mode='online'; return route.fulfill({status:502,json:{error:'Upstream response lost'}}); }
    await route.fulfill({response});
  });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('Browser error:', error.message));
  await page.goto(`${origin}contact`);
  await fill(page);
  await page.getByText('Saved on this device. Waiting to send.').first().waitFor({timeout:5000});
  equal(await page.getByRole('button', {name:'Download receipt'}).count(), 0);
  let saved = await deliveries(page); equal(saved.length, 1); equal(saved[0].status, 'pending');
  console.log('PASS durable offline save');
  const requestId = saved[0].clientRequestId;
  await page.reload();
  await page.getByText('Saved on this device. Waiting to send.').first().waitFor();
  equal((await deliveries(page))[0].clientRequestId, requestId);
  const tab = await context.newPage(); await tab.goto(`${origin}contact`);
  mode='online';
  await Promise.all([page,tab].map(p => p.evaluate(() => window.dispatchEvent(new Event('online')))));
  await page.getByRole('button', {name:'Download receipt'}).first().waitFor();
  await tab.getByRole('button', {name:'Download receipt'}).first().waitFor();
  equal(backend.fixture('count'), '1');
  saved = await deliveries(page); equal(saved[0].status, 'confirmed');
  equal('payload' in saved[0], false);
  console.log('PASS reload and two-tab delivery');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', {name:'Download receipt'}).first().click();
  const download = await downloadEvent;
  const html = await fs.readFile(await download.path(), 'utf8');
  assert.ok(html.includes(saved[0].receipt.reference)); checks++;
  const receiptPage = await context.newPage(); await receiptPage.setContent(html);
  const bits = await receiptPage.evaluate(async () => {
    const svg = document.querySelector('svg');
    const img = new Image(); img.src = 'data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(svg));
    await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const row=ctx.getImageData(0,30,canvas.width,1).data;
    return Array.from({length:canvas.width},(_,i)=>row[i*4]<128);
  });
  const row = new BitArray(bits.length);bits.forEach((bit,i)=>{if(bit)row.set(i);});
  equal(new Code128Reader().decodeRow(0,row).getText(), saved[0].receipt.reference);
  console.log('PASS downloaded Code 128 decode');
  await receiptPage.close();
  // Property form also persists and recovers a committed-but-lost response.
  mode='lost'; await page.goto(`${origin}properties/1`); await fill(page);
  await waitDeliveries(page, rows => rows.filter(row=>row.status==='confirmed').length===2);
  equal(backend.fixture('count'), '2');
  equal(lostResponses,1);
  assert.ok(posted >= 3, `A lost response must require an actual retry: ${JSON.stringify(await deliveries(page))}`); checks++;
  console.log('PASS property form and lost response recovery');
  for (const status of ['422','409']) {
    mode=status; await page.goto(`${origin}contact`);await fill(page);
    await page.getByText('Needs attention. Retry or discard this inquiry.').first().waitFor();
    const attention=(await deliveries(page)).find(row=>row.status==='needs_attention');assert.ok(attention); checks++;
    await page.getByRole('button',{name:'Discard inquiry'}).first().click();
  }
  equal(backend.fixture('count'), '2');
  // Storage denial must retain entered data and must not pretend the request was queued.
  const denied = await browser.newContext();
  await denied.addInitScript(() => { Object.defineProperty(window,'indexedDB',{get(){throw new DOMException('Fixture denied','SecurityError');}}); });
  const deniedPage=await denied.newPage();await deniedPage.goto(`${origin}contact`);await fill(deniedPage);
  await deniedPage.getByText('Could not save on this device. Keep this form open and try again.').first().waitFor();
  equal(await deniedPage.locator('input[name="name"]').inputValue(),'Fictional Customer');
  await denied.close();
  // Dari status/receipt rendering, responsive layout and escaping.
  await page.evaluate(() => localStorage.setItem('lang','fa'));mode='online';await page.reload();
  await page.locator('[data-inquiry-deliveries]').waitFor(); equal(await page.locator('html').getAttribute('dir'),'rtl');
  for (const width of [375,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    equal(await page.locator('[data-inquiry-deliveries]').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  }
  const hostileDownload = page.waitForEvent('download');
  await page.evaluate(async () => {
    const {downloadInquiryReceipt}=await import('/src/lib/inquiryReceipt.ts');
    downloadInquiryReceipt({reference:'INQ-0123456789ABCDEF0123456789ABCDEF',submittedAt:'2026-11-14T00:00:00Z',customerName:'<script>alert(1)</script>',propertyName:'<img src=x onerror=alert(1)>'},'fa');
  });
  const hostileHtml = await fs.readFile(await (await hostileDownload).path(),'utf8');
  const safeReceipt = await context.newPage();await safeReceipt.setContent(hostileHtml);
  equal(await safeReceipt.locator('script,img').count(),0);
  equal(await safeReceipt.locator('html').getAttribute('dir'),'rtl');
  await safeReceipt.emulateMedia({media:'print'});
  equal(await safeReceipt.locator('button').isVisible(),false);
  await fs.mkdir('releases/validation/website-inquiries',{recursive:true});
  await page.locator('[data-inquiry-deliveries]').screenshot({path:'releases/validation/website-inquiries/dari-deliveries.png'});
  await context.close();
  console.log(`${checks} offline inquiry/browser/barcode assertions passed; ${posted} transport deliveries, 2 committed rows.`);
} finally {await browser.close();await vite.close();await backend.close();}
