-- V2 ONLY. Import ONCE after 040-hr-finance.sql in the Internal Office CRM Database.
-- Phase 5: Marketing and Production Workflow (Internal CRM side).
SET NAMES utf8mb4;

CREATE TABLE mkt_production_entries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  property_type ENUM('Villa','Block','Building','Apartment') NOT NULL,
  submitted_by_id INT UNSIGNED NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  filming_date DATE NULL,
  videographer_id INT UNSIGNED NULL,
  filming_completed_at DATETIME NULL,
  editing_deadline_at DATE NULL,
  editor_id INT UNSIGNED NULL,
  content_type VARCHAR(120) NULL,
  serial_number VARCHAR(80) NULL UNIQUE,
  property_info_note TEXT NULL,
  photos_json MEDIUMTEXT NULL,
  platform ENUM('Facebook','YouTube','Instagram') NULL,
  stage ENUM('submitted','filming_scheduled','filming_completed','editing_scheduled','ready_for_post','posted') NOT NULL DEFAULT 'submitted',
  submission_post_id INT UNSIGNED NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (submitted_by_id) REFERENCES core_users(id),
  FOREIGN KEY (videographer_id) REFERENCES core_users(id),
  FOREIGN KEY (editor_id) REFERENCES core_users(id),
  INDEX (stage, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO core_modules VALUES ('marketing','Marketing and Media Production Workflow',UTC_TIMESTAMP());
INSERT INTO core_module_versions VALUES ('marketing',1,UTC_TIMESTAMP());
INSERT INTO core_permissions VALUES
  ('marketing.submit_property','marketing','Submit property entries for Marketing filming and production'),
  ('marketing.schedule_filming','marketing','Schedule filming dates and assign Videographers'),
  ('marketing.complete_filming','marketing','Mark property filming completed'),
  ('marketing.edit_and_post','marketing','Schedule editing, set content type, and mark Posted with 5 photos');
INSERT INTO core_role_permissions VALUES
  ('sales','marketing.submit_property'),('sales_leader','marketing.submit_property'),('callcenter','marketing.submit_property'),
  ('manager','marketing.submit_property'),('ceo','marketing.submit_property'),
  ('marketing_manager','marketing.submit_property'),('marketing_manager','marketing.schedule_filming'),('marketing_manager','marketing.complete_filming'),
  ('production_manager','marketing.submit_property'),('production_manager','marketing.schedule_filming'),('production_manager','marketing.complete_filming'),
  ('videographer','marketing.complete_filming'),('photographer','marketing.complete_filming'),
  ('editor','marketing.edit_and_post');
