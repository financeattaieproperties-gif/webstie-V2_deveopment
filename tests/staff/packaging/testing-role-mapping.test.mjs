import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {ACTIVE_INTERNAL_ROLES} from '../../../packages/staff-contracts/branch-policy.mjs';

const roleNames = Object.freeze({
  ceo: 'CEO', manager: 'Manager', callcenter: 'Call Center Agent', sales_leader: 'Sales Leader', sales: 'Sales Agent',
  marketing_manager: 'Marketing Manager', editor: 'Editor', videographer: 'Videographer', finance_manager: 'Finance Manager',
  architect: 'Architect', graphic_designer: 'Graphic Designer', visual_designer_3d: '3D Visual Designer',
});

function completeMap() {
  return {
    branch: {code: 'MAIN', name: 'Attaie Properties - Main Branch'},
    managerEmail: 'manager@example.test',
    salesLeaderEmail: 'sales-leader@example.test',
    users: ACTIVE_INTERNAL_ROLES.map((role) => ({
      role,
      name: roleNames[role],
      email: `${role.replaceAll('_', '-')}@example.test`,
      firebaseUid: `uid-${role}`,
      ...(role === 'ceo' ? {} : {branchCode: 'MAIN'}),
    })).map((user) => user.role === 'manager' ? {...user, email: 'manager@example.test'} : user.role === 'sales_leader' ? {...user, email: 'sales-leader@example.test'} : user),
  };
}

function runMapper(input) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'attaie-role-map-'));
  const inputPath = path.join(directory, 'input.json');
  const outputPath = path.join(directory, 'mapping.sql');
  fs.writeFileSync(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, ['scripts/create-testing-role-mapping.mjs', inputPath, outputPath], {encoding: 'utf8'});
  return {result, sql: fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '', directory};
}

test('writes fresh V2 SQL with CEO, MAIN branch, manager ownership, and sales leadership', () => {
  const {result, sql, directory} = runMapper(completeMap());
  try {
    assert.equal(result.status, 0, result.stderr);
    assert.match(sql, /START TRANSACTION;/);
    assert.match(sql, /'MAIN'\s*,\s*'Attaie Properties - Main Branch'/);
    assert.match(sql, /'ceo'\s*,\s*NULL\s*,\s*1/);
    assert.match(sql, /core_branch_managers/);
    assert.match(sql, /team_leader_id/);
    assert.match(sql, /COMMIT;/);
    for (const role of ACTIVE_INTERNAL_ROLES) assert.match(sql, new RegExp(`'${role}'`), role);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('rejects duplicate Firebase identities before writing SQL', () => {
  const input = completeMap();
  input.users[1].firebaseUid = input.users[0].firebaseUid;
  const {result, sql, directory} = runMapper(input);
  try {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /duplicate Firebase UID/i);
    assert.equal(sql, '');
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('rejects unsafe roles and branch assignments', () => {
  const input = completeMap();
  input.users[0].branchCode = 'MAIN';
  input.users[1].role = 'retired_manager';
  const {result, sql, directory} = runMapper(input);
  try {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /CEO.*branch|active role/i);
    assert.equal(sql, '');
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});

test('rejects a map without required manager and sales leader references', () => {
  const input = completeMap();
  input.managerEmail = 'missing@example.test';
  input.salesLeaderEmail = 'missing@example.test';
  const {result, sql, directory} = runMapper(input);
  try {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Manager|Sales Leader/);
    assert.equal(sql, '');
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
