import test from 'node:test';
import assert from 'node:assert/strict';
import { contractPaymentSummary, receiptSummary, agreementVerificationUrl } from '../../../packages/staff-contracts/documents.mjs';

test('contract tracker excludes drafts/reversals and other contracts without mixing currencies', () => {
  const contract = { id: 10, totalPrice: 100.05, currency: 'AFN' };
  const deposits = [
    { id: 1, contractId: 10, amount: 30.01, status: 'posted' },
    { id: 2, contractId: 10, amount: 20.02, status: 'posted' },
    { id: 3, contractId: 10, amount: 99, status: 'draft' },
    { id: 4, contractId: 10, amount: 99, status: 'reversed' },
    { id: 5, contractId: 11, amount: 99, status: 'posted' },
  ];
  assert.deepEqual(contractPaymentSummary(contract, deposits), { total: 100.05, paid: 50.03, remaining: 50.02, progress: 50, currency: 'AFN' });
});

test('reprinted receipt retains its posting totals after later collections', () => {
  const contract = { id: 10, totalPrice: 100, currency: 'USD' };
  const receipt = { id: 1, contractId: 10, amount: 20, status: 'posted', receiptPaidToDate: 20, receiptRemainingBalance: 80 };
  assert.deepEqual(receiptSummary(contract, receipt), { paid: 20, remaining: 80, historical: true });
  assert.deepEqual(receiptSummary(contract, { ...receipt, receiptPaidToDate: undefined, receiptRemainingBalance: undefined }), { paid: null, remaining: null, historical: false });
});

test('agreement QR contains only verification token on the configured same origin', () => {
  const token = 'a'.repeat(64);
  assert.equal(agreementVerificationUrl('https://website.attaieproperties.com', token), `https://website.attaieproperties.com/dashboard/?verify=${token}`);
  assert.throws(() => agreementVerificationUrl('https://website.attaieproperties.com', '../buyer?id=secret'));
  assert.throws(() => agreementVerificationUrl('javascript:alert(1)', token));
});
