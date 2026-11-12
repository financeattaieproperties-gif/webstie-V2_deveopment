-- V2 ONLY: Non-destructive Role & Permission Upgrade Script for Existing V2 Testing Databases.
-- Run this ONLY if upgrading an earlier 001-core.sql installation.
-- Legacy additive registration only. Canonical role conversion is guarded by 110-ceo-manager-branch-model.sql.
SET NAMES utf8mb4;

INSERT IGNORE INTO core_departments (code, name) VALUES
  ('management', 'Management');

INSERT IGNORE INTO core_roles (code, department_code, name) VALUES
  ('ceo', 'management', 'CEO'),
  ('manager', 'management', 'Manager'),
  ('marketing_manager', 'production', 'Marketing Manager'),
  ('videographer', 'production', 'Videographer');

INSERT IGNORE INTO core_permissions (code, module_code, description) VALUES
  ('core.departments.manage', 'core', 'Create and manage internal departments and staff roles'),
  ('core.submissions.read', 'core', 'Read website publishing submission status');

-- Remove internal CRM task/staff authority from Admin (UDR-001: Admin is website-only + Submissions review)
DELETE FROM core_role_permissions
WHERE role_code = 'admin'
  AND permission_code IN ('core.tasks.assign', 'core.staff.manage', 'callcenter.access', 'callcenter.manage');

-- Canonical baseline grants. Script 110 removes every retired-role grant.
INSERT IGNORE INTO core_role_permissions (role_code, permission_code) VALUES
  ('ceo', 'core.tasks.read_own'),
  ('ceo', 'core.tasks.assign'),
  ('ceo', 'core.staff.manage'),
  ('ceo', 'core.departments.manage'),
  ('ceo', 'core.submissions.read'),
  ('manager', 'core.tasks.read_own'),
  ('manager', 'core.tasks.assign'),
  ('manager', 'core.submissions.read'),
  ('marketing_manager', 'core.tasks.read_own'),
  ('marketing_manager', 'core.tasks.assign'),
  ('marketing_manager', 'core.submissions.read'),
  ('videographer', 'core.tasks.read_own'),
  ('videographer', 'core.submissions.read');
