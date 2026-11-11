# Current staff implementation

## Latest V2 implementation update

2026-11-11 complete testing kit: use `releases/v2-complete-test-20261111-resumed/`, including separate public/private archives and manual SQL. Local verification and remaining hosting checks: `v2-kit-verification-2026-11-11.md`. Earlier complete-kit folder failed integrity checks; preserved but superseded. Nothing deployed.

2026-11-11 UI update: call center is now English-only with the owner's teal palette; management keeps its existing language/theme. See `callcenter-theme-20261111.md` for changed files, checks, and the latest frontend build. Earlier full packages have the previous appearance.

The resumed implementation now lives in this original writable checkout, not only in the old managed worktree. Staff paths were recovered from clean committed `feature/callcenter-dashboard` files without merging or replacing unrelated changes. The current V2 guidance in AGENTS.md supersedes historical repository-wide backend/database freezes.

Firebase email/password login and password reset replace the recovered staff password login. MySQL provisioning uses exact Firebase UIDs; the shared core registers all departments/roles. New-install SQL: `staff-service/database/001-core.sql`, followed by `010-callcenter.sql`. Future dashboard modules add owned tables and new registry/permission rows without altering existing tables or records. No other department dashboard was built.

See `deployment/staff/README.md` for manual testing deployment and `docs/staff/modular-firebase-verification.md` for fresh verification and remaining live setup. Older results below are historical. No merge, push, deployment, or live V1 operation occurred.

---

Updated 2026-11-10 after the owner authorized implementation, excluded the sales dashboard, and supplied the CTC upload archive.

Code is committed as `2de491a` on branch `feature/callcenter-dashboard` in the managed worktree (not merged or pushed):

`C:/Users/RoheenAhmadi/.codex/worktrees/f277/WebsiteVersion2`

Do not assume the application code is in this original `master` checkout. Existing local edits, restored project artwork, protected V1 endpoints/database, and production remain untouched here.

Implemented: call center overview/follow-ups/customers/leads/My Tasks; same-design management task assignment and agent creation; new independent PHP/MySQL staff service and schema; automatic customer creation from lead submission; role restrictions, transactions and idempotent retries; EN/FA/RTL; isolated manual package tooling. No sales dashboard was built. Sales backend behavior was exercised through API tests only.

Automatic Etisalat ingestion is not connected. The archive has candidate callback field/status aliases, not proof of final disconnection events or direct mobile-call reporting. It was reviewed read-only and not installed.

Later saved-page analysis found a CPaaS CTC Pingback `Call_End` setting, candidate report end-time/agent/call-ID fields, and a documented Pull Report API. See `cpaas-page-review-2026-11-10.md`. These are platform capabilities, not verification of current account settings or actual event payloads; automatic ingestion is still disabled.

Read the worktree's `docs/staff/implementation-verification.md`, `docs/staff/implementation-progress.md`, and `deployment/staff/README.md` for observed tests, current limitations and manual staging instructions. Final package successfully prepared at `releases/callcenter-manual-staging-20261110-final/` in that worktree. Never upload its private setup/app/SQL into webroot. Verified locally: 9 Node tests, 13 PHP assertions, 34 real PHP/MariaDB API assertions, two-connection races, three browser workflows, builds/typechecks/syntax, packaging privacy, and fixture backup/restore.

Local preview while dev server is running: `http://127.0.0.1:5175/callcenter/?preview=1`; management uses `/management/?preview=1`. Clearly labeled preview is nonpersistent and removed from upload builds.

The original 13-task production plan is not entirely complete: provider events/workers, sales UI (explicitly deferred), privileged MFA/operational hardening, existing admin static noindex/UI alignment, hosting verification and owner deployment checks remain. Do not report this as deployed or fully production-verified.
