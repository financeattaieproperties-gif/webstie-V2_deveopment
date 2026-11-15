import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {ACTIVE_INTERNAL_ROLES} from '../../../packages/staff-contracts/branch-policy.mjs';

const origin = process.env.STAFF_BROWSER_ORIGIN || 'http://127.0.0.1:5175';
const browser = await chromium.launch({headless: true});

try {
  const mobile = await browser.newPage({viewport: {width: 375, height: 812}});
  mobile.setDefaultTimeout(7000);
  for (const role of ACTIVE_INTERNAL_ROLES) {
    await mobile.goto(`${origin}/dashboard/?preview=1&role=${role}`, {waitUntil: 'networkidle'});
    await mobile.getByLabel('Open navigation').waitFor();
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `${role} mobile page must not overflow horizontally`);
    const box = await mobile.getByLabel('Open navigation').boundingBox();
    assert.ok(box && box.width >= 44 && box.height >= 44, `${role} mobile navigation target must be at least 44px`);
  }
  await mobile.close();

  const desktop = await browser.newPage({viewport: {width: 1440, height: 900}});
  desktop.setDefaultTimeout(7000);
  for (const role of ACTIVE_INTERNAL_ROLES) {
    await desktop.goto(`${origin}/dashboard/?preview=1&role=${role}`, {waitUntil: 'networkidle'});
    await desktop.locator('.pillar-rail').waitFor();
    await desktop.locator('.sub-drawer').waitFor();
    await desktop.locator('.breadcrumbs').waitFor();
    await desktop.getByText('All Modules', {exact: true}).waitFor();
    const previewCopy = await desktop.getByText('Sample workspace only', {exact: false}).count();
    assert.equal(previewCopy, 0, `${role} dashboard must not expose preview-only copy`);
  }
  await desktop.close();
  console.log(`Unified responsive dashboard shell passed for ${ACTIVE_INTERNAL_ROLES.length} roles.`);
} finally {
  await browser.close();
}
