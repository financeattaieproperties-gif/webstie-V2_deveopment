-- V2 ONLY: Non-destructive Role & Permission Upgrade Script for Existing V2 Testing Databases.
-- Run this ONLY if upgrading an earlier 001-core.sql installation.
-- Safely registers Manager, HR Manager, Marketing Manager, and Videographer without auto-converting assistant_manager to hr_manager.
SET NAMES utf8mb4;

INSERT IGNORE INTO core_departments (code, name) VALUES
  ('management', 'Management'),
  ('hr', 'Human Resources');

INSERT IGNORE INTO core_roles (code, department_code, name) VALUES
  ('manager', 'management', 'Manager'),
  ('hr_manager', 'hr', 'HR Manager'),
  ('marketing_manager', 'production', 'Marketing Manager'),
  ('videographer', 'production', 'Videographer');

INSERT IGNORE INTO core_permissions (code, module_code, description) VALUES
  ('core.departments.manage', 'core', 'Create and manage internal departments and staff roles'),
  ('core.submissions.read', 'core', 'Read website publishing submission status');

-- Remove internal CRM task/staff authority from Admin (UDR-001: Admin is website-only + Submissions review)
DELETE FROM core_role_permissions
WHERE role_code = 'admin'
  AND permission_code IN ('core.tasks.assign', 'core.staff.manage', 'callcenter.access', 'callcenter.manage');

-- Grant Manager full internal authority
INSERT IGNORE INTO core_role_permissions (role_code, permission_code) VALUES
  ('manager', 'core.tasks.read_own'),
  ('manager', 'core.tasks.assign'),
  ('manager', 'core.staff.manage'),
  ('manager', 'core.departments.manage'),
  ('manager', 'core.submissions.read'),
  ('manager', 'callcenter.access'),
  ('manager', 'callcenter.manage'),
  ('hr_manager', 'core.tasks.read_own'),
  ('marketing_manager', 'core.tasks.read_own'),
  ('marketing_manager', 'core.tasks.assign'),
  ('marketing_manager', 'core.submissions.read'),
  ('videographer', 'core.tasks.read_own'),
  ('videographer', 'core.submissions.read');
