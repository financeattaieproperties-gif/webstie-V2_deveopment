-- V2 ONLY: Import into the SEPARATE THIRD Submission Database (or isolated sub_* schema).
-- Phase 5: Isolated Submission Database bridging Marketing Posted entries and Admin Website Publishing.
-- UDR-001/002/003: Admin reads/updates status here and publishes to Website DB; Staff reads status here; Admin NEVER accesses Internal CRM DB.
SET NAMES utf8mb4;

CREATE TABLE sub_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marketing_entry_id INT UNSIGNED NOT NULL UNIQUE,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  customer_name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  property_type ENUM('Villa','Block','Building','Apartment') NOT NULL,
  property_info_note TEXT NOT NULL,
  social_platform ENUM('Facebook','YouTube','Instagram') NOT NULL,
  publish_status ENUM('Submitted','Approved','Published','Rejected') NOT NULL DEFAULT 'Submitted',
  rejection_reason TEXT NULL,
  submitted_by_name VARCHAR(160) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  published_at DATETIME NULL,
  website_property_id INT UNSIGNED NULL,
  version INT NOT NULL DEFAULT 1,
  INDEX (publish_status, submitted_at),
  INDEX (serial_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sub_post_photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sub_post_id INT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  UNIQUE KEY uq_sub_photo_order (sub_post_id, sort_order),
  FOREIGN KEY (sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sub_publish_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sub_post_id INT UNSIGNED NOT NULL,
  actor_role VARCHAR(60) NOT NULL,
  previous_status VARCHAR(40) NULL,
  next_status VARCHAR(40) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_post_id) REFERENCES sub_posts(id),
  INDEX (sub_post_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Copied marketing images only. No buyer documents or CRM identity data.
CREATE TABLE sub_post_assets (
  sub_post_id INT UNSIGNED NOT NULL, sort_order TINYINT UNSIGNED NOT NULL,
  mime VARCHAR(100) NOT NULL, content LONGBLOB NOT NULL,
  PRIMARY KEY(sub_post_id,sort_order), FOREIGN KEY(sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
