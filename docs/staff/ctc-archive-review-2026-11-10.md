# CTC archive integration review

Source: `C:/Users/RoheenAhmadi/Downloads/ctc-cpanel-upload.zip`, inspected read-only on 2026-11-10. Archive was not extracted into the website, installed, imported, or deployed. No configuration credentials were printed.

## Evidence

- `api/ctc/initiate_call.php` records an authenticated agent ID, agent phone, customer phone, and local `reference_id` before initiating an Etisalat CTC call. Provider response may supply `requestid`.
- `api/ctc/callback.php` receives JSON and maps candidate aliases for reference, status, and duration. Its comment explicitly says field names need adjustment after provider documentation is obtained.
- Callback status mapping treats `answered`, `connected`, and `success` as completed, alongside `end` and `ended`. These are insufficient to distinguish answering from disconnection.
- The receiver updates `ctc_call_log`; it does not insert a lead/customer or create a follow-up.
- Parsed duration is not persisted by this receiver. Call log schema has `created_at`, but no explicit started/answered/ended timestamps. Creation time must not be presented as verified call-end time.
- Callback authentication is optional based on a configured shared secret in the query string. New staff ingestion must require a documented authentication mechanism; do not reuse an optional guard as a verified provider contract.
- `call_history.php` and `call_status.php` read the application's own call log. They do not fetch a provider CDR history endpoint or demonstrate direct ordinary mobile-call reporting.
- Archive includes its own users, sessions, contacts, follow-ups, call logs and token cache. This is a separate CTC application, not a safe drop-in replacement for existing website files.

## Reuse in the new staff design

Use these fields as an integration reference: agent ID/phone, customer number, local call reference, and provider request ID. Keep the original CTC files/database unchanged. New staff database owns customers, leads, assignments, follow-up deadlines, and feedback.

Before enabling automatic lead ingestion, verify actual final event names/fields, unique provider call/event identity, end timestamp/timezone, account callback authentication, retry behavior, supported call types, and independent event delivery that leaves the current callback intact. Obtain a redacted received callback or provider account documentation; source-side candidate aliases are not proof.

Until verified, develop with clearly labeled event fixtures/manual entry. Do not mark an answered call as an ended call. Do not claim direct mobile-call capture based only on this archive.

## Owner scope update

Implement call center and shared tasks/management foundation. Do not build a sales-agent dashboard yet. Prepare backend permissions and assignment contracts for future sales integration without shipping `/sales` UI. Sales-dependent end-to-end acceptance remains pending that future dashboard or verified API-based testing; do not describe it as an available sales screen.
