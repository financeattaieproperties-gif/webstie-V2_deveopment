# V2 manual testing kit verification

Current kit: `releases/v2-complete-test-20261111-resumed/`.
Target: `https://website.attaieproperties.com`, separate V2 document root and database.
No upload, hosting import, external account change, or V1 operation occurred.

The earlier `v2-complete-test-20261111` folder is superseded. Its integrity test failed for 16 files and its two admin SQL copies disagreed. It was preserved for investigation rather than repaired in place. The exact cause of those post-manifest differences remains unknown. Use the resumed kit only.

## Fresh evidence

- Full packager built public, admin, call center and management assets, with all three TypeScript checks passing. Build output is recorded in `releases/v2-resumed-build.log`.
- 18 Node domain/isolation tests passed.
- Kit integrity check passed: 267 manifest files; 98 preserved artwork files; projects 1–5 and 25 sample layouts; separate SQL/private setup; English-only call center.
- All 49 packaged PHP files passed syntax checks.
- Both ZIPs passed CRC checks and byte-for-byte comparison against their source folders, including hidden files.
- 26 packaged local checks passed against a newly created fictional loopback MariaDB database (`attaie_v2_kit_fed3eb4cac`, port 3397). All three initial SQL imports succeeded, creating 39 tables. CEO provisioning template succeeded with a fictional UID. The generated private admin password matched its imported bcrypt hash and authenticated through the packaged login endpoint.
- Packaged project list returned five records; each project detail endpoint returned HTTP 200. Public/admin/staff HTML shells were served. Anonymous protected APIs denied access. Website-admin session granted website-admin access but did not grant staff access. Anonymous staff session returned a CSRF token and noindex header.

Commands:

```powershell
node scripts/package-v2.mjs releases/v2-complete-test-20261111-resumed C:/Users/ROHEEN~1/AppData/Local/Temp/attaie-staff-php84/php.exe
node --test tests/staff/domain/*.test.mjs tests/staff/packaging/isolation.test.mjs
node tests/staff/packaging/v2-kit.mjs releases/v2-complete-test-20261111-resumed
node tests/staff/packaging/v2-local.mjs releases/v2-complete-test-20261111-resumed C:/Users/ROHEEN~1/AppData/Local/Temp/attaie-staff-php84/php.exe
```

The local package test requires the existing fictional MariaDB service on 127.0.0.1:3397 and creates a new database every run. It configures only temporary copies; release files remain unchanged. Test servers are stopped after checks; fictional databases remain for inspection.

## Archive hashes

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| UPLOAD-WEBSITE-CONTENTS.zip | 19605463 | `03005bb517452d05783fb649918f568f3659b194200ac2afd987aed94ccb8769` |
| UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip | 13208 | `5acb0d99074b0f5551a564f3ac9e65868f3cde491f904e2a9222e24cf0aec983` |

## Review and limits

Self-review checked packager exclusions, private/public separation, manual schema flag, route assembly, fixed project IDs and asset references, and archive contents. No independent reviewer ran in this resumed session. No product source changed during this session; added files are two local verification scripts and this handoff evidence.

Apache routing/denial rules, SSL, PHP permissions/extensions, real Firebase sign-in/reset, browser interaction workflows, uploads and customer CRUD still need hosting checks. The local PHP router tests the staff endpoint mapping only; it does not emulate Apache authorization or header rules.

Explorer calibration remains unfinished. Sample layouts/prices are not verified inventory. Automatic Etisalat ingestion and AI chat remain disabled/unconnected. Sales UI remains excluded. Owner must upload the correct public/private archives separately, import SQL only into a new empty V2 database, and provision the real Firebase UID. See the kit's `START-HERE.md`.
