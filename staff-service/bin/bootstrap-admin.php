<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options=getopt('', ['out:']);
$directory=$options['out'] ?? '';
if (!$directory || file_exists($directory)) throw new RuntimeException('Use --out NEW_PRIVATE_DIRECTORY. Keep output outside all webroots.');
if (!mkdir($directory,0700,true)) throw new RuntimeException('Cannot create private output.');
$sql=<<<'SQL'
-- V2 ONLY. Import after 001-core.sql and 010-callcenter.sql.
-- Create the CEO in Firebase first. Copy its exact UID and email into these values.
-- Empty values intentionally create NO account. No password belongs in MySQL.
SET @owner_firebase_uid = '';
SET @owner_email = '';
SET @owner_name = 'Admin (CEO)';
INSERT INTO core_users(firebase_uid,username,name,role)
SELECT @owner_firebase_uid,@owner_email,@owner_name,'ceo'
WHERE @owner_firebase_uid <> '' AND @owner_email <> '';
SQL;
file_put_contents($directory.'/020-owner.template.sql',$sql."\n");
file_put_contents($directory.'/FIREBASE-SETUP.txt',"Keep outside webroot.\nCreate the CEO in your V2 Firebase Authentication console (Email/Password).\nCopy its UID and email into 020-owner.template.sql, then import into V2 only.\nEnable Email/Password sign-in and authorize website.attaieproperties.com.\nSet matching Firebase project ID/Web API key in private PHP config, and VITE_STAFF_FIREBASE_API_KEY before building.\nNo default login or local password is generated.\nCEO: /management/; agents: /callcenter/.\n");
echo "Owner provisioning template and Firebase setup instructions prepared. No credentials generated.\n";
