import React, { useEffect, useState } from 'react';
import { contractPaymentSummary, receiptSummary } from '../../../../packages/staff-contracts/documents.mjs';
import './staff-documents.css';
import type {
  FinanceDeposit,
  HrContract,
  Role,
} from '../../../../packages/staff-contracts/types';

export interface FinanceWorkspaceProps {
  contracts: HrContract[];
  deposits: FinanceDeposit[];
  actorRole: Role;
  lang?: 'en' | 'fa';
  onManageDeposit: (payload: {
    action: 'draft' | 'approve' | 'return' | 'reverse';
    contractId: number;
    installmentId: number;
    depositId?: number;
    amount?: number;
    paymentMethod?: 'Cash' | 'Bank Transfer' | 'Cheque';
    receiptNumber?: string;
    notes?: string;
    reason?: string;
    version?: number;
    paymentDate?: string;
  }) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function FinanceWorkspace({
  contracts,
  deposits,
  actorRole,
  lang = 'en',
  onManageDeposit,
  onNotice,
  onError,
}: FinanceWorkspaceProps) {
  const canDraft = actorRole === 'finance_manager';
  const canApprove = actorRole === 'finance_manager';
  const t = (en: string, fa: string) => lang === 'fa' ? fa : en;
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<FinanceDeposit | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kabul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));

  const [selectedContractId, setSelectedContractId] = useState<number>(
    contracts[0]?.id || 1
  );
  const selectedContract =
    contracts.find((c) => c.id === selectedContractId) || contracts[0];
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number>(
    selectedContract?.installments.find((i) => i.status !== 'paid')?.id ||
      selectedContract?.installments[0]?.id ||
      1
  );

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Bank Transfer' | 'Cheque'
  >('Cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [reversalReasons, setReversalReasons] = useState<Record<number, string>>({});

  const summary = selectedContract ? contractPaymentSummary(selectedContract, deposits) : null;
  const selectedDeposits = deposits.filter(d => d.contractId === selectedContract?.id);
  const draftCount = selectedDeposits.filter((d) => d.status === 'draft').length;
  useEffect(() => {
    if (selectedContract && !selectedContract.installments.some(i => i.id === selectedInstallmentId))
      setSelectedInstallmentId(selectedContract.installments.find(i => i.status !== 'paid')?.id || selectedContract.installments[0]?.id || 0);
  }, [selectedContract, selectedInstallmentId]);

  const handleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    setBusy(true);
    try {
      await onManageDeposit({
        action: 'draft',
        contractId: selectedContract.id,
        installmentId: selectedInstallmentId,
        amount: Number(amount),
        paymentMethod,
        receiptNumber,
        notes,
        paymentDate,
      });
      onNotice(
        `Draft deposit (${receiptNumber} — $${Number(amount).toLocaleString()}) submitted for Finance Manager approval.`
      );
      setAmount(0); setReceiptNumber(''); setNotes('');
    } catch (err) {
      onError((err as Error).message);
    } finally { setBusy(false); }
  };

  const handleDepositAction = async (
    dep: FinanceDeposit,
    action: 'approve' | 'return' | 'reverse'
  ) => {
    setBusy(true);
    try {
      const reason = reversalReasons[dep.id] || '';
      await onManageDeposit({
        action,
        contractId: dep.contractId,
        installmentId: dep.installmentId,
        depositId: dep.id,
        reason,
        version: dep.version,
      });
      onNotice(`Deposit ${dep.receiptNumber} updated (${action}).`);
    } catch (err) {
      onError((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <section className="panel" data-testid="finance-workspace" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            Finance Department • {canApprove ? 'Finance Manager Approval & Ledger' : 'Read-Only Executive Ledger'}
          </p>
          <h2>{t('Installment and payment tracker','پیگیری اقساط و پرداخت‌ها')}</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge active">
            {t('Contracts','قراردادها')}: {contracts.length}
          </span>
          <span className="badge closed">
            {t('Posted receipts','رسیدهای ثبت‌شده')}: {selectedDeposits.filter(d => d.status === 'posted').length}
          </span>
          <span className="badge pending">
            Pending Draft Deposits: {draftCount}
          </span>
        </div>
      </div>
      {!contracts.length && <p>{t('Contracts and installments issued by HR will appear here.','قراردادها و اقساط صادرشده توسط منابع بشری اینجا نمایش داده می‌شود.')}</p>}
      {selectedContract && summary && <>
        <label className="field">{t('Select agreement','انتخاب قرارداد')}<select data-testid="finance-contract-selector" value={selectedContract.id} onChange={e => setSelectedContractId(Number(e.target.value))}>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.contractSerial} — {c.buyers.map(b => b.name).join(', ')} ({c.apartmentNumber})</option>)}
        </select></label>
        <div className="finance-summary">
          <article><span>{t('Agreement value','ارزش قرارداد')}</span><strong>{summary.total.toLocaleString()} {summary.currency}</strong></article>
          <article><span>{t('Total paid','مجموع پرداخت‌شده')}</span><strong>{summary.paid.toLocaleString()} {summary.currency}</strong></article>
          <article><span>{t('Remaining balance','باقی‌مانده')}</span><strong>{summary.remaining.toLocaleString()} {summary.currency}</strong></article>
        </div>
        <label>{t('Payment progress','پیشرفت پرداخت')} {summary.progress}%<progress className="finance-progress" value={summary.progress} max={100}/></label>
      </>}

      {/* Draft Customer Deposit Form (Finance Manager) */}
      {canDraft && selectedContract && (
        <form
          className="panel"
          style={{ marginTop: 14, marginBottom: 18, borderStyle: 'dashed' }}
          onSubmit={handleDraftSubmit}
          data-testid="finance-draft-deposit-form"
        >
          <h3 style={{ marginTop: 0 }}>
            {t('Record received payment','ثبت پرداخت دریافتی')}
          </h3>
          <div className="form-grid">
            <div className="field">
              <label>Select Issued HR Contract</label>
              <select
                value={selectedContract.id}
                onChange={(e) => {
                  const nextId = Number(e.target.value);
                  setSelectedContractId(nextId);
                  const nextC = contracts.find((c) => c.id === nextId);
                  if (nextC?.installments[0]) {
                    setSelectedInstallmentId(nextC.installments[0].id);
                  }
                }}
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractSerial} — {c.buyers.map((b) => b.name).join(', ')} ({c.projectName} {c.apartmentNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Target Installment</label>
              <select
                value={selectedInstallmentId}
                onChange={(e) => setSelectedInstallmentId(Number(e.target.value))}
              >
                {selectedContract.installments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    #{inst.number} {inst.description} (Scheduled: ${inst.scheduledAmount.toLocaleString()} • Paid: ${inst.paidAmount.toLocaleString()} • {inst.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Deposit Amount ({selectedContract.currency})</label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'Cash' | 'Bank Transfer' | 'Cheque')
                }
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="field">
              <label>Official Receipt Number</label>
              <input
                value={receiptNumber}
                required
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>
            <label className="field">{t('Payment date','تاریخ پرداخت')}<input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)}/></label>
            <div className="field">
              <label>Deposit Verification Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 12 }}>
            <button
              type="submit"
              className="button"
              data-testid="submit-draft-deposit-btn"
              disabled={busy}
            >
              {busy ? t('Saving…','در حال ذخیره…') : t('Save payment draft','ذخیره پیش‌نویس پرداخت')}
            </button>
          </div>
        </form>
      )}

      {/* Contract Installment Schedules */}
      <h3 style={{ marginTop: 14, marginBottom: 8 }}>
        Active HR Contract Installment Schedules ({contracts.length})
      </h3>
      <div className="table-scroll" style={{ marginBottom: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Contract</th>
              <th>Buyer</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Scheduled</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(selectedContract ? [selectedContract] : []).flatMap((c) =>
              c.installments.map((inst) => {
                const remaining = Math.max(0, inst.scheduledAmount - inst.paidAmount);
                return (
                  <tr key={`${c.id}-${inst.number}`}>
                    <td>
                      <strong>{c.contractSerial}</strong>
                      <small>{c.projectName} • {c.apartmentNumber}</small>
                    </td>
                    <td>{c.buyers.map((b) => b.name).join(', ')}</td>
                    <td>
                      <strong>#{inst.number} {inst.description}</strong> ({inst.percentage}%)
                    </td>
                    <td>{inst.dueDate || 'Milestone'}</td>
                    <td>${inst.scheduledAmount.toLocaleString()} {c.currency}</td>
                    <td><strong>${inst.paidAmount.toLocaleString()} {c.currency}</strong></td>
                    <td>${remaining.toLocaleString()} {c.currency}</td>
                    <td><span className={`badge ${inst.status}`}>{inst.status}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Deposits Ledger & Finance Manager Approval Queue */}
      <h3 style={{ marginBottom: 8 }}>
        Customer Deposits & Approval Ledger ({deposits.length})
      </h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Contract & Installment</th>
              <th>Customer</th>
              <th>Amount & Method</th>
              <th>Entered / Approved By</th>
              <th>Status</th>
              {canApprove && <th>Finance Manager Action</th>}
            </tr>
          </thead>
          <tbody>
            {selectedDeposits.map((dep) => (
              <tr key={dep.id} data-testid={`deposit-row-${dep.id}`}>
                <td>
                  <strong>{dep.receiptNumber}</strong>
                  <small>{dep.notes}</small>
                  {(dep.status === 'posted' || dep.status === 'reversed') && <button className="button secondary" type="button" onClick={() => setReceipt(dep)}>{t('Receipt','رسید')}</button>}
                </td>
                <td>
                  <strong>{dep.contractSerial}</strong>
                  <small>Installment #{dep.installmentNumber}</small>
                </td>
                <td>{dep.customerName}</td>
                <td>
                  <strong>${dep.amount.toLocaleString()} {dep.currency}</strong>
                  <small>{dep.paymentMethod}</small>
                </td>
                <td>
                  <strong>{dep.enteredBy}</strong>
                  <small>{dep.approvedBy ? `Approved: ${dep.approvedBy}` : 'Awaiting Approval'}</small>
                </td>
                <td>
                  <span className={`badge ${dep.status}`}>{dep.status}</span>
                  {dep.reversalReason && (
                    <small style={{ display: 'block', marginTop: 4 }}>
                      Reason: {dep.reversalReason}
                    </small>
                  )}
                </td>
                {canApprove && (
                  <td>
                    {dep.status === 'draft' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="button"
                          data-testid={`approve-deposit-btn-${dep.id}`}
                          onClick={() => handleDepositAction(dep, 'approve')}
                          disabled={busy}
                        >
                          Approve & Post
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => handleDepositAction(dep, 'return')}
                          disabled={busy}
                        >
                          Return
                        </button>
                      </div>
                    )}
                    {dep.status === 'posted' && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          placeholder="Reversal reason..."
                          aria-label={t('Reversal reason','دلیل برگشت پرداخت')}
                          value={reversalReasons[dep.id] || ''}
                          onChange={(e) =>
                            setReversalReasons((prev) => ({
                              ...prev,
                              [dep.id]: e.target.value,
                            }))
                          }
                          style={{ padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 6, fontSize: 12 }}
                        />
                        <button
                          type="button"
                          className="button secondary"
                          data-testid={`reverse-deposit-btn-${dep.id}`}
                          onClick={() => handleDepositAction(dep, 'reverse')}
                          disabled={busy || !reversalReasons[dep.id]?.trim()}
                        >
                          Reverse Posted Deposit
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {receipt && <PaymentReceipt contract={contracts.find(c => c.id === receipt.contractId)!} payment={receipt} lang={lang} onClose={() => setReceipt(null)}/>}
    </section>
  );
}

function PaymentReceipt({contract, payment, lang, onClose}: {contract:HrContract;payment:FinanceDeposit;lang:'en'|'fa';onClose:()=>void}) {
  const totals=receiptSummary(contract,payment); const t=(en:string,fa:string)=>lang==='fa'?fa:en;
  return <section className="receipt-sheet" data-testid="finance-payment-receipt" dir={lang==='fa'?'rtl':'ltr'}>
    <div className="no-print modal-actions"><button className="button" type="button" onClick={()=>window.print()}>{t('Print / Save PDF','چاپ / ذخیره PDF')}</button><button className="button secondary" type="button" onClick={onClose}>{t('Close','بستن')}</button></div>
    <h2>{t('Attaie Properties — Payment receipt','املاک عطایی — رسید پرداخت')}</h2>
    <strong>{payment.receiptNumber}</strong> <span className="badge">{payment.status}</span>
    <dl>
      <dt>{t('Agreement','قرارداد')}</dt><dd>{contract.contractSerial}</dd>
      <dt>{t('Buyer','خریدار')}</dt><dd>{contract.buyers.map(b=>b.name).join(', ')}</dd>
      <dt>{t('Project / apartment','پروژه / آپارتمان')}</dt><dd>{contract.projectName} / {contract.apartmentNumber}</dd>
      <dt>{t('Installment','قسط')}</dt><dd>{payment.installmentNumber}</dd>
      <dt>{t('Amount received','مبلغ دریافتی')}</dt><dd>{payment.amount.toLocaleString()} {payment.currency}</dd>
      <dt>{t('Payment date / method','تاریخ / روش پرداخت')}</dt><dd>{payment.paymentDate || payment.postedAt?.slice(0,10)} / {payment.paymentMethod}</dd>
      <dt>{t('Recorded by','ثبت‌کننده')}</dt><dd>{payment.enteredBy}</dd>
      {totals.historical && <><dt>{t('Paid at receipt issuance','پرداخت‌شده هنگام صدور رسید')}</dt><dd>{totals.paid?.toLocaleString()} {payment.currency}</dd>
        <dt>{t('Balance at receipt issuance','باقی‌مانده هنگام صدور رسید')}</dt><dd>{totals.remaining?.toLocaleString()} {payment.currency}</dd></>}
    </dl>
    {payment.status==='reversed'&&<p>{t('Reversed receipt','رسید برگشت‌شده')}: {payment.reversalReason}</p>}
    {!totals.historical&&<p>{t('Historical balance was not recorded for this legacy receipt.','باقی‌مانده تاریخی برای این رسید قدیمی ثبت نشده است.')}</p>}
    <p>{payment.notes}</p><p>{t('Finance signature and company seal','امضای مالی و مهر شرکت')}: __________________</p>
  </section>;
}
