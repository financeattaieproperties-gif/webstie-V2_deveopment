# Firebase authentication discussion — 2026-11-10

## Scope

Superseded by later owner authorization: Firebase authentication is now implemented for V2 staff dashboards in this checkout, with shared core/call-center schema. See `staff/current-implementation.md` and `../deployment/staff/README.md`. The discussion-only status below is historical; live Firebase user provisioning and hosting verification are still pending.

User requested information only. No authentication implementation, database changes, deployment, or configuration changes were authorized or performed. User plans to continue tomorrow.

## Context and conclusions

- Discussion concerns V2, not the protected V1 deployment.
- Maximum expected staff count: 50.
- Proposed architecture: Firebase Authentication handles sign-in; V2's separate MySQL database stores roles and permissions; a separate V2 backend verifies Firebase ID tokens and enforces permissions on every protected request.
- Link application users to Firebase using their UID. Possible tables: app_users, roles, user_roles, permissions, role_permissions. These are discussion suggestions, not an approved schema.
- Hiding frontend controls is insufficient; backend authorization is required. Firebase Security Rules do not protect MySQL.
- Firebase can simplify account management, password resets, email verification, and sign-in providers. It does not inherently improve site speed or design.
- Email/password authentication for 50 staff is expected to fit the no-cost limits. SMS/phone authentication requires billing and can incur charges. Existing hosting/MySQL costs remain. Check current pricing before implementation; no perpetual free-cost guarantee was made.
- User has not explicitly chosen or authorized implementation of this architecture.

## Constraints for continuation

- Preserve V1 production, its MySQL database, existing APIs/PHP endpoints, and established UX/UI.
- Any implementation must stay within the isolated V2/testing resources and separate backend/storage allowed by AGENTS.md.
- Do not treat the user's V2 clarification as permission to change protected V1 resources.
- Working tree already contains unrelated changes and an existing session handoff; this note does not replace them.

## References checked

- https://firebase.google.com/docs/auth/admin/verify-id-tokens
- https://firebase.google.com/docs/auth/admin/custom-claims
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth/limits

## Next conversation

Resume the Firebase login and MySQL staff-role discussion for V2. Wait for the user's next instruction before taking implementation action.
