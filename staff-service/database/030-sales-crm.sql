-- V2 ONLY. Import ONCE after 020-inventory.sql in the Internal Office CRM Database.
-- Phase 3: Master Customer Deduplication, Review Requests, Sales Leads, Stage History & Deal Closures.
SET NAMES utf8mb4;

CREATE TABLE crm_customer_owners (
  customer_id INT UNSIGNED PRIMARY KEY,
  serial VARCHAR(80) NOT NULL UNIQUE,
  owner_agent_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (owner_agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_customer_shared_access (
  customer_id INT UNSIGNED NOT NULL,
  agent_id INT UNSIGNED NOT NULL,
  granted_by INT UNSIGNED NOT NULL,
  reason VARCHAR(120) NOT NULL DEFAULT 'referral',
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, agent_id),
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (agent_id) REFERENCES core_users(id),
  FOREIGN KEY (granted_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_customer_review_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  phone VARCHAR(20) NOT NULL,
  requesting_agent_id INT UNSIGNED NOT NULL,
  submitted_name VARCHAR(160) NOT NULL,
  submitted_requirements TEXT NOT NULL,
  status ENUM('pending_review','approved_shared','rejected') NOT NULL DEFAULT 'pending_review',
  reviewed_by INT UNSIGNED NULL,
  manager_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (requesting_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (reviewed_by) REFERENCES core_users(id),
  INDEX (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_lead_referrals (
  lead_id INT UNSIGNED NOT NULL,
  shared_agent_id INT UNSIGNED NOT NULL,
  referred_by_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NULL,
  apartment_id INT UNSIGNED NULL,
  referred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lead_id, shared_agent_id),
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (shared_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (referred_by_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_deal_handoffs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  deal_serial VARCHAR(100) NOT NULL UNIQUE,
  sales_agent_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NOT NULL,
  agreed_amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  buyer_photo_url VARCHAR(500) NOT NULL,
  tazkira_photo_url VARCHAR(500) NOT NULL,
  hr_status ENUM('pending_contract','contract_issued') NOT NULL DEFAULT 'pending_contract',
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id),
  INDEX (hr_status, closed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO core_modules VALUES ('sales_crm','Sales Pipeline and Customer Deduplication',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('sales_crm',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
  ('sales.access','sales_crm','Access Sales CRM leads, follow-ups, visits, and deals'),
  ('sales.team_manage','sales_crm','Supervise assigned Sales Agents as Sales Team Leader'),
  ('customers.review_duplicates','sales_crm','Review and resolve duplicate customer access requests');
INSERT INTO core_role_permissions VALUES
  ('sales','sales.access'),('sales_leader','sales.access'),('sales_leader','sales.team_manage'),
  ('manager','sales.access'),('manager','sales.team_manage'),('manager','customers.review_duplicates'),
  ('ceo','sales.access'),('ceo','sales.team_manage'),('ceo','customers.review_duplicates');
