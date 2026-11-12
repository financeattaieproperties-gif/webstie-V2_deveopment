-- V2 INTERNAL CRM ONLY. Back up first. Safe to import repeatedly.
-- Canonicalizes CEO/Manager roles and adds branch ownership without guessing assignments.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS core_migration_ledger (
  migration_key VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL,
  notes VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS core_branch_assignment_issues (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_type VARCHAR(60) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,
  issue_code VARCHAR(80) NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  UNIQUE KEY uq_branch_issue (record_type, record_id, issue_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE core_branches
  ADD COLUMN IF NOT EXISTS code VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email VARCHAR(254) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE core_management_tasks ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL AFTER id;
ALTER TABLE cc_customers ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL AFTER id;
ALTER TABLE cc_leads ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL AFTER id;
ALTER TABLE inv_projects ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL AFTER id;
ALTER TABLE mkt_production_entries ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL AFTER id;

CREATE TABLE IF NOT EXISTS core_branch_managers (
  branch_id INT UNSIGNED PRIMARY KEY,
  manager_user_id INT UNSIGNED NOT NULL UNIQUE,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (manager_user_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

START TRANSACTION;
SELECT migration_key FROM core_migration_ledger
WHERE migration_key = 'ceo_manager_branch_model_v1' FOR UPDATE;
SET @phase7_apply = NOT EXISTS (
  SELECT 1 FROM core_migration_ledger WHERE migration_key = 'ceo_manager_branch_model_v1'
);

INSERT IGNORE INTO core_departments (code, name) VALUES ('management', 'Management');
INSERT IGNORE INTO core_roles (code, department_code, name) VALUES
  ('ceo', 'management', 'CEO'),
  ('manager', 'management', 'Manager');

-- Ordering is deliberate: the old top-level manager becomes CEO before HR Manager becomes Manager.
UPDATE core_users
SET role = 'ceo', branch_id = NULL, auth_version = auth_version + 1
WHERE @phase7_apply = 1 AND role = 'manager';

UPDATE core_users
SET role = 'manager', auth_version = auth_version + 1
WHERE @phase7_apply = 1 AND role = 'hr_manager';

UPDATE core_users
SET active = 0, auth_version = auth_version + 1
WHERE @phase7_apply = 1
  AND role IN ('admin','branch_manager','assistant_manager');

UPDATE core_roles SET department_code = 'management', name = 'CEO' WHERE code = 'ceo';
UPDATE core_roles SET department_code = 'management', name = 'Manager' WHERE code = 'manager';
UPDATE core_roles SET name = CONCAT('Retired: ', name)
WHERE @phase7_apply = 1
  AND code IN ('admin','hr_manager','branch_manager','assistant_manager')
  AND name NOT LIKE 'Retired:%';

DELETE FROM core_role_permissions
WHERE @phase7_apply = 1
  AND role_code IN ('ceo','manager','admin','hr_manager','branch_manager','assistant_manager');

INSERT IGNORE INTO core_role_permissions (role_code, permission_code)
SELECT 'ceo', code FROM core_permissions
WHERE @phase7_apply = 1 AND code IN (
  'core.tasks.read_own','core.tasks.assign','core.staff.manage','core.departments.manage','core.submissions.read',
  'callcenter.access','callcenter.manage','inventory.read','inventory.manage','sales.access','sales.team_manage',
  'customers.review_duplicates','finance.read','marketing.submit_property','engineering.deliverables.review'
);

INSERT IGNORE INTO core_role_permissions (role_code, permission_code)
SELECT 'manager', code FROM core_permissions
WHERE @phase7_apply = 1 AND code IN (
  'core.tasks.read_own','core.tasks.assign','core.submissions.read','callcenter.access','callcenter.manage',
  'inventory.read','sales.access','sales.team_manage','customers.review_duplicates','hr.contracts.manage','hr.preparation.manage',
  'marketing.submit_property'
);

INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'core_users', id, 'active_user_missing_active_branch'
FROM core_users
WHERE @phase7_apply = 1 AND active = 1 AND role <> 'ceo'
  AND (branch_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM core_branches b WHERE b.id = core_users.branch_id AND b.active = 1
  ));

UPDATE core_users
SET active = 0, auth_version = auth_version + 1
WHERE @phase7_apply = 1 AND active = 1 AND role <> 'ceo'
  AND (branch_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM core_branches b WHERE b.id = core_users.branch_id AND b.active = 1
  ));

INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'inv_projects', id, 'record_missing_branch' FROM inv_projects WHERE @phase7_apply = 1 AND branch_id IS NULL;
INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'cc_customers', id, 'record_missing_branch' FROM cc_customers WHERE @phase7_apply = 1 AND branch_id IS NULL;
INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'cc_leads', id, 'record_missing_branch' FROM cc_leads WHERE @phase7_apply = 1 AND branch_id IS NULL;
INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'core_management_tasks', id, 'record_missing_branch' FROM core_management_tasks WHERE @phase7_apply = 1 AND branch_id IS NULL;
INSERT IGNORE INTO core_branch_assignment_issues (record_type, record_id, issue_code)
SELECT 'mkt_production_entries', id, 'record_missing_branch' FROM mkt_production_entries WHERE @phase7_apply = 1 AND branch_id IS NULL;

INSERT INTO core_module_versions (module_code, version, applied_at)
SELECT 'core', 3, UTC_TIMESTAMP() WHERE @phase7_apply = 1
ON DUPLICATE KEY UPDATE
  version = VALUES(version),
  applied_at = VALUES(applied_at);

INSERT INTO core_migration_ledger (migration_key, applied_at, notes)
SELECT 'ceo_manager_branch_model_v1', UTC_TIMESTAMP(), 'Canonical CEO/Manager roles and branch boundaries'
WHERE @phase7_apply = 1;
COMMIT;
