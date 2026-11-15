import fs from 'node:fs';
import path from 'node:path';
import {ACTIVE_INTERNAL_ROLES} from '../packages/staff-contracts/branch-policy.mjs';

const [inputPath, outputPath] = process.argv.slice(2);

function fail(message) {
  throw new Error(message);
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function validate(input) {
  if (!input || typeof input !== 'object') fail('Role mapping input must be an object.');
  if (input.branch?.code !== 'MAIN' || !String(input.branch?.name || '').trim()) fail('Role mapping requires branch code MAIN and a branch name.');
  if (!Array.isArray(input.users)) fail('Role mapping requires a users array.');

  const roles = new Set();
  const emails = new Set();
  const uids = new Set();
  const users = input.users.map((user) => {
    if (!user || typeof user !== 'object') fail('Each mapped user must be an object.');
    const role = String(user.role || '');
    const email = String(user.email || '').trim();
    const firebaseUid = String(user.firebaseUid || '').trim();
    const name = String(user.name || '').trim();
    if (!ACTIVE_INTERNAL_ROLES.includes(role)) fail(`Select an active role: ${role || '(missing)'}.`);
    if (roles.has(role)) fail(`Duplicate role: ${role}.`);
    if (!email || !firebaseUid || !name) fail(`Mapped ${role} requires name, email, and Firebase UID.`);
    const emailKey = email.toLowerCase();
    if (emails.has(emailKey)) fail('Duplicate email in role mapping.');
    if (uids.has(firebaseUid)) fail('Duplicate Firebase UID in role mapping.');
    roles.add(role); emails.add(emailKey); uids.add(firebaseUid);
    const branchCode = user.branchCode === undefined ? null : String(user.branchCode);
    if (role === 'ceo') {
      if (branchCode !== null) fail('CEO cannot have a branch assignment.');
    } else if (branchCode !== 'MAIN') {
      fail(`${role} must be assigned to branch MAIN.`);
    }
    return {role, name, email, emailKey, firebaseUid};
  });

  for (const role of ACTIVE_INTERNAL_ROLES) if (!roles.has(role)) fail(`Missing active role: ${role}.`);
  if (users.length !== ACTIVE_INTERNAL_ROLES.length) fail('Role mapping may contain each active role only once.');

  const findByEmail = (email, label) => {
    const user = users.find((candidate) => candidate.emailKey === String(email || '').trim().toLowerCase());
    if (!user) fail(`${label} reference must match a mapped user.`);
    return user;
  };
  const manager = findByEmail(input.managerEmail, 'Manager');
  const salesLeader = findByEmail(input.salesLeaderEmail, 'Sales Leader');
  if (manager.role !== 'manager') fail('Manager reference must identify the Manager role.');
  if (salesLeader.role !== 'sales_leader') fail('Sales Leader reference must identify the Sales Leader role.');
  return {branch: {code: 'MAIN', name: String(input.branch.name).trim()}, users, manager, salesLeader};
}

function renderSql(map) {
  const orderedRoles = ['ceo', 'manager', 'callcenter', 'sales_leader', 'sales', 'marketing_manager', 'editor', 'videographer', 'finance_manager', 'architect', 'graphic_designer', 'visual_designer_3d'];
  const users = orderedRoles.map((role) => map.users.find((user) => user.role === role));
  const ceo = users[0];
  const nonCeo = users.slice(1);
  const lines = [
    '-- V2 INTERNAL CRM ONLY. Generated private testing role mapping.',
    '-- Import only after database/fresh/02-internal-crm.sql into the empty V2 Internal CRM database.',
    'START TRANSACTION;',
    `INSERT INTO core_users(firebase_uid,name,username,role,branch_id,active) VALUES (${sql(ceo.firebaseUid)},${sql(ceo.name)},${sql(ceo.email)},'ceo',NULL,1);`,
    'SET @ceo_id=(SELECT id FROM core_users WHERE firebase_uid=' + sql(ceo.firebaseUid) + ');',
    `INSERT INTO core_branches(code,name,active) VALUES (${sql(map.branch.code)},${sql(map.branch.name)},1);`,
    'SET @main_branch_id=(SELECT id FROM core_branches WHERE code=' + sql(map.branch.code) + ');',
  ];
  for (const user of nonCeo) lines.push(`INSERT INTO core_users(firebase_uid,name,username,role,branch_id,active) VALUES (${sql(user.firebaseUid)},${sql(user.name)},${sql(user.email)},${sql(user.role)},@main_branch_id,1);`);
  lines.push(
    'SET @manager_id=(SELECT id FROM core_users WHERE firebase_uid=' + sql(map.manager.firebaseUid) + ');',
    'SET @sales_leader_id=(SELECT id FROM core_users WHERE firebase_uid=' + sql(map.salesLeader.firebaseUid) + ');',
    "UPDATE core_users SET team_leader_id=@sales_leader_id WHERE role='sales' AND branch_id=@main_branch_id;",
    'INSERT INTO core_branch_managers(branch_id,manager_user_id,assigned_by) VALUES (@main_branch_id,@manager_id,@ceo_id);',
    'COMMIT;',
    '',
  );
  return lines.join('\n');
}

try {
  if (!inputPath || !outputPath) fail('Usage: node scripts/create-testing-role-mapping.mjs <inputPath> <outputPath>');
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const mapping = validate(input);
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, renderSql(mapping), 'utf8');
  process.stdout.write('Private V2 role mapping SQL written.\n');
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
