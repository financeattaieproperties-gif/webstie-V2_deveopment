-- READ ONLY. Select the NEW V2 testing database in phpMyAdmin first.
SELECT DATABASE() AS selected_v2_database;
SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema=DATABASE();
-- Fresh kit: 39 tables (19 website + 12 shared core + 8 call-center).
SELECT id,name FROM projects ORDER BY id;
-- Fresh packages contain no projects.
SELECT project_id,COUNT(*) AS sample_layouts FROM project_units GROUP BY project_id ORDER BY project_id;
-- Fresh packages contain no project-unit records.
SELECT canonical_base_url,robots_index FROM seo_settings WHERE id=1;
-- Expected: https://website.attaieproperties.com and 0.
SELECT username,LEFT(password_hash,4) AS hash_prefix FROM admin_users;
-- Website owner hash prefix: $2y$.
SELECT code,name FROM core_departments ORDER BY code;
SELECT code,department_code,name FROM core_roles ORDER BY department_code,code;
SELECT module_code,version FROM core_module_versions ORDER BY module_code;
SELECT id,name,username,role,active FROM core_users ORDER BY id;
-- CEO appears only AFTER filling/importing 04-staff-ceo.template.sql.
