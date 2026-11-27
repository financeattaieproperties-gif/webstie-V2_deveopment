# Attaie Properties — Phase 2 customer authentication (V2 only)

Status: **foundation in draft PR; not live or fully integrated.**

## Agreed product decision

Support both verified email and verified phone sign-in for website and Android users.
One verified factor is sufficient for initial registration in the current foundation; 
customers may link the second factor to the same Firebase UID. 
**Product owner still needs to confirm whether both are mandatory for property publication.**

Staff and customer identities must never be joined by matching email or phone.
The customer Website database has its own `customer_accounts` table keyed by Firebase UID.
Existing CRM (`core_users`), Website Admin, and Submissions DB access are unchanged.

## Code included

- `public/api/migrations/2026-11-27-customer-identity.sql`: manual additive V2 Website MySQL migration
- `public/api/customer-firebase-auth.php`: verified Firebase JWT and active account lookup
- `public/api/customer-identity.php`: canonical verified claim mapping and profile field allowlist
- `public/api/customer-cors.php`: allowlisted browser origins with bearer Authorization headers
- `public/api/customer/me.php`: GET own profile, POST create/sync own profile
- `tests/website/customer-firebase.php`, `tests/website/customer-identity.php`: policy and token verification regression tests
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

1. Run schema migration only against a backed-up V2 Website database in staging.
2. Configure a customer Firebase project and email verification; confirm project isolation.
3. Implement React signup/signin and provider-linking; do not use client-side auth as authorization.
4. Integrate GET/POST profile API with meaningful loading/error/retry states.
5. Run HTTP/MySQL integration and authorization tests in staging.
6. Run a real Afghanistan carrier SMS pilot with consented test accounts.
7. Build Android Kotlin Compose login and recovery with matching API contract.
8. Implement verified customer account deletion/recovery/identity update workflows.
9. Add rate limits and abuse controls; monitor production telemetry before general availability.
10. Add customer-owned property draft API only after identity integration passes.

## Review constraints

V1 production is untouchable. No changes to CRM or Submissions DB.
No merge or deployment until tests and manual migration preflight pass.
Avoid storing access tokens, passwords, verification codes, or provider keys in the MySQL customer table.
