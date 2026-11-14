# V2 readiness work — session handoff (2026-11-14)

Resume the approved V2 readiness implementation on branch `codex/v2-revised-workflows` in this repository. The owner said “yes please continue” to implementation of the latest revised plans. Work only against V2 source and isolated fictional MySQL fixtures. Do not read `.env.local` or real `public/api/db.php`, do not touch V1, and do not deploy or operate on hosting.

## Current state

- Inquiry plan `docs/superpowers/plans/2026-11-13-v2-website-inquiries-plan.md` is completed and reviewed; commits are in the branch.
- Lead uniqueness plan `docs/superpowers/plans/2026-11-13-v2-lead-uniqueness-plan.md`: Task 1 committed as `312d071 feat: define canonical customer property lead claims`; Task 2 implementation is modified/uncommitted; Task 3 UI is not started.
- Publication review and acceptance/staging plans have not started. Read the readiness index, specs, and plan ledgers before further work.
- Latest git status at handoff: modified `staff-service/src/App.php`, `staff-service/src/Completion.php`; untracked `staff-service/tests/lead-property-http-fixture.php`, `tests/staff/api/lead-property-concurrency.mjs`, `tests/staff/api/lead-property-http.mjs`, `tests/staff/api/lead-property-support.mjs`.
- Task 2 targeted local validation last passed: 28 real MySQL/HTTP assertions and 10 separate-connection concurrency assertions. Re-run after inspecting changes, then PHP lint and staff typecheck before committing.
- Existing broad `tests/staff/api/completion-http.mjs` is known to fail at baseline because its fixture seeds retired `hr_manager`, absent from canonical `core_roles`; the existing source also lacks branch IDs in unrelated paths. Report this accurately and do not restore retired roles just to satisfy the old fixture. Update or supersede old fixtures transparently as integration requires.
- An async clarification is pending from the owner: onboarding docs give staff provisioning to Manager, but current SQL gives it to CEO. Do not change this policy until answered; it does not block lead workflow work.

## Next steps

1. Read applicable `AGENTS.md`, startup/skill rules for the fresh session, readiness index, relevant plan/spec, and the lead uniqueness progress ledger. Preserve current branch and uncommitted work.
2. Inspect Task 2 diff and rerun `node tests/staff/api/lead-property-http.mjs` and `node tests/staff/api/lead-property-concurrency.mjs`; run PHP lint and `npm.cmd run typecheck --prefix apps/staff` (or the repo's documented equivalent). Fix genuine regressions and commit Task 2 with scoped git identity if needed; do not change global git identity.
3. Execute Task 3: staff UI/API explicit project-vs-unit property selection, authorized inventory, draft/activation/change workflows, conflict feedback, localized EN/FA, RTL and browser coverage. Preserve form data on failures. Follow the plan's TDD sequence.
4. Continue publication review and acceptance/staging plans per readiness index. Keep test deployment preparation separate from actual deployment; owner manually uploads/imports later. No external operation without environment verification.
5. Keep the progress ledger current. Final report must distinguish completed source work from remaining owner upload/import/server verification gates.

Prior validation context and architectural constraints are in the session history and project `AGENTS.md`. The V2 owner clarification removes old V1 freeze restrictions for V2 source and the separate V2 DB, but does not authorize production deployment or V1 changes. New packages must start with empty project/unit catalogs; retain reusable explorer code. Dashboard UX is Alabaster Split-Rail and public/customer-facing strings must support English/Dari and RTL.

## Remote update pulled before new session

- Fetched `origin` and merged `origin/master` commit `d9f4490` (`feat: add biometric authentication and mobile UI`) into this feature branch in merge commit `b3162d0`.
- Merge was clean; there are no unresolved conflicts. The remote adds the Sales mobile/PWA and biometric work, supporting staff hooks/components, Android project/assets/screenshots, and related contract/API/build changes. Keep these changes when continuing.
- Restored the in-progress Task 2 local changes after merging. They remain uncommitted as listed above. The handoff file is also untracked and must be preserved.
- No application tests were run after the remote merge; inspect overlapping staff API/UI/contracts and run relevant checks while resuming.
- No commit was pushed and nothing was deployed.
