-- ATTAIE V2 WEBSITE DATABASE ONLY. Apply AFTER customer-agency-verification.sql.
-- Manual, additive migration; verified owner contact is distinct from agency business contact.
-- Business contacts are REVIEWED by Website Admin, NOT SMS/email OTP verified.
SET NAMES utf8mb4;
ALTER TABLE customer_agencies
  ADD COLUMN business_email VARCHAR(254) DEFAULT NULL,
  ADD COLUMN business_phone_e164 VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  ADD COLUMN business_contact_reviewed_at DATETIME DEFAULT NULL,
  ADD COLUMN business_contact_reviewed_by VARCHAR(120) DEFAULT NULL;
