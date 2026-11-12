<?php
declare(strict_types=1);
// Local fictional database only. Never loads repository or hosting credentials.
if (PHP_SAPI !== 'cli' || getenv('STAFF_LOCAL_TEST') !== '1') throw new RuntimeException('Local test only.');
$release = realpath($argv[1] ?? '');
if (!$release || !is_file($release.'/manifest.json')) throw new RuntimeException('Prepared kit required.');
$db = new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$name = 'attaie_v2_kit_'.bin2hex(random_bytes(5));
$db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");
$db->exec("USE `$name`");
foreach (['01-new-v2-schema.sql','02-five-project-showcase.sql','03-website-admin.sql'] as $file) $db->exec(file_get_contents($release.'/database/'.$file));
$check = static function(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); };
$check(count($db->query('SHOW TABLES')->fetchAll())===39, 'Expected 39 tables.');
$check((int)$db->query('SELECT COUNT(*) FROM projects')->fetchColumn()===0, 'Expected an empty project catalog.');
$check((int)$db->query('SELECT COUNT(*) FROM project_units')->fetchColumn()===0, 'Expected no project layouts.');
$check((int)$db->query('SELECT COUNT(*) FROM core_users')->fetchColumn()===0, 'Unprovisioned staff accounts must be absent.');
$login = file_get_contents($release.'/private-setup/WEBSITE-ADMIN-LOGIN-PRIVATE.txt');
preg_match('/^Password: (.+)$/m', $login, $match);
$check(password_verify(trim($match[1] ?? ''), $db->query("SELECT password_hash FROM admin_users WHERE username='owner'")->fetchColumn()), 'Private admin password does not match imported hash.');
$sql = file_get_contents($release.'/database/04-staff-ceo.template.sql');
$sql = str_replace(['PASTE_EXACT_FIREBASE_USER_UID', 'ceo@example.com'], ['fixture-kit-ceo','kit-ceo@example.test'], $sql);
// The template may intentionally use blank values instead of example placeholders.
$sql = preg_replace("/SET @owner_firebase_uid = '[^']*';/", "SET @owner_firebase_uid = 'fixture-kit-ceo';", $sql);
$sql = preg_replace("/SET @owner_email = '[^']*';/", "SET @owner_email = 'kit-ceo@example.test';", $sql);
$db->exec($sql);
$check((int)$db->query("SELECT COUNT(*) FROM core_users WHERE firebase_uid='fixture-kit-ceo' AND role='ceo'")->fetchColumn()===1, 'CEO provisioning failed.');
$target = sys_get_temp_dir().'/'.$name;
$copy = function(string $from, string $to) use (&$copy): void {
    if (is_dir($from)) { mkdir($to,0700,true); foreach (new FilesystemIterator($from) as $entry) $copy($entry->getPathname(),$to.'/'.$entry->getFilename()); }
    else copy($from,$to);
};
$copy($release.'/dist',$target.'/webroot');
$copy($release.'/private',$target.'/private');
$config = file_get_contents($target.'/webroot/api/db.php');
foreach (['DB_HOST'=>'127.0.0.1:3397','DB_USER'=>'root','DB_PASS'=>'','DB_NAME'=>$name] as $key=>$value) $config = preg_replace("/define\('$key',\s*'[^']*'\);/", "define('$key', '$value');", $config);
file_put_contents($target.'/webroot/api/db.php',$config);
$config = require $target.'/private/config.php';
$config['dsn'] = "mysql:host=127.0.0.1;port=3397;dbname=$name;charset=utf8mb4";
$config['database_user']='root'; $config['database_password']='';
$config['session_directory']=$target.'/private/sessions';
$config['origin']='http://127.0.0.1:8893'; $config['allow_local_http']=true;
file_put_contents($target.'/private/config.php','<?php return '.var_export($config,true).';');
file_put_contents($target.'/webroot/staff-api/paths.php','<?php return '.var_export(['app_directory'=>$target.'/private/app','config_file'=>$target.'/private/config.php'],true).';');
// A local router maps Apache's staff rewrite only; Apache headers/denials still need host checks.
file_put_contents($target.'/router.php', '<?php if (str_starts_with(parse_url($_SERVER["REQUEST_URI"],PHP_URL_PATH),"/staff-api/v1/")) { require __DIR__."/webroot/staff-api/index.php"; return true; } return false;');
echo json_encode(['database'=>$name,'directory'=>$target,'checks'=>7]);
