import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL(`../../../staff-service/database/${name}`, import.meta.url), 'utf8');
test('Dari staff translations contain no damaged placeholder text',()=>{
 const fa=JSON.parse(fs.readFileSync(new URL('../../../apps/staff/src/i18n/fa.json',import.meta.url),'utf8'));
 for(const [key,value] of Object.entries(fa)) assert.doesNotMatch(value,/\?{2}/,key);
});
test('core registers all departments and roles without password storage', () => {
 const sql=read('001-core.sql');
 for(const name of ['core_users','core_departments','core_roles','core_permissions','core_role_permissions','core_modules','core_module_versions','core_management_tasks']) assert.match(sql,new RegExp(`CREATE TABLE ${name}\\s*\\(`));
 for(const role of ['ceo','callcenter','sales_leader','sales','production_manager','editor','photographer','branch_manager','assistant_manager','finance_manager','architect','graphic_designer','visual_designer_3d','customer']) assert.ok(sql.includes(`'${role}'`),role);
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
