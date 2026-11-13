import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addSeoKeyword,
  countActiveSeoKeywords,
  filterSeoKeywordRecords,
  filterSeoKeywords,
  getActiveSeoKeywordsString,
  parseSeoKeywords,
  removeSeoKeyword,
  serializeSeoKeywords,
  toggleSeoKeywordRecord,
  type SeoKeywordRecord,
} from '../admin-panel/src/lib/seoKeywords';
import { resolveHomeMetadata } from '../src/lib/homeMetadata';

test('parseSeoKeywords trims whitespace and deduplicates case-insensitively', () => {
  const parsed = parseSeoKeywords(
    '  Attaie Properties, Kabul real estate , attaie properties , ,  luxury   villas Kabul \n apartments in Kabul ',
  );

  assert.deepEqual(parsed, [
    'Attaie Properties',
    'Kabul real estate',
    'luxury villas Kabul',
    'apartments in Kabul',
  ]);
});

test('addSeoKeyword adds single and batch keywords without case-insensitive duplicates', () => {
  const existing = ['Attaie Properties', 'Kabul real estate'];

  const single = addSeoKeyword(existing, '  Wazir Akbar Khan villas  ');
  assert.deepEqual(single.added, ['Wazir Akbar Khan villas']);
  assert.deepEqual(single.duplicates, []);
  assert.deepEqual(single.next, [
    'Attaie Properties',
    'Kabul real estate',
    'Wazir Akbar Khan villas',
  ]);

  const batchWithDup = addSeoKeyword(
    single.next,
    'kabul real estate, Shahr-e-Naw apartments, Kabul Commercial Plazas',
  );
  assert.deepEqual(batchWithDup.added, [
    'Shahr-e-Naw apartments',
    'Kabul Commercial Plazas',
  ]);
  assert.deepEqual(batchWithDup.duplicates, ['kabul real estate']);
  assert.equal(
    serializeSeoKeywords(batchWithDup.next),
    'Attaie Properties, Kabul real estate, Wazir Akbar Khan villas, Shahr-e-Naw apartments, Kabul Commercial Plazas',
  );
});

test('removeSeoKeyword removes matching keyword case-insensitively and preserves order', () => {
  const list = ['Attaie Properties', 'Kabul real estate', 'luxury villas Kabul'];
  const after = removeSeoKeyword(list, 'KABUL REAL ESTATE');
  assert.deepEqual(after, ['Attaie Properties', 'luxury villas Kabul']);
});

test('filterSeoKeywords filters by substring case-insensitively', () => {
  const list = ['Attaie Properties', 'Kabul real estate', 'Wazir Akbar Khan villas'];
  assert.deepEqual(filterSeoKeywords(list, 'kabul'), ['Kabul real estate']);
  assert.deepEqual(filterSeoKeywords(list, ''), list);
});

test('structured keyword record helpers toggle, count, filter, and serialize active keywords', () => {
  const records: SeoKeywordRecord[] = [
    { id: 1, keyword: 'Attaie Properties', enabled: true },
    { id: 2, keyword: 'Kabul real estate', enabled: true },
    { id: 3, keyword: 'luxury villas Kabul', enabled: true },
  ];

  assert.equal(countActiveSeoKeywords(records), 3);
  assert.equal(
    getActiveSeoKeywordsString(records),
    'Attaie Properties, Kabul real estate, luxury villas Kabul',
  );

  // Toggle #2 OFF
  const toggledOff = toggleSeoKeywordRecord(records, 2, false);
  assert.equal(countActiveSeoKeywords(toggledOff), 2);
  assert.equal(toggledOff[1].enabled, false);
  assert.equal(
    getActiveSeoKeywordsString(toggledOff),
    'Attaie Properties, luxury villas Kabul',
  );

  // Toggle #2 back ON (implicit toggle without explicit boolean)
  const toggledBackOn = toggleSeoKeywordRecord(toggledOff, 2);
  assert.equal(countActiveSeoKeywords(toggledBackOn), 3);
  assert.equal(toggledBackOn[1].enabled, true);
  assert.equal(
    getActiveSeoKeywordsString(toggledBackOn),
    'Attaie Properties, Kabul real estate, luxury villas Kabul',
  );

  // Filter records
  assert.deepEqual(
    filterSeoKeywordRecords(toggledOff, 'kabul').map(r => r.id),
    [2, 3],
  );
});

test('resolveHomeMetadata reflects added, removed, toggled, and cleared global keywords', () => {
  const baseSettings = {
    site_name: 'Attaie Properties',
    default_title: 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
    title_template: '%s | Attaie Properties',
    default_description:
      'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
    keywords: 'Attaie Properties, Diplomatic Penthouses Kabul',
    og_image: '/logo.png',
    twitter_image: null,
    twitter_card: 'summary_large_image' as const,
    twitter_site: '@AttaieProps',
    canonical_base_url: 'https://www.attaieproperties.com',
    robots_index: true,
  };

  const withAdded = resolveHomeMetadata({ siteSettings: baseSettings });
  const kwTagAdded = withAdded.metaTags.find(t => t.name === 'keywords');
  assert.equal(kwTagAdded?.content, 'Attaie Properties, Diplomatic Penthouses Kabul');

  const records: SeoKeywordRecord[] = [
    { id: 1, keyword: 'Attaie Properties', enabled: true },
    { id: 2, keyword: 'Kabul real estate', enabled: false },
    { id: 3, keyword: 'Diplomatic Penthouses Kabul', enabled: true },
  ];
  const toggledMeta = resolveHomeMetadata({
    siteSettings: { ...baseSettings, keywords: getActiveSeoKeywordsString(records) },
  });
  const kwTagToggled = toggledMeta.metaTags.find(t => t.name === 'keywords');
  assert.equal(kwTagToggled?.content, 'Attaie Properties, Diplomatic Penthouses Kabul');

  const withRemoved = resolveHomeMetadata({
    siteSettings: { ...baseSettings, keywords: 'Diplomatic Penthouses Kabul' },
  });
  const kwTagRemoved = withRemoved.metaTags.find(t => t.name === 'keywords');
  assert.equal(kwTagRemoved?.content, 'Diplomatic Penthouses Kabul');

  const cleared = resolveHomeMetadata({
    siteSettings: { ...baseSettings, keywords: '' },
  });
  const kwTagCleared = cleared.metaTags.find(t => t.name === 'keywords');
  assert.equal(kwTagCleared, undefined);
});
