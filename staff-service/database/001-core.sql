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
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, active TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 name VARCHAR(120) NOT NULL, username VARCHAR(254) NOT NULL UNIQUE,
 role VARCHAR(60) NOT NULL, branch_id INT UNSIGNED NULL, active TINYINT NOT NULL DEFAULT 1,
 auth_version INT NOT NULL DEFAULT 1, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(role) REFERENCES core_roles(code), FOREIGN KEY(branch_id) REFERENCES core_branches(id), INDEX(role,active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_login_limits (
 bucket CHAR(64) PRIMARY KEY, attempts INT NOT NULL, window_start DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE core_management_tasks (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(200) NOT NULL, instructions TEXT NOT NULL,
 priority ENUM('low','normal','high','urgent') NOT NULL, assignee_id INT UNSIGNED NOT NULL, assigned_by INT UNSIGNED NOT NULL,
 deadline_at DATETIME NOT NULL, status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
 completed_at DATETIME NULL, version INT NOT NULL DEFAULT 1,
 FOREIGN KEY(assignee_id) REFERENCES core_users(id), FOREIGN KEY(assigned_by) REFERENCES core_users(id),
 INDEX(assignee_id,status,deadline_at,id)
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
INSERT INTO core_module_versions VALUES ('core',1,UTC_TIMESTAMP());
INSERT INTO core_departments VALUES
 ('administration','Administration'),('callcenter','Call Center'),('sales','Sales Department'),
 ('production','Marketing and Production'),('branches','Branch Management'),('finance','Finance'),
 ('engineering','Engineering and Graphic Department'),('customers','Customers');
INSERT INTO core_roles VALUES
 ('ceo','administration','Admin (CEO)'),('admin','administration','Administrator'),
 ('callcenter','callcenter','Call Center Agent'),('sales_leader','sales','Sales Team Leader'),('sales','sales','Sales Agent'),
 ('production_manager','production','Production Manager'),('editor','production','Editor'),('photographer','production','Photographer'),
 ('branch_manager','branches','Manager'),('assistant_manager','branches','Assistant Manager'),
 ('finance_manager','finance','Finance Manager'),('finance_assistant','finance','Finance Assistant'),
 ('architect','engineering','Architect'),('graphic_designer','engineering','Graphic Designer'),('visual_designer_3d','engineering','3D Visual Designer'),
 ('customer','customers','Customer');
INSERT INTO core_permissions VALUES
 ('core.tasks.read_own','core','Read and complete assigned management tasks'),
 ('core.tasks.assign','core','Assign management tasks'),('core.staff.manage','core','Provision and deactivate operational staff');
INSERT INTO core_role_permissions SELECT code,'core.tasks.read_own' FROM core_roles WHERE code <> 'customer';
INSERT INTO core_role_permissions VALUES
 ('ceo','core.tasks.assign'),('admin','core.tasks.assign'),('ceo','core.staff.manage'),('admin','core.staff.manage');
