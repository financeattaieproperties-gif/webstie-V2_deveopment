-- V2 INTERNAL CRM ONLY. Optional populated-database upgrade after 103, NOT a fresh-schema import.
-- Back up, verify SELECT DATABASE(), pause writes, and resolve the read-only preflight report first.
-- No customer merge, lead deletion or guessed identity is performed. Owner reviews every resolution.
-- Conservative guard: normalize historical phone FORMATTING to the existing +937XXXXXXXX registry
-- format only after reviewing identities. Multiple customer IDs for one phone must be resolved manually.
DELIMITER $$
CREATE PROCEDURE v2_backfill_lead_property_claims()
BEGIN
  DECLARE current_enabled TINYINT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
  START TRANSACTION;
  SELECT enabled INTO current_enabled FROM crm_lead_property_readiness WHERE id=1 FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM cc_customers c LEFT JOIN crm_phone_registry r ON r.phone=c.phone
    WHERE c.phone NOT REGEXP '^\\+937[0-9]{8}$' OR r.customer_id IS NULL OR r.customer_id<>c.id
  ) OR EXISTS (SELECT phone FROM cc_customers GROUP BY phone HAVING COUNT(*)>1) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Resolve historical customer identities and canonical phone registry before activation';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cc_leads l LEFT JOIN cc_customers c ON c.id=l.customer_id
    WHERE l.status<>'draft' AND (c.id IS NULL OR l.phone<>c.phone)
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Resolve unqualified or mismatched lead customer identity'; END IF;
  UPDATE cc_leads SET property_kind=IF(apartment_id IS NOT NULL,'unit','project'),property_id=COALESCE(apartment_id,project_id)
  WHERE status<>'draft' AND property_kind IS NULL AND property_id IS NULL;
  IF EXISTS (
    SELECT 1 FROM cc_leads l
    LEFT JOIN inv_projects p ON l.property_kind='project' AND p.id=l.property_id
    LEFT JOIN inv_apartments a ON l.property_kind='unit' AND a.id=l.property_id
    LEFT JOIN inv_projects up ON up.id=a.project_id
    WHERE l.status<>'draft' AND (
      l.property_kind IS NULL OR l.property_id IS NULL OR l.property_id=0 OR
      (l.property_kind='project' AND (p.id IS NULL OR p.branch_id<>l.branch_id OR l.apartment_id IS NOT NULL OR (l.project_id IS NOT NULL AND l.project_id<>p.id))) OR
      (l.property_kind='unit' AND (a.id IS NULL OR up.id IS NULL OR up.branch_id<>l.branch_id OR (l.project_id IS NOT NULL AND l.project_id<>a.project_id) OR (l.apartment_id IS NOT NULL AND l.apartment_id<>a.id)))
    )
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Resolve missing, inconsistent or foreign-branch lead property references'; END IF;
  IF EXISTS (
    SELECT customer_id,property_kind,property_id FROM cc_leads WHERE status<>'draft'
    GROUP BY customer_id,property_kind,property_id HAVING COUNT(*)>1
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Resolve historical duplicate customer/property pairs without deleting history'; END IF;
  IF EXISTS (
    SELECT 1 FROM crm_customer_property_leads c LEFT JOIN cc_leads l ON l.id=c.lead_id
    WHERE l.id IS NULL OR l.customer_id<>c.customer_id OR l.property_kind<>c.property_kind OR l.property_id<>c.property_id OR l.status='draft'
  ) THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Existing claims need explicit review'; END IF;
  INSERT INTO crm_customer_property_leads(customer_id,property_kind,property_id,lead_id)
  SELECT l.customer_id,l.property_kind,l.property_id,l.id FROM cc_leads l
  LEFT JOIN crm_customer_property_leads c ON c.lead_id=l.id WHERE l.status<>'draft' AND c.lead_id IS NULL;
  UPDATE crm_lead_property_readiness SET enabled=1,checked_at=UTC_TIMESTAMP() WHERE id=1;
  COMMIT;
END$$
CALL v2_backfill_lead_property_claims()$$
DROP PROCEDURE v2_backfill_lead_property_claims$$
DELIMITER ;
