-- V2 ONLY: select a NEW EMPTY testing database in phpMyAdmin before import.
-- Core owns identity, permissions and shared tasks. Import once; no password storage.
SET NAMES utf8mb4;
CREATE TABLE core_modules (
 code VARCHAR(60) PRIMARY KEY, name VARCHAR(120) NOT NULL, installed_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_module_versions (
 module_code VARCHAR(60) NOT NULL, version INT UNSIGNED NOT NULL, applied_at DATETIME NOT NULL,
 PRIMARY KEY(module_code,version), FOREIGN KEY(module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_departments (
 code VARCHAR(60) PRIMARY KEY, name VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_roles (
 code VARCHAR(60) PRIMARY KEY, department_code VARCHAR(60) NOT NULL, name VARCHAR(120) NOT NULL,
 FOREIGN KEY(department_code) REFERENCES core_departments(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_permissions (
 code VARCHAR(100) PRIMARY KEY, module_code VARCHAR(60) NOT NULL, description VARCHAR(255) NOT NULL,
 FOREIGN KEY(module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_role_permissions (
 role_code VARCHAR(60) NOT NULL, permission_code VARCHAR(100) NOT NULL,
 PRIMARY KEY(role_code,permission_code), FOREIGN KEY(role_code) REFERENCES core_roles(code),
 FOREIGN KEY(permission_code) REFERENCES core_permissions(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_branches (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(40) NOT NULL UNIQUE, name VARCHAR(160) NOT NULL,
 address VARCHAR(255) NOT NULL DEFAULT '', phone VARCHAR(40) NOT NULL DEFAULT '', email VARCHAR(254) NOT NULL DEFAULT '',
 active TINYINT NOT NULL DEFAULT 1, version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 name VARCHAR(120) NOT NULL, username VARCHAR(254) NOT NULL UNIQUE,
 role VARCHAR(60) NOT NULL, branch_id INT UNSIGNED NULL, active TINYINT NOT NULL DEFAULT 1,
 auth_version INT NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(role) REFERENCES core_roles(code), FOREIGN KEY(branch_id) REFERENCES core_branches(id), INDEX(role,active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_branch_managers (
 branch_id INT UNSIGNED PRIMARY KEY, manager_user_id INT UNSIGNED NOT NULL UNIQUE,
 assigned_by INT UNSIGNED NOT NULL, assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(branch_id) REFERENCES core_branches(id), FOREIGN KEY(manager_user_id) REFERENCES core_users(id),
 FOREIGN KEY(assigned_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_login_limits (
 bucket CHAR(64) PRIMARY KEY, attempts INT NOT NULL, window_start DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_management_tasks (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, branch_id INT UNSIGNED NOT NULL, title VARCHAR(200) NOT NULL, instructions TEXT NOT NULL,
 priority ENUM('low','normal','high','urgent') NOT NULL, assignee_id INT UNSIGNED NOT NULL, assigned_by INT UNSIGNED NOT NULL,
 deadline_at DATETIME NOT NULL, status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
 completed_at DATETIME NULL, version INT NOT NULL DEFAULT 1,
 FOREIGN KEY(branch_id) REFERENCES core_branches(id), FOREIGN KEY(assignee_id) REFERENCES core_users(id), FOREIGN KEY(assigned_by) REFERENCES core_users(id),
 INDEX(branch_id,status,deadline_at,id), INDEX(assignee_id,status,deadline_at,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_audit_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, actor_id INT UNSIGNED NOT NULL, action VARCHAR(80) NOT NULL,
 target_id INT UNSIGNED NOT NULL, details TEXT NOT NULL, created_at DATETIME NOT NULL,
 FOREIGN KEY(actor_id) REFERENCES core_users(id), INDEX(actor_id,created_at), INDEX(action,target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_idempotency_keys (
 actor_id INT UNSIGNED NOT NULL, request_key VARCHAR(80) NOT NULL, body_hash CHAR(64) NOT NULL, result_json MEDIUMTEXT NULL,
 created_at DATETIME NOT NULL, PRIMARY KEY(actor_id,request_key), FOREIGN KEY(actor_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO core_modules VALUES ('core','Shared application core',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('core',3,UTC_TIMESTAMP());
INSERT INTO core_departments VALUES
 ('management','Management'),
 ('callcenter','Call Center'),('sales','Sales Department'),
 ('production','Marketing and Production'),('finance','Finance'),
 ('engineering','Engineering and Graphic Department');
INSERT INTO core_roles VALUES
 ('ceo','management','CEO'),('manager','management','Manager'),
 ('callcenter','callcenter','Call Center Agent'),('sales_leader','sales','Sales Team Leader'),('sales','sales','Sales Agent'),
 ('marketing_manager','production','Marketing Manager'),
 ('editor','production','Editor'),('videographer','production','Videographer'),
 ('finance_manager','finance','Finance Manager'),
 ('architect','engineering','Architect'),('graphic_designer','engineering','Graphic Designer'),('visual_designer_3d','engineering','3D Visual Designer');
INSERT INTO core_permissions VALUES
 ('core.tasks.read_own','core','Read and complete assigned management tasks'),
 ('core.tasks.assign','core','Assign management tasks'),
 ('core.staff.manage','core','Provision and deactivate operational staff'),
 ('core.departments.manage','core','Create and manage internal departments and staff roles'),
 ('core.submissions.read','core','Read website publishing submission status');
INSERT INTO core_role_permissions SELECT code,'core.tasks.read_own' FROM core_roles;
INSERT INTO core_role_permissions VALUES
 ('manager','core.tasks.assign'),('ceo','core.tasks.assign'),
 ('sales_leader','core.tasks.assign'),('marketing_manager','core.tasks.assign'),('finance_manager','core.tasks.assign'),
 ('ceo','core.staff.manage'),
 ('ceo','core.departments.manage'),
 ('manager','core.submissions.read'),('ceo','core.submissions.read'),('marketing_manager','core.submissions.read'),
 ('editor','core.submissions.read'),('videographer','core.submissions.read'),
 ('finance_manager','core.submissions.read'),
 ('sales_leader','core.submissions.read'),('sales','core.submissions.read'),('callcenter','core.submissions.read');
