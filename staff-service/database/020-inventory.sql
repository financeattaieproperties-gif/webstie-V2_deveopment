-- V2 ONLY. Import ONCE after 010-callcenter.sql in the Internal Office CRM Database.
-- Phase 2: Manager Pre-Sale Project & Apartment Inventory (text/numeric only, no website image dependencies).
SET NAMES utf8mb4;

CREATE TABLE inv_projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  floors INT UNSIGNED NOT NULL DEFAULT 1,
  assigned_team_leader_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (assigned_team_leader_id) REFERENCES core_users(id),
  FOREIGN KEY (created_by) REFERENCES core_users(id),
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  INDEX (branch_id, id),
  INDEX (code),
  INDEX (assigned_team_leader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_project_sellers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  father_name VARCHAR(160) NOT NULL DEFAULT '',
  grandfather_name VARCHAR(160) NOT NULL DEFAULT '',
  tazkira_number VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  share_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  INDEX (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_construction_companies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL UNIQUE,
  company_name VARCHAR(180) NOT NULL,
  license_number VARCHAR(80) NOT NULL DEFAULT '',
  representative_name VARCHAR(160) NOT NULL,
  representative_father_name VARCHAR(160) NOT NULL DEFAULT '',
  representative_tazkira VARCHAR(80) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  FOREIGN KEY (project_id) REFERENCES inv_projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_apartments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  unit_number VARCHAR(40) NOT NULL,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  floor INT NOT NULL,
  rooms INT UNSIGNED NOT NULL DEFAULT 3,
  area_sqm DECIMAL(10,2) NOT NULL,
  direction VARCHAR(80) NOT NULL,
  boundary_north VARCHAR(180) NOT NULL,
  boundary_south VARCHAR(180) NOT NULL,
  boundary_east VARCHAR(180) NOT NULL,
  boundary_west VARCHAR(180) NOT NULL,
  price_per_sqm DECIMAL(14,2) NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('available','reserved','deal_closed','sold') NOT NULL DEFAULT 'available',
  version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_project_unit (project_id, unit_number),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  INDEX (project_id, status, floor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inv_project_sales_agents (
  project_id INT UNSIGNED NOT NULL,
  sales_agent_id INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, sales_agent_id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO core_modules VALUES ('inventory','Pre-Sale Project and Apartment Inventory',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('inventory',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
  ('inventory.read','inventory','Read pre-sale project and apartment inventory'),
  ('inventory.manage','inventory','Create and update pre-sale projects, sellers, and apartments');
INSERT INTO core_role_permissions VALUES
  ('manager','inventory.read'),
  ('ceo','inventory.read'),('ceo','inventory.manage'),
  ('sales_leader','inventory.read'),('sales','inventory.read'),('callcenter','inventory.read'),
  ('finance_manager','inventory.read'),
  ('architect','inventory.read'),('graphic_designer','inventory.read'),('visual_designer_3d','inventory.read');
