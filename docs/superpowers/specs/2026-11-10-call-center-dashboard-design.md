# Call Center and Sales Follow-up Dashboard Requirements

Date: 2026-11-10
Status: Confirmed workflow requirements captured; integration details and identifier decisions remain open. Implementation has not started.

## Purpose

Provide a dedicated call center dashboard connected to a sales-agent task dashboard. Track a customer from a completed phone call through follow-ups, visits, sales handoffs, and a completed or lost deal.

## Owner requirement: consistent dashboard UX and UI

- All staff dashboards must use the same UX and UI system, including call center, sales, management, existing admin, and future role dashboards.
- Use the existing admin design as the foundation. Share staff layout, navigation placement, typography, colors, spacing, buttons, forms, tables, filters, status badges, dialogs, notifications, loading/error/empty states, responsive behavior, accessibility, and language/RTL conventions.
- Roles change available modules, permissions, and data, not the visual style or interaction conventions. My Tasks must behave consistently in every dashboard.
- Maintain one staff design-token source and reusable staff components; do not create independent role-specific design systems or copy divergent styles into each app.
- Preserve independent frontend builds: shared staff design must not add staff runtime code or assets to public customer visits.
- Bring existing admin into shared consistency through incremental, compatible frontend work only. Do not rewrite its authentication, frozen APIs, or working journeys, and do not assume this requirement authorizes a production deployment or broad redesign.
- Verify representative screens side by side at desktop/mobile sizes and in both language directions. Document any necessary compatibility exceptions rather than silently allowing visual drift.

## Owner requirement: public website performance

The owner intends to create a separate dashboard for each role. Adding staff dashboards must not make the customer-facing website heavier.

- Build role dashboards as separate application entry points and asset bundles, following the existing separation between the public site and `/admin/`.
- Public pages must not import, preload, or prefetch staff dashboard code, dashboard-only styles, or staff-only dependencies.
- Staff dashboard code loads only when that dashboard is opened. Public customer visits must not initialize staff authentication, task polling, staff notifications, or staff API requests.
- Share framework-neutral types or pure utilities where useful without pulling dashboard UI/runtime dependencies into the public bundle.
- Staff activity can still consume shared server capacity even with separate bundles. Use paginated queries, appropriate indexes in the new staff database, bounded refresh intervals, and isolated background jobs so dashboard growth does not unnecessarily compete with public requests.
- Capture public bundle sizes, network requests, and repeatable customer-page performance before and after dashboard integration. Accept no dashboard-attributable increase in public downloaded assets or staff-related requests; investigate measurable public performance regressions before release.
- Verify fresh public visits to Home, Properties, and Project Detail make no dashboard asset downloads or staff-service requests. Report measured results rather than promising zero hosting impact from architecture alone.

## Mandatory V1 protections

- Preserve the deployed V1 website, existing routes, authentication, integrations, and user journeys.
- Do not change the protected production MySQL database, including its structure, data, or configuration.
- Do not change existing working PHP/API endpoints or shared backend helpers, including existing Etisalat initiation/callback endpoints.
- Implement new staff capabilities using separate services and an isolated staff database. Call center and sales roles may share that new database through server-enforced permissions.
- Reuse the relevant existing admin UX, typography, colors, spacing, forms, and navigation. Preserve bilingual public behavior and RTL; define staff language coverage during design.
- Develop with isolated fixtures and staging. Do not place real calls or change live data for tests. Production deployment requires separate authorization.

## Owner requirement: SEO is public-only

- SEO settings, sitemaps, canonical metadata, social previews, and structured data cover only the main public website and its published contents.
- Exclude admin, call center, sales, all other staff dashboards, login pages, task/lead records, and private exports from public sitemaps and SEO-generated links or metadata.
- Apply `noindex` to each dashboard entry HTML and an appropriate `X-Robots-Tag` response header to dashboard routes and private downloadable resources. Keep authenticated access controls independent of crawler directives.
- Do not rely on robots.txt exclusions alone to prevent indexing. Crawlers must be able to read `noindex` on publicly reachable login shells; private content remains authentication-protected.
- Keep dashboard indexing exclusions independent of the public website's global indexing switch. Turning public indexing on must never enable dashboard indexing.
- Verify public metadata is unchanged, sitemap URLs stay within the public route allowlist, and dashboard root/nested/login/error routes return the intended exclusion metadata without public SEO fallbacks.
- Read-only review found current sitemap generators explicitly list public routes, but `admin-panel/index.html` and the current built admin shell lack a robots noindex tag; repository `.htaccess` has no dashboard-specific X-Robots-Tag. Server-level headers have not been verified.

## Confirmed workflow

### Shared My Tasks tab for every staff role

Owner addition: every role dashboard, including `/callcenter` and future sales or other staff dashboards, must include a **My Tasks** tab.

- The website administrator or CEO can assign a task to a specific staff member.
- Every assigned task includes a priority and deadline.
- Upon successful assignment, the task appears in the selected staff member's My Tasks tab in their own dashboard.
- Use shared task records in the new isolated staff system so future dashboards consume the same assignments and permissions rather than creating separate incompatible task stores.
- Keep management-assigned tasks distinguishable from lead follow-ups. A general task need not have a customer or lead; optional lead linkage must not be required for assignment.
- The confirmed 24-hour feedback allowance applies to scheduled lead follow-ups. Do not automatically add 24 hours to a management task's explicit deadline.
- Staff task UI, polling, authentication, and dependencies must remain excluded from the public website bundle and customer-page requests.
- Administrator/CEO assignment controls must use new isolated staff capabilities. Do not change frozen V1 endpoints or production database tables to add them.

Proposed task details for design review: title, instructions, assignee, assigning administrator/CEO, priority (Low, Normal, High, Urgent), deadline, status (To do, In progress, Completed), completion timestamp, and update history. Determine completion-feedback requirements and manager visibility during design; these details are recommendations rather than confirmed owner selections.

### 1. Create a lead after a call ends

The call center agent receives a call on a mobile phone. After disconnection, the requested Etisalat integration supplies the caller number and call date/time. The system creates a lead assigned to the receiving call center agent.

- Automatically assign a serial such as `CA01-L1`.
- `CA` identifies a call center agent, `01` is the agent ID, and `L1` is lead number one.
- Show the caller number and provider call date/time in the new entry.
- Agent enters customer name, inquiry information, and the next follow-up date/time before submitting the initial lead details.
- Preserve provider call identity separately so delivery retries cannot create duplicate leads.

Owner's later clarification: `/callcenter` must also offer a Customers tab listing customers and their requirements. When the agent finishes a call, enters the customer name and requirements, and submits the lead, the system must automatically save a linked customer containing that name, caller phone number, and requirements. This must happen as part of the same successful submission; no second customer-entry form is required. Retain requirements on each lead so a later inquiry cannot erase earlier requirements. Determine shared-phone matching and which customers each role may view before implementation.

### 2. Scheduled follow-ups

- Every active follow-up submission requires feedback and a next follow-up date/time.
- Visit submissions also require feedback and a next follow-up date/time.
- Show each agent the follow-ups assigned to them, including upcoming, due, and overtime work.
- A completed task remains in the lead history. Creating the next task does not erase or rewrite the prior feedback.

### 3. Feedback outcomes

Use a dropdown with these outcomes:

| Outcome | Required submission fields | Result |
|---|---|---|
| Follow up | Feedback and next scheduled date/time; next assignee where handed off | Lead remains active; create next task |
| Visit | Visit feedback and next scheduled date/time; next assignee where handed off | Lead remains active; create next task |
| Deal closed (sales agent only) | Deal amount entered by the sales agent conducting the deal | Complete lead; no next follow-up required |
| Deal lost | Reason for loss | Complete lead; no next follow-up required |

Do not require an additional follow-up date for a completed or lost deal. Preserve all earlier call, assignment, and activity records.

Only a sales agent conducting the deal may submit Deal closed and its amount. A call center agent cannot close a deal independently. The call center dashboard displays the sales-submitted closure, amount, and responsible sales agent as read-only history. Enforce this restriction in the new backend as well as the UI; hiding the outcome alone is insufficient. Deal lost remains available under the previously specified workflow.

### 4. Call center assigns a sales task

- Call center agent selects a sales agent.
- Call center agent enters the follow-up instructions and scheduled date/time.
- On successful submission, the sales agent receives the task on their dashboard.
- The task references the same lead and its serial.
- Sales agent enters feedback on that lead; call center can see the returned feedback and task status.

### 5. Sales agent chooses the next owner

After a Follow up or Visit outcome, the sales agent chooses one of:

1. **Follow up myself:** select next date/time; the new task remains assigned to that sales agent.
2. **Return to call center:** select a call center agent and next date/time; the new task appears on that agent's dashboard.

The previous task is completed and retained in history. The lead stays the same across handoffs. Its history must make clear who submitted feedback and who owns the next scheduled task.

### 6. Deadline and overtime

The feedback deadline is exactly 24 elapsed hours after the scheduled follow-up time. It is not measured from the actual call time, page opening, or assignment acceptance.

For scheduled time `S`, feedback deadline `D = S + 24 hours`:

| Condition | Status |
|---|---|
| Current time is before S, no feedback submitted | Upcoming |
| Current time is at or after S and at or before D, no feedback submitted | Due |
| Current time is after D, no feedback submitted | Overtime |
| Feedback submitted at or before D | Completed on time |
| Feedback submitted after D | Completed late |

- Overtime starts only after the deadline, not immediately after the scheduled time.
- Apply the same rule to call center and sales tasks.
- Record scheduled time, assigned agent, submission time, deadline, and late duration.
- Completed-late work stays visible in that agent's history/reporting even after a next task is created or the lead is closed.
- New follow-ups have their own scheduled time and independent deadline.

Example: scheduled Monday 10:00 AM; deadline Tuesday 10:00 AM; overtime begins after Tuesday 10:00 AM if no feedback exists.

## Required dashboard surfaces

### Call center dashboard

- URL: `/callcenter`; use a professional, modern, minimal implementation grounded in the existing staff/admin design.
- Customers tab with customer names, phone numbers, requirements, and linked lead history, automatically populated by submitted lead entries.
- My Tasks tab showing tasks assigned to the signed-in agent by the administrator or CEO, including priority and deadline.
- New call-generated leads awaiting customer/inquiry details.
- Upcoming, Due, and Overtime follow-up lists for the signed-in agent.
- Completed-late history, showing assigned agent and delay.
- Lead details: serial, caller number, customer name, inquiry, call date/time, current next task, and chronological activity history.
- Follow-up/Visit feedback form with required next date/time.
- Sales-agent selector and task assignment controls.
- Returned tasks from sales agents, scheduled for the selected call center agent.
- Read-only completed-deal status, amount, and closing sales agent; no Deal closed submission control.
- Deal lost form requiring loss reason.

### Sales dashboard integration

- My Tasks tab with the same assignment, priority, and deadline behavior as call center and future staff dashboards.
- Tasks assigned by call center agents.
- Lead serial and permitted lead history/inquiry details.
- Due, Upcoming, Overtime, and Completed-late visibility.
- Feedback outcome dropdown and corresponding required fields.
- Sales-only Deal closed submission requiring the deal amount and recording the closing sales agent.
- Follow up myself / Return to call center controls.

## Proposed implementation safeguards

These are engineering recommendations to support the confirmed workflow, not additional owner-approved product behavior:

- Keep an immutable internal lead ID and original serial, with separate sequential activity references. Do not rename database primary keys or lose prior serial history.
- Allocate lead/activity numbers transactionally in the new database; concurrent calls must not receive the same serial.
- Deduplicate provider events by documented provider call/event IDs, including multiple events for one physical call.
- Complete the current task, write feedback, and create the next assignment in one transaction.
- Enforce role and per-record access on the server for every request. Browser filters alone are insufficient.
- Store timestamps in UTC, calculate deadlines server-side, and display an explicit business timezone. Proposed display timezone: Asia/Kabul; confirm before implementation.
- Retain immutable assignment and feedback audit records. Edits to a task must not silently reset its original deadline or erase late status.
- Verify webhook authenticity using the actual Etisalat-supported mechanism. Do not invent event names, payload fields, signatures, or capabilities.
- Keep credentials and raw provider integration settings server-side and outside uploaded frontend files.

## Etisalat integration dependency

Read-only repository review found:

- `public/api/initiate-call.php` initiates website click-to-call to a configured call center number.
- `public/api/ctc/callback.php` accepts provider callbacks and updates the existing website CTC log.
- Those files do not establish support for all ordinary inbound mobile calls, definitive disconnection events, or per-agent mobile identity.

Before implementing automatic lead ingestion, obtain the account-specific Etisalat documentation or a redacted real completion-event sample confirming:

1. Which calls are reported: website CTC calls, direct mobile calls, or both.
2. A stable call ID, caller number, receiving agent/mobile number, timestamps, and final call outcome.
3. Delivery authentication, retry behavior, timezone, and event ordering.
4. Whether a separate webhook destination/subscription is supported without replacing V1's working callback.

Use a new isolated callback receiver if supported. If the account cannot report the required mobile calls, identify the provider change needed; do not claim automatic capture works. Build and test dashboard behavior with labeled fixtures while that dependency is resolved.

## Open product decisions

- **Serial prefix:** original lead example uses `CA01-L1`; later activity examples use `SA01-L1F1` and `SA01-L1V1`. Confirm whether `SA` marks a sales activity and whether `01` means original lead owner or activity actor.
- **Outcome suffixes:** the request used `DL` for a closed deal; the assistant proposed `DC` for closed and `DL` for lost. Owner has not explicitly resolved this conflict. Do not finalize those suffixes yet.
- **Lead numbering:** confirm whether L numbers count per originating call center agent and never reset; retain the agreed format regardless of internal IDs.
- **Repeat callers:** confirm whether each new completed call creates a fresh lead or attaches to an existing active lead. Provider retry deduplication is required regardless.
- **Call outcomes:** define handling of missed, unanswered, failed, withheld-number, transferred, or shared-phone calls.
- **Agent mapping:** confirm one mobile per agent or shared-number routing, and authoritative provider fields for assignment.
- **Concurrent tasks:** recommended one active next follow-up per lead; confirm whether parallel call center/sales tasks are needed.
- **Scheduling:** confirm display timezone, whether early feedback is allowed, and whether next scheduled time must be strictly in the future.
- **Deal amount:** confirm currency and validation (for example, whether zero is permitted). Do not infer USD or AFN from existing public listings.
- **Completed leads:** define whether reopening and post-submission correction are allowed and which role can do so.
- **Staff visibility:** agents need assigned tasks and relevant lead history; define supervisor/admin visibility separately.

## Acceptance criteria

- An authorized administrator or CEO can assign a task with priority and deadline to a staff member; the same record appears in that user's My Tasks tab.
- Every role dashboard has a My Tasks tab; an agent cannot access someone else's task by changing a request ID.
- A general management task can exist without a linked lead/customer and does not inherit the lead follow-up 24-hour allowance.

- Separate role dashboards introduce no dashboard code/styles, staff authentication, polling, notification connections, or staff API requests into ordinary public visits.
- Before/after public asset and request measurements confirm the separation; shared-host resource checks identify any remaining server-side performance risk.

- A verified completed-call fixture creates one lead with caller number, call time, mapped agent, and unique automatic serial; delivery retries create no duplicates.
- Initial lead details cannot be submitted without customer name, inquiry, and next follow-up date/time.
- Follow up and Visit cannot be submitted without feedback and next date/time.
- Deal closed requires an amount submitted by a sales agent conducting the deal, records that sales agent, and creates no next task; Deal lost requires a reason and creates no next task.
- A call center agent cannot close a deal through the UI or a direct API request. The call center dashboard can read the permitted sales-submitted closure details.
- Call center assignment creates a visible sales task on the same lead.
- Sales can keep the next task or return it to a selected call center agent with the required scheduled time.
- At the exact scheduled time the task is Due; at the exact 24-hour deadline it is still Due; immediately afterward it is Overtime.
- Feedback after the deadline is Completed late and remains attributable to the assigned agent.
- Completing one task and handing off to another cannot erase history or create a half-completed transaction.
- Unauthorized agents cannot fetch or modify another agent's tasks by changing IDs in requests.
- No production database, frozen API endpoint, or V1 deployment changes are required or performed.
- Automatic Etisalat ingestion is reported as verified only after provider capabilities and isolated end-to-end checks have been confirmed.

## Next design step

The proposed implementation and future-dashboard structure are documented in `docs/superpowers/plans/2026-11-10-staff-dashboards-implementation.md`. Resolve its explicitly listed business/provider gates before dependent implementation. This document records requirements; it does not claim the dashboard is built.
