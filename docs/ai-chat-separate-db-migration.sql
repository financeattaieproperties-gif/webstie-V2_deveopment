-- =============================================================================
-- Attaie Properties — Reviewable Additive Migration for AI Real-Estate Chat
-- =============================================================================
-- IMPORTANT:
-- 1. DO NOT RUN THIS AGAINST THE PROTECTED V1 PRODUCTION DATABASE WITHOUT EXPLICIT
--    OWNER APPROVAL (per AGENTS.md Rule 2).
-- 2. By default, /public/ai-chat/ uses isolated storage outside public_html
--    (.attaie_ai_private/) so zero changes are required on the existing MySQL DB.
-- 3. If you provision a SEPARATE dedicated MySQL database for AI chat storage
--    (e.g. `cpaneluser_attaie_ai_chat`), run this additive script in that separate
--    database only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id                VARCHAR(64)  NOT NULL PRIMARY KEY,
  owner_token_hash  CHAR(64)     NOT NULL,
  provider          VARCHAR(32)  NOT NULL DEFAULT 'gemini',
  model             VARCHAR(80)  NOT NULL DEFAULT 'gemini-2.5-flash',
  language          VARCHAR(10)  NOT NULL DEFAULT 'fa',
  last_property_id  INT          DEFAULT NULL,
  page_context      VARCHAR(255) DEFAULT NULL,
  handoff_status    ENUM('none','delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'none',
  lead_submitted    TINYINT(1)   NOT NULL DEFAULT 0,
  lead_hash         CHAR(64)     DEFAULT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_conv_owner (owner_token_hash),
  INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id                VARCHAR(64)  NOT NULL PRIMARY KEY,
  conversation_id   VARCHAR(64)  NOT NULL,
  sender            ENUM('customer','assistant','system') NOT NULL,
  message_text      TEXT         NOT NULL,
  verified_cards    JSON         DEFAULT NULL,
  provider          VARCHAR(32)  DEFAULT NULL,
  model             VARCHAR(80)  DEFAULT NULL,
  suggest_handoff   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_msg_conv_created (conversation_id, created_at),
  CONSTRAINT fk_ai_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES ai_chat_conversations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_chat_handoffs (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id   VARCHAR(64)  NOT NULL,
  customer_name     VARCHAR(120) NOT NULL,
  customer_phone    VARCHAR(30)  NOT NULL,
  customer_email    VARCHAR(255) DEFAULT NULL,
  customer_notes    TEXT         DEFAULT NULL,
  consent_given     TINYINT(1)   NOT NULL DEFAULT 1,
  lead_hash         CHAR(64)     NOT NULL,
  delivery_status   ENUM('delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'delivered_to_crm',
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ai_handoff_hash (lead_hash),
  INDEX idx_ai_handoff_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_chat_rate_limits (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket            VARCHAR(40)  NOT NULL,
  ip_hash           CHAR(64)     NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_rl_bucket_ip_time (bucket, ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
