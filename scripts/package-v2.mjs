import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||'');
const php=process.argv[3]||'php';
if(!process.argv[2] || !output.startsWith(path.join(root,'releases')+path.sep) || fs.existsSync(output))throw new Error('Use a NEW output folder under releases/ and optional PHP executable.');
const dist=path.join(output,'dist'),database=path.join(output,'database'),privateDir=path.join(output,'private');
for(const dir of [dist,database,path.join(privateDir,'app'),path.join(privateDir,'sessions')])fs.mkdirSync(dir,{recursive:true});
const write=(relative,text)=>{const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);};
const copy=(source,relative)=>{const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,source),target);};
function run(command,args){const result=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});if(result.status!==0)throw new Error(result.stderr||result.stdout||`Command failed: ${command}`);if(result.stdout)process.stdout.write(result.stdout);}
process.env.VITE_API_URL='/api';process.env.VITE_SITE_URL='https://website.attaieproperties.com';
run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit']);
run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','-p','admin-panel/tsconfig.json']);
run(process.execPath,['node_modules/typescript/bin/tsc','--noEmit','-p','apps/staff/tsconfig.json']);
// Disable publicDir copying: raw public/ contains private/local config and old outputs.
await build({configFile:path.join(root,'vite.config.ts'),publicDir:false,build:{outDir:dist,emptyOutDir:false}});
await build({configFile:path.join(root,'admin-panel/vite.config.ts'),root:path.join(root,'admin-panel'),publicDir:false,build:{outDir:path.join(dist,'admin'),emptyOutDir:false}});
const adminHtml=path.join(dist,'admin/index.html');
fs.writeFileSync(adminHtml,fs.readFileSync(adminHtml,'utf8').replace('<head>','<head>\n<meta name="robots" content="noindex, nofollow, noarchive">'));
copy('deployment/staff/dashboard.htaccess','dist/admin/.htaccess');
for(const role of ['callcenter','management'])run(process.execPath,['scripts/build-staff.mjs','--role',role,'--out',path.join(dist,role)]);
for(const folder of ['assets','fonts'])fs.cpSync(path.join(root,'public',folder),path.join(dist,folder),{recursive:true});
copy('public/logo.png','dist/logo.png');

const backendHashes=[];
function phpTree(relative){
 for(const entry of fs.readdirSync(path.join(root,'public',relative),{withFileTypes:true})){
  const rel=path.join(relative,entry.name);
  if(entry.isDirectory()){if(!['data','uploads','sessions'].includes(entry.name))phpTree(rel);continue;}
  if(!entry.name.endsWith('.php') && entry.name!=='.htaccess')continue;
  if(/^(db\.php|db\.example\.php|paths(?:\.example)?\.php|migrate.*\.php|install\.php|.*\.local\.php)$/.test(entry.name))continue;
  copy('public/'+rel,'dist/'+rel);
  if(entry.name.endsWith('.php'))backendHashes.push({path:rel.replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'public',rel))).digest('hex')});
 }
}
for(const tree of ['api','visual-config','staff-api'])phpTree(tree);
for(const file of ['seo.php','sitemap.php','.user.ini'])copy('public/'+file,'dist/'+file);
let rules=fs.readFileSync(path.join(root,'public/.htaccess'),'utf8');
rules=rules.replace('# Admin CRM SPA fallback',`# Staff module deep links (existing files/assets already served above)\nRewriteRule ^staff-api/v1(?:/.*)?$ /staff-api/index.php [L]\nRewriteRule ^callcenter(?:/.*)?$ /callcenter/index.html [L]\nRewriteRule ^management(?:/.*)?$ /management/index.html [L]\n\n# Admin CRM SPA fallback`);
if(!rules.includes('^staff-api/v1'))throw new Error('Review changed root routing before packaging.');
write('dist/.htaccess',`# V2 TESTING ONLY. Never upload into the main domain document root.\nRewriteEngine On\nRewriteRule ^(?:ai-chat(?:/|$)|chat-service\\.php$) - [F,L]\n${rules}\n<IfModule mod_headers.c>\n Header always set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>\n<Files "initiate-call.php">\n Require all denied\n</Files>\n`);
write('dist/robots.txt','User-agent: *\nDisallow: /\n');
write('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://website.attaieproperties.com/</loc></url></urlset>\n');
write('dist/visual-config/data/.htaccess','Require all denied\n');
write('dist/visual-config/.htaccess','Options -Indexes\n<FilesMatch "^(?:.*\\.json|.*\\.tmp.*)$">\n Require all denied\n</FilesMatch>\n');
write('dist/uploads/.htaccess','Options -Indexes\n<FilesMatch "\\.(?:php[0-9]?|phtml|phar|cgi|pl|py|sh|shtml)$">\n Require all denied\n</FilesMatch>\n');
for(const folder of ['private_applications','chat_store'])write(`dist/uploads/${folder}/.htaccess`,'Require all denied\n');
let db=fs.readFileSync(path.join(root,'public/api/db.example.php'),'utf8');
for(const [from,to] of [["define('ADMIN_USER', 'admin');","define('ADMIN_USER', '');"],["define('ADMIN_PASS', 'choose_a_strong_password');","define('ADMIN_PASS', '');"]]){if(!db.includes(from))throw new Error('Review changed website configuration template.');db=db.replace(from,to);}
db=db.replace('<?php',"<?php\n// V2 manual phpMyAdmin schema import: never run request-time migrations.\ndefine('ATTAIE_MANUAL_SCHEMA', true);");
write('dist/api/db.php',db);
copy('public/staff-api/paths.example.php','dist/staff-api/paths.php');
for(const file of ['src/App.php','src/Domain.php','src/FirebaseAuth.php'])copy('staff-service/'+file,'private/app/'+file);
let config=fs.readFileSync(path.join(root,'staff-service/config/config.example.php'),'utf8');
const firebase=fs.readFileSync(path.join(root,'staff-service/config/firebase.local.php'),'utf8');
for(const key of ['firebase_project_id','firebase_api_key']){
 const match=firebase.match(new RegExp(`'${key}'\\s*=>\\s*'([A-Za-z0-9_-]+)'`));
 if(!match)throw new Error('Missing owner-provided Firebase web identifiers.');
 config=config.replace(new RegExp(`('${key}'\\s*=>\\s*)'[^']*'`),`$1'${match[1]}'`);
}
config=config.replace('NEW_STAFF_DATABASE','YOUR_V2_DATABASE').replace('NEW_STAFF_RUNTIME_USER','YOUR_V2_DATABASE_USER').replace('/home/CPANEL_USER/private-staff/sessions','/home/CPANEL_USER/attaie-v2-private/sessions');
write('private/config.php',config);
copy('public/staff-api/paths.example.php','private/paths-reference.php');

const sqls=['public/api/schema.sql','staff-service/database/001-core.sql','staff-service/database/010-callcenter.sql'];
write('database/01-new-v2-schema.sql','-- NEW EMPTY V2 TEST DATABASE ONLY. Select it explicitly in phpMyAdmin.\n-- Website tables + shared core + call-center module. Import once; not an upgrade.\n'+sqls.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n\n'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'deployment/v2/project-showcase.json'),'utf8'));
if(catalog.projects.length || catalog.units.length)throw new Error('Project seeds are disabled; new V2 packages start with an empty project catalog.');
const value=v=>v==null?'NULL':v===''?"''":typeof v==='number'?(Number.isFinite(v)?String(v):(()=>{throw new Error('Invalid number');})()):`CONVERT(0x${Buffer.from(Array.isArray(v)?JSON.stringify(v):String(v),'utf8').toString('hex')} USING utf8mb4)`;
const insert=(table,columns,rows)=>rows.length ? `INSERT INTO ${table} (${columns.map(c=>'`'+c+'`').join(',')}) VALUES\n`+rows.map(r=>'('+columns.map(c=>value(r[c])).join(',')+')').join(',\n')+';\n' : '';
for(const record of [...catalog.projects,...catalog.units])for(const url of [record.image_url,record.masterplan_image,...(record.gallery_images||[])].filter(Boolean))if(!url.startsWith('/assets/')||!fs.existsSync(path.join(dist,url.slice(1))))throw new Error('Missing showcase artwork '+url);
const projects=['id','name','location','delivery_date','status','available_units','total_units','image_url','gallery_images','video_url','masterplan_image','description','created_at'];
const units=['id','project_id','unit_number','title','beds','baths','area','floor','price','currency','status','image_url','description'];
write('database/02-five-project-showcase.sql','-- NEW EMPTY V2 DATABASE ONLY. No bundled projects, units, or project artwork.\nSET NAMES utf8mb4;\nSTART TRANSACTION;\n'+insert('projects',projects,catalog.projects)+insert('project_units',units,catalog.units)+"UPDATE seo_settings SET canonical_base_url='https://website.attaieproperties.com',robots_index=0 WHERE id=1;\nCOMMIT;\n");
run(php,['-n','scripts/prepare-v2-admin.php',path.join(output,'private-setup')]);
fs.copyFileSync(path.join(output,'private-setup/03-website-admin.sql'),path.join(database,'03-website-admin.sql'));
run(php,['-n','staff-service/bin/bootstrap-admin.php','--out',path.join(output,'private-setup/staff-owner')]);
fs.copyFileSync(path.join(output,'private-setup/staff-owner/020-owner.template.sql'),path.join(database,'04-staff-ceo.template.sql'));
copy('deployment/v2/project-showcase.json','private-setup/project-showcase.json');
write('private-setup/backend-source-hashes.json',JSON.stringify(backendHashes,null,2));
copy('deployment/v2/START-HERE.md','START-HERE.md');
copy('deployment/v2/VERIFY-TEST-DATABASE.sql','database/VERIFY-TEST-DATABASE.sql');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const manifest=walk(output).map(file=>({path:path.relative(output,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
write('manifest.json',JSON.stringify(manifest,null,2));
run(process.execPath,['tests/staff/packaging/v2-kit.mjs',output]);
run(process.platform==='win32'?'python':'python3',['scripts/zip-v2-release.py',output]);
console.log('Prepared V2 testing kit: '+output+'\nNo server upload, live import, or production change occurred.');
