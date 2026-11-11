-- ==============================================================================
-- Attaie Properties V2 — Complete Consolidated MySQL Schema (All 39 Tables)
-- ==============================================================================
-- Includes:
--   • Part A: Public Website, Catalog Admin (/admin), Careers, Visits, CTC, SEO, AI Chat (19 tables)
--   • Part B: Shared Staff Core Identity, RBAC, Tasks, Audit & Idempotency (12 tables)
--   • Part C: Call Center & Sales CRM Module (/callcenter & /management) (8 tables)
--
-- Instructions:
--   1. Open cPanel > phpMyAdmin, select your V2 database, and click the "SQL" tab.
--   2. Paste and execute this entire script.
--   3. Every statement uses CREATE TABLE IF NOT EXISTS and INSERT IGNORE so it is
--      100% idempotent and safe to run on a fresh or existing V2 database.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- PART A: PUBLIC WEBSITE & CATALOG ADMIN TABLES (19 TABLES)
-- ==============================================================================

-- 1. Admin Users (for /admin website catalog login)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Properties
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

-- 3. Projects (Multi-Unit Developments)
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

-- 4. Project Units (Apartments / Commercial Units within a Project)
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

-- 5. Agents (Real Estate Advisors & Specialists)
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

-- 6. Branches (Office Locations)
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

-- 7. Website Leads & Property Inquiries
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

-- 8. Visit Requests & Viewing Appointments
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

-- 9. Visit Request Audit Events
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

-- 10. Visit Rate Limit Log
CREATE TABLE IF NOT EXISTS visit_rate_limit_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  phone_hash CHAR(64)    NOT NULL,
  outcome    ENUM('allowed','blocked_ip','blocked_phone') NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_rl_ip_time (ip_address, created_at),
  INDEX idx_visit_rl_phone_time (phone_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Etisalat CPaaS Click-to-Call Token Cache
CREATE TABLE IF NOT EXISTS ctc_auth_cache (
  id         TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  id_token   TEXT     NOT NULL,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Etisalat CPaaS Public Call Log
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

-- 13. Persistent Site-Wide SEO Settings
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
  canonical_base_url  VARCHAR(255)  DEFAULT 'https://website.attaieproperties.com',
  robots_index        TINYINT(1)    NOT NULL DEFAULT 0,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_settings_site_name (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO seo_settings (
  id, site_name, default_title, title_template, template,
  default_description, description, keywords, og_image,
  twitter_image, twitter_card, twitter_site, canonical_base_url, robots_index
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
  'https://website.attaieproperties.com',
  0
);

-- 14. Career Job Postings
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

-- 15. Career Job Applications
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

-- 16. AI Chat Conversations
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

-- 17. AI Chat Messages
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

-- 18. AI Chat Handoffs
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

-- 19. AI Chat Rate Limits
CREATE TABLE IF NOT EXISTS ai_chat_rate_limits (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket     VARCHAR(40)  NOT NULL,
  ip_hash    CHAR(64)     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_rl_bucket_ip_time (bucket, ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- PART B: STAFF CORE IDENTITY, RBAC & MANAGEMENT TASKS (12 TABLES)
-- ==============================================================================

-- 20. Core Modules
CREATE TABLE IF NOT EXISTS core_modules (
  code VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  installed_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. Core Module Versions
CREATE TABLE IF NOT EXISTS core_module_versions (
  module_code VARCHAR(60) NOT NULL,
  version INT UNSIGNED NOT NULL,
  applied_at DATETIME NOT NULL,
  PRIMARY KEY (module_code, version),
  FOREIGN KEY (module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. Core Departments
CREATE TABLE IF NOT EXISTS core_departments (
  code VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. Core Roles
CREATE TABLE IF NOT EXISTS core_roles (
  code VARCHAR(60) PRIMARY KEY,
  department_code VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  FOREIGN KEY (department_code) REFERENCES core_departments(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. Core Permissions
CREATE TABLE IF NOT EXISTS core_permissions (
  code VARCHAR(100) PRIMARY KEY,
  module_code VARCHAR(60) NOT NULL,
  description VARCHAR(255) NOT NULL,
  FOREIGN KEY (module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. Core Role Permissions
CREATE TABLE IF NOT EXISTS core_role_permissions (
  role_code VARCHAR(60) NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  PRIMARY KEY (role_code, permission_code),
  FOREIGN KEY (role_code) REFERENCES core_roles(code),
  FOREIGN KEY (permission_code) REFERENCES core_permissions(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. Core Branches
CREATE TABLE IF NOT EXISTS core_branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  active TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. Core Users (Firebase-mapped staff accounts; no passwords stored here)
CREATE TABLE IF NOT EXISTS core_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(254) NOT NULL UNIQUE,
  role VARCHAR(60) NOT NULL,
  branch_id INT UNSIGNED NULL,
  active TINYINT NOT NULL DEFAULT 1,
  auth_version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role) REFERENCES core_roles(code),
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  INDEX idx_core_users_role_active (role, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. Core Login Limits
CREATE TABLE IF NOT EXISTS core_login_limits (
  bucket CHAR(64) PRIMARY KEY,
  attempts INT NOT NULL,
  window_start DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. Core Management Tasks
CREATE TABLE IF NOT EXISTS core_management_tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  instructions TEXT NOT NULL,
  priority ENUM('low','normal','high','urgent') NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  deadline_at DATETIME NOT NULL,
  status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
  completed_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id),
  INDEX idx_core_tasks_assignee_status (assignee_id, status, deadline_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. Core Audit Events
CREATE TABLE IF NOT EXISTS core_audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  details TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (actor_id) REFERENCES core_users(id),
  INDEX idx_core_audit_actor (actor_id, created_at),
  INDEX idx_core_audit_action (action, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31. Core Idempotency Keys
CREATE TABLE IF NOT EXISTS core_idempotency_keys (
  actor_id INT UNSIGNED NOT NULL,
  request_key VARCHAR(80) NOT NULL,
  body_hash CHAR(64) NOT NULL,
  result_json MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (actor_id, request_key),
  FOREIGN KEY (actor_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Core RBAC Metadata
INSERT IGNORE INTO core_modules VALUES ('core','Shared application core',UTC_TIMESTAMP());
INSERT IGNORE INTO core_module_versions VALUES ('core',1,UTC_TIMESTAMP());

INSERT IGNORE INTO core_departments VALUES
  ('administration','Administration'),
  ('callcenter','Call Center'),
  ('sales','Sales Department'),
  ('production','Marketing and Production'),
  ('branches','Branch Management'),
  ('finance','Finance'),
  ('engineering','Engineering and Graphic Department'),
  ('customers','Customers');

INSERT IGNORE INTO core_roles VALUES
  ('ceo','administration','Admin (CEO)'),
  ('admin','administration','Administrator'),
  ('callcenter','callcenter','Call Center Agent'),
  ('sales_leader','sales','Sales Team Leader'),
  ('sales','sales','Sales Agent'),
  ('production_manager','production','Production Manager'),
  ('editor','production','Editor'),
  ('photographer','production','Photographer'),
  ('branch_manager','branches','Manager'),
  ('assistant_manager','branches','Assistant Manager'),
  ('finance_manager','finance','Finance Manager'),
  ('finance_assistant','finance','Finance Assistant'),
  ('architect','engineering','Architect'),
  ('graphic_designer','engineering','Graphic Designer'),
  ('visual_designer_3d','engineering','3D Visual Designer'),
  ('customer','customers','Customer');

INSERT IGNORE INTO core_permissions VALUES
  ('core.tasks.read_own','core','Read and complete assigned management tasks'),
  ('core.tasks.assign','core','Assign management tasks'),
  ('core.staff.manage','core','Provision and deactivate operational staff');

INSERT IGNORE INTO core_role_permissions
  SELECT code, 'core.tasks.read_own' FROM core_roles WHERE code <> 'customer';

INSERT IGNORE INTO core_role_permissions VALUES
  ('ceo','core.tasks.assign'),
  ('admin','core.tasks.assign'),
  ('ceo','core.staff.manage'),
  ('admin','core.staff.manage');


-- ==============================================================================
-- PART C: CALL CENTER & SALES CRM MODULE TABLES (8 TABLES)
-- ==============================================================================

-- 32. Per-Agent Lead Serial Counters
CREATE TABLE IF NOT EXISTS cc_serial_counters (
  agent_id INT UNSIGNED PRIMARY KEY,
  next_number INT UNSIGNED NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 33. Call Center Customers
CREATE TABLE IF NOT EXISTS cc_customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_cc_customers_phone (phone),
  INDEX idx_cc_customers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 34. Call Center Leads
CREATE TABLE IF NOT EXISTS cc_leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  serial VARCHAR(80) NOT NULL UNIQUE,
  customer_id INT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL,
  requirements TEXT NOT NULL,
  origin_agent_id INT UNSIGNED NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  status ENUM('draft','active','closed','lost') NOT NULL DEFAULT 'draft',
  call_at DATETIME NOT NULL,
  source ENUM('manual','provider') NOT NULL,
  provider_call_id VARCHAR(180) NULL UNIQUE,
  version INT NOT NULL DEFAULT 1,
  current_task_id INT UNSIGNED NULL,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (origin_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  INDEX idx_cc_leads_origin (origin_agent_id, status, id),
  INDEX idx_cc_leads_assignee (assignee_id, status, id),
  INDEX idx_cc_leads_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 35. Follow-up Tasks (24-Hour SLA)
CREATE TABLE IF NOT EXISTS cc_followup_tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  scheduled_at DATETIME NOT NULL,
  deadline_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  late_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  outcome VARCHAR(20) NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  INDEX idx_cc_followups_scheduled (assignee_id, completed_at, scheduled_at, id),
  INDEX idx_cc_followups_deadline (assignee_id, completed_at, deadline_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 36. Lead Activities Log
CREATE TABLE IF NOT EXISTS cc_lead_activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL,
  notes TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (actor_id) REFERENCES core_users(id),
  INDEX idx_cc_activities_lead (lead_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 37. Closed Deals (Sales Agent Closures)
CREATE TABLE IF NOT EXISTS cc_deal_closures (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  sales_agent_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  closed_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 38. Call Records
CREATE TABLE IF NOT EXISTS cc_calls (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  agent_id INT UNSIGNED NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  call_at DATETIME NOT NULL,
  source ENUM('manual','provider') NOT NULL,
  provider_call_id VARCHAR(180) NULL UNIQUE,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (agent_id) REFERENCES core_users(id),
  INDEX idx_cc_calls_agent_time (agent_id, call_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 39. Provider Events Inbox
CREATE TABLE IF NOT EXISTS cc_provider_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  external_event_id VARCHAR(180) NOT NULL,
  received_at DATETIME NOT NULL,
  processed_at DATETIME NULL,
  status ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  payload MEDIUMTEXT NOT NULL,
  UNIQUE KEY uq_cc_provider_event (provider, external_event_id),
  INDEX idx_cc_provider_status_time (status, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Call Center RBAC Metadata
INSERT IGNORE INTO core_modules VALUES ('callcenter','Call Center',UTC_TIMESTAMP());
INSERT IGNORE INTO core_module_versions VALUES ('callcenter',1,UTC_TIMESTAMP());

INSERT IGNORE INTO core_permissions VALUES
  ('callcenter.access','callcenter','Access scoped call-center workspace'),
  ('callcenter.manage','callcenter','Read call-center records for management');

INSERT IGNORE INTO core_role_permissions VALUES
  ('callcenter','callcenter.access'),
  ('sales','callcenter.access'),
  ('ceo','callcenter.access'),
  ('admin','callcenter.access'),
  ('ceo','callcenter.manage'),
  ('admin','callcenter.manage');

SET FOREIGN_KEY_CHECKS = 1;
