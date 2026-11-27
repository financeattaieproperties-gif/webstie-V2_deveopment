-- V2 WEBSITE DATABASE ONLY, apply AFTER customer-agency-business-contacts.sql.
-- Manual migration: backup, inspect current schema, never V1 / staff / submissions DB.
-- 'revision' is an unpublished correction window. Prior documents are retained
-- privately with inactive flags; they are never deleted by self-service requests.
ALTER TABLE customer_agencies
  MODIFY COLUMN verification_status ENUM('pending','verified','rejected','revision') NOT NULL DEFAULT 'pending',
  ADD COLUMN review_round INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN resubmitted_at DATETIME DEFAULT NULL;
ALTER TABLE customer_agency_documents
  ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN superseded_at DATETIME DEFAULT NULL,
  ADD INDEX idx_agency_current_documents (agency_id, is_current, document_type);
ALTER TABLE customer_agency_verification_events
  ADD COLUMN review_round INT UNSIGNED DEFAULT NULL;
