-- ==============================================================================
-- Attaie Properties — Consolidated Production MySQL Schema (schema.sql)
-- ==============================================================================
-- Instructions:
--   1. Open cPanel > phpMyAdmin, select your database, and go to the SQL tab.
--   2. Paste and execute this entire script.
--   3. All statements use CREATE TABLE IF NOT EXISTS with inline, globally unique
--      index names and INSERT IGNORE seeds so the script is 100% idempotent and
--      will never fail with "#1061 - Duplicate key name" on re-runs.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Admin Users ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Properties ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  serial_number    VARCHAR(50)    NOT NULL,
  title            VARCHAR(255)   NOT NULL,
  price            DECIMAL(12,2)  NOT NULL,
  location         VARCHAR(255)   NOT NULL,
  beds             TINYINT        DEFAULT NULL,
  baths            TINYINT        DEFAULT NULL,
  area             DECIMAL(8,2)   DEFAULT NULL,
  floor            TINYINT        DEFAULT NULL,
  status           ENUM('available','pending','sold','rented') NOT NULL DEFAULT 'available',
  type             ENUM('Villa','Apartment','House','Commercial','Land') NOT NULL,
  listing_type     ENUM('sale','rent') NOT NULL,
  image_url        VARCHAR(500)   DEFAULT NULL,
  description      TEXT           DEFAULT NULL,
  gallery_images   TEXT           DEFAULT NULL,
  video_url        VARCHAR(1000)  DEFAULT NULL,
  floor_plan_url   VARCHAR(500)   DEFAULT NULL,
  three_d_plan_url VARCHAR(500)   DEFAULT NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_properties_serial (serial_number),
  INDEX idx_properties_status_type (status, type),
  INDEX idx_properties_listing_type (listing_type),
  INDEX idx_properties_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Projects (Multi-Unit Developments) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255)  NOT NULL,
  location         VARCHAR(255)  NOT NULL,
  delivery_date    VARCHAR(50)   DEFAULT NULL,
  status           ENUM('Coming Soon','In Progress','Sold Out','Under Construction','Ready') NOT NULL DEFAULT 'Coming Soon',
  available_units  INT           DEFAULT 0,
  total_units      INT           DEFAULT 0,
  image_url        VARCHAR(500)  DEFAULT NULL,
  gallery_images   TEXT          DEFAULT NULL,
  video_url        VARCHAR(1000) DEFAULT NULL,
  masterplan_image VARCHAR(500)  DEFAULT NULL,
  description      TEXT          DEFAULT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status (status),
  INDEX idx_projects_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Project Units (Apartments / Commercial Units within a Project) ─────────
CREATE TABLE IF NOT EXISTS project_units (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  project_id   INT           NOT NULL,
  unit_number  VARCHAR(80)   NOT NULL,
  title        VARCHAR(255)  DEFAULT NULL,
  beds         TINYINT       DEFAULT NULL,
  baths        TINYINT       DEFAULT NULL,
  area         DECIMAL(8,2)  DEFAULT NULL,
  floor        TINYINT       DEFAULT NULL,
  price        DECIMAL(12,2) DEFAULT NULL,
  currency     CHAR(3)       NOT NULL DEFAULT 'USD',
  status       ENUM('available','reserved','sold','rented') NOT NULL DEFAULT 'available',
  image_url    VARCHAR(500)  DEFAULT NULL,
  description  TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_project_units_project_unit (project_id, unit_number),
  INDEX idx_project_units_status (status),
  CONSTRAINT fk_project_units_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Agents (Real Estate Advisors & Specialists) ────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(160) NOT NULL,
  background   TEXT         NOT NULL,
  portrait_url VARCHAR(500) NOT NULL,
  phone        VARCHAR(50)  NOT NULL,
  email        VARCHAR(255) NOT NULL,
  whatsapp     VARCHAR(50)  DEFAULT NULL,
  published    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agents_published_name (published, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Branches (Office Locations) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  address    VARCHAR(500) NOT NULL,
  phone      VARCHAR(50)  DEFAULT NULL,
  email      VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_branches_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Leads & Property Inquiries ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50)  NOT NULL,
  message       TEXT         DEFAULT NULL,
  property_id   VARCHAR(50)  DEFAULT NULL,
  property_name VARCHAR(255) DEFAULT NULL,
  stage         VARCHAR(50)  DEFAULT 'New',
  source        VARCHAR(50)  DEFAULT 'Website',
  status        VARCHAR(50)  DEFAULT 'Pending',
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leads_status_stage (status, stage),
  INDEX idx_leads_property_id (property_id),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Visit Requests & Viewing Appointments ──────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  property_id      INT          DEFAULT NULL,
  project_id       INT          DEFAULT NULL,
  project_unit_id  INT          DEFAULT NULL,
  listing_name     VARCHAR(255) NOT NULL,
  requested_at     DATETIME     NOT NULL,
  status           ENUM('pending','confirmed','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
  staff_note       TEXT         DEFAULT NULL,
  source           VARCHAR(50)  NOT NULL DEFAULT 'Website',
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_visit_requests_requested_at (requested_at),
  INDEX idx_visit_requests_status (status),
  INDEX idx_visit_requests_property (property_id),
  INDEX idx_visit_requests_project (project_id),
  INDEX idx_visit_requests_unit (project_unit_id),
  INDEX idx_visit_requests_ip_time (ip_address, created_at),
  INDEX idx_visit_requests_phone_time (phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Visit Request Audit Events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_request_events (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  visit_request_id INT          NOT NULL,
  previous_status  VARCHAR(30)  DEFAULT NULL,
  next_status      VARCHAR(30)  NOT NULL,
  actor            VARCHAR(100) NOT NULL DEFAULT 'system',
  note             TEXT         DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_events_request_id (visit_request_id),
  CONSTRAINT fk_visit_events_request
    FOREIGN KEY (visit_request_id) REFERENCES visit_requests(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. Visit Rate Limit Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_rate_limit_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  phone_hash CHAR(64)    NOT NULL,
  outcome    ENUM('allowed','blocked_ip','blocked_phone') NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_rl_ip_time (ip_address, created_at),
  INDEX idx_visit_rl_phone_time (phone_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. Etisalat CPaaS Click-to-Call Tables ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ctc_auth_cache (
  id         TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  id_token   TEXT     NOT NULL,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ctc_public_call_log (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_number     VARCHAR(20)  NOT NULL,
  ip_address          VARCHAR(45)  NOT NULL,
  reference_id        INT UNSIGNED NOT NULL,
  etisalat_request_id VARCHAR(50)  DEFAULT NULL,
  status              ENUM('initiated','failed','blocked') DEFAULT 'initiated',
  response_payload    TEXT         DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ctc_ip_time (ip_address, created_at),
  INDEX idx_ctc_number_time (customer_number, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. Persistent Site-Wide SEO Settings ─────────────────────────────────────
-- Replaces hardcoded mock SEO objects with database-backed configuration storing
-- site_name, default_title, title_template / template, default_description / description,
-- keywords, OpenGraph / Twitter card metadata, canonical URL, and indexing directives.
CREATE TABLE IF NOT EXISTS seo_settings (
  id                  TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  site_name           VARCHAR(120)  NOT NULL DEFAULT 'Attaie Properties',
  default_title       VARCHAR(255)  NOT NULL DEFAULT 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
  title_template      VARCHAR(160)  NOT NULL DEFAULT '%s | Attaie Properties',
  template            VARCHAR(160)  NOT NULL DEFAULT '%s | Attaie Properties',
  default_description TEXT          NOT NULL,
  description         TEXT          DEFAULT NULL,
  keywords            TEXT          DEFAULT NULL,
  og_image            VARCHAR(500)  DEFAULT '/logo.png',
  twitter_image       VARCHAR(500)  DEFAULT NULL,
  twitter_card        ENUM('summary_large_image','summary') NOT NULL DEFAULT 'summary_large_image',
  twitter_site        VARCHAR(100)  DEFAULT '@AttaieProps',
  canonical_base_url  VARCHAR(255)  DEFAULT 'https://www.attaieproperties.com',
  robots_index        TINYINT(1)    NOT NULL DEFAULT 1,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_settings_site_name (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO seo_settings (
  id,
  site_name,
  default_title,
  title_template,
  template,
  default_description,
  description,
  keywords,
  og_image,
  twitter_image,
  twitter_card,
  twitter_site,
  canonical_base_url,
  robots_index
) VALUES (
  1,
  'Attaie Properties',
  'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
  '%s | Attaie Properties',
  '%s | Attaie Properties',
  'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
  'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
  'Attaie Properties, Kabul real estate, properties for sale in Kabul, properties for rent in Kabul, luxury villas Kabul, apartments in Kabul, Afghanistan property agency',
  '/logo.png',
  NULL,
  'summary_large_image',
  '@AttaieProps',
  'https://www.attaieproperties.com',
  1
);

-- ── 13. Careers & Job Applications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_jobs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  location        VARCHAR(255) NOT NULL DEFAULT 'Kabul, Afghanistan',
  employment_type VARCHAR(100) NOT NULL DEFAULT 'Full-Time',
  description     TEXT         NOT NULL,
  qualifications  TEXT         NOT NULL,
  deadline_at     DATETIME     NOT NULL,
  status          ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_career_jobs_status_deadline (status, deadline_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_applications (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  job_id              INT          NOT NULL,
  name                VARCHAR(255) NOT NULL,
  father_name         VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50)  NOT NULL,
  address             VARCHAR(500) NOT NULL,
  photo_path          VARCHAR(500) NOT NULL,
  photo_original_name VARCHAR(255) NOT NULL,
  photo_mime_type     VARCHAR(100) NOT NULL,
  photo_size          INT UNSIGNED NOT NULL,
  cv_path             VARCHAR(500) NOT NULL,
  cv_original_name    VARCHAR(255) NOT NULL,
  cv_mime_type        VARCHAR(100) NOT NULL,
  cv_size             INT UNSIGNED NOT NULL,
  ip_address          VARCHAR(45)  DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_career_apps_job_created (job_id, created_at),
  INDEX idx_career_apps_ip_created (ip_address, created_at),
  CONSTRAINT fk_career_apps_job
    FOREIGN KEY (job_id) REFERENCES career_jobs(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 14. AI Real-Estate Assistant Tables (Optional / Isolated Storage) ─────────
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id               VARCHAR(64)  NOT NULL PRIMARY KEY,
  owner_token_hash CHAR(64)     NOT NULL,
  provider         VARCHAR(32)  NOT NULL DEFAULT 'gemini',
  model            VARCHAR(80)  NOT NULL DEFAULT 'gemini-2.5-flash',
  language         VARCHAR(10)  NOT NULL DEFAULT 'fa',
  last_property_id INT          DEFAULT NULL,
  page_context     VARCHAR(255) DEFAULT NULL,
  handoff_status   ENUM('none','delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'none',
  lead_submitted   TINYINT(1)   NOT NULL DEFAULT 0,
  lead_hash        CHAR(64)     DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_conv_owner (owner_token_hash),
  INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(64)  NOT NULL,
  sender          ENUM('customer','assistant','system') NOT NULL,
  message_text    TEXT         NOT NULL,
  verified_cards  JSON         DEFAULT NULL,
  provider        VARCHAR(32)  DEFAULT NULL,
  model           VARCHAR(80)  DEFAULT NULL,
  suggest_handoff TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_msg_conv_created (conversation_id, created_at),
  CONSTRAINT fk_ai_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES ai_chat_conversations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_handoffs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(64)  NOT NULL,
  customer_name   VARCHAR(120) NOT NULL,
  customer_phone  VARCHAR(30)  NOT NULL,
  customer_email  VARCHAR(255) DEFAULT NULL,
  customer_notes  TEXT         DEFAULT NULL,
  consent_given   TINYINT(1)   NOT NULL DEFAULT 1,
  lead_hash       CHAR(64)     NOT NULL,
  delivery_status ENUM('delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'delivered_to_crm',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ai_handoff_hash (lead_hash),
  INDEX idx_ai_handoff_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_rate_limits (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket     VARCHAR(40)  NOT NULL,
  ip_hash    CHAR(64)     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_rl_bucket_ip_time (bucket, ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
