-- V2 ONLY. Import ONCE after 030-sales-crm.sql in the Internal Office CRM Database.
-- Phase 4: HR Contracts, Buyers, Installment Schedules & Finance Deposits.
SET NAMES utf8mb4;

CREATE TABLE hr_contracts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_serial VARCHAR(100) NOT NULL UNIQUE,
  deal_handoff_id INT UNSIGNED NULL,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NOT NULL,
  sellers_snapshot_json MEDIUMTEXT NOT NULL,
  construction_snapshot_json MEDIUMTEXT NOT NULL,
  apartment_snapshot_json MEDIUMTEXT NOT NULL,
  price_per_sqm DECIMAL(14,2) NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  sales_agent_name VARCHAR(160) NOT NULL DEFAULT '',
  gregorian_date DATE NOT NULL,
  jalali_date VARCHAR(40) NOT NULL,
  clauses_json MEDIUMTEXT NOT NULL,
  notes TEXT NOT NULL,
  status ENUM('draft','issued','amended','cancelled') NOT NULL DEFAULT 'issued',
  amendment_version INT UNSIGNED NOT NULL DEFAULT 1,
  issued_by INT UNSIGNED NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (deal_handoff_id) REFERENCES crm_deal_handoffs(id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id),
  FOREIGN KEY (issued_by) REFERENCES core_users(id),
  INDEX (project_id, apartment_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE hr_contract_buyers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  father_name VARCHAR(160) NOT NULL,
  grandfather_name VARCHAR(160) NOT NULL DEFAULT '',
  tazkira_number VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(255) NOT NULL,
  photo_3x4_url VARCHAR(500) NOT NULL,
  tazkira_photo_url VARCHAR(500) NULL,
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id),
  INDEX (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE hr_contract_installments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  installment_number INT UNSIGNED NOT NULL,
  description VARCHAR(180) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  due_date DATE NULL,
  scheduled_amount DECIMAL(14,2) NOT NULL,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending','partially_paid','paid','overdue') NOT NULL DEFAULT 'pending',
  UNIQUE KEY uq_contract_inst (contract_id, installment_number),
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id),
  INDEX (contract_id, status, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fin_deposits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  installment_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  payment_method ENUM('Cash','Bank Transfer','Cheque') NOT NULL DEFAULT 'Cash',
  receipt_number VARCHAR(80) NOT NULL,
  notes TEXT NOT NULL,
  status ENUM('draft','posted','returned','reversed') NOT NULL DEFAULT 'draft',
  reversal_reason TEXT NULL,
  entered_by INT UNSIGNED NOT NULL,
  approved_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  posted_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id),
  FOREIGN KEY (installment_id) REFERENCES hr_contract_installments(id),
  FOREIGN KEY (entered_by) REFERENCES core_users(id),
  FOREIGN KEY (approved_by) REFERENCES core_users(id),
  INDEX (contract_id, status),
  INDEX (installment_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO core_modules VALUES ('hr_finance','HR Contracts and Finance Installment Ledger',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('hr_finance',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
  ('hr.contracts.manage','hr_finance','Create, issue, print, and amend bilingual apartment sale contracts'),
  ('finance.read','hr_finance','Read contract installment schedules and deposit ledgers'),
  ('finance.deposit.draft','hr_finance','Prepare draft customer installment deposits'),
  ('finance.deposit.approve','hr_finance','Approve, post, return, and reverse customer deposits');
INSERT INTO core_role_permissions VALUES
  ('manager','hr.contracts.manage'),
  ('finance_manager','finance.read'),('finance_manager','finance.deposit.draft'),('finance_manager','finance.deposit.approve'),
  ('ceo','finance.read');
