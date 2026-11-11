# Frontend release preparation

This release targets the existing cPanel installation. Production has not been changed.

For the separate, fresh testing deployment at `website.attaieproperties.com`, use the full staging kit and [staging installation guide](deployment/staging/README.md). That kit includes immutable backend copies and an empty-database installer. The frontend-only instructions below apply to an existing installation.

## Build and package

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run lint
powershell -ExecutionPolicy Bypass -File scripts/package-frontend.ps1
```

The package is written to `releases/frontend-YYYYMMDD-HHMMSS.zip`. A sibling JSON manifest records each file's SHA-256 hash. Upload only the ZIP contents, never the raw `dist/` directory. The current build copies backend files into `dist/`; those files are not part of this frontend release.

The ZIP includes the public frontend and web admin frontend, static assets, fonts, and logo. It excludes all PHP, API directories, SQL, database configuration, server configuration, uploads, robots directives, and sitemap files. Keep all existing server files and old hashed assets in place during an upgrade.

## Release prerequisites

- Confirm the canonical domain. Source currently uses `https://www.attaieproperties.com`; the repository instructions also mention `attaieproperties.af`. No domain change was made.
- Test the package on isolated staging with separate data or API fixtures. The Vite preview provides mock API responses, so preview success does not prove PHP compatibility.
- Verify all frontend calls against the existing V1 API contracts. A missing backend capability is a release blocker; do not upload PHP or run migrations to resolve it.
- Check the home page, listings, detail pages, contact page, agents, careers, admin login and navigation, English/Dari, RTL, and mobile layouts.
- Test submissions, uploads, chat, visit requests, and calls only against isolated services. Do not perform development writes or trigger calls against production.
- Check Google Maps and other external integrations on the staging hostname with their intended browser key restrictions.
- Confirm that existing production rewrite rules serve public and admin deep links, dynamic SEO, and the sitemap. This package deliberately leaves those rules unchanged.

## Rollback and release

Before any approved production release, download the current V1 frontend files and record the exact paths that will be overwritten. Keep that backup outside the web root. Preserve the existing APIs, PHP, configuration, database, and uploads.

Only after staging checks pass and production deployment is explicitly authorized, extract the frontend ZIP into the existing document root without deleting other files. For rollback, restore the saved frontend files and entry points. Retain old hashed assets until rollback is no longer needed.

## Validation in this session

- Repaired the root npm lockfile to match the existing dependency declarations.
- The combined production build completed for the public site and web admin.
- `npm run lint` runs TypeScript checking, not ESLint.
- No production deployment, database changes, or API source changes were performed.

Browser interaction checks and compatibility with the deployed V1 backend remain release prerequisites. A successful build alone does not establish production safety.
