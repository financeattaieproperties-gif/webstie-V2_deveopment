# V2 remaining implementation audit

Reviewed: 2026-11-15. This is an evidence audit, not a new implementation plan or authorization to deploy.

## Scope and interpretation

Compared the historical `plans/` documents, master status/audits, department requirements, and November 10–15 specs/plans with current public, Admin, staff, PHP, packaging, and test source. Current V2 rules in `AGENTS.md` control: separate testing databases and document root, manual owner upload/import, empty project/unit catalogs, existing Alabaster UI, EN/FA and RTL. No V1 or hosted operation was performed. Existing uncommitted application changes were preserved.

Unchecked boxes are not reliable evidence of missing implementation. The November 4 master status and November 10–11 staff status are particularly stale. Source presence establishes implementation, not runtime acceptance. Historical local test results below are identified separately from checks rerun today.

## 1. Current build blocker — fix before packaging

`npm.cmd --prefix apps/staff run typecheck` currently fails:

```text
vite.config.ts(39,5): error TS2321: Excessive stack depth comparing types 'Plugin<any>[]' and 'Plugin<any> | Plugin<any>[]'.
vite.config.ts(40,7): error TS2345: Argument of type 'Plugin<any>[]' is not assignable to parameter of type 'Plugin<any> | Plugin<any>[]'.
```

The affected code pushes the PWA plugin into the Vite plugin array in [staff Vite configuration](../../../apps/staff/vite.config.ts:39). Diagnose package/type compatibility before claiming a current successful release. Existing generated binaries do not establish that current source builds.

## 2. Concrete remaining implementation

| Priority | Remaining work | Evidence and limits |
| --- | --- | --- |
| P1 | Finish Windows staff distribution and validate packaged startup. | [Staff package scripts](../../../apps/staff/package.json:13) use Electron Packager to generate an application folder, not the installer requested by the [November 15 master](2026-11-15-app-master-comprehensive-plan.md). [Electron main](../../../apps/staff/electron/main.cjs:16) loads `dist/index.html`, while [Vite](../../../apps/staff/vite.config.ts:127) uses role-specific HTML entries and role-root asset paths. Resolve entry/assets/API origin and verify authenticated desktop startup. [Preload](../../../apps/staff/electron/preload.cjs:1) is a placeholder; add only native capabilities actually needed. |
| P1 | Implement private testing-role map generation and packaging, if following the November 14 release plan. | [Release plan Tasks 1–2](2026-11-14-v2-testing-release.md:43) require `scripts/create-testing-role-mapping.mjs`, map validation, and private `04-firebase-role-mapping.sql`. Generator and mapper tests are absent. [Current packager](../../../scripts/package-dashboard-completion.mjs:135) emits a generic owner template; it does not consume `V2_TESTING_ROLE_MAP_FILE`. Keep real mappings outside Git/public output. |
| P1 | Remove silent truncation of large unit catalogs. | [Public data service](../../../src/lib/dbService.ts:273) and [second pagination loop](../../../src/lib/dbService.ts:292) stop after 20 pages, then return `has_more: false` and the collected length as total. More than 2,000 units at limit 100 can be silently omitted. Continue until genuine exhaustion or expose a truthful incomplete/paginated result. |
| P2 | Complete Careers live information if that draft scope remains wanted. | [Careers spec](../specs/2026-11-04-careers-and-job-applications-design.md:20) calls for Kabul date/clock/weather. [KabulLiveInfoBar](../../../src/pages/CareersPage.tsx:49) is defined but never mounted; its weather effect fetches on mount, without periodic refresh. Careers jobs/application functionality otherwise exists. The spec is explicitly marked draft, so this is a documented scope gap rather than proof of later owner approval. |
| P2 | Finish localization of publication review controls. | [Admin publishing page](../../../admin-panel/src/pages/PublishingTasks.tsx:338) hardcodes Revision and [Review history](../../../admin-panel/src/pages/PublishingTasks.tsx:459), with no translation hook. Publication Task 3 requires localized strings; staff Marketing controls already use translations. |
| P2 | Surface incomplete SEO configuration instead of silently returning success defaults. | [SEO settings API](../../../public/api/get-seo-settings.php:27) returns defaults on prepare failure, missing row, or caught errors (also lines 34–35 and 43–44). Distinguish a deliberate fallback from a broken database/settings setup and verify the intended public error contract. |
| Conditional | Complete automatic Etisalat event ingestion/provider workers. | [Staff API](../../../staff-service/src/App.php:192) explicitly reports automatic capture disconnected; [staff UI](../../../apps/staff/src/main.tsx:1473) states the same. Manual call/lead workflows exist. Real payload/account verification is still required. Keep chargeable calls disabled in testing packages until separately authorized. |
| Conditional | Add durable offline CRM mutations and synchronization if the November 15 offline-first promise is retained. | [Staff main](../../../apps/staff/src/main.tsx:312) restores cached views and reconnects; [API](../../../apps/staff/src/api.ts:29) still requires network for mutations. [Sales PWA](../../../apps/staff/vite.config.ts:106) deliberately excludes authenticated API responses from service-worker caches. Offline viewing exists; a durable write queue, replay/conflict policy, and sync acceptance are additional work. Do not solve this by caching private API responses indiscriminately. |

## 3. Missing acceptance coverage and release evidence

The [November 13 acceptance plan](2026-11-13-v2-acceptance-staging-plan.md) and [November 14 release plan](2026-11-14-v2-testing-release.md) remain partly implemented:

- `tests/website/integrated-workflow.mjs` is absent. Existing separate suites do not establish the complete Editor → Admin publication → public listing → offline inquiry → Admin follow-up → CRM boundary flow.
- `tests/staff/api/role-matrix.mjs` exists and enumerates the 12 canonical roles, but has representative session/tasks/branch/finance/provisioning cases rather than the full planned route/scope matrix, revocation and cross-application acceptance. The planned `tests/staff/fixtures/role-route-matrix.json` is absent. Extend meaningful behavior coverage rather than requiring a particular filename alone.
- `tests/staff/browser/publication-review.mjs` is absent. Publication PHP fixture coverage exists, but full Editor correction/resubmission and Admin review browser acceptance still needs evidence. The actual fixture is `staff-service/tests/publication-revisions.php`; older plan filenames differ.
- `tests/staff/browser/dashboard-release-responsive.mjs` is absent. Verify every release entry/deep route at mobile/desktop widths, navigation targets, keyboard, RTL, no overflow, and Alabaster shell consistency.
- Dedicated `tests/staff/api/staff-provisioning.mjs` and `tests/staff/packaging/onboarding.test.mjs` are absent. Branch-onboarding and role tests provide partial coverage; complete invalid/duplicate UID/email, department/role/team assignment, hash-helper failure paths, and handoff privacy assertions.
- `tests/staff/packaging/revised-workflow.test.mjs` is absent. Existing packaging tests cover source composition and isolation; complete actual archive/extracted-tree and additive-upgrade preservation checks for the revised workflows.
- `docs/staff/v2-revised-workflow-acceptance.md` is absent. Record reproducible results and hosted `not_run` checks in one current acceptance ledger.
- Older enquiries/unit plans still lack the named public form/unit/visit API/end-to-end suites (`tests/api/` and `admin-panel/src/__tests__/` are absent). Tests may use other names; verify actual boundary coverage before declaring those requirements accepted.

Substantial package work already exists: [packager](../../../scripts/package-dashboard-completion.mjs:112) composes three distinct databases, includes inquiry/lead/publication migrations, private chat configuration, upgrade guidance, and the [private Admin hash helper](../../../scripts/create-website-admin-hash.py). Do not rebuild these as if absent. A fresh package must be produced after current source blockers are fixed and acceptance passes.

## 4. New master-plan statements need reconciliation

The [November 15 master](2026-11-15-app-master-comprehensive-plan.md) introduces ambitions that do not match the earlier implemented department scope:

- HR attendance, employee onboarding and employee contracts: current HR centers on property parties, buyer agreements, installments, and amendments ([Completion dispatcher](../../../staff-service/src/Completion.php:65)).
- Finance invoicing and budget reports: current implementation centers on contract deposits, receipts, approvals, and reversals ([Finance dispatch](../../../staff-service/src/Completion.php:68)).
- Marketing campaign management and automatic social publishing: existing controls record social posts and separately submit website listings ([Marketing UI](../../../apps/staff/src/components/MarketingWorkspace.tsx:360)); a platform publishing integration is separate work.
- Engineering infrastructure/deployment monitoring: current Engineering tracks assigned design deliverables and reviewed versions ([Engineering dispatch](../../../staff-service/src/Completion.php:72)).
- The master describes Capacitor/SQLite; the actual Android implementation includes a Kotlin activity and biometric bridge. Reconcile the intended architecture before planning a migration.
- Glassmorphism guidance conflicts with the mandatory Alabaster Split-Rail standard. Follow `AGENTS.md` unless the owner explicitly scopes a design change.

Treat these as unresolved scope additions, not defects in the older department implementation. Historical customer accounts/saved properties, a blog CMS, WhatsApp inbox, and a separate iOS app likewise remain deferred product choices rather than current testing-release blockers.

## 5. Implemented items that stale documents call incomplete

- Public listing/detail/projects/About/Contact, bilingual interface, Admin CMS, Careers jobs/applications, blueprint viewer, agents/branches, visits and project units have current source implementations.
- Staff Sales, Management/CEO, HR contract, Finance payment, Marketing and Engineering components and backend routes exist ([workspace wiring](../../../apps/staff/src/main.tsx:1502), [module dispatcher](../../../staff-service/src/Completion.php:63)). `docs/staff/current-implementation.md` incorrectly says other dashboards were not built and Sales UI remains deferred.
- Inquiry receipts, durable public inquiry queue, Admin follow-up and cross-browser private chat are implemented. [November 14 verification](../../staff/v2-inquiry-local-verification-2026-11-14.md) records local HTTP/browser/race evidence; those suites were not rerun during this audit.
- Customer/property uniqueness and staff selectors exist, including `tests/staff/browser/lead-property-entry.mjs`. The November 14 handoff's “Task 3 not started” is stale.
- Revisioned publication, five-photo validation, reject/correct/resubmit, immutable assets, review history and retry-safe mapping exist. [Publication verification](../../staff/v2-publication-verification-2026-11-14.md:16) records 29 local assertions. This does not replace missing integrated browser/hosted acceptance.
- Old SEO/backend findings already addressed include real detail 404s ([SEO handler](../../../public/seo.php:274)), transactional project deletion ([projects API](../../../public/api/admin/projects.php:86)), content-inspected uploads ([upload endpoint](../../../public/api/admin/upload.php:77)), blocked HTTP migrations, price/area/studio filtering, visible Admin unit-load errors, and lazy public routes. Do not implement those fixes twice.
- `website.attaieproperties.com` is the authorized V2 testing origin, not a hostname to replace because an older production SEO audit called it a placeholder. Testing packages deliberately block indexing.

## 6. Checks actually run during this audit

| Check | Observed result |
| --- | --- |
| `npm.cmd run lint` | Passed. This script runs the public TypeScript check, not ESLint. |
| `npm.cmd --prefix apps/staff run typecheck` | Failed with TS2321/TS2345 at Vite plugin array lines 39–40. |
| `npm.cmd --prefix apps/staff test` | Passed: 55 domain tests. |
| `node scripts/package-dashboard-completion.mjs --audit-source` | Passed: empty catalog, required source/schema inputs, separate schema check. This is not an archive/runtime audit. |
| `node --test tests/staff/packaging/deployment-readiness.test.mjs tests/staff/packaging/isolation.test.mjs tests/staff/packaging/completion-schema.test.mjs tests/staff/packaging/branch-migration.test.mjs` | 9 passed, 2 failed. Both failures are connection refusals from the unavailable disposable loopback MySQL fixture at port 3397, before migration assertions. No migration defect was established. |

No complete rebuild, desktop/Android launch, browser acceptance, hosted Firebase login, provider call, upload, or database import was performed. Source checks and historical results are not deployment evidence.

The existing `releases/manual-staging-dashboard-completion-20261114-ready/BUILD-STATUS.json` identifies the testing origin and leaves `serverUploaded`, `databaseImported`, and `serverVerified` false. Do not infer hosted installation from its folder name.

## Recommended implementation order

1. Fix current staff typecheck and verify current build configuration.
2. Correct unit pagination; settle whether the dormant Careers information bar remains in scope.
3. Complete integrated permissions/publication/onboarding/responsive acceptance using the disposable fictional database fixtures.
4. Finish private role-map delivery and rebuild/audit a new manual staging package.
5. Validate Windows startup/distribution and Android device behavior as distinct platform deliverables.
6. Keep owner upload/import/hosted acceptance separate. Scope automatic provider ingestion, offline writes, and newly proposed department functions explicitly before implementing them.

Documentation cleanup should accompany this work: update the readiness index and old status/handoff ledgers with evidence-backed states; preserve historical context without letting stale checkboxes drive duplicate development.
