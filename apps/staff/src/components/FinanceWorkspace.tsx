import React, { useState } from 'react';
import type {
  FinanceDeposit,
  HrContract,
  Role,
} from '../../../../packages/staff-contracts/types';

export interface FinanceWorkspaceProps {
  contracts: HrContract[];
  deposits: FinanceDeposit[];
  actorRole: Role;
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
  }) => Promise<unknown>;
  onNotice: (msg: string) => void;
  onError: (err: string) => void;
}

export function FinanceWorkspace({
  contracts,
  deposits,
  actorRole,
  onManageDeposit,
  onNotice,
  onError,
}: FinanceWorkspaceProps) {
  const canDraft =
    actorRole === 'finance_assistant' || actorRole === 'finance_manager';
  const canApprove = actorRole === 'finance_manager';

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

  const [amount, setAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash' | 'Bank Transfer' | 'Cheque'
  >('Cash');
  const [receiptNumber, setReceiptNumber] = useState('RCP-2026-1088');
  const [notes, setNotes] = useState('Customer installment payment received at Finance counter.');
  const [reversalReasons, setReversalReasons] = useState<Record<number, string>>({});

  const totalContractValue = contracts.reduce((s, c) => s + Number(c.totalPrice || 0), 0);
  const totalPosted = deposits
    .filter((d) => d.status === 'posted')
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const draftCount = deposits.filter((d) => d.status === 'draft').length;

  const handleDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      await onManageDeposit({
        action: 'draft',
        contractId: selectedContract.id,
        installmentId: selectedInstallmentId,
        amount: Number(amount),
        paymentMethod,
        receiptNumber,
        notes,
      });
      onNotice(
        `Draft deposit (${receiptNumber} — $${Number(amount).toLocaleString()}) submitted for Finance Manager approval.`
      );
    } catch (err) {
      onError((err as Error).message);
    }
  };

  const handleDepositAction = async (
    dep: FinanceDeposit,
    action: 'approve' | 'return' | 'reverse'
  ) => {
    try {
      const reason = reversalReasons[dep.id] || '';
      await onManageDeposit({
        action,
        contractId: dep.contractId,
        installmentId: dep.installmentId,
        depositId: dep.id,
        reason,
      });
      onNotice(`Deposit ${dep.receiptNumber} updated (${action}).`);
    } catch (err) {
      onError((err as Error).message);
    }
  };

  return (
    <section className="panel" data-testid="finance-workspace">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            Finance Department • {canApprove ? 'Finance Manager Approval & Ledger' : canDraft ? 'Finance Assistant Deposit Entry' : 'Read-Only Executive Ledger'}
          </p>
          <h2>Contract Installment Schedules & Customer Deposits</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge active">
            Total Contract Value: ${totalContractValue.toLocaleString()} USD
          </span>
          <span className="badge closed">
            Posted Collections: ${totalPosted.toLocaleString()} USD
          </span>
          <span className="badge pending">
            Pending Draft Deposits: {draftCount}
          </span>
        </div>
      </div>

      {/* Draft Customer Deposit Form (Finance Assistant & Finance Manager) */}
      {canDraft && selectedContract && (
        <form
          className="panel"
          style={{ marginTop: 14, marginBottom: 18, borderStyle: 'dashed' }}
          onSubmit={handleDraftSubmit}
          data-testid="finance-draft-deposit-form"
        >
          <h3 style={{ marginTop: 0 }}>
            Prepare Draft Customer Deposit (Requires Finance Manager Approval to Post)
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
                min={1}
                step="0.01"
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
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>
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
            >
              Save Draft Deposit
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
            {contracts.flatMap((c) =>
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
            {deposits.map((dep) => (
              <tr key={dep.id} data-testid={`deposit-row-${dep.id}`}>
                <td>
                  <strong>{dep.receiptNumber}</strong>
                  <small>{dep.notes}</small>
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
                        >
                          Approve & Post
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => handleDepositAction(dep, 'return')}
                        >
                          Return
                        </button>
                      </div>
                    )}
                    {dep.status === 'posted' && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          placeholder="Reversal reason..."
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
    </section>
  );
}
