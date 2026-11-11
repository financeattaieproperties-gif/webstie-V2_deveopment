import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]);
const exists=p=>fs.existsSync(path.join(root,p));
assert.ok(exists('dist/index.html'));
for(const file of ['admin/index.html','callcenter/index.html','management/index.html','staff-api/paths.php','api/db.php','.htaccess','.user.ini'])assert.ok(exists('dist/'+file),file);
const rules=fs.readFileSync(path.join(root,'dist/.htaccess'),'utf8');
assert.ok(rules.includes('staff-api/v1'));assert.ok(rules.includes('callcenter'));assert.ok(rules.includes('noindex'));
assert.ok(fs.readFileSync(path.join(root,'dist/api/db.php'),'utf8').includes("define('ATTAIE_MANUAL_SCHEMA', true)"));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
for(const file of walk(path.join(root,'dist'))){
 const relative=path.relative(path.join(root,'dist'),file).replaceAll('\\','/');
 assert.ok(!/\.sql$|\.env|WEBSITE-ADMIN-LOGIN|config\.php$|(^|\/)install\.php$|firebase\.local\.php|paths\.example\.php/.test(relative),relative);
 assert.ok(!relative.startsWith('private/'),relative);
}
for(const file of ['01-new-v2-schema.sql','02-five-project-showcase.sql','03-website-admin.sql','04-staff-ceo.template.sql'])assert.ok(exists('database/'+file),file);
assert.ok(exists('private/app/src/FirebaseAuth.php'));
assert.ok(exists('private/config.php'));
assert.ok(exists('private-setup/WEBSITE-ADMIN-LOGIN-PRIVATE.txt'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'private-setup/project-showcase.json'),'utf8'));
assert.deepEqual(catalog.projects.map(p=>p.id),[1,2,3,4,5]);assert.equal(catalog.units.length,25);
for(const record of [...catalog.projects,...catalog.units])for(const url of [record.image_url,record.masterplan_image,...(record.gallery_images||[])].filter(Boolean))assert.ok(exists('dist'+url),url);
const art=['kabul-plaza-saljuqi','moon-residency','kabul-plaza-burj','kabul-plaza-12','kabul-plaza-abc'];
let assets=0;for(const folder of art)assets+=walk(path.join(root,'dist/assets',folder)).length;assert.ok(assets>=98,`Artwork count ${assets}`);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
for(const row of manifest){const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,row.path))).digest('hex');assert.equal(digest,row.sha256,row.path);}
assert.equal(fs.readdirSync(path.join(root,'dist/callcenter/assets')).filter(n=>/^fa-.*\.js$/.test(n)).length,0);
console.log(`Full V2 kit verified: ${manifest.length} manifest files, ${assets} five-project artwork files, 5 projects/25 sample layouts, separate SQL/private setup, English callcenter.`);
