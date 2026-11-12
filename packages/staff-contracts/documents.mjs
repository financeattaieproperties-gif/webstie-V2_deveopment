/** @param {{id:number,totalPrice:number,currency:string}} contract @param {Array<{contractId:number,amount:number,status:string}>} deposits */
export function contractPaymentSummary(contract, deposits) {
  const totalCents = Math.round(Number(contract.totalPrice) * 100);
  const paidCents = deposits.filter(d => d.contractId === contract.id && d.status === 'posted')
    .reduce((sum, d) => sum + Math.round(Number(d.amount) * 100), 0);
  return { total: totalCents / 100, paid: paidCents / 100,
    remaining: Math.max(0, totalCents - paidCents) / 100,
    progress: totalCents > 0 ? Math.min(100, Math.round(paidCents / totalCents * 100)) : 0,
    currency: contract.currency };
}

/** @param {{totalPrice:number}} _contract @param {{receiptPaidToDate?:number|null,receiptRemainingBalance?:number|null}} payment */
export function receiptSummary(_contract, payment) {
  const historical = Number.isFinite(payment.receiptPaidToDate) && Number.isFinite(payment.receiptRemainingBalance);
  return { paid: historical ? payment.receiptPaidToDate : null,
    remaining: historical ? payment.receiptRemainingBalance : null, historical };
}

/** @param {string} origin @param {string} token */
export function agreementVerificationUrl(origin, token) {
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || !/^[a-f0-9]{64}$/i.test(token)) throw new Error('Invalid agreement verification link.');
  return `${url.origin}/dashboard/?verify=${encodeURIComponent(token)}`;
}
