import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';

const root = process.cwd();
export const php = process.env.WEBSITE_TEST_PHP || path.resolve('releases/validation/php/php.exe');
export const phpArgs = ['-d', `extension_dir=${path.join(path.dirname(php), 'ext')}`, '-d', 'extension=mysqli'];
export async function startWebsiteFixture() {
  assert.ok(fs.existsSync(php), 'Local PHP with mysqli required; no HTTP test was run');
  const database = `attaie_v2_test_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'attaie-website-fixture-'));
  const env = {...process.env, STAFF_LOCAL_TEST:'1', WEBSITE_TEST_DATABASE:database};
  const fixture = (action) => {
    const result = spawnSync(php, [...phpArgs, 'tests/website/support/fixture.php', action], {cwd:root, env, encoding:'utf8'});
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  fixture('setup');
  const publicDir = path.join(dir, 'public');
  fs.mkdirSync(path.join(publicDir, 'api/admin'), {recursive:true});
  for (const file of ['bootstrap.php', 'submit-lead.php', 'inquiry-service.php', 'admin/leads.php']) {
    if (fs.existsSync(`public/api/${file}`)) fs.copyFileSync(`public/api/${file}`, path.join(publicDir, 'api', file));
  }
  // Copy the public template, never a local/private db.php. Replace its db() with a fixture-only connection.
  let config = fs.readFileSync('public/api/db.example.php', 'utf8');
  config = config.replace(/function db\(\): mysqli \{[\s\S]*?\n\}/, `function db(): mysqli {
    static $conn;
    if (!$conn) { $conn = new mysqli('127.0.0.1', 'root', '', '${database}', 3397); $conn->set_charset('utf8mb4'); }
    return $conn;
  }`);
  config = config.replace('<?php', '<?php\ndefine("ATTAIE_MANUAL_SCHEMA", true);');
  fs.writeFileSync(path.join(publicDir, 'api/db.php'), config);
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(php, [...phpArgs, '-S', `127.0.0.1:${port}`, '-t', publicDir], {cwd:root, env, stdio:['ignore','ignore','pipe']});
  let logs = ''; server.stderr.on('data', chunk => { logs += chunk; });
  for (let i=0; i<50; i++) {
    try { await fetch(origin); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    if (i === 49) throw new Error(logs || 'PHP server did not start');
  }
  return {origin, dir, database, fixture, publicDir, race(payload) {
    return new Promise((resolve, reject) => {
      const child = spawn(php, [...phpArgs, 'tests/website/support/fixture.php', 'race'], {cwd:root, env:{...env, WEBSITE_TEST_PAYLOAD:JSON.stringify(payload)}});
      let output = '', errors = '';
      child.stdout.on('data', chunk => output += chunk);
      child.stderr.on('data', chunk => errors += chunk);
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(output + errors)));
    });
  }, async close() {
    const stopped = new Promise(resolve => server.once('exit', resolve));
    server.kill(); await stopped; fixture('drop'); fs.rmSync(dir, {recursive:true, force:true});
  }};
}
