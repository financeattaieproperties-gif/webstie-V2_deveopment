# Attaie Properties V2 — Development progress

_Last updated: 2026-11-27. This is a development-branch ledger, not production acceptance._

## Branch and scope
- Repository: `financeattaieproperties-gif/webstie-V2_deveopment`
- Working branch: `feature/customer-marketplace-phase2-identity-foundation`
- Draft PR: https://github.com/financeattaieproperties-gif/webstie-V2_deveopment/pull/3
- No production deploy, merge or database migration has been performed.

## Phase 2: implemented in source
- Firebase bearer-token customer account bootstrap and server-side verification.
- Individual and agency customer account types.
- Owner-only agency application, representative/business contacts, private documents.
- Website Admin approval/rejection with explicit business-contact and document review confirmations.
- Rejected -> revision -> pending resubmission with optimistic version checks.
- Private document replacement: current metadata vs retained superseded versions, upload audit and lifetime cap.
- Transactional audit events for agency profile, representative/contact and document changes.
- Website Admin audit history and retained-document inspection.
- Customer email/password sign-up, verification, sign-in, in-memory refresh and account onboarding route `/customer/account` (requires real Firebase configuration).

## Still incomplete / not verified
- **Phone OTP** via Firebase supported phone-auth/reCAPTCHA and Afghan carrier acceptance.
- Full immutable before/after field snapshots for agency edits.
- Staging database migrations (manual only), staging storage setup, backup and rollback drill.
- Actual PHP lint, unit tests, MySQL HTTP integration tests, TypeScript build, responsive browser tests and authenticated workflow tests on current branch.
- Firebase deployment configuration, privacy/security review, document malware scanning and retention policy.
- Reconfirming previously stored owner verification flags at admin approval.
- Customer property listing submission and publication workflow (later phase).

## CI
- `.github/workflows/customer-identity-checks.yml` is intentionally manual-only due to earlier GitHub Actions jobs failing before steps appeared.
- Attempts to retrieve historical logs returned a missing GitHub blob. The failure cause remains unconfirmed.
- Do not re-enable automatic triggers or report CI green without a successful run.

## Next safe work for Codex Terminal
1. Pull branch and run `php -l` for changed customer/admin PHP files.
2. Run `php tests/website/customer-agency-revision.php` and `php tests/website/customer-agency-verification.php`.
3. Run `npm ci`, `npx tsc --noEmit` and `npx tsc --noEmit -p admin-panel/tsconfig.json`.
4. Fix any verified type/build failures; check that the new customer route renders without Firebase config and fails safely.
5. Set up backed-up **staging only** after explicit authorization; apply migrations in documented order, test full agency lifecycle and private document access.
6. Implement supported Firebase phone auth and complete end-to-end browser acceptance after user approval of provider configuration.

## Required gate
Do not merge, deploy, apply production migrations or expose private document intake until test evidence and security/privacy review are complete.
