import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

test('private archive contains generated database mapping and public archive excludes it', () => {
  const releases = path.resolve('releases');
  const release = fs.mkdtempSync(path.join(releases, 'manual-staging-archive-test-'));
  try {
    fs.mkdirSync(path.join(release, 'dist'), {recursive: true});
    fs.mkdirSync(path.join(release, 'private'), {recursive: true});
    fs.mkdirSync(path.join(release, 'database'), {recursive: true});
    fs.writeFileSync(path.join(release, 'dist', 'index.html'), '<!doctype html>');
    fs.writeFileSync(path.join(release, 'private', 'config.example.php'), '<?php');
    fs.writeFileSync(path.join(release, 'database', '04-firebase-role-mapping.sql'), '-- private mapping');
    const result = spawnSync('python', ['scripts/zip-v2-release.py', release], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const privateList = spawnSync('tar', ['-tf', path.join(release, 'UPLOAD-PRIVATE-OUTSIDE-WEBROOT.zip')], {encoding: 'utf8'});
    const publicList = spawnSync('tar', ['-tf', path.join(release, 'UPLOAD-WEBSITE-CONTENTS.zip')], {encoding: 'utf8'});
    assert.equal(privateList.status, 0, privateList.stderr);
    assert.equal(publicList.status, 0, publicList.stderr);
    assert.match(privateList.stdout, /attaie-v2-private\/database\/04-firebase-role-mapping\.sql/);
    assert.doesNotMatch(publicList.stdout, /firebase-role-mapping|\.sql/);
  } finally {
    fs.rmSync(release, {recursive: true, force: true});
  }
});
