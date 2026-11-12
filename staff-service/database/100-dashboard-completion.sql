-- V2 internal office database ONLY. Back up first. Apply once after 095.
-- Additive upgrade: retains all existing rows and account mappings.
ALTER TABLE inv_projects ADD total_area_sqm DECIMAL(12,2) NOT NULL DEFAULT 0, ADD commercial_floors_json TEXT NULL, ADD residential_floors_json TEXT NULL, ADD corridor_count INT NOT NULL DEFAULT 1, ADD cover_photo_url VARCHAR(500) NOT NULL DEFAULT '', ADD status VARCHAR(20) NOT NULL DEFAULT 'presale';
ALTER TABLE inv_apartments ADD kind VARCHAR(20) NOT NULL DEFAULT 'apartment', ADD corridor VARCHAR(20) NOT NULL DEFAULT 'A', ADD roof_area_sqm DECIMAL(10,2) NOT NULL DEFAULT 0, ADD is_vip TINYINT NOT NULL DEFAULT 0;
ALTER TABLE inv_project_sellers ADD photo_3x4_url VARCHAR(500) NOT NULL DEFAULT '', ADD details_json TEXT NULL;
ALTER TABLE inv_construction_companies ADD representative_photo_url VARCHAR(500) NOT NULL DEFAULT '', ADD details_json TEXT NULL;
ALTER TABLE hr_contracts ADD verification_token CHAR(64) NULL UNIQUE;
ALTER TABLE hr_contract_buyers ADD details_json TEXT NULL;
CREATE TABLE hr_contract_revisions (contract_id INT UNSIGNED NOT NULL, amendment_version INT UNSIGNED NOT NULL, snapshot_json MEDIUMTEXT NOT NULL, reason TEXT NOT NULL, actor_id INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(contract_id,amendment_version), FOREIGN KEY(contract_id) REFERENCES hr_contracts(id), FOREIGN KEY(actor_id) REFERENCES core_users(id)) ENGINE=InnoDB;
ALTER TABLE fin_deposits ADD payment_date DATE NULL, ADD receipt_paid_to_date DECIMAL(14,2) NULL, ADD receipt_remaining_balance DECIMAL(14,2) NULL;
ALTER TABLE core_users ADD department_code VARCHAR(60) NULL, ADD team_leader_id INT UNSIGNED NULL;
CREATE TABLE core_private_files (id CHAR(32) PRIMARY KEY, owner_id INT UNSIGNED NOT NULL, purpose VARCHAR(40) NOT NULL, file_name VARCHAR(255) NOT NULL, mime VARCHAR(100) NOT NULL, byte_size INT NOT NULL, content LONGBLOB NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(owner_id) REFERENCES core_users(id)) ENGINE=InnoDB;
CREATE TABLE mkt_submission_outbox (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, entry_id INT UNSIGNED NOT NULL UNIQUE, payload_json MEDIUMTEXT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'pending', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(entry_id) REFERENCES mkt_production_entries(id)) ENGINE=InnoDB;
CREATE TABLE crm_phone_registry (phone VARCHAR(20) PRIMARY KEY, customer_id INT UNSIGNED NULL, FOREIGN KEY(customer_id) REFERENCES cc_customers(id)) ENGINE=InnoDB;
INSERT INTO crm_phone_registry(phone,customer_id) SELECT phone,MIN(id) FROM cc_customers GROUP BY phone;
ALTER TABLE cc_leads ADD project_id INT UNSIGNED NULL, ADD apartment_id INT UNSIGNED NULL, ADD stage_code VARCHAR(2) NOT NULL DEFAULT 'L';
DELETE FROM core_role_permissions WHERE permission_code='inventory.manage' AND role_code<>'ceo';
DELETE FROM core_role_permissions WHERE permission_code IN ('core.staff.manage','core.departments.manage') AND role_code<>'ceo';
INSERT IGNORE INTO core_permissions VALUES ('hr.preparation.manage','hr_finance','Prepare sellers and apartment boundaries');
INSERT IGNORE INTO core_role_permissions VALUES ('manager','hr.preparation.manage');
INSERT IGNORE INTO core_module_versions VALUES ('core',2,UTC_TIMESTAMP());
