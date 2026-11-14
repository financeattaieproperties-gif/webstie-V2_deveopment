# V2 publication verification — 2026-11-14

The website publication workflow now uses explicit `submit_website` and `resubmit_website` actions. Recording a social post is independent. Only the assigned Editor can submit after filming and editing are complete. Each submission contains exactly five distinct protected marketing files and its own immutable revision payload/assets.

Website Admin reviews the current revision. A rejection needs a nonempty reason. Rejected entries can be corrected and submitted as the next revision while preserving snapshots, assets, and review events. Website Admin does not receive CRM credentials. Anonymous photo access is restricted to the published revision; Admin preview requires its separate website session.

## Local evidence

Executed against PHP 8.4, a disposable MySQL server at loopback port 3397, and three randomly named fictional databases:

```powershell
$env:STAFF_LOCAL_TEST='1'
& 'releases/validation/php/php.exe' -d extension_dir=releases/validation/php/ext -d extension=pdo_mysql -d extension=fileinfo staff-service/tests/publication-revisions.php
```

Result: **29 publication revision/database/HTTP/privacy/recovery assertions passed.**

Coverage includes wrong Editor denial; four/six/duplicate photo rejection; Editor attribution despite Sales creating the production entry; website submission without a social platform; rejected revision correction; preserved revision assets; delayed revision-one outbox replay after revision two; anonymous review/photo denial; authorized Admin photo preview; stale revision and blank reason rejection; current revision approval; a deliberately failing submission-status update after the website commit; retry recovery with one website mapping; published-photo access; and continued privacy of rejected older photos. The HTTP fixture substitutes fictional Admin authentication and never contacts Firebase or hosting.

The fresh website mapping migration also had an incompatible unsigned foreign key referencing the signed `properties.id`; this was corrected. Failed submission-status writes now return 503 and leave publication retryable rather than reporting success. Once the website write has committed, rejection returns 409 until publication acknowledgement is recovered. The blocked rejection preserves Approved status and prevents an Editor from substituting a newer revision behind an existing website mapping.

`node tests/staff/browser/marketing-branch.mjs` passed after reproducing the missing selector. It verifies that CEO marketing creation requires an active branch selection and successfully creates the scoped fictional production entry. Staff typecheck also passed after this change.

## Import order

- Internal CRM: `105-submission-revisions-internal.sql` once, after `100-dashboard-completion.sql` and the lead migrations required by the release.
- Third submission database: `106-submission-revisions-third.sql` once, after `055-submissions-db.sql` for a fresh installation, or after verifying existing `055`/`101` tables for an upgrade.
- Website: `102-website-submission-map.sql` against the website schema. Existing tables must be inspected before any upgrade.

These are target-specific migrations. Never import all database files into one database. Back up existing V2 data before additive upgrades; do not reapply one-time ALTER statements blindly.

## Hosted checks pending

Actual cPanel import, real Firebase authentication, website Admin session and CSRF protection, Apache configuration, browser role workflows, Dari/RTL rendering, and owner acceptance remain distinct checks. No hosted upload, import, or verification was performed by this fixture.
