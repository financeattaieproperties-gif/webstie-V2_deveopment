# V2 Website and CRM Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the owner's revised website inquiry, publication, and CRM lead rules with a verifiable manual V2 testing package.

**Architecture:** Website Admin owns website forms/messages and public publication. Staff CRM owns customer/property leads and calls; a separate third database carries Editor publication submissions. Extend existing applications and authentication boundaries.

**Tech Stack:** React/TypeScript/Vite, PHP/MySQL, Firebase staff authentication, IndexedDB, existing locked-file chat.

**Spec:** `docs/superpowers/specs/2026-11-13-v2-website-crm-boundaries-design.md`

## Global Constraints

- Target `https://website.attaieproperties.com` only. V1 remains untouched.
- Three distinct V2 databases; website Admin has no internal CRM credentials or authorization.
- Existing V2 data is preserved. Fresh schemas are only for new empty V2 databases; automated tests use fictional isolated fixtures.
- New packages start with empty project and unit catalogs and exclude bundled project artwork.
- Preserve existing UI, accessibility, EN/FA translations, and RTL behavior.
- Manual cPanel/file upload and phpMyAdmin import; SQL/private configuration remain outside every document root.
- Implementation starts after the owner reviews this design/plan set and chooses an execution approach.

## Review Focus

1. A committed inquiry with a lost response returns the same receipt on retry (inquiries Task 1).
2. Two agents racing on equivalent customer/property identities create only one lead (lead uniqueness Task 2).
3. A stale Editor delivery cannot replace content that Admin approved or published (publication Task 2).
4. Browser-local chat cannot masquerade as delivery to a different customer's or Admin's device (inquiries Task 4).
5. Local/mocked evidence cannot set hosted deployment verification flags (acceptance Task 2).

## Ordered delivery

The three product plans can be reviewed independently. Execute sequentially by default; they share packaging and test fixtures.

1. [Website inquiries, offline submission, receipts, and messages](2026-11-13-v2-website-inquiries-plan.md)
2. [CRM customer/property lead uniqueness](2026-11-13-v2-lead-uniqueness-plan.md)
3. [Editor submission revisions and website publication](2026-11-13-v2-publication-review-plan.md)
4. [Acceptance matrix and manual staging delivery](2026-11-13-v2-acceptance-staging-plan.md)

Deployment is part of implementation delivery, including tested onboarding, not an undocumented action after building. Follow the [step-by-step cPanel, database, and department-user setup guide](../../staff/v2-cpanel-database-user-setup.md) after the revised package is prepared. It covers separate document root/HTTPS/PHP, three databases and scoped connection users, fresh/upgrade imports, private files, Firebase CEO/Manager bootstrap, website Admin, operational department users, and hosted acceptance/rollback. Current role/permission storage is documented there; Manager provisions operational staff under the existing grants.

- [ ] Review the written design, including the explicitly labeled implementation choices.
- [ ] Complete each product plan's tests and review before integration packaging.
- [ ] Complete local integrated acceptance and prepare a new manual staging package.
- [ ] Owner imports/uploads to the verified V2 target and records hosted acceptance results.

## Execution handoff

Recommended approach: native execution in this session, because the changes share existing PHP routes, schemas, and browser contracts. Keep one whole-change independent review before packaging. Subagent-driven execution is an alternative if the owner prefers a fresh implementation/review gate for each task. Neither method is selected by this document.

Plan preparation is not product implementation, test execution, package creation, database migration, or deployment. Do not report these as completed based on this document.
