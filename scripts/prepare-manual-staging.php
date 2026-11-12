<?php
declare(strict_types=1);
// Local packaging only: no database connections and no changes to API sources.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
$kit = isset($argv[1]) ? realpath($argv[1]) : false;
$destination = $root . '/releases/manual-staging-' . date('Ymd-His');
if (!$kit || !is_file($kit . '/setup/01-schema.sql') || !is_dir($kit . '/site')) {
    throw new RuntimeException('Usage: php scripts/prepare-manual-staging.php releases/staging-kit-TIMESTAMP');
}
if (file_exists($destination) || !mkdir($destination, 0700, true)) throw new RuntimeException('Use a new output directory.');
$dist = $destination . '/dist';
mkdir($dist, 0755);
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($kit . '/site', FilesystemIterator::SKIP_DOTS));
foreach ($files as $file) {
    $relative = substr($file->getPathname(), strlen($kit . '/site') + 1);
    $target = $dist . '/' . str_replace('\\', '/', $relative);
    if (!is_dir(dirname($target))) mkdir(dirname($target), 0755, true);
    if (!copy($file->getPathname(), $target)) throw new RuntimeException('File copy failed.');
}
$template = file_get_contents($kit . '/setup/db.template.php');
foreach ([
    "define('ADMIN_USER', 'admin');" => "define('ADMIN_USER', '');",
    "define('ADMIN_PASS', 'choose_a_strong_password');" => "define('ADMIN_PASS', '');",
] as $from => $to) {
    if (substr_count($template, $from) !== 1) throw new RuntimeException('Review changed config template.');
    $template = str_replace($from, $to, $template);
}
if (file_exists($dist . '/api/db.php')) throw new RuntimeException('Unexpected database config in source kit.');
file_put_contents($dist . '/api/db.php', $template);
mkdir($dist . '/uploads/chat_store', 0700, true);
file_put_contents($dist . '/uploads/chat_store/.htaccess', "Require all denied\n");

$password = bin2hex(random_bytes(16));
$hash = password_hash($password, PASSWORD_BCRYPT);
if (!password_verify($password, $hash)) throw new RuntimeException('Hash verification failed.');
$sql = "-- ONLY import into the NEW EMPTY website.attaieproperties.com TEST database.\n";
$sql .= "-- Never import into V1. Select the test database in phpMyAdmin first.\n\n";
$sql .= file_get_contents($kit . '/setup/01-schema.sql') . "\n";
$sql .= file_get_contents($kit . '/setup/02-five-projects.sql') . "\n";
$sql .= "-- First administrator; bcrypt hash generated with PHP password_hash().\n";
$sql .= "INSERT INTO admin_users (username, password_hash) VALUES ('owner', '" . $hash . "');\n";
file_put_contents($destination . '/database-test-only.sql', $sql);
file_put_contents($destination . '/ADMIN-LOGIN-PRIVATE.txt', "KEEP PRIVATE. DO NOT UPLOAD THIS FILE.\n\nURL: https://website.attaieproperties.com/admin\nUsername: owner\nPassword: " . $password . "\n\nThis password is stored only as a bcrypt hash in database-test-only.sql.\nSave the password in your password manager.\n");
chmod($destination . '/ADMIN-LOGIN-PRIVATE.txt', 0600);
file_put_contents($destination . '/README.txt', <<<'TEXT'
MANUAL TESTING DEPLOYMENT: website.attaieproperties.com

1. Create a separate subdomain document root and enable HTTPS.
2. Create a new EMPTY MySQL database and new database user in cPanel.
   Give that user privileges ONLY on this new test database.
3. Upload the CONTENTS of this dist folder into the subdomain document root.
   Include hidden files (.htaccess, .user.ini, nested .htaccess files).
   index.html and api/ must be directly inside the document root, not /dist/.
4. Edit api/db.php in the NEW TEST installation. Replace these placeholders:
   DB_HOST: localhost (unless your host specifies another value)
   DB_USER: your_cpanel_db_user
   DB_PASS: your_cpanel_db_password
   DB_NAME: your_cpanel_db_name
   Use ONLY the new testing database credentials. Keep ADMIN_USER and
   ADMIN_PASS blank: the account uses the bcrypt hash in admin_users.
5. Open phpMyAdmin, explicitly select the new EMPTY testing database,
   choose Import, and import database-test-only.sql once.
   Do NOT upload this SQL file into the document root.
6. Open ADMIN-LOGIN-PRIVATE.txt locally for your generated admin login.
   Do NOT upload that credentials file. Save the password in your manager.
7. Visit /admin and sign in. Check /api/get-projects.php returns an empty
   array. There should be 19 tables with no project or project-unit records.
   Add new projects and upload their artwork through the application.
   No live database has been contacted.

Use this NEW dist folder. The repository-root dist is an older build.
Do not upload README.txt, database-test-only.sql, ADMIN-LOGIN-PRIVATE.txt,
or the parent directory: upload ONLY this dist folder's CONTENTS.

AI endpoints and outbound click-to-call are blocked in this testing kit.
robots.txt and the Apache noindex header discourage search indexing.
Normal WhatsApp/telephone links still use the company's real numbers.
Google Maps depends on the browser key being authorized for the subdomain.
Existing APIs/PHP were copied unchanged; only NEW test db.php uses the
blank legacy admin constants. V1 source and production remain untouched.

Read-only phpMyAdmin checks (TEST database selected):
SHOW TABLES;
SELECT id, name FROM projects ORDER BY id;
SELECT project_id, COUNT(*) FROM project_units GROUP BY project_id;
SELECT username, LEFT(password_hash, 4) FROM admin_users;

Expected: project layout counts 6, 4, 6, 5, 4; hash prefix $2y$.
If import fails, do not reset V1. Inspect the error; retry only with a
fresh, empty testing database. This SQL is a new-install import, not a
migration or a safe repeat import into an existing database.
TEXT
);
echo 'Manual deployment folder: ' . $destination . PHP_EOL;
echo "Generated SQL and one bcrypt admin; password saved privately outside dist.\n";
