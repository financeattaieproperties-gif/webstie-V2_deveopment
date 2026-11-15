# V2 testing release design

## Intent

Prepare the current Version 2 application for manual deployment to `https://website.attaieproperties.com`. The release is for testing only. It must not touch the V1 document root, V1 database, or `attaieproperties.com` production deployment.

The release must include the public site, Website Admin CRM, and every staff workspace. It must use the existing Alabaster Architectural Split-Rail dashboard system and be usable on desktop and mobile layouts.

## Goals

- Build a new, isolated manual-staging release from current V2 source.
- Include only deployable public files and a separately packaged private/setup bundle.
- Keep projects and unit catalogs empty for testing, while retaining reusable explorer and workflow code.
- Verify the public site, Admin, and role workspaces build and open correctly.
- Prepare private Firebase-to-role mapping SQL for the supplied CEO, Manager, Sales Agent, Call Center Agent, Sales Leader, Marketing Manager, Editor, Videographer, Finance Manager, Architect, Graphic Designer, and 3D Visual Designer accounts.
- Create the initial `Attaie Properties - Main Branch` branch with code `MAIN`.
- Check that all dashboard entry points use the established Alabaster Split-Rail tokens, navigation, responsive behavior, and no legacy gold/teal dashboard treatment.

## Non-goals

- Uploading files, importing SQL, creating Firebase users, or changing hosted data.
- Touching V1 source, hosting, credentials, or databases.
- Deleting tracked source, documentation, historical releases, or user-owned working changes.
- Adding secret values to Git or public upload content.

## Constraints

- Firebase's public Web API key is used only as a transient build environment value.
- Firebase account UIDs and email addresses go only into the private setup bundle, never source control or public web files.
- The V2 database remains empty until the owner imports the prepared fresh schemas and private role mapping material through phpMyAdmin.
- The existing uncommitted `sales-android/.../MainActivity.kt` edit and untracked `.agents/skills/startup/` directory remain untouched.
- The release script's public/private output separation remains the authority for cleanup. "Cleanup" means excluding generated or stale deployment files from the staged release, not deleting repository history.

## Approaches considered

1. **Release-only cleanup — selected.** Create a fresh manual-staging directory from source and prune only its output. This preserves source and historical material while preventing stale files from reaching testing hosting.
2. **Repository cleanup.** Delete old source artifacts and release material. Rejected because the owner did not identify exact targets and deletion could remove useful history.
3. **Dashboard rewrite before release.** Rebuild every dashboard interface. Rejected because the current source already has the Alabaster Split-Rail architecture; the appropriate work is verification and focused fixes discovered by it.

## Release shape

The public upload archive contains the public Vite site, `/admin/`, `/dashboard/`, `/management/`, `/callcenter/`, dedicated staff entry points (`/ceo/`, `/sales-leader/`, `/sales/`, `/finance/`, `/marketing/`, `/engineering/`), public PHP routes, required assets, and server rewrite files.

The private archive contains database inputs, private PHP configuration templates, setup instructions, a generated Firebase identity/role/branch mapping SQL file, and checksums. It is extracted outside the web root. It contains no Firebase passwords.

The release records `serverUploaded`, `databaseImported`, and `serverVerified` as false until the owner completes those external steps.

## Dashboard verification

Validate every supported role and its permitted workspace routes using the current role matrix. Check the split rail, `All Modules` drawer, breadcrumb topbar, focus behavior, keyboard navigation, Dari/RTL, 375px mobile layout, 768px tablet layout, and 1024px/1440px desktop layout. Confirm responsive surfaces prevent horizontal overflow and retain usable touch targets.

Fix only verified deviations from the Alabaster standard. Run role-matrix, branch-readiness, lifecycle, responsive browser fixtures, TypeScript checks, package source audit, and a production build before staging.

## Owner deployment steps

The owner manually uploads the public archive contents to the V2 testing document root, extracts the private archive outside the web root, creates/imports the three empty V2 databases, configures private credentials and Firebase project values, runs the generated role mapping SQL in the Internal CRM database, and checks the hosted workflows. The main domain remains unchanged.

## Builder decisions

- Use `MAIN` as the initial branch code.
- Treat supplied Firebase IDs and emails as exact values, including any unusual email domain spelling.
- Preserve the current role set; do not provision retired roles.
- Skip map functionality when a maps key is unavailable, without blocking the testing package.
- Assign every supplied non-CEO user to `MAIN`. The supplied Manager manages that branch, and the supplied Sales Agent reports to the supplied Sales Leader.
