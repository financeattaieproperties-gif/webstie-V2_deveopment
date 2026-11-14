-- INTERNAL CRM ONLY. Apply once after 100; retains all production and outbox history.
ALTER TABLE mkt_production_entries ADD website_revision INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE mkt_submission_outbox ADD revision INT UNSIGNED NOT NULL DEFAULT 1,
  DROP INDEX entry_id, ADD UNIQUE KEY uq_entry_revision(entry_id,revision);
UPDATE mkt_production_entries p JOIN mkt_submission_outbox o ON o.entry_id=p.id SET p.website_revision=1 WHERE p.website_revision=0;
-- Legacy payloads omitted branch/revision; preserve content while adding routing metadata.
UPDATE mkt_submission_outbox o JOIN mkt_production_entries p ON p.id=o.entry_id
 SET o.payload_json=JSON_SET(o.payload_json,'$.originBranchId',p.branch_id,'$.revision',o.revision);
