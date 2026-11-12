-- V2 INTERNAL OFFICE CRM ONLY. Manual upgrade for an existing V2 installation.
-- Back up the separate V2 internal CRM database and verify the selected database
-- in phpMyAdmin before importing. Never run against V1 or the website database.
-- Do not import this upgrade instead of the normal new-install schema.
-- No users, contracts, deposits, or audit records are deleted or reassigned.
SET NAMES utf8mb4;
START TRANSACTION;

-- Disable retired accounts and invalidate existing staff sessions on next request.
-- Existing user IDs remain valid for historical payment/task/audit references.
UPDATE core_users
SET active = 0, auth_version = auth_version + 1
WHERE role = 'finance_assistant' AND active <> 0;

DELETE FROM core_role_permissions WHERE role_code = 'finance_assistant';

-- Keep a role row only when historical users still reference it (foreign key).
-- The app no longer offers this role; never auto-promote these users.
DELETE FROM core_roles
WHERE code = 'finance_assistant'
  AND NOT EXISTS (SELECT 1 FROM core_users WHERE role = 'finance_assistant');

COMMIT;

-- Expected: zero active Assistant accounts and zero Assistant permission grants.
SELECT COUNT(*) AS active_retired_accounts
FROM core_users WHERE role = 'finance_assistant' AND active <> 0;
SELECT COUNT(*) AS retired_permission_grants
FROM core_role_permissions WHERE role_code = 'finance_assistant';
