# Modular Firebase call-center implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline. Track steps below.

**Goal:** Deliver the existing call-center workflow with Firebase authentication and an extensible V2 MySQL core/module schema.

**Architecture:** Firebase email/password sign-in exchanges a verified ID token for the existing private, CSRF-protected PHP session. MySQL maps immutable Firebase UIDs to provisioned users and role permissions. Core and call-center SQL install into an empty V2 database; future modules own prefixed tables and add registry/permission rows without altering earlier tables.

**Tech Stack:** Existing React/TypeScript/Vite staff UI, PHP/PDO/MySQL, Firebase REST authentication and server-side token verification.

**Spec:** Owner approved shared core, prefixed call-center module, future additive dashboard modules, and Firebase on 2026-11-10. Department roster: `docs/staff/departments-and-roles.md`.

## Global constraints

- V2 source and separate database are editable. No live V1 changes or deployment.
- No sales or other department UI in this increment; register their roles only.
- Preserve bilingual/RTL staff UI and existing call-center workflows.
- No default passwords, Firebase service credentials, or live tokens in upload materials.
- Staff access requires both verified Firebase identity and active MySQL provisioning. Never assign roles from browser input or email matching.
- SQL installations are manual through phpMyAdmin. No destructive replacement of an existing database.

## Review focus

- Wrong-project, expired, revoked, malformed, or unverified tokens must not establish sessions.
- Customer/future-role accounts must not acquire call-center data or management permissions.
- New module installation must leave core and existing module tables/data unchanged.
- Failed login/logout and disabled users must not retain unintended access.
- Private configuration/SQL must remain outside webroot and public visits must not load staff code.

## Tasks

- [x] Recover clean committed staff files into this writable checkout without replacing unrelated files; record baseline tests.
- [x] Add fresh core and call-center SQL, all department/role registry rows, and fixtures. Test import and additive module isolation on fictional MySQL data.
- [x] Add Firebase verification and UID provisioning, migrate staff SQL queries to owned tables, enforce role permissions and remove local password login. Test denied tokens/roles, sessions, and staff workflow regressions.
- [x] Connect Firebase email/password login/password reset and staff provisioning UI, keeping EN/FA labels and existing design. Test typecheck/build and browser workflows.
- [x] Update manual SQL/config/bootstrap and packaging instructions; run focused suites, inspect diff, review implementation, and report remaining live Firebase/hosting checks.

## Execution notes

Owner explicitly requested proceeding with implementation. Existing saved worktree is clean but outside writable roots; recover only its committed new staff paths into this checkout. No merge/push/deployment. Existing unrelated local changes stay intact.
