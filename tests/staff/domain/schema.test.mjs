import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL(`../../../staff-service/database/${name}`, import.meta.url), 'utf8');
test('Dari staff translations contain no damaged placeholder text',()=>{
 const fa=JSON.parse(fs.readFileSync(new URL('../../../apps/staff/src/i18n/fa.json',import.meta.url),'utf8'));
 for(const [key,value] of Object.entries(fa)) assert.doesNotMatch(value,/\?{2}/,key);
});
test('core registers canonical roles and branch ownership without password storage', () => {
 const sql=read('001-core.sql');
 for(const name of ['core_users','core_departments','core_roles','core_permissions','core_role_permissions','core_modules','core_module_versions','core_branches','core_branch_managers','core_management_tasks']) assert.match(sql,new RegExp(`CREATE TABLE ${name}\\s*\\(`));
 const roleSeed=sql.match(/INSERT INTO core_roles VALUES([\s\S]*?)INSERT INTO core_permissions/)?.[1] || '';
 for(const role of ['ceo','manager','callcenter','sales_leader','sales','marketing_manager','editor','videographer','finance_manager','architect','graphic_designer','visual_designer_3d']) assert.ok(roleSeed.includes(`'${role}'`),role);
 for(const role of ['admin','hr_manager','branch_manager','assistant_manager','production_manager','photographer','customer']) assert.ok(!roleSeed.includes(`'${role}'`),role);
 assert.match(sql,/CREATE TABLE core_branches \([\s\S]*code VARCHAR\(40\) NOT NULL UNIQUE[\s\S]*address VARCHAR\(255\)[\s\S]*phone VARCHAR\(40\)[\s\S]*email VARCHAR\(254\)[\s\S]*version INT/);
 assert.match(sql,/CREATE TABLE core_branch_managers \([\s\S]*branch_id INT UNSIGNED PRIMARY KEY[\s\S]*manager_user_id INT UNSIGNED NOT NULL UNIQUE/);
 assert.match(sql,/CREATE TABLE core_management_tasks \([\s\S]*branch_id INT UNSIGNED NOT NULL/);
 assert.match(sql,/firebase_uid VARCHAR\(128\).*UNIQUE/);
 assert.doesNotMatch(sql,/password_hash|DROP TABLE|ALTER TABLE/i);
});
test('callcenter install creates only its own tables and never alters prior tables', () => {
 const sql=read('010-callcenter.sql');
 const names=[...sql.matchAll(/CREATE TABLE (\w+)/g)].map(m=>m[1]);
 assert.ok(names.length>=7);
 assert.ok(names.every(n=>n.startsWith('cc_')));
 assert.doesNotMatch(sql,/ALTER TABLE|DROP TABLE|TRUNCATE|CREATE DATABASE|USE\s+/i);
 for(const table of ['cc_customers','cc_leads','cc_followup_tasks','cc_lead_activities','cc_calls','cc_provider_events']) assert.ok(names.includes(table));
});

test('fresh modules attach branch ownership to every workflow root and canonical grants', () => {
 const core=read('001-core.sql');
 const callcenter=read('010-callcenter.sql');
 const inventory=read('020-inventory.sql');
 const hr=read('040-hr-finance.sql');
 const marketing=read('050-marketing-production.sql');
 const submissions=read('055-submissions-db.sql');
 assert.match(callcenter,/CREATE TABLE cc_customers \([\s\S]*branch_id INT UNSIGNED NOT NULL/);
 assert.match(callcenter,/CREATE TABLE cc_leads \([\s\S]*branch_id INT UNSIGNED NOT NULL/);
 assert.match(inventory,/CREATE TABLE inv_projects \([\s\S]*branch_id INT UNSIGNED NOT NULL/);
 assert.match(marketing,/CREATE TABLE mkt_production_entries \([\s\S]*branch_id INT UNSIGNED NOT NULL/);
 assert.match(submissions,/CREATE TABLE sub_posts \([\s\S]*origin_branch_id INT UNSIGNED NOT NULL/);
 assert.doesNotMatch(submissions,/origin_branch_id[\s\S]{0,300}REFERENCES core_branches/);
 assert.match(inventory,/\('ceo','inventory\.manage'\)/);
 assert.doesNotMatch(inventory,/\('manager','inventory\.manage'\)/);
 assert.match(hr,/\('manager','hr\.contracts\.manage'\)/);
 assert.doesNotMatch(hr,/\('manager','finance\.deposit\.(?:draft|approve)'\)/);
 assert.match(core,/INSERT INTO core_module_versions VALUES \('core',3,UTC_TIMESTAMP\(\)\)/);
});

test('role migration is guarded, invalidates retired sessions, and never guesses branches', () => {
 const sql=read('110-ceo-manager-branch-model.sql');
 assert.match(sql,/core_migration_ledger/);
 assert.match(sql,/ceo_manager_branch_model_v1/);
 assert.match(sql,/START TRANSACTION/);
 assert.match(sql,/role = 'ceo'[\s\S]*role = 'manager'/);
 assert.match(sql,/role = 'manager'[\s\S]*role = 'hr_manager'/);
 assert.match(sql,/role IN \('admin','branch_manager','assistant_manager'\)[\s\S]*auth_version = auth_version \+ 1/);
 assert.match(sql,/core_branch_assignment_issues/);
 assert.doesNotMatch(sql,/SET branch_id = [0-9]+/);
 assert.match(sql,/INSERT INTO core_migration_ledger[\s\S]*COMMIT/);
});

test('role migration advances an existing core module version to 3', () => {
 const sql=read('110-ceo-manager-branch-model.sql');
 assert.match(
  sql,
  /INSERT INTO core_module_versions[\s\S]*'core',\s*3[\s\S]*ON DUPLICATE KEY UPDATE[\s\S]*version\s*=\s*VALUES\(version\)/,
 );
});
