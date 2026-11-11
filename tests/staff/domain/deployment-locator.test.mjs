import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../../../'+p,import.meta.url),'utf8');
test('manual cPanel locator supports private staff service/config without environment setup',()=>{
 assert.match(read('public/staff-api/index.php'),/paths\.php/);
 assert.match(read('public/staff-api/index.php'),/config_file/);
 assert.match(read('public/staff-api/paths.example.php'),/app_directory/);
 assert.match(read('public/staff-api/.htaccess'),/paths/);
});
test('manual schema flag prevents request-time website schema changes',()=>{
 const php=read('public/api/bootstrap.php').replace(/\r/g,'');
 assert.match(php,/ATTAIE_MANUAL_SCHEMA/);
 assert.ok(php.includes("if (!defined('ATTAIE_MANUAL_SCHEMA') || ATTAIE_MANUAL_SCHEMA !== true) {\n    attaie_ensure_schema();"));
});
