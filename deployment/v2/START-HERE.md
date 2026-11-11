# V2 testing website and call-center setup

Target: **https://website.attaieproperties.com**. This is a fresh testing installation with a separate database and document root. Nothing has been uploaded or installed on your hosting account by preparing this kit.

No cPanel Terminal, Composer, Node, Python, or automatic installer is needed on the server. Use cPanel File Manager, Database Wizard, phpMyAdmin, and Firebase Console. Keep this guide open while you work.

## What is included

- Fresh public website and property-admin build, latest English-only teal `/callcenter/`, and `/management/`.
- PHP website/API files and a private staff service using Firebase Authentication.
- **39 tables in one NEW V2 database:** 19 website tables, 12 shared `core_` tables, and 8 `cc_` call-center tables. Future dashboard modules add their own tables and permission/registry rows without changing these tables.
- Five preserved projects, their 98 artwork files, and 25 existing **sample** layout records. Prices, dates, availability, and layout counts are showcase data, not verified live inventory.
- A generated website-admin password kept in a private local file. Staff users use Firebase passwords instead; no staff passwords are stored in MySQL.

The photo explorer's current calibration/default configuration is unfinished; artwork is included, but this kit does not invent floor/apartment polygons or claim the interactive photo explorer is configured. Automatic Etisalat capture, outbound click-to-call, and AI chat are disabled/unconnected for this test installation. The manual call-center workflow is available. Ordinary telephone/WhatsApp links still point to the company's numbers.

## 1. Identify the files

| Item | Purpose | Where it goes |
| --- | --- | --- |
| `UPLOAD-WEBSITE-CONTENTS.zip` | Public website, admin and staff dashboards, PHP entrypoints, hidden routing files | Extract directly into the **testing subdomain document root** |
| `dist/` | Same public upload files, already extracted | Alternative to the public ZIP; upload its **contents**, not the folder |
| `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` | Private staff application, placeholder configuration, sessions directory | Extract in your cPanel **home directory**, outside every web root |
| `database/` | SQL files for phpMyAdmin | Keep on your computer; import through phpMyAdmin, never upload to web root |
| `private-setup/` | Private website-admin login and provisioning templates | Keep on your computer, never upload to web root |
| `manifest.json`, this guide | Verification/instructions | Keep outside web root |

Do not upload the whole release folder. Use only the newly prepared full V2 kit, not repository-root `dist` or earlier release ZIPs.

## 2. Create or verify the testing subdomain

1. In cPanel open **Domains**, then **Create A New Domain** if the testing subdomain does not already exist.
2. Enter `website.attaieproperties.com`. Disable **Share document root** with the main domain.
3. Use a separate folder, for example `/home/CPANEL_USER/website.attaieproperties.com`. Replace `CPANEL_USER` throughout this guide with the actual account name shown by cPanel. Your host's exact path may differ; use the path shown for this subdomain.
4. If a V2 test site already occupies that folder, download its files and export its database before replacing anything. These SQL files are for a **new empty database**, not an upgrade or reset of existing customer data.
5. Point the subdomain DNS at this hosting account if necessary. In **SSL/TLS Status / AutoSSL**, issue/verify its HTTPS certificate.
6. Select PHP **8.2 or newer** for this subdomain. Required extensions: `mysqli` with mysqlnd, `pdo_mysql`, OpenSSL, cURL, fileinfo, JSON, and sessions. PHP must be able to reach Google's HTTPS endpoints with a valid CA certificate store.

Host interfaces vary. If the subdomain shares the main site's directory, correct that before extracting the package. Do not extract over the main domain.

## 3. Create one NEW V2 database

1. Open **Database Wizard** or **Manage My Databases**.
2. Create a NEW database, for example `CPANEL_USER_attaie_v2_test`.
3. Create a NEW database user, for example `CPANEL_USER_v2_app`, with a strong password. Save the database name, full username, password, and database host in your password manager. Use only these new credentials in this test kit.
4. Associate that user with **only this V2 database**. Runtime permissions needed by the application: **SELECT, INSERT, UPDATE, DELETE**. Perform schema imports with cPanel/phpMyAdmin setup privileges. If the host temporarily requires broader import privileges, remove CREATE/ALTER/DROP from the application user after importing.

Both the website and staff service use this same V2 database in this kit. `leads` belongs to website inquiries; `cc_leads` belongs to the call-center module. Do not rename or merge them manually.

## 4. Import the tables and sample projects

In cPanel open **phpMyAdmin**. Click the NEW V2 database in the left sidebar. Verify its complete name and that it contains no tables. Use the **Import** tab in this order:

1. `database/01-new-v2-schema.sql` — creates all 39 tables, eight department groups, known roles/permissions, and module registrations.
2. `database/02-five-project-showcase.sql` — adds projects with fixed IDs 1-5, 25 sample layouts, and the testing SEO settings.
3. `database/03-website-admin.sql` — adds the website catalog administrator with a bcrypt password hash.

Do not import the CEO template yet; fill it in during step 6. `VERIFY-TEST-DATABASE.sql` is a read-only checklist, not another creation script.

If an import fails, stop and save the exact error. Do not rerun creation files blindly or delete another database. Check whether the import was partial before deciding how to recover. Never use these files on a populated V2 database or V1 database.

## 5. Upload and configure the website

1. Open cPanel **File Manager > Settings** and enable **Show Hidden Files (dotfiles)**.
2. Open the testing subdomain's document root from step 2.
3. Upload `UPLOAD-WEBSITE-CONTENTS.zip` there, select it, and choose **Extract** into that same folder. Alternatively upload the contents of this kit's `dist/` folder through your file-transfer client.
4. Confirm the root directly contains `index.html`, `.htaccess`, `.user.ini`, `api/`, `admin/`, `callcenter/`, `management/`, and `staff-api/`. It must not be nested under an extra `dist/` or ZIP-name folder. Remove the uploaded ZIP after extraction.
5. In File Manager edit **the testing installation's** `api/db.php`. Replace:

   ```php
   define('DB_HOST', 'localhost'); // use your host's value
   define('DB_USER', 'YOUR_FULL_V2_DATABASE_USERNAME');
   define('DB_PASS', 'YOUR_V2_DATABASE_PASSWORD');
   define('DB_NAME', 'YOUR_FULL_V2_DATABASE_NAME');
   ```

   Change the existing values in that file; do not paste duplicate definitions. If a password contains a single quote or backslash, escape it correctly in the PHP string (`\'` or `\\`). Keep `ADMIN_USER` and `ADMIN_PASS` blank. Keep `ATTAIE_MANUAL_SCHEMA` set to `true`: this installation uses your manual SQL import and must not migrate tables during web requests.
6. Keep `uploads/` writable by the hosting user's PHP process. Start with normal hosting permissions (directories commonly 755, files 644); never use 777. Private upload subdirectories have denial rules that must remain in place.

The placeholder `api/db.php` contains no real credentials in the supplied archive. Fill it only in the V2 testing installation. The default generated `/admin/` login is in `private-setup/WEBSITE-ADMIN-LOGIN-PRIVATE.txt` on your computer; do not upload that file or send its password in chat.

## 6. Enable Firebase and create the Admin (CEO)

1. Open [Firebase Console](https://console.firebase.google.com/) and select project **`roheenahmadi-907a7`**.
2. Open **Build > Authentication**. If prompted, choose **Get started**.
3. Under **Sign-in method**, enable **Email/Password** and save. Email/password is the method implemented here; phone/SMS sign-in is not part of this kit.
4. Under Authentication **Settings > Authorized domains**, add `website.attaieproperties.com` without `https://` or a path. Check the password reset email template's sender/name and allowed action domain.
5. Under **Users > Add user**, create the CEO's email and strong password. Save the password privately.
6. Open that user's details and copy the exact **UID** and email. UID matching is case-sensitive. Do not use the Google Cloud project number, project ID, or an email address as the UID.
7. On your computer, open `database/04-staff-ceo.template.sql` in a plain-text editor. Fill these two values:

   ```sql
   SET @owner_firebase_uid = 'PASTE_EXACT_FIREBASE_USER_UID';
   SET @owner_email = 'ceo@example.com';
   SET @owner_name = 'Admin (CEO)';
   ```

8. Save and import that edited file in phpMyAdmin with the NEW V2 database selected. It adds a `core_users` row with role `ceo`. Blank template values intentionally create no account. Do not import twice for the same user. No password belongs in this SQL.

A Firebase user without an active matching MySQL row cannot enter the staff workspace. The browser never chooses its own role. All eight department groups are registered, but their future dashboards are not installed by this kit.

## 7. Install the private staff application

1. In File Manager go to your cPanel **home directory**, for example `/home/CPANEL_USER`.
2. Upload `UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip` there and extract it there. It creates:

   ```text
   /home/CPANEL_USER/attaie-v2-private/
       app/src/App.php
       app/src/Domain.php
       app/src/FirebaseAuth.php
       config.php
       sessions/
   ```

   This folder must be outside the testing document root, `public_html`, and every other domain's web root. Delete the private ZIP after extraction. The `paths-reference.php` file is only a reference; the active locator is configured in step 8.
3. Edit the private `config.php` and set the **same** V2 database as the website:

   ```php
   'dsn' => 'mysql:host=localhost;dbname=CPANEL_USER_attaie_v2_test;charset=utf8mb4',
   'database_user' => 'CPANEL_USER_v2_app',
   'database_password' => 'YOUR_V2_DATABASE_PASSWORD',
   'origin' => 'https://website.attaieproperties.com',
   'session_directory' => '/home/CPANEL_USER/attaie-v2-private/sessions',
   'allow_local_http' => false,
   ```

   Change existing values; do not add duplicate array keys. Preserve the included Firebase project ID/Web API key. The supplied key is a public Firebase web identifier, not a service-account private key. No service-account JSON, Composer install, or Firebase Security Rules for MySQL are needed here.
4. Make the private sessions directory writable by the hosting user's PHP process. Start with 700 for private directories and 600 for private config if your PHP runs as your hosting user; ask the host for its supported restrictive permissions if PHP cannot read/write them. Never make these files world-writable.

## 8. Connect the staff API using File Manager

Edit `staff-api/paths.php` **inside the testing document root**. Replace only the absolute paths:

```php
return [
    'app_directory' => '/home/CPANEL_USER/attaie-v2-private/app',
    'config_file' => '/home/CPANEL_USER/attaie-v2-private/config.php',
];
```

This public locator stores paths only, not passwords. Its HTTP access is denied by the included `.htaccess`; PHP loads it internally. The entrypoint checks that the service and config are outside its web root. Confirm they are outside **all** other web roots too. No environment-variable setup or cPanel Terminal is required for this method. Existing staff environment configuration remains supported if the locator file is absent.

## 9. Sign in and create call-center agents

These are separate current login surfaces:

| URL | Account | How it is created |
| --- | --- | --- |
| `/admin/` | Website property/catalog administrator | Generated `owner` login in the private local text file, backed by `admin_users` |
| `/management/` | Admin (CEO) | Firebase email/password plus the CEO `core_users` row from step 6 |
| `/callcenter/` | Call Center Agent | Firebase user plus provisioning in management |

Existing website-admin authentication has not been migrated to Firebase in this call-center increment.

For each call-center agent:

1. In Firebase **Authentication > Users > Add user**, create the agent's email/password. Give that password to the agent through your normal private process, not SQL or uploaded documents.
2. Copy the agent's exact UID and email.
3. Visit `https://website.attaieproperties.com/management/` and sign in with the CEO Firebase account.
4. Open **Team tasks**, then **Create agent**.
5. Enter the name, Firebase account email, exact **Firebase UID**, and select **Call center**. Save. This creates the MySQL profile/role mapping; it does not create a Firebase user.
6. Have the agent sign in at `https://website.attaieproperties.com/callcenter/` with that Firebase email/password.
7. Use **Forgot password?** on login or the profile's reset-email form for password recovery. Reset messages may arrive in spam; check the configured Firebase email templates.

Do not select Sales for the call-center pilot. The sales dashboard and the other departments' interfaces are deferred. Their registered roles do not automatically grant access to this dashboard.

## 10. Test the workflow

Use clearly fictional test records in this V2 database:

1. As an agent click **New entry**. Enter a fictional customer name/phone, actual manual call time, requirements, and a future next follow-up time. Choose yourself as the next agent and save.
2. Check **Customers**: the customer is added automatically. Check **Leads** and **Follow-ups**: the same inquiry appears with an automatic serial such as `CA01-L1`. The number uses the actual core user ID, so your first agent may have a different prefix.
3. Open **Feedback** and submit Follow up or Visit with notes and the next date/time. The feedback deadline is the scheduled time plus 24 elapsed hours. A task becomes Overtime strictly after that deadline; late completion remains in history.
4. From management choose **Assign task**, select that agent, enter instructions/priority/deadline, and save. In the agent's **My Tasks**, open the task, start it, and mark it complete. General task deadlines have no extra 24-hour grace period.
5. Check logout, password reset, browser refresh, mobile layout, and direct deep links such as `/callcenter/followups` and `/management/team`. Call center is English-only; management retains its current language option.
6. Do not expect a real mobile call to create a lead automatically yet. Etisalat final-event ingestion is not connected. Do not hand off live work to a sales workflow without its dashboard being available.

The agent can complete or lose a lead through permitted outcomes. Only the assigned sales role can submit deal closure in the backend; call-center agents cannot close deals. No sales dashboard is shipped here.

## 11. Verify the server and database

Open `database/VERIFY-TEST-DATABASE.sql` in phpMyAdmin's SQL tab with the V2 database selected. Expected: 39 tables, projects 1-5, sample layout counts 6/4/6/5/4, eight department rows, module versions `core=1` and `callcenter=1`, and the provisioned staff profiles.

Check these browser URLs:

- `/api/get-projects.php` returns five project records, and `/projects/1` through `/projects/5` load project content/artwork.
- `/admin/` signs in with the private generated website-admin login. Property CRUD, uploads, inquiries, career applications, and visit requests need their own fictional V2 workflow checks before relying on them.
- `/staff-api/v1/session` returns JSON with `user: null` when signed out. A configured anonymous session is not a server error.
- `/staff-api/v1/dashboard` denies signed-out access. A customer or unrelated department account must not read call-center records.
- Root `robots.txt` says `Disallow: /`; browser Network response headers include `X-Robots-Tag: noindex, nofollow, noarchive`. Staff HTML also has noindex. These discourage indexing, but authentication protects private data.
- Public website visits make no `/staff-api/` requests or staff asset downloads.
- `/staff-api/paths.php`, `/visual-config/data/draft.json`, and private upload paths deny HTTP access. The private application/config/SQL/password file must not have a public URL at all.

Google Maps needs its own browser key authorized for this testing hostname. The normal contact links use company numbers; avoid real calls/messages during checks. A successful local build is not proof of hosting configuration or a real Firebase login.

## 12. Troubleshooting

| Symptom | Check |
| --- | --- |
| Staff service returns 503 / Not configured | `staff-api/paths.php` absolute paths; private config outside web roots; PHP read permissions; required extensions; correct database; all schema SQL imported |
| Database connection failed | Full cPanel-prefixed database/user names, password escaping, host, and database-user association |
| Firebase login fails before app access | Email/Password enabled, correct account/password/project, network access to Identity Toolkit, browser CSP headers |
| Firebase verifies but workspace access is denied | Exact case-sensitive UID exists in `core_users`, correct role, `active=1`; creating a Firebase user alone is insufficient |
| Sign-in could not be verified | Server cURL/OpenSSL/CA store, Google HTTPS egress, server clock, Firebase project/key pairing, account disabled/revoked state |
| Browser key works but PHP lookup is rejected | A key restricted to browser HTTP referrers may reject server calls. Use an appropriate server key from the same Firebase project in private PHP config, restricted to required Identity Toolkit API and supported server restrictions. Keep the browser key in the frontend build. Do not add a service-account secret to the website |
| Login works but saves fail with origin/CSRF errors | Exact HTTPS `origin` in private config, correct domain, cookies enabled; sign out/in after config changes. Do not visit the dashboard through a different hostname |
| Deep links return public home/404 | Correct root and nested `.htaccess` files uploaded; mod_rewrite enabled; files extracted into the correct document root |
| Entire site returns 500 | Check cPanel Errors/PHP logs. Ask the host whether copied PHP directives/Options in `.htaccess` are supported before altering only the testing installation |
| Project photo explorer is absent | The current visual calibration config is unfinished. Assets and sample listings are included; this is a documented remaining feature, not a failed database import |
| AI chat or click-to-call returns forbidden | Intentionally disabled in this testing kit. Do not connect it to V1 credentials or assume automatic Etisalat capture exists |
| Session expires | Sign in again. Staff sessions expire at Firebase ID-token expiry (about one hour) or 30 minutes of inactivity. Account revocation is rechecked at most five minutes apart while active; MySQL activity/permissions are checked each request |

For offboarding, first resolve active lead/task assignments. Disable the Firebase user and set the matching V2 `core_users.active` to `0`, incrementing `auth_version`, through a reviewed admin operation/phpMyAdmin. Keep the records/history; do not delete the user row or role tables. Permission changes belong in V2 MySQL and must be reviewed before granting broader access.

## Backups, updates and rollback

Before replacing an existing V2 site, download its current files and export its V2 database privately. Keep the known-good release, private configuration and sessions secure. The supplied SQL is **new-install only**. Do not rerun it for a later dashboard module or overwrite populated tables.

Future modules install their own tables and new registry/permission rows. Existing core/module schema changes need a separate explicit migration and backup. Do not copy V2 files into V1's document root, use V1 credentials, or restore test data into V1.

If a new V2 release fails, stop staff activity and restore compatible prior application files. Do not restore an old database over newer customer work without reviewing data loss. Nothing in this guide authorizes a main-domain production deployment.

## Reference documentation

- [cPanel File Manager](https://docs.cpanel.net/cpanel/files/file-manager/110/) and [show hidden files](https://support.cpanel.net/hc/en-us/articles/5085107370135-How-to-show-hidden-files-in-cPanel-File-Manager).
- [cPanel database users and privileges](https://docs.cpanel.net/cpanel/databases/manage-my-databases/).
- [Firebase email/password authentication](https://firebase.google.com/docs/auth/web/password-auth) and [server token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).
