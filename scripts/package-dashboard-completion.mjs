/** Fresh, manual V2 delivery. Never reads local credentials or existing build outputs. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const output = path.resolve(process.argv[2] || path.join(root, 'releases', `manual-staging-dashboard-completion-${stamp}`));
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const freshInternal = ['001-core.sql','010-callcenter.sql','020-inventory.sql','030-sales-crm.sql','040-hr-finance.sql','050-marketing-production.sql','060-engineering.sql','090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql','103-customer-property-leads.sql','105-submission-revisions-internal.sql'];
function sourceAudit() {
  const catalog = JSON.parse(read('deployment/v2/project-showcase.json'));
  if (catalog.projects.length || catalog.units.length) throw new Error('New packages require empty project/unit catalogs.');
  for (const file of freshInternal) if (!fs.existsSync(path.join(root,'staff-service/database',file))) throw new Error(`Missing SQL: ${file}`);
  for (const file of ['App.php','Completion.php','CompletionRules.php','Domain.php','FirebaseAuth.php']) if (!fs.existsSync(path.join(root,'staff-service/src',file))) throw new Error(`Missing service source: ${file}`);
  if (/CREATE TABLE\s+(?:core_|inv_|hr_|fin_|cc_|sub_)/i.test(read('public/api/schema.sql'))) throw new Error('Website schema contains another database module.');
  console.log('Source packaging audit passed: empty catalog, complete PHP source, separate SQL inputs.');
}
sourceAudit();
if (process.argv.includes('--audit-source')) process.exit(0);
if (!/^AIza[A-Za-z0-9_-]{35}$/.test(process.env.VITE_STAFF_FIREBASE_API_KEY || '')) throw new Error('Set VITE_STAFF_FIREBASE_API_KEY to the V2 Firebase public Web API key before creating an upload package.');
const roleMapPath=process.env.V2_TESTING_ROLE_MAP_FILE||'';
if(!path.isAbsolute(roleMapPath)||!fs.statSync(roleMapPath,{throwIfNoEntry:false})?.isFile()) throw new Error('Set V2_TESTING_ROLE_MAP_FILE to an absolute private role-map JSON file before creating an upload package.');
const run = (command,args) => {const result=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});if(result.stdout)process.stdout.write(result.stdout);if(result.status!==0)throw new Error(result.stderr||result.stdout||`Command failed: ${command}`);};
const roleMapProbe=fs.mkdtempSync(path.join(os.tmpdir(),'attaie-v2-role-map-'));
let roleMappingSql=''; let roleMapIdentityValues=[];
try {
  const probeOutput=path.join(roleMapProbe,'04-firebase-role-mapping.sql');
  run(process.execPath,['scripts/create-testing-role-mapping.mjs',roleMapPath,probeOutput]);
  roleMappingSql=fs.readFileSync(probeOutput,'utf8');
  roleMapIdentityValues=JSON.parse(fs.readFileSync(roleMapPath,'utf8')).users.flatMap(user=>[String(user.firebaseUid),String(user.email)]);
} finally { fs.rmSync(roleMapProbe,{recursive:true,force:true}); }
if (path.dirname(output) !== path.join(root,'releases') || !path.basename(output).startsWith('manual-staging-dashboard-completion-') || fs.existsSync(output)) throw new Error('Use a NEW manual-staging-dashboard-completion-* folder directly under releases/.');
const dist = path.join(output,'dist');
const write = (relative,content) => {const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
const copy = (source,relative) => {const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,source),target);};

// Type checks precede all output. A failure leaves no misleading upload folder.
for (const config of ['tsconfig.json','admin-panel/tsconfig.json','apps/staff/tsconfig.json']) run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','-p',config]);
fs.mkdirSync(dist,{recursive:true});
process.env.VITE_API_URL='/api';
process.env.VITE_SITE_URL='https://website.attaieproperties.com';
const firebaseConfigured=Boolean(process.env.VITE_STAFF_FIREBASE_API_KEY);
const common={configFile:false,envDir:false,publicDir:false,logLevel:'warn',build:{emptyOutDir:false}};
// Do not load repository vite.config.ts: it explicitly loads private .env.local.
await build({...common,root,plugins:[react(),tailwindcss()],resolve:{alias:{'@':path.join(root,'src')}},define:{'process.env.GOOGLE_MAPS_PLATFORM_KEY':JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY||'')},build:{...common.build,outDir:dist}});
const websiteHtml=path.join(dist,'index.html');
fs.writeFileSync(websiteHtml,fs.readFileSync(websiteHtml,'utf8').replace(/(<meta name="robots" content=")[^"]+/, '$1noindex, nofollow, noarchive').replaceAll('https://www.attaieproperties.com','https://website.attaieproperties.com'));
await build({...common,root:path.join(root,'admin-panel'),plugins:[react()],base:'/admin/',build:{...common.build,outDir:path.join(dist,'admin')}});
const adminHtml=path.join(dist,'admin/index.html');
fs.writeFileSync(adminHtml,fs.readFileSync(adminHtml,'utf8').replace('<head>','<head>\n<meta name="robots" content="noindex, nofollow, noarchive">'));
copy('deployment/staff/dashboard.htaccess','dist/admin/.htaccess');
for (const role of ['dashboard','management','callcenter']) {
  const directory=path.join(dist,role);
  await build({...common,root:path.join(root,'apps/staff'),plugins:[react()],base:`/${role}/`,define:{__STAFF_ROLE__:JSON.stringify(role),__STAFF_PREVIEW_ALLOWED__:'false'},build:{...common.build,outDir:directory,rollupOptions:{input:path.join(root,`apps/staff/${role}/index.html`)}}});
  fs.renameSync(path.join(directory,role,'index.html'),path.join(directory,'index.html'));
  fs.rmdirSync(path.join(directory,role));
  copy('deployment/staff/dashboard.htaccess',`dist/${role}/.htaccess`);
  const html=fs.readFileSync(path.join(directory,'index.html'),'utf8');
  if(!html.includes('noindex')||!html.includes(`/${role}/assets/`))throw new Error(`Incorrect ${role} base or missing noindex.`);
}
// Preserve every role entry URL from the current app; all use server-authorized sessions.
for (const panel of ['ceo','sales-leader','finance','marketing','engineering']) {
  copy('deployment/staff/dashboard.htaccess',`dist/${panel}/.htaccess`);
  write(`dist/${panel}/index.html`,fs.readFileSync(path.join(dist,'dashboard/index.html'),'utf8'));
}
process.env.STAFF_ROLE='sales'; process.env.STAFF_MOBILE_APP='0'; process.env.STAFF_ALLOW_PREVIEW='0';
await build({configFile:path.join(root,'apps/staff/vite.config.ts'),envDir:false,logLevel:'warn',build:{outDir:path.join(dist,'sales'),emptyOutDir:false}});
fs.renameSync(path.join(dist,'sales/dashboard/index.html'),path.join(dist,'sales/index.html'));
fs.rmdirSync(path.join(dist,'sales/dashboard'));
copy('deployment/staff/dashboard.htaccess','dist/sales/.htaccess');
// Explicit shared assets only. Never copy all assets/aistudio (contains old notes).
fs.cpSync(path.join(root,'public/fonts'),path.join(dist,'fonts'),{recursive:true,filter:file=>fs.statSync(file).isDirectory()||/\.(?:ttf|woff2?)$/i.test(file)});
copy('public/logo.png','dist/logo.png');
const referencedAssets=new Set();
for (const file of walk(path.join(root,'src')).filter(file=>/\.(?:tsx?|css)$/.test(file))) {
  for (const match of fs.readFileSync(file,'utf8').matchAll(/['"](\/assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|svg))['"]/g)) referencedAssets.add(match[1]);
}
for (const asset of referencedAssets) copy(`public${asset}`,`dist${asset}`);

// Only distributable PHP, no migrations, installs, local configs or stored data.
for (const tree of ['api','visual-config','staff-api']) {
  for (const file of walk(path.join(root,'public',tree))) {
    const relative=path.relative(path.join(root,'public'),file).replaceAll('\\','/');
    const name=path.basename(file);
    if (!/\.php$/.test(name) && name!=='.htaccess') continue;
    if (/(?:^|\/)(?:data|uploads|sessions|migrations)\//.test(relative) || /^(?:db(?:\.example)?|paths(?:\.example)?|.*\.local|migrate.*|install)\.php$/.test(name)) continue;
    copy(`public/${relative}`,`dist/${relative}`);
  }
}
for (const name of ['seo.php','sitemap.php','.user.ini']) copy(`public/${name}`,`dist/${name}`);
copy('public/chat-service.php','dist/chat-service.php');
let rules=read('public/.htaccess').replace(/RewriteRule \^sitemap\\\.xml\$ .*\n/,'');
rules=rules.replace('# Admin CRM SPA fallback', '# V2 staff API and dashboard routing\nRewriteRule ^staff-api/v1(?:/.*)?$ /staff-api/index.php [L]\nRewriteRule ^dashboard(?:/.*)?$ /dashboard/index.html [L]\nRewriteRule ^management(?:/.*)?$ /management/index.html [L]\nRewriteRule ^callcenter(?:/.*)?$ /callcenter/index.html [L]\n\n# Admin CRM SPA fallback');
if(!rules.includes('^dashboard')||!rules.includes('^staff-api/v1'))throw new Error('Routing insertion failed.');
write('dist/.htaccess','# V2 testing document root ONLY.\nRewriteEngine On\nRewriteRule ^ai-chat(?:/|$) - [F,L]\n'+rules+'\n<IfModule mod_headers.c>\nHeader always set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>\n<Files "initiate-call.php">\nRequire all denied\n</Files>\n');
write('dist/robots.txt','User-agent: *\nDisallow: /\n');
write('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n');
write('dist/uploads/.htaccess','Options -Indexes\n<FilesMatch "\\.(?:php[0-9]?|phtml|phar|cgi|pl|py|sh|shtml)$">\nRequire all denied\n</FilesMatch>\n');
for(const folder of ['private_applications','chat_store'])write(`dist/uploads/${folder}/.htaccess`,'Require all denied\n');
write('dist/visual-config/data/.htaccess','Require all denied\n');
write('dist/visual-config/.htaccess','Options -Indexes\n<FilesMatch "\\.(?:json|tmp)$">\nRequire all denied\n</FilesMatch>\n');
write('dist/api/db.php',"<?php\n// Path only. Real website/submission configuration lives outside every web root.\nrequire '/home/CPANEL_USER/attaie-v2-private/website-db.php';\n");
copy('public/staff-api/paths.example.php','dist/staff-api/paths.php');
for(const file of walk(path.join(root,'staff-service/src')))copy(path.relative(root,file),`private/app/${path.relative(path.join(root,'staff-service'),file)}`);
write('private/config.example.php',read('staff-service/config/config.example.php').replaceAll('/home/CPANEL_USER/private-staff/sessions','/home/CPANEL_USER/attaie-v2-private/sessions'));
copy('public/staff-api/paths.example.php','private/paths.example.php');
let websiteConfig=read('public/api/db.example.php').replace("define('ADMIN_USER', 'admin');","define('ADMIN_USER', '');").replace("define('ADMIN_PASS', 'choose_a_strong_password');","define('ADMIN_PASS', '');");
websiteConfig=websiteConfig.replace('<?php',"<?php\ndefine('ATTAIE_MANUAL_SCHEMA', true);\n// Separate THIRD submission database. Never use website or internal CRM credentials.\ndefine('SUBMISSION_DB_HOST','localhost');\ndefine('SUBMISSION_DB_USER','YOUR_SUBMISSION_USER');\ndefine('SUBMISSION_DB_PASS','');\ndefine('SUBMISSION_DB_NAME','YOUR_SUBMISSION_DATABASE');");
websiteConfig=websiteConfig.replace("define('WEBSITE_CHAT_STORE_DIR', '');","define('WEBSITE_CHAT_STORE_DIR', '/home/CPANEL_USER/attaie-v2-private/chat');");
write('private/website-db.example.php',websiteConfig);
write('private/sessions/.gitkeep','');
write('private/chat/.gitkeep','');
const header=name=>`-- ${name}. V2 TESTING ONLY. Verify DATABASE() in phpMyAdmin before import.\n-- Fresh install requires a NEW EMPTY database. Never import fresh SQL over existing data.\n`;
write('database/fresh/01-website.sql',header('WEBSITE database')+read('public/api/schema.sql')+"\n"+read('staff-service/database/102-website-submission-map.sql')+"\nUPDATE seo_settings SET canonical_base_url='https://website.attaieproperties.com',robots_index=0 WHERE id=1;\n");
write('database/fresh/02-internal-crm.sql',header('SEPARATE INTERNAL OFFICE CRM database')+freshInternal.map(name=>`\n-- SOURCE ${name}\n`+read(`staff-service/database/${name}`)).join('\n'));
write('database/fresh/03-submissions.sql',header('SEPARATE THIRD SUBMISSION database')+read('staff-service/database/055-submissions-db.sql')+'\n'+read('staff-service/database/106-submission-revisions-third.sql'));
write('database/04-firebase-role-mapping.sql',roleMappingSql);
for(const name of ['090-role-migration.sql','095-retire-finance-assistant.sql','100-dashboard-completion.sql'])copy(`staff-service/database/${name}`,`database/upgrade/internal-crm/${name}`);
copy('staff-service/database/102-website-submission-map.sql','database/upgrade/website/102-website-submission-map.sql');
copy('staff-service/database/101-submission-assets.sql','database/upgrade/submissions/101-submission-assets.sql');
copy('public/api/migrations/2026-11-13-inquiry-receipts.sql','database/upgrade/website/2026-11-13-inquiry-receipts.sql');
for(const name of ['103-customer-property-leads.sql','104-backfill-customer-property-leads.sql','105-submission-revisions-internal.sql','110-ceo-manager-branch-model.sql']) copy(`staff-service/database/${name}`,`database/upgrade/internal-crm/${name}`);
copy('staff-service/database/106-submission-revisions-third.sql','database/upgrade/submissions/106-submission-revisions-third.sql');
copy('staff-service/tools/preflight-lead-properties.php','private/tools/preflight-lead-properties.php');
copy('docs/staff/v2-lead-property-upgrade.md','database/upgrade/LEAD-PREFLIGHT.md');
write('database/upgrade/README.md',`# Existing V2 installations only

Back up all three databases, public uploads, private chat, sessions and configuration. Pause V2 writes during the upgrade. Verify SELECT DATABASE() before every import. Never import fresh SQL over existing data. Inspect installed columns and core_module_versions; apply only missing migrations, once. A partially applied ALTER requires inspection before retry.

1. INTERNAL CRM: missing 090, 095, 100 in that order; then review/apply 110 canonical CEO/Manager/branch migration; then 103 customer/property claims; then 105 publication revisions. Migration 105 requires branch columns introduced by 110 on older installations. The guarded 110 legacy conversion intentionally maps old manager to ceo and old hr_manager to manager once, disables retired roles and never guesses branches. Do not run legacy conversion against already canonical populated accounts without verifying the migration ledger and role history.
2. WEBSITE: missing 2026-11-13-inquiry-receipts.sql, then 102 website publication map. If an old 102 table exists, inspect the signed property_id type against properties.id and repair that foreign-key definition in a backed-up maintenance window.
3. THIRD SUBMISSIONS: missing 101 assets, then 106 revision snapshots. Preserve every old photo, publication event and website mapping.
4. Preserve existing private files. If 100 was previously applied before branch_id was added to core_private_files, 110 now adds/backfills that column without changing file IDs.
5. Run the read-only customer/property preflight using private/tools/preflight-lead-properties.php before claim activation. Read LEAD-PREFLIGHT.md. Resolve reported historical duplicate identities/pairs with owner decisions; then review optional 104 backfill. Never automatically merge customers or delete leads. No cPanel Terminal is required: the owner can run the private preflight locally against a backed-up disposable copy; do not publish it as a web endpoint.
6. Reassign unresolved legacy branch ownership through a reviewed operation before enabling affected staff. Do not reset accounts, history, inventory, contracts, payments, uploads or Firebase UID mappings.

Fresh install SQL and these upgrades are alternatives. Do not import 110 into the fresh canonical schema as a blanket post-install step. All runtime connection users need data privileges only; import/schema privileges stay separate.
`);
write('database/04-firebase-owner.template.sql',"-- INTERNAL CRM only, after fresh schema or verified upgrade. No password belongs here.\n-- Create CEO in V2 Firebase first. Replace exact UID/email/name privately.\nSET @uid=''; SET @email=''; SET @name='Admin (CEO)';\nINSERT INTO core_users(firebase_uid,username,name,role) SELECT @uid,@email,@name,'ceo' WHERE @uid<>'' AND @email<>'';\n-- Then sign in as CEO, create an inactive branch, provision its Manager with exact Firebase UID/email,\n-- assign that Manager and activate the branch. All other active staff require that active branch.\n-- Only CEO provisions users; Manager handles branch operations and contracts.\n");
write('database/05-website-admin.template.sql',"-- WEBSITE database only. Generate a strong password hash privately; never put password text here.\n-- After replacing both placeholders, remove the leading comment from the statement.\n-- INSERT INTO admin_users(username,password_hash) VALUES ('YOUR_ADMIN_USERNAME','YOUR_PASSWORD_HASH');\n");
copy('docs/staff/dashboard-completion-delivery.md','START-HERE.md');
copy('docs/staff/v2-cpanel-database-user-setup.md','CPANEL-STEP-BY-STEP.md');
copy('scripts/create-website-admin-hash.py','tools/create-website-admin-hash.py');
write('PHP-REQUIREMENTS.txt','PHP 8.4; mysqli, pdo_mysql, curl, openssl, fileinfo, mbstring, sessions. MySQL 8 or MariaDB 10.6+. Hosting compatibility must be checked before importing upgrades.\n');
write('BUILD-STATUS.json',JSON.stringify({builtAt:new Date().toISOString(),target:'https://website.attaieproperties.com',firebasePublicKeyConfigured:firebaseConfigured,serverUploaded:false,databaseImported:false,serverVerified:false},null,2));

// Fail the release before archive creation when private/setup material is public.
for(const file of walk(dist)) {
  const relative=path.relative(dist,file).replaceAll('\\','/');
  if(/(?:\.sql$|\.env|\.local\.php$|config\.php$|firebase\.json$|service.account|(?:^|\/)(?:private|database|node_modules)\/)/i.test(relative))throw new Error(`Private material in public output: ${relative}`);
  const content=/\.(?:js|html|php|css|json|ini)$/.test(file)?fs.readFileSync(file,'utf8'):'';
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content))throw new Error(`Private key found: ${relative}`);
  if(relative.includes('04-firebase-role-mapping')||roleMapIdentityValues.some(value=>value&&content.includes(value)))throw new Error(`Private role mapping leaked into public output: ${relative}`);
  if(/^(?:dashboard|management|callcenter)\/assets\/.*\.js$/.test(relative)&&/Sample workspace only|Explore sample workspace/.test(fs.readFileSync(file,'utf8')))throw new Error(`Preview code leaked: ${relative}`);
  if(relative.startsWith('assets/aistudio/')&&!referencedAssets.has('/'+relative))throw new Error(`Unreferenced artwork: ${relative}`);
}
for(const required of ['index.html','.htaccess','.user.ini','admin/index.html','dashboard/index.html','management/index.html','callcenter/index.html','staff-api/index.php','staff-api/paths.php','api/db.php'])if(!fs.existsSync(path.join(dist,required)))throw new Error(`Missing required public file: ${required}`);
const manifest=walk(output).map(file=>({path:path.relative(output,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
write('manifest.json',JSON.stringify(manifest,null,2));
run(process.platform==='win32'?'python':'python3',['scripts/zip-v2-release.py',output]);
write('SHA256SUMS.txt',['UPLOAD-WEBSITE-CONTENTS.zip','UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip'].map(name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(output,name))).digest('hex')+'  '+name).join('\n')+'\n');
console.log(`Prepared ${output}. Firebase public key configured: ${firebaseConfigured}. No upload or database operation occurred.`);
