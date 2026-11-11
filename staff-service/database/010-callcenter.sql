-- V2 ONLY. Import ONCE after 001-core.sql. This module adds tables and registry rows only.
SET NAMES utf8mb4;
CREATE TABLE cc_serial_counters (
 agent_id INT UNSIGNED PRIMARY KEY, next_number INT UNSIGNED NOT NULL, FOREIGN KEY(agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE cc_customers (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, phone VARCHAR(20) NOT NULL,
 created_at DATETIME NOT NULL, INDEX(phone), INDEX(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE cc_leads (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, serial VARCHAR(80) NOT NULL UNIQUE,
 customer_id INT UNSIGNED NULL, customer_name VARCHAR(160) NOT NULL DEFAULT '', phone VARCHAR(20) NOT NULL,
 requirements TEXT NOT NULL, origin_agent_id INT UNSIGNED NOT NULL, assignee_id INT UNSIGNED NOT NULL,
 status ENUM('draft','active','closed','lost') NOT NULL DEFAULT 'draft', call_at DATETIME NOT NULL,
 source ENUM('manual','provider') NOT NULL, provider_call_id VARCHAR(180) NULL UNIQUE,
 version INT NOT NULL DEFAULT 1, current_task_id INT UNSIGNED NULL,
 FOREIGN KEY(customer_id) REFERENCES cc_customers(id), FOREIGN KEY(origin_agent_id) REFERENCES core_users(id),
 FOREIGN KEY(assignee_id) REFERENCES core_users(id), INDEX(origin_agent_id,status,id), INDEX(assignee_id,status,id), INDEX(customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- current_task_id is maintained transactionally by the service, avoiding a cyclic table dependency.
CREATE TABLE cc_followup_tasks (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lead_id INT UNSIGNED NOT NULL, assignee_id INT UNSIGNED NOT NULL,
 scheduled_at DATETIME NOT NULL, deadline_at DATETIME NOT NULL, completed_at DATETIME NULL, late_seconds INT UNSIGNED NOT NULL DEFAULT 0,
 notes TEXT NOT NULL, outcome VARCHAR(20) NULL, version INT NOT NULL DEFAULT 1,
 FOREIGN KEY(lead_id) REFERENCES cc_leads(id), FOREIGN KEY(assignee_id) REFERENCES core_users(id),
 INDEX(assignee_id,completed_at,scheduled_at,id), INDEX(assignee_id,completed_at,deadline_at,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE cc_lead_activities (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lead_id INT UNSIGNED NOT NULL, actor_id INT UNSIGNED NOT NULL,
 type VARCHAR(40) NOT NULL, notes TEXT NOT NULL, created_at DATETIME NOT NULL,
 FOREIGN KEY(lead_id) REFERENCES cc_leads(id), FOREIGN KEY(actor_id) REFERENCES core_users(id), INDEX(lead_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE cc_deal_closures (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lead_id INT UNSIGNED NOT NULL UNIQUE, sales_agent_id INT UNSIGNED NOT NULL,
 amount DECIMAL(14,2) NOT NULL, currency CHAR(3) NOT NULL, closed_at DATETIME NOT NULL,
 FOREIGN KEY(lead_id) REFERENCES cc_leads(id), FOREIGN KEY(sales_agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE cc_calls (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, lead_id INT UNSIGNED NOT NULL UNIQUE,
 agent_id INT UNSIGNED NOT NULL, customer_phone VARCHAR(20) NOT NULL, call_at DATETIME NOT NULL,
 source ENUM('manual','provider') NOT NULL, provider_call_id VARCHAR(180) NULL UNIQUE, created_at DATETIME NOT NULL,
 FOREIGN KEY(lead_id) REFERENCES cc_leads(id), FOREIGN KEY(agent_id) REFERENCES core_users(id), INDEX(agent_id,call_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Reserved inbox for future verified provider integration; no public ingestion route is enabled.
CREATE TABLE cc_provider_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, provider VARCHAR(60) NOT NULL, external_event_id VARCHAR(180) NOT NULL,
 received_at DATETIME NOT NULL, processed_at DATETIME NULL, status ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
 payload MEDIUMTEXT NOT NULL, UNIQUE(provider,external_event_id), INDEX(status,received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO core_modules VALUES ('callcenter','Call Center',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('callcenter',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
 ('callcenter.access','callcenter','Access scoped call-center workspace'),
 ('callcenter.manage','callcenter','Read call-center records for management');
INSERT INTO core_role_permissions VALUES
 ('callcenter','callcenter.access'),('sales','callcenter.access'),
 ('ceo','callcenter.access'),('admin','callcenter.access'),('ceo','callcenter.manage'),('admin','callcenter.manage');
