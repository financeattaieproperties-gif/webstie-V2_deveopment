-- ATTAIE V2 WEBSITE DATABASE ONLY.
-- Apply AFTER 2026-11-27-customer-identity.sql on a backed-up STAGING database.
-- Never import into Internal CRM, Submissions DB, or V1.
-- Verified state is administrator-controlled; never writable by a customer API.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customer_agencies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_customer_id BIGINT UNSIGNED NOT NULL,
  legal_name VARCHAR(200) NOT NULL,
  public_name VARCHAR(200) NOT NULL,
  registration_reference VARCHAR(100) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  operational_status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  rejection_reason VARCHAR(1000) DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  verified_by_admin_id INT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_customer_agency_owner (owner_customer_id),
  INDEX idx_customer_agency_verification (verification_status,created_at),
  CONSTRAINT fk_customer_agency_owner FOREIGN KEY (owner_customer_id)
    REFERENCES customer_accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_agency_members (
  agency_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  member_role ENUM('owner','manager','agent') NOT NULL,
  membership_status ENUM('active','revoked') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (agency_id,customer_id),
  CONSTRAINT fk_customer_agency_member_agency FOREIGN KEY (agency_id)
    REFERENCES customer_agencies(id) ON DELETE RESTRICT,
  CONSTRAINT fk_customer_agency_member_customer FOREIGN KEY (customer_id)
    REFERENCES customer_accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_agency_verification_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  agency_id BIGINT UNSIGNED NOT NULL,
  previous_status VARCHAR(30) NOT NULL,
  next_status VARCHAR(30) NOT NULL,
  reviewer_admin_id INT DEFAULT NULL,
  reason VARCHAR(1000) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agency_review_events (agency_id,id),
  CONSTRAINT fk_agency_review_history FOREIGN KEY (agency_id)
    REFERENCES customer_agencies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ownership of published WEBSITE properties is separate from existing admin records.
-- Populate ONLY through authorized listing publication, never directly from client input.
-- Exactly one owner is required: personal customer OR registered agency.
CREATE TABLE IF NOT EXISTS customer_property_ownership (
  property_id INT NOT NULL PRIMARY KEY,
  individual_customer_id BIGINT UNSIGNED DEFAULT NULL,
  agency_id BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_property_website FOREIGN KEY (property_id)
    REFERENCES properties(id) ON DELETE RESTRICT,
  CONSTRAINT fk_customer_property_individual FOREIGN KEY (individual_customer_id)
    REFERENCES customer_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT fk_customer_property_agency FOREIGN KEY (agency_id)
    REFERENCES customer_agencies(id) ON DELETE RESTRICT,
  CONSTRAINT chk_customer_property_owner_exclusive CHECK (
    (individual_customer_id IS NOT NULL AND agency_id IS NULL)
    OR (individual_customer_id IS NULL AND agency_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
