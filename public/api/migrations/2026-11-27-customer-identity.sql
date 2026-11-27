-- ATTAIE V2 WEBSITE DATABASE ONLY. Never apply to V1, staff CRM, or submissions DB.
-- Manual additive migration: verify SELECT DATABASE(), take a tested backup, run once.
-- No schema changes are executed automatically on a web request.
-- Firebase UID is the ONLY account ownership key. Email/phone never grant staff access.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  display_name VARCHAR(160) NOT NULL DEFAULT '',
  email VARCHAR(254) DEFAULT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  phone_e164 VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  account_type ENUM('individual','agency') NOT NULL DEFAULT 'individual',
  status ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_customer_firebase_uid (firebase_uid),
  INDEX idx_customer_status (status),
  INDEX idx_customer_phone (phone_e164),
  INDEX idx_customer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Never store bearer tokens or OTP values. Record only limited, non-secret audit events.
CREATE TABLE IF NOT EXISTS customer_account_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('created','profile_updated','identity_synced','suspended','deleted') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_account_events (customer_id, id),
  CONSTRAINT fk_customer_event_account FOREIGN KEY (customer_id)
    REFERENCES customer_accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
