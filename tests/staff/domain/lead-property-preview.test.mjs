import test from 'node:test';
import assert from 'node:assert/strict';
import { previewClient, getSharedStaffStore } from '../../../apps/staff/src/preview.ts';

test('preview qualification requires explicit identity, preserves drafts and prevents duplicate pairs across statuses', async () => {
  const store = getSharedStaffStore();
  store.projects.push({ id: 8001, code: 'FIX', name: 'Fictional property', branchId: 1, assignedSalesAgentIds: [2], apartments: [{ id: 8002, projectId: 8001, unitNumber: 'A-101' }, { id: 8003, projectId: 8001, unitNumber: 'A-102' }] });
  const agent = previewClient(false, 'callcenter');
  const draft = await agent.draft({phone: '0799000123', callAt: new Date().toISOString()}, 'call');
  assert.equal(draft.status, 'draft');
  const details = { customerName: 'Fictional property buyer', requirements: 'Apartment', nextScheduledAt: new Date(Date.now() + 3600000).toISOString(), nextAssigneeId: 1 };
  await assert.rejects(agent.entry(draft.id, details, 'missing'), /Choose a project or unit/);
  assert.equal(draft.status, 'draft');
  const first = await agent.entry(draft.id, {...details, property: {kind: 'unit', id: 8002}}, 'first');
  assert.deepEqual(first.property, {kind: 'unit', id: 8002});
  const secondDraft = await agent.draft({phone: '+93799000123', callAt: new Date().toISOString()}, 'second-call');
  const before = store.followups.length;
  await assert.rejects(agent.entry(secondDraft.id, {...details, property: {kind: 'unit', id: 8002}}, 'duplicate'), /A lead already exists for this customer and property/);
  assert.equal(store.followups.length, before);
  assert.equal(secondDraft.status, 'draft');
  store.leads.find(l => l.id === first.id).status = 'lost';
  await assert.rejects(agent.entry(secondDraft.id, {...details, property: {kind: 'unit', id: 8002}}, 'lost-duplicate'), /already exists/);
  const second = await agent.entry(secondDraft.id, {...details, property: {kind: 'unit', id: 8003}}, 'different-unit');
  assert.equal(second.status, 'active');
  const sales = previewClient(false, 'sales');
  const sale = await sales.createSalesLead({...details, phone:'0799000124', source:'walk_in', property:{kind:'project',id:8001}}, 'sales');
  assert.equal(sale.status, 'active');
  assert.deepEqual(sale.property, {kind:'project', id:8001});
});
