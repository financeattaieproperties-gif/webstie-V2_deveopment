# Agency verification workflow — Attaie Properties V2

**Owner-approved decision:** Every real estate agency must submit a **business registration OR business license document**, the owner's verified email OR phone, separately supplied agency business contact details, and a named representative. **Only Website Admin** may approve or reject.

**Implementation status:** Development branch draft. Not merged or deployed. Migration, testing and credential setup remain pending.

## Boundaries and permission model

- Customer owner: authenticated Firebase customer UID, mapped to active `customer_accounts`, who owns the agency.
- Customer owner may submit representative details, upload registration/license document(s), and see metadata/status of their own application; never read other agencies or approve their own.
- Website Admin: existing protected admin session + CSRF for review writes. May list agencies, download private documents, approve/reject and record audit entries.
- Staff CRM, internal marketing submissions, and Website DB remain separate. Customer roles cannot access CRM.
- Agency application `pending` does NOT imply a verified or published agency; a verified agency still needs **individual listing moderation** before any property becomes public.
- `customer_property_ownership` links public properties to exactly one customer OR one agency, but there is **not yet a listing-publication integration** that writes it.

## Database deployment order — V2 website database only

After a verified staging database backup and checking `SELECT DATABASE()`, apply manually:
1. `public/api/migrations/2026-11-27-customer-identity.sql`
2. `public/api/migrations/2026-11-27-customer-agencies.sql`
3. `public/api/migrations/2026-11-27-customer-agency-verification.sql`
4. `public/api/migrations/2026-11-27-customer-agency-business-contacts.sql`
5. `public/api/migrations/2026-11-27-customer-agency-resubmission.sql`

Each script is **additive**. Do not apply to V1 or internal CRM/submission databases.
Staging MySQL must support CHECK constraints (MySQL 8.0.16+); confirm before applying ownership migration.
Do not apply if any table/column already exists without reviewing its current definition first.

## Storage and secret configuration

Create a dedicated writable directory **outside every website document root**, accessible only to the PHP operating user (e.g. directory mode 0700). Supply its absolute path via `CUSTOMER_AGENCY_PRIVATE_DIR`. No directory is created by the request.
Deploy only when the directory is provably outside public static serving, including aliases, symlinks and other hosted domains.
Provision `CUSTOMER_FIREBASE_PROJECT_ID`, `CUSTOMER_FIREBASE_API_KEY` and allowlisted `CUSTOMER_ALLOWED_ORIGINS` for the customer identity provider.
Do not put private documents into `public/uploads`, the Git repository, the Android APK or ordinary public object storage.
Private file contents, paths, tokens and phone values must not appear in logs or analytics.
Backups, access logs, staff confidentiality rules, incident response, retention/deletion schedule and malware screening must be approved before enabling live agency document intake.

## Customer API

All customer APIs require an active customer and valid Firebase bearer token; browser origins are allowlisted.

- `POST /api/customer/agencies.php`: initial agency application (creates owner membership and pending agency)
- `GET /api/customer/agencies.php`: own agency profile
- `GET /api/customer/agency-verification.php`: own representative fields/status
- `POST /api/customer/agency-verification.php`: JSON:
  `{"version":N,"representative_name":"Example Representative","representative_position":"Director","representative_contact_method":"email","business_email":"office@example.com","business_phone_e164":"+93701234567"}`
  - Only `email` or `phone` if the corresponding Firebase-linked contact is verified
  - Owner-only, pending or revision applications only; requires current optimistic-lock version; no status or reviewer mutation
  - Agency business email/phone are independent of the verified owner's contact; at least one business contact is required, and those values are NOT automatically OTP-verified
  - Any edit resets business-contact review evidence
- `POST /api/customer/agency-document.php`: multipart `version=N`, `document_type=registration|license`, `document=<PDF|JPEG|PNG>`
  - Up to 5 MB per file; one current document per category; previous versions remain private; maximum 30 lifetime uploads per agency
  - Owner-only; pending or revision status required; version check and audit event
  - Validation checks file size, magic signature and MIME; random opaque private storage key; integrity hash recorded in DB
  - Returns metadata ID and new version only, never a public download URL
- `GET /api/customer/agency-documents.php`: own current document metadata/status, no bytes or storage keys
- `GET /api/admin/customer-agency-history.php?agency_id=…`: Website Admin-only transition and change-event history
- Website Admin document metadata includes both current and superseded documents, with private authenticated download.

## Website Admin API

All routes use the **existing Website Admin session**; mutation requires CSRF:

- `GET /api/admin/customer-agencies.php?status=pending|verified|rejected|revision|all`
  - Returns review queue (max 100) including owner contact verification and document count
- `GET /api/admin/customer-agency-document.php?agency_id=…`
  - Lists private document metadata
- `GET /api/admin/customer-agency-document.php?agency_id=…&document_id=…`
  - Authenticated attachment-only file read; file size and SHA-256 integrity checked
- `POST /api/admin/customer-agencies.php`:
  `{"agency_id":123,"version":1,"decision":"verified","reason":"","business_contact_reviewed":true,"documents_reviewed":true}`
  or
  `{"agency_id":123,"version":1,"decision":"rejected","reason":"Missing valid registration document","business_contact_reviewed":false,"documents_reviewed":false}`
  - Server checks pending state, optimistic-lock version, the owner's verified contact, representative details, at least one supplied agency business email/phone, explicit Website Admin confirmations of business-contact and document review, and at least one intact private document before approval
  - Rejection reason is required
  - Approval/rejection and reviewer username are recorded in verification event history; on approval, the business-contact review timestamp and reviewer username are saved as well
- Admin UI: `/admin/agency-verification` accessible through the Website Admin sidebar

## Frontend delivery status

- `src/lib/customerAgencyClient.ts`: typed authenticated customer agency API client
- `src/components/customer/AgencyOnboarding.tsx`: reusable private agency creation, representative/business-contact form, document upload and review status UI
- `admin-panel/src/pages/AgencyVerification.tsx`: Website Admin review page, explicit manual business-contact acknowledgement required before approval
- The customer onboarding component is mounted at **`/customer/account`** behind an in-memory Firebase email sign-in/verification flow (`src/pages/CustomerAccountPage.tsx` and `src/lib/customerEmailAuth.ts`). The backend independently enforces Firebase bearer tokens. Browser reload signs out by design; no token is persisted in browser storage.
- Configure the **public Firebase Web API key** as `VITE_FIREBASE_API_KEY` at frontend build time; enable Email/Password and email verification in Firebase. The backend separately requires `CUSTOMER_FIREBASE_PROJECT_ID` and `CUSTOMER_FIREBASE_API_KEY`. Do not embed admin/service-account secrets in the frontend.
- **Phone OTP is not implemented**: requires supported Firebase phone authentication, reCAPTCHA and real-carrier acceptance testing. Do not claim full email/phone parity.
- The owner's email/phone must be verified by Firebase, whereas the business email/phone are submitted contact details reviewed manually by Website Admin; the UI must not describe them as OTP-verified.

## Rejected agency correction and resubmission (draft)

- `rejected → revision → pending` is the **only** owner-controlled review-state transition. A verified or pending agency cannot open a revision; owners cannot approve themselves.
- `POST /api/customer/agency-revision.php` with `{"action":"start_revision","version":N}` opens correction. `{"action":"resubmit","version":N}` checks required representative, owner-verified contact, business contact and current document before returning to the Website Admin queue.
- `POST /api/customer/agency-revision-details.php` edits legal/public name, registration reference and description **only in revision** with optimistic version control.
- `POST /api/customer/agency-verification.php` edits representative and business contacts in pending or revision.
- Uploading a replacement of the same registration/license type supersedes prior document metadata (`is_current=0`); **historical files are retained privately**, and Website Admin can still download them for audit. Current document metadata is returned to the customer.
- Every transition creates an append-only `customer_agency_verification_events` record; Website Admin's `GET /api/admin/customer-agency-history.php?agency_id=…` and review page display decisions and resubmission rounds.
- The revision API does not automatically approve or publish agency listings; Website Admin remains sole decision-maker.
- Profile, representative/contact and document changes now create transactional audit events with version/round references. The event log does **not** yet contain complete immutable before/after field snapshots. Database migrations, PHP/MySQL HTTP integration tests, full browser builds, storage integrity and rollback validation have **not been executed**.

## Implementation and launch gates

Still required before production:
1. Ensure GitHub Actions runner works; run PHP lint, policy tests, admin TypeScript build, and full HTTP/MySQL fixture integration.
2. Test actual upload size/type checks, symlink/path refusal, ownership and CSRF, concurrent review updates, document integrity, repeated uploads and upload-abuse limits.
3. Reconfirm owner's verified contact information from Firebase before approval; existing stored verification flags must be treated as potentially stale. Manually compare agency business contacts against submitted documents, without implying independent phone/email OTP verification.
4. Rehearse and harden the committed correction/resubmission flow, including historical document access, audit completeness, concurrent updates, and a field-level change log.
5. Validate the new `/customer/account` route in browser with real Firebase configuration and refresh behavior; complete supported phone OTP and sign-in recovery, then test protected agency onboarding end to end.
6. Decide and implement private-document malware scanning, retention, access audit and lawful handling.
7. Review and document administrator actions: rejecting an application must not expose private documents or customer PII to public pages.
8. Run manual cPanel staging acceptance and backup/restore drills; no V1 deployments.
