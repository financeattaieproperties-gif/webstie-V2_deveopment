# V2 Customer and Property Lead Uniqueness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow different-property leads for one customer while preventing another lead for an existing customer/property pair across agents and statuses.

**Architecture:** Preserve current normalized-phone customer ownership. Add an atomic property claim table in internal CRM, enforce it at every lead qualification/property-change path, and require explicit inventory identity rather than free-text matching.

**Tech Stack:** Existing PHP/PDO/MySQL, React/TypeScript staff application, staff contracts, isolated HTTP/concurrency fixtures.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-website-crm-boundaries-design.md`

## Global Constraints

- Apply every constraint in `2026-11-13-v2-readiness-index.md`.
- Existing customer ownership, Manager sharing, project assignments, and record-visibility rules remain enforced.
- Website inquiries never participate in this CRM lead constraint.
- Uniqueness applies across all agents and lead statuses, including closed/lost. Closing a lead never releases its property claim.
- General call drafts can lack a property; active property leads cannot. Preserve genuine calls when duplicate qualification is refused.

## Review Focus

- Equivalent phone formats and historical duplicate customer identities cannot bypass matching (Tasks 1/2).
- Concurrent agents must not create duplicate leads or leave orphan follow-ups/counter changes (Task 2).
- Different units within one project must remain distinct (Tasks 1/3).
- Duplicate errors cannot disclose another agent's private customer/lead details (Task 2).
- Legacy duplicates cannot trigger automatic data loss or a silently incomplete migration (Task 1).

## Task 1: Canonical property contract and non-destructive migration

**Files:** Modify `packages/staff-contracts/types.ts`; create `staff-service/database/103-customer-property-leads.sql`, `staff-service/tools/preflight-lead-properties.php`, and `staff-service/src/LeadPropertyClaims.php`; extend `tests/staff/packaging/completion-schema.test.mjs`; create `staff-service/tests/lead-property-migration.php`.

**Interfaces:** `LeadPropertyReference = {kind: 'project' | 'unit'; id: number}`. New service trait exposes `private function resolveLeadProperty(array $body): array`, returning validated `{kind,id,projectId,apartmentId}`; and `private function claimLeadProperty(int $customerId, array $property, int $leadId): void`. The caller owns the surrounding transaction. Preflight outputs a report only and exits nonzero when ambiguous identities or duplicate pairs require resolution.

- [ ] Write migration fixture tests: two units in one project produce different keys; project-level interest differs from unit interest; equivalent customer phones identify the same canonical customer; duplicate historical pairs and missing references produce actionable reports without row deletion; running preflight changes no data.
- [ ] Run the new PHP fixture test using the isolated local MySQL harness and `STAFF_LOCAL_TEST=1`; require explicit fixture DB verification before setup. Confirm failure before adding the migration.
- [ ] Add nullable canonical property kind/ID fields to `cc_leads` and `crm_customer_property_leads(customer_id,property_kind,property_id,lead_id)`, with primary key on the first three and unique `lead_id`. Validate referenced inventory and unit/project consistency in the resolver. Use the existing phone registry for canonical customer identity, without automatically merging historical customer records.
- [ ] Implement read-only preflight and a reviewed backfill path: report legacy duplicates/missing property identities; stop before enabling/backfilling claims when unresolved. Existing rows remain intact/readable. Fresh fictional fixtures can enable the constraint immediately. Add instructions for owner-approved canonical resolution rather than automated merge/reset SQL.
- [ ] Rerun migration/schema tests; expect preserved row counts and no implicit duplicate resolution. Commit with `feat: define canonical customer property lead claims`.

## Task 2: Atomic enforcement in staff lead mutations

**Files:** Modify `staff-service/src/App.php`, `Completion.php`, new `LeadPropertyClaims.php`, `staff-service/tests/completion-database.php`, `tests/staff/api/completion-http.mjs`; create `tests/staff/api/lead-property-concurrency.mjs`.

**Interfaces:** Callcenter `submitEntry` and Sales `salesLead` consume `property: LeadPropertyReference`. Property-changing actions use the same resolver/claim interface. Existing successful DTOs remain compatible and gain `property: LeadPropertyReference | null`. Existing per-actor idempotency remains outside the domain mutation so equal retries return the original result.

- [ ] Add HTTP assertions for one customer/two different properties (allowed), same customer/property/same agent (409), same pair/different shared agent (409), equivalent phone formats (409), closed/lost existing lead (409), unrelated inaccessible customer (generic existing Manager-review behavior), and a mismatched unit/project (422). Confirm failed operations leave lead/task counts unchanged.
- [ ] Add a two-connection concurrency test: simultaneous creation/activation for one pair yields exactly one qualifying lead and one claim; retrying the winner's idempotency key returns the original lead. Independent pairs both succeed. Test late property changes and closure-time unit selection against existing claims.
- [ ] Run the HTTP/concurrency tests and confirm missing constraints cause the expected failures.
- [ ] Wire the trait into App. Resolve identity/authorization, then claim and create/activate/update within the existing transaction. On a unique-key conflict, roll back and return generic 409 without foreign lead IDs/names. For a permitted property change, acquire the new claim before releasing the old one in the same transaction. Never release on closed/lost transitions.
- [ ] Require property identity before Callcenter activation and Sales creation. Keep real call recording intact when duplicate activation is rejected. Validate project assignment for Sales and unit membership; preserve customer sharing review and request idempotency. Inventory changes at deal closure cannot bypass the claim.
- [ ] Run `node tests/staff/api/completion-http.mjs` and `node tests/staff/api/lead-property-concurrency.mjs` against the isolated local test setup; expect all assertions and no orphan rows. Commit with `fix: prevent duplicate customer property leads transactionally`.

## Task 3: Staff property selection and duplicate feedback

**Files:** Modify `apps/staff/src/main.tsx`, `apps/staff/src/api.ts`, `apps/staff/src/preview.ts`, `packages/staff-contracts/types.ts`, `apps/staff/src/i18n/en.json`, `fa.json`; create `tests/staff/browser/lead-property-entry.mjs`.

**Interfaces:** Staff creation/activation client bodies pass `{property: LeadPropertyReference}` to Task 2 routes. Lead DTOs display explicit property labels from authorized inventory data. Preview fixtures use fictional properties and model the same rules.

- [ ] Write browser assertions: Callcenter can record a call before choosing a property, cannot activate without one, can select another unit in the same project for the same customer, and sees an accessible generic duplicate message without foreign customer data. Sales can choose only authorized project/unit references. Include keyboard and Dari/RTL checks.
- [ ] Run `node tests/staff/browser/lead-property-entry.mjs` and confirm the absent selector/validation fails.
- [ ] Implement selectors in Callcenter qualification and Sales lead entry, preserve failed form data, render property identity and duplicate feedback, and refresh existing accessible leads after conflict. Do not offer to clone a duplicate or silently change customer ownership. Include separate project-level interest where no unit has yet been selected.
- [ ] Run browser tests, `npm.cmd --prefix apps/staff run typecheck`, and `npm.cmd --prefix apps/staff test`; expect exit 0. Commit with `feat: select property identity when qualifying crm leads`.

## Completion evidence

Record race-test counts and preserved-history migration results. If existing V2 duplicate identities/pairs remain unresolved, report that upgrade activation is blocked; a passing fresh-schema test does not prove the existing database is ready.
