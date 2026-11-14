# V2 manual deployment, database setup, and department users

Target: `https://website.attaieproperties.com` only. This is the step-by-step deployment deliverable for the revised implementation plans, not evidence that the revised package exists or is installed. Complete implementation/local acceptance first, then use the exact newly prepared release. No cPanel Terminal or automated installer is required.

Menu labels vary by host. Current official references: [cPanel domain creation](https://docs.cpanel.net/cpanel/domains/domains/create-a-new-domain/134/), [database/user management](https://docs.cpanel.net/cpanel/databases/manage-my-databases/), [PHP selection](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/), [SSL certificates](https://docs.cpanel.net/cpanel/security/ssl-tls-certificates/), [Firebase password authentication](https://firebase.google.com/docs/auth/web/password-auth), and [Firebase user management](https://firebase.google.com/docs/auth/web/manage-users). The environment-specific paths and access rules below come from this repository.

## 1. Identify the testing installation

1. Sign in to the hosting account's cPanel. Open **Domains** and find `website.attaieproperties.com`.
2. Record its actual document root privately. Verify that it differs from V1's document root. If the domain already exists, inspect it rather than creating or repointing it again.
3. If absent, choose **Create A New Domain**, enter `website.attaieproperties.com`, disable **Share document root**, and select a separate testing directory. Do not use the main domain's root. Confirm the displayed path before saving. cPanel account/host restrictions may determine which separate paths are allowed.
4. Confirm the subdomain's DNS resolves to the testing host. If DNS is managed elsewhere, create/update only that testing subdomain record there; do not change the main domain or its nameservers.
5. Determine whether this is a fresh installation or an existing V2 installation. For existing V2, download backups of its three databases, uploads/chat storage, private configuration, UID mappings, and current application files before imports or replacement.

Checkpoint: testing origin/root identified, V1 excluded, and fresh/upgrade branch recorded. Never clear an existing root/database to make it appear fresh.

## 2. Configure HTTPS and PHP for the testing domain

1. Open **SSL/TLS Status**, or the host's **SSL/TLS Certificates** interface. Confirm a valid certificate covers `website.attaieproperties.com`. Run available AutoSSL for that domain if needed; ask the host to resolve an unavailable certificate feature.
2. After the certificate works, enable **Force HTTPS Redirect** for the testing domain in **Domains**. Verify the HTTPS address without browser certificate warnings.
3. Open **MultiPHP Manager**, select only the testing domain, and choose the same PHP version used for the release's validation (current local validation uses PHP 8.4). Do not change the account-wide/default PHP version or V1's selection.
4. Through the host's PHP extension interface, or hosting support if extensions are not exposed, verify `mysqli`, `pdo_mysql`, `curl`, `openssl`, `fileinfo`, and session support. Firebase verification also needs working outbound HTTPS and CA certificates. MultiPHP Manager selects a version; it does not itself guarantee these extensions are installed.
5. Use the testing domain's PHP INI interface to check upload/post limits against application file-size requirements. Keep PHP errors out of public responses and use the host's private error log for diagnostics. Preserve the packaged `.user.ini`; verify it is compatible with the host rather than changing V1 settings.

Checkpoint: correct domain-specific PHP runtime, HTTPS, extensions, and private error reporting. Do not leave public `phpinfo()` or diagnostic installers online.

## 3. Create the three V2 databases

Skip new database creation when upgrading the existing verified V2 databases. Use their backed-up upgrade path instead.

1. Open **Manage My Databases** (older hosting themes may say **MySQL Databases**) or **Database Wizard**. Create databases through cPanel, then import through phpMyAdmin.
2. Create three separate databases using distinguishable suffixes, for example `v2web`, `v2crm`, and `v2sub`. cPanel may prepend the account name; copy the complete resulting names, not just the suffixes.
3. Record the actual MySQL host from your hosting configuration. It may be `localhost`; use the host's documented value rather than assuming.
4. Keep the names in a private worksheet:

| Purpose | Actual database name | Data |
| --- | --- | --- |
| Website | Fill privately | Public listings, website inquiries/follow-up, website Admin account |
| Internal CRM | Fill privately | Staff UIDs, departments, roles, permissions, inventory, CRM leads, departmental work |
| Submission bridge | Fill privately | Editor publication revisions, selected photos, Admin review history |

Checkpoint: three distinct V2 databases, none matching V1.

## 4. Create database service users and assign access

Database service users are application connections, not employees. Employees do not each need a cPanel or MySQL user.

1. In cPanel's database management screen, create a website runtime user with a unique generated password. Assign it only to the website database.
2. Create an internal CRM runtime user with a different password. Assign it only to the CRM database.
3. Create a submission writer user for the staff runtime and assign it only to the submission database.
4. Create a separate submission reviewer user for website Admin, assigned only to the submission database. This permits independent revocation/auditing of the two bridge consumers; both still access the same third database.
5. In **Add User To Database**, select each intended user/database pair, click **Add**, and apply the runtime privileges required by current queries. The intended starting grants are `SELECT`, `INSERT`, `UPDATE`, `DELETE` on that user's designated database only. Confirm them against local acceptance and the final release's grant checklist. Runtime migrations are disabled; employees' PHP connections do not need schema administration privileges.
6. Use the cPanel account's phpMyAdmin import access for schema creation/migrations. If the host requires a separate import user, grant its schema privileges only for the named V2 database, keep it outside runtime config, and revoke/remove that temporary access after successful import. Do not grant runtime `ALL PRIVILEGES` across databases to solve an import error.
7. Keep complete usernames/passwords in a password manager/private config only. Confirm website service users have no CRM grants and staff service users have no website grants.

Checkpoint: explicit database/user grant matrix; no shared V1 credentials; website Admin cannot connect to CRM even if a client requests it.

## 5. Import each schema using phpMyAdmin

1. Obtain the exact new release directory and its manifest. Keep its `database/` folder on your computer or outside all web roots; never upload SQL to the public testing directory.
2. In **phpMyAdmin**, select the website database in the sidebar. Open **SQL** and run:

   ```sql
   SELECT DATABASE();
   ```

3. Verify the result matches the recorded V2 website name. For a new empty database, open **Import**, select `database/fresh/01-website.sql`, choose UTF-8/SQL as appropriate, and click **Import/Go**. Record success or the exact failing statement; do not continue through unexplained failures.
4. Select the internal CRM database, run `SELECT DATABASE();` again, verify the name, and import only `database/fresh/02-internal-crm.sql` into the new empty database.
5. Select the submission database, repeat the target check, and import only `database/fresh/03-submissions.sql` into the new empty database.
6. Verify website `properties`/`projects`/`project_units` and internal project/unit catalogs contain no bundled records. Verify internal role/permission tables and third-database submission tables exist. Empty property/project catalogs are expected; roles/departments are schema configuration, not demo listings.
7. For an existing installation, do **not** import any fresh file. Follow the new release's `database/upgrade/README.md` target/order checklist, inspect installed columns/versions, and apply only missing additive migrations. Run the customer/property duplicate preflight against V2 and resolve conflicts through owner-approved decisions before enabling that constraint. Preserve accounts/history/uploads; never retry an entire partly applied migration blindly.

Checkpoint: each import is tied to its verified database and result. Fresh schema and upgrade SQL are alternatives, not consecutive steps.

## 6. Place private application/configuration files

1. In **File Manager**, open your account home, for example `/home/CPANEL_USER/`. Enable hidden-file display in Settings.
2. Create a directory outside **every** domain's document root, for example `/home/CPANEL_USER/attaie-v2-private/`. Confirm the actual host path and that no domain serves it.
3. Upload/extract `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` there. Inspect the archive layout and resulting paths instead of creating an extra nested directory accidentally. Confirm `app/src/App.php`, `Completion.php`, `CompletionRules.php`, and all newly added service files exist under the configured app directory.
4. Copy `config.example.php` to private `config.php`. Fill in the internal CRM DSN/user/password, the staff submission-bridge connection, exact testing `origin`, V2 Firebase project ID/public web API key, and a private writable session directory.
5. Copy `website-db.example.php` to private `website-db.php`. Enter the website connection and Admin's submission-bridge connection only. Keep `ATTAIE_MANUAL_SCHEMA=true`. Do not put CRM credentials in this file. Disable legacy example Admin credentials; the separate Admin account will use its password hash.
6. Create private session/chat directories. The revised release will expose `WEBSITE_CHAT_STORE_DIR` in its template; point it to a private chat directory. On upgrades, copy and verify existing V2 chat history before switching paths; preserve the old copy until acceptance.
7. Restrict private file access to the hosting account/PHP process using the host's supported permissions. Avoid world-writable permissions. Confirm PHP can write sessions/chat while HTTP cannot fetch private files.

Checkpoint: configured private paths and connections, no SQL/secrets in public roots. The revised chat setting is an implementation deliverable, not a claim about today's package.

## 7. Set up V2 Firebase Authentication

1. Open the intended **V2 Firebase project**, not an unrelated/live project.
2. Under **Authentication → Sign-in method**, enable **Email/Password**. Firebase manages staff passwords; no staff passwords are stored in MySQL or SQL files.
3. Under Authentication settings, add `website.attaieproperties.com` to authorized domains where required by the selected authentication/reset flows. Verify email/reset configuration for the actual V2 project.
4. Under **Authentication → Users**, add the first CEO account and a separate Manager account. Use controlled real email addresses and privately generated passwords; distribute credentials outside documentation/chat. Record each exact case-sensitive UID and account email privately.
5. Supply the matching public Firebase web configuration to the implementation/build process before the upload package is generated. The PHP configuration must refer to the same Firebase project. If the package lacks that public build configuration, rebuild locally; editing PHP alone does not repair a previously built frontend.

Checkpoint: two distinct Firebase identities and matching frontend/backend project configuration. Firebase identity alone does not grant a CRM role.

## 8. Bootstrap CEO and Manager in the CRM database

1. Return to phpMyAdmin, select the internal CRM database, and verify `SELECT DATABASE();`.
2. Open a private copy of `database/04-firebase-owner.template.sql`. Fill its CEO UID/email/name and separate Manager UID/email/name from the Firebase records. Do not add passwords.
3. Review the role mapping: CEO uses `ceo`; Manager uses `manager`. Apply the template once to the verified CRM database. For an upgrade, first check whether those UIDs/emails already exist; do not insert duplicates or overwrite existing role mappings blindly.
4. Verify mappings with this read-only query in the CRM database:

   ```sql
   SELECT u.id, u.name, u.username, u.role,
          COALESCE(u.department_code, r.department_code) AS department_code,
          u.active
   FROM core_users AS u
   JOIN core_roles AS r ON r.code = u.role
   WHERE u.role IN ('ceo', 'manager');
   ```

5. Current migration 100 grants staff/department management to **Manager**, not CEO. Bootstrap both; use Manager for ordinary department/user creation. CEO, Manager, and website Admin are distinct accounts/authorities. Changing those management permissions is a separate business decision, not a deployment workaround.

Checkpoint: exact Firebase identities mapped once in MySQL; no passwords in bootstrap SQL. Complete live login checks after the public upload.

## 9. Create the separate website Admin

1. Generate a strong password hash locally using a trusted local PHP tool provided with the final handoff, or another trusted local password-hashing tool. The implementation must provide a local prompt-based helper; no cPanel Terminal, public hashing page, or online password-sharing service is required.
2. In a private copy of `database/05-website-admin.template.sql`, replace the username/hash placeholders and enable only the intended INSERT statement. Do not put plaintext passwords into SQL.
3. In phpMyAdmin, select and verify the **website database**, then apply the prepared statement once. For existing V2 Admin accounts, preserve them or follow an explicitly approved account update instead of blindly inserting another copy.
4. This creates `admin_users` credentials for `/admin/`; it does not create a Firebase staff account, role mapping, cPanel login, or CRM access.

Checkpoint: separate website account stored as a password hash in website `admin_users`.

## 10. Upload public files to the testing document root

1. In File Manager, select the verified testing root from step 1. Confirm the full path again before replacing any files. Use the backed-up upgrade procedure if files already exist.
2. Upload `UPLOAD-WEBSITE-CONTENTS.zip` from the exact newly prepared release and extract its **contents** into that root. Do not upload the whole release directory, SQL, private ZIP, or setup worksheets there. Remove the public ZIP after extraction/verification.
3. Confirm the root contains `index.html`, `.htaccess`, `.user.ini`, `api/`, `admin/`, `staff-api/`, `dashboard/`, `management/`, and `callcenter/`. The revised package must include `chat-service.php`; unrelated AI chat stays blocked.
4. Edit public `staff-api/paths.php` to the actual private app/config paths. Edit public `api/db.php` to require the actual private `website-db.php`. These public bridge files contain paths only, not credentials.
5. Confirm uploads are writable as required and packaged script-execution denial rules remain present. Confirm private directories and files are inaccessible from public URLs.
6. Load the homepage, empty catalog, `/admin/`, `/dashboard/`, `/management/`, `/callcenter/`, and their deep links. Check browser network errors and private PHP logs.

Checkpoint: only V2 public files replaced, hidden files present, all route entry points reachable, no private/SQL artifacts exposed.

## 11. Add employees to departments

Each employee requires a Firebase identity **and** a MySQL mapping. Do not create cPanel accounts, MySQL service users, or Firebase project IAM memberships for ordinary employees.

1. Sign in as **Manager** at `/management/` after testing its real Firebase login.
2. Open staff/department management. Built-in departments/roles are installed by the CRM SQL. If a new department is needed, choose **Create department**, enter its stable code and display name, then save. A new department does not automatically create a new permission-bearing role.
3. In the V2 Firebase console, add the employee under Authentication Users. Copy the exact UID and email; issue/reset the password privately through Firebase.
4. Back in Manager's **Create agent/staff** form, enter name, the same email, exact Firebase UID, intended department, and appropriate existing operational role. Review both selectors; the current form's defaults must not be assumed to match the new employee.
5. Use this mapping as the ordinary onboarding guide:

| Department | Role codes |
| --- | --- |
| Call Center (`callcenter`) | `callcenter` |
| Sales (`sales`) | `sales_leader`, `sales` |
| Human Resources (`hr`) | `hr_manager` |
| Marketing and Production (`production`) | `marketing_manager`, `production_manager`, `editor`, `videographer`, `photographer` |
| Finance (`finance`) | `finance_manager` |
| Engineering and Graphic (`engineering`) | `architect`, `graphic_designer`, `visual_designer_3d` |

6. Save and confirm that the employee is active. Duplicate email/UID errors require checking existing mappings, not creating another Firebase identity to bypass the error. CEO/Manager privileged provisioning uses the reviewed private bootstrap route; ordinary staff creation intentionally excludes those roles.
7. For Sales, assign the appropriate projects through Manager's inventory/project assignment workflow. Use the existing Sales leader/team assignment controls if available in the completed implementation. Selecting Sales role alone does not grant every project's records.
8. Have the employee sign in with their own credentials. Callcenter uses `/callcenter/`; other operational roles use the staff entry provided by the application, normally `/dashboard/`. Verify their own authorized workspace and at least one denied protected action. Do not give employees Manager's session as a login workaround.
9. Repeat for each department, including at least one Editor for the five-photo publication acceptance. Verify deactivation/revocation through authorized controls and account for active work that blocks deactivation.

Checkpoint: each employee has one UID mapping, intended department/role, correct assignments, and observed allowed/denied access. Custom roles outside the server's operational allowlist require explicit implementation and permission tests, not merely a new SQL label or Firebase claim.

## 12. Where roles and permissions are saved

All staff authorization data is in the **internal CRM MySQL database**:

| Table/column | Meaning |
| --- | --- |
| `core_departments` | Department codes and names |
| `core_roles` | Role codes/names and default department |
| `core_permissions` | Individual allowed capabilities |
| `core_role_permissions` | Which capabilities each role has |
| `core_users.firebase_uid` | Exact Firebase identity link |
| `core_users.role` | Employee's assigned role; currently one role per employee |
| `core_users.department_code` | Explicit department assignment; role's department is the fallback |
| `core_users.team_leader_id` | Optional team-leader relationship |
| `core_users.active`, `auth_version` | Local activation and session authorization version |

Firebase Authentication owns identity/password verification. The PHP backend loads MySQL mappings/grants to authorize requests; browser controls are not the authority. Website Admin lives separately in website `admin_users`. Neither cPanel users nor Firebase project IAM roles represent employee CRM roles.

Read-only permission inspection, on the CRM database:

```sql
SELECT r.code AS role_code, r.name AS role_name, r.department_code,
       rp.permission_code
FROM core_roles AS r
LEFT JOIN core_role_permissions AS rp ON rp.role_code = r.code
ORDER BY r.department_code, r.code, rp.permission_code;
```

## 13. Complete hosted acceptance and retain rollback

1. Use `docs/staff/v2-revised-workflow-acceptance.md` from the completed implementation/release to record each import, login, permission denial, and workflow result. A not-run check stays not run.
2. Verify Editor five-photo submission, Admin rejection/reason, corrected resubmission/history, approval/publication, and unauthenticated photo privacy. Confirm Admin never sees CRM data.
3. Test both inquiry forms offline and after reconnect/reopen; verify one saved inquiry/receipt despite retries, barcode reference lookup by Admin, Admin follow-up, and separate-device customer/Admin messages. Confirm no staff CRM inquiry was created.
4. Test one customer's different-property CRM leads and refusal of a duplicate pair across agents/statuses. Use fictional data and isolated acceptance records; do not delete real V2 records to restore an empty catalog.
5. Keep CTC routing in its PHP configuration and keep chargeable test calls disabled. Record simulated checks separately; real call-provider testing requires its own authorized V2 check.
6. Check Dari/RTL, mobile/desktop layout, keyboard access, printed/downloaded receipt, HTTPS, deep routes, uploads, Firebase reset/session expiry, and role revocation. Include all deployed custom roles in the permission matrix.
7. Mark deployment verified only after these hosted observations exist. Retain the prior application/database/upload backups and document a coordinated V2-only restore if needed; do not restore one database version against an incompatible application or reset V1.

Checkpoint: actual hosted results recorded, remaining failures explicit, and recoverable V2 backups retained.
