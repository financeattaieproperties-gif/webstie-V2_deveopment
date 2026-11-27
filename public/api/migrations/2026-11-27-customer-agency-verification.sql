-- ATTAIE V2 WEBSITE DATABASE ONLY — ADDITIVE STEP AFTER customer-agencies.sql
-- Requires manual DB selection verification and tested staging backup.
-- Never import into V1, CRM, or Submissions database.
SET NAMES utf8mb4;

ALTER TABLE customer_agencies
  ADD COLUMN representative_name VARCHAR(160) NOT NULL DEFAULT '',
  ADD COLUMN representative_position VARCHAR(120) NOT NULL DEFAULT '',
  ADD COLUMN representative_contact_method ENUM('email','phone') DEFAULT NULL,
  ADD COLUMN reviewed_version INT UNSIGNED NOT NULL DEFAULT 0;

CREATE TABLE customer_agency_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  agency_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('registration','license') NOT NULL,
  storage_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  mime_type VARCHAR(40) NOT NULL,
  original_filename VARCHAR(180) NOT NULL,
  byte_size INT UNSIGNED NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_agency_document_storage_key (storage_key),
  INDEX idx_agency_document_latest (agency_id, uploaded_at),
  CONSTRAINT fk_agency_document_owner FOREIGN KEY (agency_id)
    REFERENCES customer_agencies(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
