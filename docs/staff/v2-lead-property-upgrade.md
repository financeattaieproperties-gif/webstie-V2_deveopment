# V2 CRM customer/property claim upgrade

Use only the separate V2 internal CRM database. Website inquiries and the publication database never participate. Back up existing V2 records/configuration and verify `SELECT DATABASE()` before any import. Do not reset V2 data or touch V1.

Fresh empty databases import `103-customer-property-leads.sql` after the existing internal schema. Its readiness flag activates only when both customer and lead tables are empty. New application source must be deployed with this migration.

For a populated database, import 103 once. It adds nullable canonical property fields and empty claim/readiness tables, preserving every lead and customer. Enforcement stays disabled. Keep writes paused while reviewing and backfilling; do not enable the flag manually as a shortcut.

The read-only PHP preflight (`staff-service/tools/preflight-lead-properties.php`) uses `STAFF_CONFIG_FILE` pointing to private V2 configuration. It prints JSON and exits 2 when unresolved rows exist. A local operator with PHP/MySQL connectivity can run it; the hosted workflow does not require cPanel Terminal. Reports contain internal record IDs and belong outside the web root and source control.

Review these issues explicitly with the owner: duplicate normalized customer phones, registry mappings that do not identify one customer, legacy leads missing customer/property identity, invalid or inconsistent inventory references, foreign-branch references, and multiple historical leads for the same customer/property pair. Closing or losing one duplicate does not resolve uniqueness. Never delete or automatically merge history; retain all records while the owner determines canonical identities or correct property interests. If historical rows cannot truthfully be resolved, keep enforcement disabled and report the upgrade as pending.

After owner-approved corrections, use phpMyAdmin to import the separate optional `104-backfill-customer-property-leads.sql`. This is not part of a fresh schema. Its transaction conservatively requires canonical `+937XXXXXXXX` phone formatting and exact registry mappings, valid branch/property identity, and no duplicate pairs. Review formatting changes separately from identity merges. It infers a unit only from an existing valid apartment ID; otherwise it uses an existing project ID. Missing references are not guessed. Guard failures roll back derived property fields and all claim/readiness writes. If an import error leaves the helper procedure present, verify the transaction rolled back, resolve the reported condition, and drop only that named helper procedure before retrying the reviewed file.

On success, verify every non-draft lead has its matching claim, drafts remain readable without property, row counts/history are unchanged, and the readiness flag is 1. The application must claim properties within the same transaction as creation/activation/change. A generic 409 must preserve the original lead/call and disclose no other agent's record. Closing/loss never releases a claim.

Each unit is a separate property. Project-level interest is distinct from unit-level interest. Changing an existing lead's property uses one atomic claim UPDATE: MySQL checks the new unique key before replacing the old key. Inserting a second claim first would violate the schema's unique lead ID; deleting first would weaken failure recovery.

This document and local fictional fixtures do not prove any existing hosted database has been reviewed, upgraded, or activated. Leave hosted acceptance pending until actual import and allowed/denied workflow evidence exists.
