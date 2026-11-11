<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
$directory=$argv[1]??'';
if (!$directory || file_exists($directory)) throw new RuntimeException('Use a new private output folder.');
if (!mkdir($directory,0700,true)) throw new RuntimeException('Cannot create private setup folder.');
$password=bin2hex(random_bytes(18));
$hash=password_hash($password,PASSWORD_BCRYPT);
if (!password_verify($password,$hash)) throw new RuntimeException('Password verification failed.');
file_put_contents($directory.'/03-website-admin.sql',"-- NEW V2 TEST DATABASE ONLY. Website /admin account; separate from Firebase staff.\nINSERT INTO admin_users(username,password_hash) VALUES ('owner','$hash');\n");
file_put_contents($directory.'/WEBSITE-ADMIN-LOGIN-PRIVATE.txt',"KEEP PRIVATE. Never upload to a web root or send in chat.\nWebsite catalog admin: https://website.attaieproperties.com/admin/\nUsername: owner\nPassword: $password\nThis is not the Firebase CEO/staff login. Save in your password manager.\n");
chmod($directory.'/WEBSITE-ADMIN-LOGIN-PRIVATE.txt',0600);
echo "Website admin hash SQL and private login file prepared. Password was not printed.\n";
