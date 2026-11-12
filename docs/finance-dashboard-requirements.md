# Finance Dashboard Requirements

Status: Collecting requirements.

## Recording instructions

- Record each requirement as the owner provides it, step by step.
- Preserve details, corrections, user roles, permissions, workflows, and structural requirements as they are provided.
- Do not summarize requirements or create the implementation plan until the owner explicitly requests a summary.
- When requested, summarize the collected requirements and create a complete dashboard implementation plan covering its users and structure.
- This dashboard belongs to the V2 project and follows the repository's V2 environment and deployment boundaries.

## Universal dashboard rules

Source: [Marketing and Production Dashboard requirements](marketing-production-dashboard-requirements.md), Universal dashboard rules and submission database permissions (requirement 14). Updated at the owner's request; this replaces the earlier Sales-only source reference.

### UDR-001 — Website database isolation and role-limited CRM access

Owner requirement: This is a benchmark and universal rule for every dashboard, not only the Sales Dashboard.

- Admin is the only dashboard permitted to access the main website database.
- Every other dashboard must not fetch data from, read, write, update, or delete anything in the main website database.
- Every non-Admin dashboard must fetch its data from a separate database dedicated to the internal office CRM.
- Each role's access within the internal CRM must be limited to that role's permissions.

### UDR-002 — Tasks tab on every dashboard

- Every dashboard must include a Tasks tab.
- Task workflows and permissions remain to be specified by the owner.

### UDR-003 — Shared submission database and Admin isolation

Owner-confirmed amendment to UDR-001: Non-Admin departments may also access the separate submission database according to their permissions. Their internal workflow data remains in the internal office CRM database. Admin may access the website and submission databases, but must not access the internal office CRM database. Only Admin may access the website database.

Submission database permissions imported from Marketing requirement 14:

- Marketing may submit posts and view their publishing status.
- Admin may review submissions and approve them for publishing through the website database.
- Call Center, Management, Finance, and Sales have read-only access to submissions and publishing statuses, so every department can know which posts are on the website.
- Marketing and other non-Admin departments must not access the website database.

## Requirements

1. **Universal database and access boundary:** Apply UDR-001 to the Finance Dashboard. Specific Finance role permissions will be recorded as the owner provides them.
2. **Tasks tab:** The Finance Dashboard must include a Tasks tab, as required for every dashboard by UDR-002.
3. **Finance data visibility and permissions:** Finance data must be visible only to Management and the Finance user. Management has read-only access. The Finance user has full access to finance data. Other users must not be able to view finance data. These permissions remain subject to UDR-001's database isolation boundary.
4. **Finance role (owner correction, 2026-11-12):** Finance has exactly one role: **Finance Manager**. Remove Finance Assistant from the app. This replaces the earlier two-role requirement and resolves the generic "Finance user" reference in requirement 3 as Finance Manager, who holds the previously specified full Finance access, including recording payments. Management's read-only access remains unchanged.
5. **Universal rules update from Marketing:** Apply UDR-001 as amended by UDR-003. Finance internal workflows use the internal office CRM database; Finance also has read-only access to the separate submission database's submissions and publishing statuses. Admin has no access to the internal office CRM database. This amends requirement 1's original database boundary; the finance data visibility restrictions in requirement 3 remain in effect.
6. **Contract installment tracking:** Finance must track the installments associated with contracts.
7. **Customer deposits:** Finance must handle and record deposits received from customers. The owner described this as "make the deposits from the customers"; the detailed deposit workflow remains to be specified.
8. **Reference finance tracker (owner requirement, 2026-11-12):** Use the finance/payment tracker in the owner's [Attaie Properties contract system](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system) as the reference for the Finance Dashboard. The owner explicitly extends the earlier HR-only reference scope to include this Finance workflow. This supersedes the Finance exclusion in Management requirement 10 only for the requested tracker; it does not adopt the reference app's Admin role, authentication, database setup, or unrelated approval rules.
9. **HR-to-Finance contract handoff:** When HR creates a contract and enters buyer information and installments, Finance must be able to track payments for that contract and its installments. Reuse the same contract, buyer, apartment/project linkage, and installment schedule; do not require Finance to recreate them. This extends requirement 6 and corresponds to [Management requirement 28](management-dashboard-requirements.md). The exact eligibility point for drafts versus issued/signed contracts, and later schedule amendment behavior, remain unspecified.
10. **Contract payment tracker structure:** Follow the reference's contract selection, contract value, total paid, remaining balance, payment progress, installment schedule, and recorded payment/receipt ledger. Track scheduled and paid amounts per installment so unpaid, partly paid, and fully paid installments can be distinguished. Use HR's actual installment schedule; the reference's five-stage label and sample amounts do not impose a fixed installment count or sample data on V2.
11. **Payment recording and receipts:** Extend the customer deposit responsibility in requirement 7 using the reference workflow: record a received payment against the relevant contract and installment, with receipt number, amount, payment date, payment method, notes, and recording user. The reference offers cash, bank transfer, cheque, and other methods and printable/reprintable receipts showing the payment, cumulative paid amount, and remaining contract balance. These are the observed tracker features requested as the reference. Detailed receipt numbering, payment correction/reversal, overpayment, and installment allocation rules remain to be specified.
12. **Finance tracker permissions and boundaries:** Finance Manager is the only Finance role and tracks and records payments while HR prepares contracts and installment schedules. Requirement 4's owner correction resolves the earlier role split; there is no Finance Assistant role or Assistant-to-Manager handoff. Preserve Management's read-only finance access under requirement 3. This integration does not independently grant HR payment-ledger access or Finance permission to edit contracts, buyers, or HR schedules. Keep all internal contract/payment data in the internal office CRM database under UDR-003. Website Admin has no internal CRM access. Use the shared dashboard UI and UX foundation when adapting the reference tracker.
13. **Finance Assistant removal (owner correction, 2026-11-12):** Remove Finance Assistant from selectable roles, demo staff, workflow permissions, task recipients, and new-install role/permission registration. Finance Manager handles the Finance workflow, including preparing and posting payments; the existing draft/post states need not be removed by this role change. For an existing V2 installation, retire Assistant access while preserving user IDs, financial records, and audit history. Do not automatically promote former Assistants to Finance Manager.

## Finance tracker reference observations — 2026-11-12

Read-only source review through the connected GitHub tools on the repository's default branch. These observations support later planning; no reference app runtime, payment persistence, receipt arithmetic, or server authorization was verified. Blob SHAs identify the reviewed files.

- [PaymentView.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/PaymentView.tsx), blob `78a46ef141c2dc98a0d31c4761f5ae2fbcf644c0`: selects a contract, calculates total paid from recorded payments, and displays remaining balance and payment progress. Shows installment descriptions, scheduled/paid amounts, and a payment receipt ledger with date, method, recording user, amount, and reprint action. Its Finance-only entry controls and Admin read-only presentation are reference behaviors; V2 uses its own role boundaries, including no website Admin access.
- [PaymentModal.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/PaymentModal.tsx), blob `63bfb514b83db6038a66f0f1028f82233a5f2410`: captures installment, receipt number, amount, date, payment method, notes, and recording user and calls the payment-recording handler. Reference role checks in this component do not establish server enforcement. Its random sample receipt number, default amount, and sample notes must not be treated as V2 requirements or production numbering rules.
- [PaymentReceipt.tsx](https://github.com/financeattaieproperties-gif/Attaie-properties-contract-system/blob/main/src/components/PaymentReceipt.tsx), blob `956e44f3713fb5b3a0a96b4efeb5fed35c6c97b3`: renders a printable receipt with contract/payment context, amount received, payment date/method, installment, paid-to-date total, and remaining balance. Receipt history calculations and reprinting behavior require validation during implementation, especially after later payments exist.

The source review identifies the requested tracker structure, not an implementation plan. Payment persistence, balance reconciliation, backend permissions, and the HR-to-Finance integration still require design and validation when implementation is authorized.
