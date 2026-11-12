// Creates a new-install kit. Existing API/PHP source files are copied verbatim.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2] && path.resolve(process.argv[2]);
if (!destination || !destination.startsWith(path.join(root, 'releases') + path.sep)) {
  throw new Error('Destination must be a new directory inside releases/.');
}
if (fs.existsSync(destination)) throw new Error('Destination already exists.');
const setup = path.join(destination, 'setup');
const site = path.join(destination, 'site');
fs.mkdirSync(setup, { recursive: true });
fs.mkdirSync(site);

function readConstants(relative, wanted, context = {}) {
  const source = ts.createSourceFile(relative, fs.readFileSync(path.join(root, relative), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !wanted.includes(declaration.name.text)) continue;
      if (!declaration.initializer) throw new Error('Missing initializer');
      context[declaration.name.text] = vm.runInNewContext(`(${declaration.initializer.getText(source)})`, context, { timeout: 1000 });
    }
  }
  for (const name of wanted) if (!context[name]) throw new Error(`Missing source constant: ${name}`);
  return context;
}

const { projects, units } = JSON.parse(fs.readFileSync(path.join(root, 'deployment/v2/project-showcase.json'), 'utf8'));
if (projects.length || units.length) throw new Error('Project seeds are disabled.');
const images = new Set();
for (const record of [...projects, ...units]) {
  for (const image of [record.image_url, record.masterplan_image, ...(record.gallery_images || [])]) {
    if (image) images.add(image);
  }
}
for (const image of images) {
  if (!image.startsWith('/assets/') || !fs.existsSync(path.join(root, 'public', image.slice(1)))) throw new Error(`Missing local showcase asset: ${image}`);
}
fs.writeFileSync(path.join(setup, 'catalog.json'), JSON.stringify({ projects, units, note: 'Empty project catalog. Add project data through the application.' }, null, 2));

function sqlValue(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid SQL number');
    return String(value);
  }
  const text = Array.isArray(value) ? JSON.stringify(value) : String(value);
  return text === '' ? "''" : `CONVERT(0x${Buffer.from(text, 'utf8').toString('hex')} USING utf8mb4)`;
}
function insert(table, columns, records) {
  if (!records.length) return '';
  return `INSERT INTO ${table} (${columns.map(c => '`' + c + '`').join(', ')}) VALUES\n` + records.map(record => '(' + columns.map(c => sqlValue(record[c])).join(', ') + ')').join(',\n') + ';\n';
}
const projectColumns = ['id', 'name', 'location', 'delivery_date', 'status', 'available_units', 'total_units', 'image_url', 'gallery_images', 'video_url', 'masterplan_image', 'description', 'created_at'];
const unitColumns = ['id', 'project_id', 'unit_number', 'title', 'beds', 'baths', 'area', 'floor', 'price', 'currency', 'status', 'image_url', 'description'];
const seed = '-- NEW EMPTY TEST DATABASE ONLY. Project catalog starts empty.\n' +
  '-- No project or apartment seeds are included.\n' +
  'SET NAMES utf8mb4;\nSTART TRANSACTION;\n' + insert('projects', projectColumns, projects) + insert('project_units', unitColumns, units) +
  "UPDATE seo_settings SET canonical_base_url = 'https://website.attaieproperties.com', robots_index = 0 WHERE id = 1;\nCOMMIT;\n";
fs.writeFileSync(path.join(setup, '02-five-projects.sql'), seed);
fs.copyFileSync(path.join(root, 'public/api/schema.sql'), path.join(setup, '01-schema.sql'));
fs.copyFileSync(path.join(root, 'public/api/db.example.php'), path.join(setup, 'db.template.php'));
for (const name of ['install.php', 'config.example.php', 'README.md']) {
  fs.copyFileSync(path.join(root, 'deployment/staging', name), path.join(setup, name));
}

const copied = [];
function copyPhpTree(relative) {
  const source = path.join(root, 'public', relative);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) copyPhpTree(child);
    else if ((entry.name.endsWith('.php') || entry.name === '.htaccess') && !/^(db\.php|db\.example\.php|migrate.*\.php)$/.test(entry.name)) copyPublic(child);
  }
}
function copyPublic(relative) {
  const source = path.join(root, 'public', relative);
  const target = path.join(site, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  copied.push({ path: relative.replaceAll('\\', '/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex') });
}
copyPhpTree('api');
copyPhpTree('ai-chat');
for (const name of ['chat-service.php', 'seo.php', 'sitemap.php', '.htaccess', '.user.ini']) copyPublic(name);
fs.writeFileSync(path.join(site, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
// Block AI before the existing-file bypass: some hosts ignore SetEnv, which
// could otherwise allow Config.php to select another deployment's private data.
const originalRules = fs.readFileSync(path.join(site, '.htaccess'), 'utf8');
fs.writeFileSync(path.join(site, '.htaccess'), '# Isolated testing deployment only\nRewriteEngine On\nRewriteRule ^ai-chat(?:/|$) - [F,L]\n' + originalRules + '\n<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>\n<Files "initiate-call.php">\n  Require all denied\n</Files>\n');
fs.writeFileSync(path.join(setup, 'backend-source-hashes.json'), JSON.stringify(copied.filter(f => f.path.endsWith('.php')), null, 2));
console.log(`Prepared staging source: ${projects.length} projects, ${units.length} showcase layouts, ${copied.length} server files.`);
