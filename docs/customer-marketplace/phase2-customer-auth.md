# Attaie Properties — Phase 2 customer authentication (V2 only)

Status: **identity and agency verification foundations in draft PR; not live or fully integrated.**

See [agency verification implementation and staged rollout](./phase2-agency-verification.md) for private document intake, representative details and Website Admin-only approval.

## Agreed product decision

Support both verified email and verified phone sign-in for website and Android users.
One verified factor is sufficient for initial registration in the current foundation; 
customers may link the second factor to the same Firebase UID. 
**Owner decision (confirmed):** One verified email OR one verified phone number is sufficient for registration and initial property submission. An authorized, server-derived risk check can require additional verification (both methods) when necessary. A client-provided risk level must never bypass the server policy.

Staff and customer identities must never be joined by matching email or phone.
The customer Website database has its own `customer_accounts` table keyed by Firebase UID.
Existing CRM (`core_users`), Website Admin, and Submissions DB access are unchanged.

## Confirmed customer and agency account decision

Both **Individual** and **Real Estate Agency** accounts are supported by the
customer identity schema. A customer starts as `individual` and can apply for
one agency profile. Creating an agency application atomically records the
authenticated customer as its **owner**, creates an owner membership, and
marks the account type `agency`. This does **not** mean the agency is verified.

Agency applications begin in `pending` state. Only an authorized Website Admin
review can set `verified` or `rejected`; public customer APIs cannot set
verification status or assign listing ownership.

- A pending agency owner can prepare listing drafts and submit for review, once
  customer listing endpoints exist.
- A property must **not** be publicly published under an agency identity unless
  both the normal listing approval is granted and the agency is verified.
- Agency-owned and individually owned published properties have **distinct**
  ownership columns in `customer_property_ownership`, not interchangeable
  customer email/phone references.
- Staff CRM and Website Admin roles remain isolated. Agency accounts gain no
  staff permissions.
- Agency team onboarding/delegation beyond the initial owner is a later
  feature; manager/agent membership roles are reserved but no public team
  invitation APIs are exposed.
- Agency review documents must be handled via a future private media pipeline;
  do not upload sensitive registration documents through `description` or
  public media storage.

## Code included

- `public/api/migrations/2026-11-27-customer-identity.sql`: manual additive V2 Website MySQL migration
- `public/api/customer-firebase-auth.php`: verified Firebase JWT and active account lookup
- `public/api/customer-identity.php`: canonical verified claim mapping and profile field allowlist
- `public/api/customer-publication-policy.php`: server-only standard and step-up verification requirements; not yet wired into a listing submission route
- `public/api/migrations/2026-11-27-customer-agencies.sql`: manual V2 Website-only agency and published-listing ownership schema
- `public/api/customer-agency-policy.php`: agency application field allowlist and authenticated membership/verification policy
- `public/api/customer/agencies.php`: authenticated owner agency application POST and owner GET (no approval endpoint)
- `tests/website/customer-agency-policy.php`: agency application, authorization and verification tests
- `public/api/customer-cors.php`: allowlisted browser origins with bearer Authorization headers
- `public/api/customer/me.php`: GET own profile, POST create/sync own profile
- `tests/website/customer-firebase.php`, `tests/website/customer-identity.php`, `tests/website/customer-publication-policy.php`: policy and token verification regression tests
- `.github/workflows/customer-identity-checks.yml`: PHP lint + isolated policy tests

## Environment setup (manual; do not use staff secret configuration)

Configure `CUSTOMER_FIREBASE_PROJECT_ID` and `CUSTOMER_FIREBASE_API_KEY`
for the dedicated customer Firebase project. Never expose Firebase server credentials
or private keys in frontend source or public deployment assets.
Set `CUSTOMER_ALLOWED_ORIGINS` only for additional HTTPS staging origins when needed.
Ensure PHP has OpenSSL and cURL, and web server forwards the Authorization header.
Enable only verified email sign-in first; keep phone sign-in disabled to live users
until Afghanistan SMS pilot passes.

### Current API contract

`POST /api/customer/me.php`
- Header: `Authorization: Bearer <Firebase ID token>`, `Content-Type: application/json`
- Body: `{"display_name":"Example","locale":"en"}`
- Response 201 on create / 200 on existing: `{"customer":{...}}`
- The client cannot send `firebase_uid`, `email_verified`, `phone_verified`,
  `phone_e164`, `account_type`, `role` or `status`.
- Only a verified email or phone from Firebase account lookup creates an account.

`GET /api/customer/me.php`
- Header: `Authorization: Bearer <Firebase ID token>`
- Response 200 when already registered, 404 if not created, 403 if suspended/deleted.

Do not call POST automatically for anonymous website visitors.

`POST /api/customer/agencies.php` requires an already registered, active customer with one verified contact method. Body: `{\"legal_name\":\"Example Real Estate\",\"public_name\":\"Example\",\"registration_reference\":\"\",\"description\":\"\"}`. Initial response is `201 {\"agency\":{\"verification_status\":\"pending\",...}}`. Customer-supplied owner ID, verification status, member roles or staff roles are rejected. `GET /api/customer/agencies.php` returns only the authenticated owner's agency, or null.

## Afghan SMS carrier acceptance before phone launch

Test real, consented devices/numbers across the Afghan mobile carriers the team plans to support.
Use Firebase test phone numbers ONLY for automated UI tests; those do not send real SMS.
Real-carrier pilot must log (without phone/OTP content):
carrier, handset model/Android version, network conditions, region, requested-at timestamp,
delivery outcome, completion time, timeout, duplicate resend, rate limit and user-visible error.
Set a pilot budget and monitor SMS costs; configure Firebase SMS region policy and abuse protection.
Verify reCAPTCHA/Play Integrity fallback on phones without Google Play Services.
Do not put private phone numbers in logs, issues, screenshots, or analytics.

Go/no-go criteria: repeatable delivery on actual target carriers and devices, known failures
recoverable through verified email, cost controls enabled, and explicit user consent.

## Required integration work (not complete)

1. Run both identity and agency migrations **in order** only against a backed-up V2 Website database in staging. Check MySQL 8.0.16+ CHECK constraint enforcement before using agency ownership mapping.
2. Configure a customer Firebase project and email verification; confirm project isolation.
3. Implement React signup/signin and provider-linking; do not use client-side auth as authorization.
4. Integrate GET/POST profile API with meaningful loading/error/retry states.
5. Run HTTP/MySQL integration and authorization tests in staging.
6. Run a real Afghanistan carrier SMS pilot with consented test accounts.
7. Build Android Kotlin Compose login and recovery with matching API contract.
8. Implement verified customer account deletion/recovery/identity update workflows.
9. Add rate limits and abuse controls; monitor production telemetry before general availability.
10. Add customer-owned property draft API only after identity integration passes, and enforce `customer_property_submission_decision` in the backend for every submission.
11. Define server-derived risk triggers, review procedures and appeal/recovery before enabling step-up in production.
12. Website Admin agency approval/rejection API + screen, private registration/license upload, and audit are committed; these are **not yet tested or deployed**.
13. Build owned listing drafts and reviewer-controlled publication that writes `customer_property_ownership` only after approval; it is **not yet built**.
14. Build React customer-facing agency application, representative/document upload, pending/rejected status, and owner dashboard; it is **not yet built**.
15. Test agency application HTTP/MySQL concurrency, rejection of unauthorized owners, and suspension; policy tests alone do not verify database transactions.

## Review constraints

V1 production is untouchable. No changes to CRM or Submissions DB.
No merge or deployment until tests and manual migration preflight pass.
Avoid storing access tokens, passwords, verification codes, or provider keys in the MySQL customer table.
