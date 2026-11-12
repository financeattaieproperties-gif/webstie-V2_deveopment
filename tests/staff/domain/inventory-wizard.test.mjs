import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apartmentNumber, copyTypicalFloor, validateInventoryLayout } from '../../../packages/staff-contracts/inventory.mjs';

test('corridor numbering preserves complete floors and two digit suffixes', () => {
  assert.equal(apartmentNumber('A', 2, '01'), 'A-201');
  assert.equal(apartmentNumber('A', 10, '01'), 'A-1001');
  assert.throws(() => apartmentNumber('AA', 2, '01'));
  assert.throws(() => apartmentNumber('A', 2, '00'));
});
test('typical copy renumbers and rejects duplicates without changing roof pricing', () => {
  const source = [{ unitNumber: 'A-501', corridor: 'A', floor: 5, kind: 'apartment', areaSqm: 100, pricePerSqm: 800, roofAreaSqm: 0, isVip: false }];
  const copied = copyTypicalFloor(source, 5, [6, 10], []);
  assert.deepEqual(copied.map(a => a.unitNumber), ['A-601', 'A-1001']);
  assert.equal(copied[0].totalPrice, 80000);
  assert.throws(() => copyTypicalFloor(source, 5, [6], copied));
  assert.throws(() => copyTypicalFloor([{...source[0], isVip:true}], 5, [6], []));
});
test('floor sets, duplicate commercial names and VIP top floor are checked', () => {
  const project = { floors:12, corridorCount:1, commercialFloors:[1,2,3,4], residentialFloors:[5,6,7,8,9,10,11,12], apartments:[] };
  assert.deepEqual(validateInventoryLayout(project), []);
  assert.ok(validateInventoryLayout({...project,residentialFloors:[4,5]}).length);
  assert.ok(validateInventoryLayout({...project,apartments:[{unitNumber:'S101',floor:1,kind:'shop',areaSqm:10,pricePerSqm:5},{unitNumber:'s101',floor:1,kind:'shop',areaSqm:10,pricePerSqm:5}]}).length);
  assert.ok(validateInventoryLayout({...project,apartments:[{unitNumber:'A-501',corridor:'A',floor:5,kind:'apartment',areaSqm:100,pricePerSqm:5,isVip:true,roofAreaSqm:20}]}).length);
});
test('VIP roof remains separately measured and malformed numbering is rejected', () => {
  const project = {floors:2,corridorCount:1,commercialFloors:[1],residentialFloors:[2],apartments:[{unitNumber:'A-201',corridor:'A',floor:2,kind:'apartment',areaSqm:100,pricePerSqm:800,isVip:true,roofAreaSqm:35}]};
  assert.deepEqual(validateInventoryLayout(project), []);
  assert.ok(validateInventoryLayout({...project,apartments:[{...project.apartments[0],unitNumber:'A-301'}]}).length);
  assert.ok(validateInventoryLayout({...project,apartments:[{...project.apartments[0],roofAreaSqm:NaN}]}).length);
});
