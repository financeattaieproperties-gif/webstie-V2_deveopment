# CPaaS saved-page review: automatic lead creation

Reviewed read-only on 2026-11-10:

- `C:/Users/RoheenAhmadi/Downloads/Cpaas - for your Technological Dreams.html`
- Its saved companion assets, especially `18-es2015.288e3a2e0d1861793827.js.download` and `19-es2015.a43630ef58664a460021.js.download`.

No provider request, authentication, call, account setting change, database operation or code deployment was performed. Sample documentation tokens/passwords were not used. This analysis adds evidence beyond the earlier CTC archive review; it does not enable automatic lead capture.

## Documented report API

Host shown in the saved documentation: `https://dservices.eand.af`.

1. `POST /Cpaas/api/pullcalldetails/authenticatepullreport`
   - Request: `username`, `password`, `dni`.
   - Response example: `idToken`, `expiresIn`, `circle`.
   - The report service has its own authentication endpoint; do not assume a CTC initiation token is interchangeable.
2. `POST /Cpaas/api/pullcalldetails/pullreport`
   - Authorization header, with Bearer supported.
   - Request: service `dni`, `fromdate`, `todate`, `calltype`, and returned `circle`.
   - Dates documented as `DD-MM-YYYY`.
   - `calltype=1` inbound, `2` OBD, `3` click-to-call.
   - Response documentation only gives a placeholder `report` value, not a defined row schema.

This supports a proposed report-polling integration without changing the existing callback, subject to account access, real response fields, provider rate limits, latency, completeness and timezone verification. A polling interval is a design choice to agree with provider limits, not an API guarantee. Cross-midnight/late-arriving report reconciliation and stable call deduplication are required.

## Click-to-call end-event evidence in saved UI code

The saved CPaaS configuration module includes a **Click To Call Pingback** form and these configurable event flags:

- `A_Party_Dial_Initiate`
- `A_Party_Connected_or_Not_Connected`
- `B_Party_Dial_Initiate`
- `B_Party_Connected_or_Not_Connected`
- `Call_End`

The form includes API URL, method, content type, authentication, timeout, retry and SSL-verification settings. Authentication UI supports Bearer, Basic and Header options. Static constructor defaults are not evidence of this customer's enabled settings.

This is evidence of platform support for a CTC end-event integration. It does not establish the body sent for `Call_End`, request signing/authentication behavior, whether the feature is provisioned for the account, which end event corresponds to the relevant bridged leg, or whether a second destination can coexist with V1.

## Call-report field evidence in saved UI code

The incoming CTC report component defines columns:

`CALLID`, `MSISDN`, `CLI`, `ENTRY_TIME`, `END_TIME`, `AGENT_NAME`, `AGENT_NO`, `STATUS`.

Its related internal field list includes `CALL_UID`.

These are useful candidate mappings for customer/mobile, business number, agent identity, timestamps, status and unique-call identity. The public Pull Report API may use different names/structures. Do not map UI column labels directly into production ingestion without an actual report row or callback sample. Uniqueness, status values, call-leg meaning and timestamp timezone remain to be verified.

## Other sections must not be confused with CTC

The progressive-campaign documentation explicitly lists `A_Party_Call_End` and `B_Party_Call_End` pingback controls. OBD documentation also offers pingback settings. These are different service APIs; do not create, activate or alter campaigns just to obtain CTC lead events.

The documented CTC initiation response (`status=1`, success/request ID) confirms a request was accepted, not that a conversation ended.

## Recommended integration

Preferred, if available without disturbing V1:

1. A provider-authenticated CTC `Call_End` notification reaches a NEW isolated staff receiver.
2. Preserve the provider call/event identity and normalized event in a durable private inbox before acknowledgment.
3. Validate the final state and customer/receiving-agent mapping, then insert one staff draft lead per eligible physical call.
4. Deduplicate repeated delivery and multiple call-leg events; allocate the stable lead serial transactionally.
5. Agent completes name/requirements/next time; existing staff entry transaction creates or links the customer.
6. Use the read-only Pull Report API for reconciliation or as the primary delayed ingestion path when independent pingback delivery is unavailable.

Before enabling: obtain one redacted real `Call_End` payload or report response, verify account/DNI access and agent routing, confirm authentication and timezone, and confirm safe independent delivery. Never replace the existing V1 callback URL or modify its PHP/database under this analysis request. If only one callback destination exists, prefer independently authorized read-only report polling until a safe provider-supported fan-out arrangement is approved.

Only calls handled by the configured CPaaS service are demonstrated here. Direct calls to an ordinary SIM that bypass CPaaS are not proven to appear in these events/reports.

## Current implementation status

The separate call center/management core remains locally implemented and tested. Automatic provider-triggered lead creation is still disabled. This page makes the available integration paths substantially clearer; it is not proof that they are enabled or verified on the owner's account.
