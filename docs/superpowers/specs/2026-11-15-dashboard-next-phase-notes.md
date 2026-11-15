# Dashboard next-phase requirements — owner notes

Recorded: 2026-11-15. Status: requirements captured; implementation resumes in the next session.

## Requested changes

1. **Polish the dashboards.** The existing app layout is exactly what the owner wants. Preserve its structure and improve icons, tables, charts, cards, and other components so the experience feels premium instead of basic.
2. **Make this the permanent dashboard standard.** All current and future dashboard development must follow the approved UX/UI format. This instruction applies to dashboards, not the public website.
3. **Company document vault.** Add a tab backed by cPanel storage, with one folder per department. Department members need upload, update, and delete access to their own folder. The owner also mentioned reading/downloading; whether this permits other departments to read ordinary department folders needs clarification. Every user also needs a personal folder accessible only to that user. Finance documents must be accessible only to CEO and Finance users.
4. **Automatic database backup every five minutes to Google Sheets.** Preserve this requested cadence and destination in the design. Assess what can be exported, how recovery works, and whether a separate restorable database backup is needed alongside Sheets exports.
5. **Upcoming leads, visits, and employee activity.** Add an administrator component using date cards and tables. The administrator chooses a date/day and opens that date card to see the leads, visits, and employee activities for it.
6. **Finance cash requests with approval.** Analyze `C:\Users\RoheenAhmadi\Downloads\expense.xlsx`. Finance requests money for expenses and the administrator approves the request. The request must print on exactly one A4 sheet.
7. **Employee payroll.** Add payroll to the Finance workspace.

## Existing context and constraints

- V2 testing target: `https://website.attaieproperties.com`; separate Website, Internal CRM, and Submission databases.
- Website Admin at `/admin/` is separate from the Firebase CEO/staff workspaces. The word "admin" in items 5 and 6 needs a role decision before implementation; proposed business owner is CEO, without giving Website Admin CRM database access.
- Canonical dashboard foundation: Option 2 Alabaster Architectural Split-Rail. Preserve navigation/layout, English/Dari, RTL, accessibility, and responsive behavior.
- Personal-folder privacy must not silently gain a CEO override. Application privacy does not imply that the hosting account owner cannot access server files; discuss client-side encryption only if that stronger guarantee is required.
- Finance-folder restriction overrides any ordinary cross-department reading permission.
- This note-taking session authorized documentation. No new feature, Google connection, scheduled job, migration, or hosted change was performed.

## Decisions to settle at the start of the next session

- Does "admin" mean CEO for activity visibility and cash approval? Is Manager access branch-scoped and read-only?
- May other departments read/download ordinary department documents, or only explicitly shared documents? Does department access span branches?
- Are personal folders excluded from administrator browsing, or must they also be encrypted against hosting administrators?
- Which V2 databases/tables go to which Google spreadsheet, with what access, retention, and recovery expectations? Credentials, session tokens, and password hashes must not become spreadsheet rows.
- For payroll: pay period, currency, salary types, allowances, deductions, attendance/overtime inputs, approval authority, payment recording, and payslips. No tax/deduction formulas are assumed.
- For cash requests: actual workbook fields, approver, maximum line count, attachment handling, and cancellation/rejection rules.

## Evidence status

- `expense.xlsx` exists at the supplied path. Its contents have not been analyzed in this note-taking session; workbook inspection is the first Finance design task.
- Hosted Website Admin and all 12 staff-role sign-ins were reported successful in the preceding deployment session. This is authentication evidence, not proof of complete workflows.
- The preceding acceptance step remains pending: create/publish one fictional property and verify it on the public listing page.
