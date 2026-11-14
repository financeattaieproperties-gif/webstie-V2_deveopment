-- V2 website database only. Back up first and verify SELECT DATABASE().
-- Apply once to an existing leads table; fresh installs use schema.sql instead.
-- Nullable identifiers preserve all legacy rows without generating historical receipts.
ALTER TABLE leads
  ADD COLUMN client_request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  ADD COLUMN payload_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  ADD COLUMN receipt_reference VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  ADD COLUMN receipt_submitted_at DATETIME DEFAULT NULL,
  ADD COLUMN followup_status ENUM('new','in_progress','resolved') NOT NULL DEFAULT 'new',
  ADD COLUMN followup_notes TEXT DEFAULT NULL,
  ADD COLUMN followup_at DATETIME DEFAULT NULL,
  ADD COLUMN version INT UNSIGNED NOT NULL DEFAULT 1,
  ADD UNIQUE KEY uq_inquiry_request (client_request_id),
  ADD UNIQUE KEY uq_inquiry_receipt (receipt_reference);

CREATE TABLE IF NOT EXISTS website_inquiry_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  actor VARCHAR(100) NOT NULL,
  previous_status VARCHAR(30) NOT NULL,
  next_status VARCHAR(30) NOT NULL,
  notes TEXT DEFAULT NULL,
  followup_at DATETIME DEFAULT NULL,
  version INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_inquiry_event (inquiry_id, id),
  CONSTRAINT fk_inquiry_event FOREIGN KEY (inquiry_id) REFERENCES leads(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
