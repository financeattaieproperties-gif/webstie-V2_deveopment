-- V2 INTERNAL CRM only. Back up and verify SELECT DATABASE() before applying once after 100.
-- Additive: legacy leads remain unchanged; read-only preflight and reviewed backfill are required.
ALTER TABLE cc_leads
  ADD COLUMN property_kind ENUM('project','unit') NULL,
  ADD COLUMN property_id INT UNSIGNED NULL,
  ADD INDEX idx_lead_property (customer_id,property_kind,property_id);

CREATE TABLE crm_customer_property_leads (
  customer_id INT UNSIGNED NOT NULL,
  property_kind ENUM('project','unit') NOT NULL,
  property_id INT UNSIGNED NOT NULL,
  lead_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (customer_id,property_kind,property_id),
  UNIQUE KEY uq_property_lead (lead_id),
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE crm_lead_property_readiness (
  id TINYINT PRIMARY KEY,
  enabled TINYINT NOT NULL DEFAULT 0,
  checked_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Only a completely empty CRM may activate immediately. Existing records require explicit review.
INSERT INTO crm_lead_property_readiness(id,enabled,checked_at)
SELECT 1, IF((SELECT COUNT(*) FROM cc_leads)=0 AND (SELECT COUNT(*) FROM cc_customers)=0,1,0),UTC_TIMESTAMP();
