# Finance Manager is the only Finance role

Owner correction, 2026-11-12: remove Finance Assistant. Finance Manager handles deposit entry, posting, returns, and reversals. Existing draft/post states remain; no Assistant approval handoff is required.

## Source changes

- Removed Finance Assistant from staff role choices and labels, preview staff, shared role types, task recipients, database access checks, and deposit entry permissions.
- Removed its new-install role registration and permission grants from the core, inventory, HR/Finance, and combined V2 schema sources.
- Denied sign-in, restored sessions, and reactivation for the retired role in the staff PHP service.
- Updated Finance requirements, the department list, and the master plan to reflect the owner's correction.

## Existing V2 installations

The upgrade SQL is [095-retire-finance-assistant.sql](../../staff-service/database/095-retire-finance-assistant.sql). It has been prepared for manual import, not executed against a server.

1. Back up and verify the selected **separate V2 internal office CRM database** in phpMyAdmin. Do not use V1 or the website database.
2. Import the upgrade SQL through phpMyAdmin. Keep SQL outside the web root.
3. Confirm both result counts are zero: active retired accounts and retired permission grants.
4. Deploy the updated staff app and private PHP service through a newly prepared manual-staging package. Existing ZIPs and staging builds have not been refreshed by this source change.
5. Verify Finance Manager can enter/post deposits and that an old Assistant account cannot sign in, restore a session, or be reactivated.

The migration disables former Assistant accounts and invalidates their sessions. It preserves user IDs, payments, contracts, and audit history; it does not promote anyone. A legacy role row remains only if users still reference it, to preserve foreign keys. New installations do not register that role.

No hosting upload or database operation is authorized or performed by preparing these files. Server behavior and the SQL upgrade require verification in the V2 testing environment after manual deployment/import.

## Local verification — 2026-11-12

- The new retired-role regression failed before the change because Finance Assistant still had CRM access. It passes after removal; it also checks task assignment and deposit denial.
- All 27 staff domain and packaging checks passed; the staff package's `npm test` also passed all 23 domain checks.
- PHP 8.4 syntax validation passed for `staff-service/src/App.php`.
- `git diff --check` passed.
- Staff `npm run typecheck` remains failing due to existing model/component mismatches, including missing FinanceDeposit fields, HR buyer field naming, EngineeringDeliverable fields, and DashboardData preview fields. A compiler-host comparison substituting HEAD versions of the changed TypeScript files produced 98 baseline diagnostics and 97 current diagnostics, with no new diagnostic messages. No clean type-check or build is claimed.
- No database migration, live sign-in test, hosting deployment, or visual browser check was performed.
