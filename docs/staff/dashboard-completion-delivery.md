# V2 dashboard completion: manual testing delivery

Target: `https://website.attaieproperties.com` only. V1's document root and databases remain untouched. A prepared package is not an installed or verified server.

## Prepare locally

Run `node scripts/package-dashboard-completion.mjs --audit-source` for source checks. After all tests and type checks pass, run `node scripts/package-dashboard-completion.mjs`. An optional first argument names a new `releases/manual-staging-dashboard-completion-*` directory.

The script builds website, `/admin/`, `/dashboard/`, `/management/`, `/callcenter/`, and the Sales PWA fresh. It includes `/ceo/`, `/sales-leader/`, `/finance/`, `/marketing/`, and `/engineering/` entry points into the same authorized staff app. It never copies repository-root `dist`, reads `.env.local` or private Firebase PHP configuration, or copies the entire public asset tree. It copies only referenced public artwork, shared fonts/logo, and bundled source assets. Reusable explorer code remains; new project/unit catalogs contain no showcase records.

Set `VITE_STAFF_FIREBASE_API_KEY` in the packaging process environment before building. It is Firebase's public web API identifier, not a service-account secret. Missing configuration stops packaging before upload output is created. Maps likewise accept `VITE_GOOGLE_MAPS_API_KEY` from process environment only.

## Three separate databases

Create three **new empty V2 testing databases**, with distinct least-privilege users. In phpMyAdmin explicitly select each database and run `SELECT DATABASE();` before import:

1. Website database: `database/fresh/01-website.sql` only.
2. Internal Office CRM database: `database/fresh/02-internal-crm.sql` only.
3. Submission database: `database/fresh/03-submissions.sql` only.

Never combine the files or import them into V1. Only Admin accesses website data. Staff runtime accesses internal CRM and authorized submission workflows; Admin must not receive internal CRM credentials.

Existing V2 installations: back up all three databases, current upload files and private configuration first. Use `database/upgrade/README.md`; do not import fresh schemas. Inspect installed versions/columns, apply missing role migration 090 if needed, then 095 and 100 to Internal CRM. Migration 095 disables retired Finance Assistant accounts and preserves historical references. Migration 100 adds fields/tables and adjusts permission grants. Run each ALTER once; inspect partial failures before proceeding. No existing inventory/account reset is authorized.

## Configure private files

Extract `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` outside **all** document roots, for example `/home/CPANEL_USER/attaie-v2-private/`. Keep SQL and this guide outside web roots too.

Copy `config.example.php` to `config.php`. Enter the separate internal CRM connection, submission connection required by the template, V2 Firebase project ID/web API key, exact testing origin, and writable private session directory. Copy `website-db.example.php` to `website-db.php`; set website credentials and separate submission credentials. Keep `ATTAIE_MANUAL_SCHEMA=true`, so HTTP requests do not perform schema migrations. Leave CTC disabled for testing.

Edit the paths in public `staff-api/paths.php` and `api/db.php` to the absolute private directory. These public files contain paths only, never credentials. Confirm private source includes every file under `app/src/`, including `Completion.php` and `CompletionRules.php`.

Provision first Admin (CEO) in the **V2 Firebase Authentication** console. Enable Email/Password, authorize `website.attaieproperties.com`, and map exact UID/email using `database/04-firebase-owner.template.sql` in Internal CRM. Only CEO provisions staff. Sign in as CEO, create an inactive branch, provision its Firebase Manager with the exact UID/email and branch, assign that Manager, then activate the branch. No staff password belongs in SQL or upload files. Website `/admin/` authentication is separate: use `tools/create-website-admin-hash.py` locally, then the website-admin SQL template. Follow `CPANEL-STEP-BY-STEP.md` for all steps.

## Upload and check

Extract the **contents** of `UPLOAD-WEBSITE-CONTENTS.zip` into the testing document root, including `.htaccess` and `.user.ini`. Do not upload the entire release directory. Keep `database/`, `private/`, manifests, setup materials, and login details outside the web root. Ensure intended upload directories are writable by PHP without enabling script execution.

Check homepage and empty project catalog; `/admin/`; every staff entry URL and deep links; Firebase login/session expiry; CEO project creation and upload; Manager party portraits/boundaries and contract issuance; agreement QR verification privacy; Finance payments/receipts/reversals; Editor five-photo review/corrections/publication; public inquiry receipts and private chat; and role-denied API requests. Use fictional test entries only. Check browser console/network errors, 375/768/1024/1440 layouts, keyboard controls, Dari/RTL, print layouts, and PHP error logs. Confirm website Admin cannot read CRM and staff cannot read website data.

The package includes no default credentials, project/unit seeds, private account mappings, or claim of successful installation. Record actual import results and server checks before accepting delivery as deployed. Keep `BUILD-STATUS.json` as a local build record; its upload/import/server flags remain false.

## Rollback

Preserve existing uploads/private files and UID mappings. Restore the prior application package plus matching database/file backups if a migration requires rollback. Do not delete V2 records or run a destructive reset to roll back this delivery. Restore only the testing environment; V1 remains untouched.
