import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('landing page replaces category and master-planned cards with ExpandingCards signature projects', () => {
  const landingSource = fs.readFileSync(
    new URL('../src/components/sections/LandingPageContent.tsx', import.meta.url),
    'utf8'
  );

  // Verify old Explore by Category and Master-Planned Developments cards are completely removed
  assert.equal(landingSource.includes('Explore by Category'), false);
  assert.equal(landingSource.includes('Master-Planned Developments'), false);
  assert.equal(landingSource.includes('FeaturedProjectMotionCarousel'), false);

  // Verify ExpandingCards is rendered in the Signature Projects section
  assert.equal(landingSource.includes('ExpandingCards'), true);
  assert.equal(landingSource.includes('mapProjectsToExpandingCards'), true);
});

test('signatureProjects defines all 5 canonical V2 developments with valid assets', () => {
  const sigSource = fs.readFileSync(
    new URL('../src/lib/signatureProjects.ts', import.meta.url),
    'utf8'
  );

  for (const name of [
    'Kabul Plaza Saljuqi',
    'Moon Residency',
    'Kabul Plaza Burj',
    'Kabul Plaza 12',
    'Kabul Plaza 09 (ABC)',
  ]) {
    assert.equal(sigSource.includes(name), true, `Expected ${name} in signatureProjects.ts`);
  }
});

test('ExpandingCards resolves dynamic project detail links and keeps all cards in full color without grayscale', () => {
  const expandingSource = fs.readFileSync(
    new URL('../src/components/ui/expanding-cards.tsx', import.meta.url),
    'utf8'
  );
  const demoSource = fs.readFileSync(
    new URL('../src/components/ui/demo.tsx', import.meta.url),
    'utf8'
  );

  assert.equal(expandingSource.includes('export function resolveProjectDetailHref'), true);
  assert.equal(expandingSource.includes('`/projects/${encodeURIComponent(String(item.id))}`'), true);
  assert.equal(expandingSource.includes('data-project-href={projectDetailHref}'), true);
  assert.equal(expandingSource.includes('View project details for ${item.title}'), true);
  assert.equal(expandingSource.includes('grayscale'), false, 'Inactive cards must not be grayscale');
  assert.equal(demoSource.includes('linkHref: `/projects/${project.id}`'), true);
});
