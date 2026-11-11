# V2 call-center module: manual testing setup

This package adds `/callcenter/`, `/management/`, and `/staff-api/` to the V2 testing website at https://website.attaieproperties.com. It is not a deployment to the main domain. Other department dashboards and automatic Etisalat ingestion are not included.

## Prepare Firebase and the build

Firebase Authentication owns passwords. MySQL stores provisioned UID/profile/role records and application data. There is no local-password fallback or public staff registration.

1. Use the owner's Firebase project `roheenahmadi-907a7`. In Firebase Console, enable Authentication > Email/Password. Add `website.attaieproperties.com` to authorized domains. Configure password reset email templates and app/API-key restrictions appropriate for the web app and PHP account lookup service.
2. Create the CEO account in Firebase Authentication. Keep its password in your password manager; never put passwords in SQL or chat. Copy its exact UID and email for the provisioning step below.
3. Before building, set `VITE_STAFF_FIREBASE_API_KEY` in `apps/staff/.env.local`. This checkout has the owner-supplied public web key configured. The web key is a project identifier, not a service-account credential. No service-account private key is required by this implementation.
4. Prepare a new output directory: `powershell -File scripts/package-staff.ps1 -OutputDirectory <NEW_OUTPUT_FOLDER> -PhpExecutable <LOCAL_PHP_EXECUTABLE>`. Node/Vite and local PHP are preparation tools only. No cPanel Terminal or web installer is required.

## Import a NEW V2 database

1. In cPanel create a separate NEW EMPTY V2 database and database user. Select that exact database in phpMyAdmin. Do not import over an existing database or use V1 credentials.
2. Import `database/001-core.sql`, then `database/010-callcenter.sql`. These are first-install scripts, intentionally not repeatable/destructive reset scripts. A partial import must be reviewed rather than blindly rerun.
3. Edit `private-setup/020-owner.template.sql` with the CEO's exact Firebase UID and email, then import it. Empty template values intentionally create no account. No default password is generated.
4. Runtime database grants: SELECT, INSERT, UPDATE, DELETE on this V2 database. Use setup privileges only for manual table installation; do not grant runtime CREATE/ALTER/DROP.

## Upload and configure

1. Upload only the CONTENTS of `webroot/` to the V2 testing document root, including nested hidden `.htaccess` files. This is an additive staff package, not the entire public website build. Keep the existing V2 website files, `/api/`, and root routing intact.
2. Place `private-app/` outside ALL document roots using cPanel File Manager. Create a private sessions directory outside webroot. Restrict access to the hosting user/PHP runtime; never use world-writable permissions.
3. Copy `private-app/config/config.example.php` to a private `config.php`. Set V2 DSN/credentials, exact HTTPS origin, and absolute private session directory. Copy the two Firebase values from package `firebase-settings.private.php` into this config. Keep local HTTP disabled. PHP requires PDO MySQL, OpenSSL, cURL, and trusted CA certificates.
4. Set PHP environment variables `STAFF_APP_DIRECTORY` and `STAFF_CONFIG_FILE` to those absolute private paths through the host's configuration. No secrets or private config belong under webroot. If the host cannot set these variables, resolve that before uploading; the API fails closed with 503 until configured.
5. Keep `database/`, `private-setup/`, private application/config/sessions, Firebase settings, README, and manifest outside every webroot.

## First checks

- Sign into `/management/` using the provisioned CEO's Firebase email/password. Create each agent in Firebase Console first, then use Create agent to provision its exact UID/email/name and operational role in MySQL.
- Sign into `/callcenter/` with an agent. Record a manual call, enter customer name/requirements/next follow-up, and verify Customers, Leads, Follow-ups, feedback, late history, and My Tasks.
- Assign a task from management and complete it from the agent dashboard. Verify English/Dari, RTL, mobile, keyboard access, deep links, noindex headers, failed saves/retries, and logout.
- Check customer and unrelated department accounts cannot read call-center records. Privileged role creation is deliberately absent from the operational agent form.
- The API verifies Firebase signatures/project/expiry and current account state, then creates a private CSRF-protected PHP session. Sessions end at token expiry (normally about one hour) or 30 minutes of inactivity. Sign in again when prompted. Firebase revocation/disabled state is rechecked at most five minutes apart while active; MySQL active/role checks occur on every request. Outages fail closed when verification is due.
- Public visits must make no staff requests. Build success does not prove hosting headers, private-file placement, PHP extensions, or live Firebase settings.

## Modular database contract

`001-core.sql` owns shared identity, roles/permissions, branches, tasks, audit, idempotency, and module registry. `010-callcenter.sql` adds only `cc_` tables plus new registry/permission rows. All eight department groups and named roles are registered; future departmental workflows are not implemented.

A future module adds its own uniquely prefixed tables and new registry/permission rows, referencing stable core user IDs. It must not alter/drop/reset core or existing module tables, rewrite their records, or automatically grant itself existing roles. Modules exchange data through authorized service interfaces. Core evolution and changes to an already installed module require a separately reviewed migration and backup; dashboard installation does not silently change earlier schemas.

Call-center customer records are contacts, not Firebase customer-dashboard logins. Future customer accounts/listing submissions need their own module and ownership mapping. Existing website catalog tables/endpoints and public inquiry operations are unchanged.

## Limits and rollback

Automatic Etisalat capture remains disabled pending verified final events, timestamps, agent mapping, authentication, and independent delivery. Manual entries do not place phone calls. Sales UI and other department dashboards remain deferred; sales handoff/closure backend exists for controlled workflow tests only.

This is a testing package. Privileged MFA, operational retention/backup policy, hosting verification, and live user sign-in still require rollout checks. Preserve compatible known-good staff files and back up V2 data privately before upgrades. Roll back only the new staff paths/service artifacts after stopping staff use; do not reset customer records or touch V1. A fresh schema is not an upgrade script for the earlier experimental staff database.

Owner upload/import and server checks are required before calling this installed. Nothing has been deployed by preparing the files.
