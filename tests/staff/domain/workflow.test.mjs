import test from 'node:test';
import assert from 'node:assert/strict';
import { followupState, feedbackDeadline, normalizePhone, validateFeedback, createSerial, taskState } from '../../../packages/staff-contracts/workflow.mjs';

const scheduled = '2026-11-10T05:30:00.000Z';
test('24-hour boundary is due at deadline and overtime strictly after it', () => {
  const task = { scheduledAt: scheduled, completedAt: null };
  assert.equal(feedbackDeadline(scheduled), '2026-11-11T05:30:00.000Z');
  assert.equal(followupState(task, '2026-11-10T05:29:59Z'), 'upcoming');
  assert.equal(followupState(task, scheduled), 'due');
  assert.equal(followupState(task, feedbackDeadline(scheduled)), 'due');
  assert.equal(followupState(task, '2026-11-11T05:30:00.001Z'), 'overtime');
});
test('late history does not depend on current time', () => {
  assert.equal(followupState({ scheduledAt: scheduled, completedAt: '2026-11-11T05:30:01Z' }, scheduled), 'completed_late');
  assert.equal(followupState({ scheduledAt: scheduled, completedAt: feedbackDeadline(scheduled) }), 'completed');
});
test('call center cannot close deals and active outcomes require next schedule', () => {
  assert.throws(() => validateFeedback({ outcome: 'closed', amount: '100', currency: 'AFN' }, 'callcenter'), /sales/i);
  assert.throws(() => validateFeedback({ outcome: 'followup', notes: 'Called' }, 'callcenter'), /next/i);
  assert.throws(() => validateFeedback({ outcome: 'lost', reason: '' }, 'callcenter'), /reason/i);
  assert.doesNotThrow(() => validateFeedback({ outcome: 'lost', reason: 'No longer buying' }, 'callcenter'));
});
test('visit needs feedback and a future date; closed requires exact money', () => {
  assert.throws(() => validateFeedback({ outcome: 'visit', notes: '', nextScheduledAt: '2099-01-01T00:00:00Z', nextAssigneeId: 1 }, 'sales'), /feedback/i);
  assert.throws(() => validateFeedback({ outcome: 'closed', amount: '1e5', currency: 'USD' }, 'sales'), /amount/i);
  assert.doesNotThrow(() => validateFeedback({ outcome: 'closed', amount: '1000.25', currency: 'AFN' }, 'sales'));
});
test('phone normalization and serial sequence preserve agent identity beyond 99', () => {
  assert.equal(normalizePhone('078 222 2279'), '+93782222279');
  assert.equal(normalizePhone('+93 78 222 2279'), '+93782222279');
  assert.equal(createSerial(1, 1), 'CA01-L1');
  assert.equal(createSerial(101, 19), 'CA101-L19');
});
test('management tasks get no extra grace period', () => {
  assert.equal(taskState({ deadlineAt: scheduled, status: 'todo' }, '2026-11-10T05:30:01Z'), 'overdue');
});
