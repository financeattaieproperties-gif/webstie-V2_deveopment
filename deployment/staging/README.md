# Fresh cPanel test installation

Target: **https://website.attaieproperties.com** only. This kit is not a V1 upgrade package.

The site bundle includes the frontend, web admin, and PHP endpoint source. Setup creates **19 tables**, **empty project and project-unit catalogs**, and **one bcrypt admin account**. No project artwork or sample inventory is bundled. Add new projects through the application.

This is a legacy installer guide. For the owner's current manual phpMyAdmin workflow, use [the V2 setup guide](../v2/START-HERE.md).

## 1. Create the isolated subdomain

In cPanel, open **Domains > Create A New Domain**, enter `website.attaieproperties.com`, and disable sharing the main domain's document root. Use:

```text
/home/CPANEL_USER/website.attaieproperties.com
```

Replace `CPANEL_USER` with your actual cPanel account name. The installer requires this dedicated folder name and refuses to overwrite an existing `api/db.php`. The folder must be new and empty before extracting this site. Do not place it in the production document root or copy production credentials into it.

If DNS is managed elsewhere, point the subdomain's DNS record at this hosting account. Enable HTTPS for the subdomain through cPanel SSL/TLS Status / AutoSSL. Select PHP 8.2 or newer for this subdomain with `mysqli`/mysqlnd, JSON, fileinfo, session, OpenSSL, and cURL available.

## 2. Create the new test database and database user

Open **Database Wizard** (older cPanel versions call it **MySQL Database Wizard**).

1. Create a new database, for example `CPANEL_USER_attaie_test`. The installer requires a name ending in `_test` or `_staging`.
2. Create a new MySQL user with its own strong password.
3. Grant that user all privileges on **only the new test database**. Do not grant it access to V1's database.
4. Record the complete database and user names shown by cPanel, including its account prefix.

Do not import SQL manually if using the installer below; it requires a completely empty database.

## 3. Extract the kit outside the web root

Upload the full `staging-kit-*.zip` to your cPanel home directory, then extract it into:

```text
/home/CPANEL_USER/attaie-staging-kit
```

It contains `site/` and `setup/`. Move the **contents** of `site/`, including `.htaccess` and `.user.ini`, into the new subdomain's document root. Enable **Show Hidden Files** in File Manager settings. `index.html` must end up directly at:

```text
/home/CPANEL_USER/website.attaieproperties.com/index.html
```

Keep the entire `setup/` folder outside every public document root. It contains SQL and the setup tools; it is not part of the website upload. No real credentials, production uploads, or private chat history are included in this kit.

## 4. Fill in the private setup config

Copy `setup/config.example.php` to `setup/config.php`. Edit these fields in cPanel File Manager:

- `document_root`: the new subdomain's full filesystem path.
- `database_host`: normally `localhost`; use the value supplied by your host.
- `database_name`, `database_user`, `database_password`: the new test database credentials.
- `admin_username`: the first administrator's login name, initially `owner`. Use 1-100 ASCII letters, digits, underscores, periods, @ signs, or hyphens, starting with a letter or digit, with no spaces.
- `ai_private_directory`: a new private folder such as `/home/CPANEL_USER/attaie-test-private`. The installer creates it; do not reuse any existing AI storage directory.

Keep `site_url` set to `https://website.attaieproperties.com`. Do not put your admin password in this config.

## 5. Create tables and the first admin

Open **cPanel > Terminal**. Run these commands after replacing the account prefix and paths:

```bash
read -r -s -p 'New admin password (16-72 bytes): ' ATTAIE_SETUP_ADMIN_PASSWORD
printf '\n'
export ATTAIE_SETUP_ADMIN_PASSWORD
php /home/CPANEL_USER/attaie-staging-kit/setup/install.php --config=/home/CPANEL_USER/attaie-staging-kit/setup/config.php --confirm-database=CPANEL_USER_attaie_test
unset ATTAIE_SETUP_ADMIN_PASSWORD
```

The password prompt hides input and avoids putting the password in shell history. Use a unique password of at least 16 characters without leading/trailing spaces (the limit is 72 bytes for bcrypt).

If `php` uses the wrong version, your host may provide a versioned binary such as `/opt/cpanel/ea-php83/root/usr/bin/php`. Confirm that path with your provider. If Terminal is disabled, ask your host to run the command with you or request a separate phpMyAdmin procedure. Do not upload the installer into a public folder to run it through a browser; HTTP execution is deliberately disabled.

On success, the installer reports 19 tables, an empty project catalog, and one bcrypt admin. It creates a new staging `api/db.php` with **blank legacy ADMIN_USER/ADMIN_PASS constants**, so the admin login uses the hashed database account. The admin password itself is not saved in a file. The existing login endpoint verifies its hash using `password_verify()`.

If setup fails after starting SQL, it may leave partial tables in this new database because MySQL DDL is not transactional. Do not rerun SQL blindly. Check the error phase and host settings, then recreate **only the new test database**, remove only this failed staging installation's generated config/private folder if present, and retry. Never reset V1.

## 6. Verify the testing site

Open:

```text
https://website.attaieproperties.com/
https://website.attaieproperties.com/admin
https://website.attaieproperties.com/api/get-projects.php
https://website.attaieproperties.com/projects
```

Sign in at `/admin` with your configured username and the password entered in Terminal. The projects API initially returns an empty array. After adding fictional project records and uploading artwork, check listings, plans, unit selection, English/Dari, RTL, mobile layouts, and test submissions.

Run these read-only checks in phpMyAdmin with **the test database selected**:

```sql
SHOW TABLES;
SELECT id, name FROM projects ORDER BY id;
SELECT project_id, COUNT(*) AS showcase_layouts
FROM project_units GROUP BY project_id ORDER BY project_id;
SELECT username, LEFT(password_hash, 4) AS hash_prefix FROM admin_users;
```

Expected: no projects or project-unit rows before adding new records. The bcrypt hash prefix should be `$2y$`.

The kit sets `robots.txt` to disallow crawling, sends an `X-Robots-Tag: noindex` header when Apache mod_headers is available, and sets the database's indexing flag off. Some frozen SEO code normalizes this staging hostname to the main production canonical URL; no SEO endpoint changes were made. Use cPanel Directory Privacy if you need access restriction; noindex directives are not authentication.

The staging `.htaccess` blocks `initiate-call.php` so testing cannot ring the live call center. Do not add Etisalat production credentials. WhatsApp and telephone links still lead to the company's real contact channels. Google Maps requires a browser API key authorized for this staging hostname; no credentials are included in the kit.

**AI HTTP endpoints are deliberately blocked in this testing kit.** The frozen AI storage fallback can select a sibling directory shared with another installation when a host ignores Apache SetEnv. The staging guard prevents those requests from reaching PHP. The installer also configures a new test-only private directory. Enabling AI later requires separately verifying the PHP handler's environment, private storage path, and read-only database credentials before removing that staging guard. No AI provider credentials are included.

After setup, remove the uploaded ZIP from cPanel and delete `setup/config.php` once you have saved the new test database credentials in your password manager. Keep private SQL/setup backups outside web roots. The staging runtime keeps its necessary database credentials in its new `api/db.php`.

## What has and has not been validated

The frontend production build and TypeScript checks passed before packaging. The project assets and frontend ZIP manifest were verified. PHP endpoint source is copied without modification; protected production resources were not touched. The packaging process checks project seed counts, image paths, and backend file hashes.

Installation on your cPanel server, its PHP/MySQL configuration, HTTPS, browser flows, Maps, and AI storage environment propagation still require verification. The build alone does not prove those integrations work.

References:

- https://docs.cpanel.net/cpanel/domains/domains/
- https://docs.cpanel.net/cpanel/databases/database-wizard/
- https://docs.cpanel.net/cpanel/files/file-manager/
- https://www.php.net/manual/en/function.password-hash.php
