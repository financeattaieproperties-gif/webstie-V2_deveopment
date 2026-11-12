<?php
declare(strict_types=1);

// CLI only. Never include the application's auto-migrating bootstrap here.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function stop(string $message): void {
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

function writeNewFile(string $file, string $contents, int $mode = 0600): void {
    $handle = fopen($file, 'x');
    if ($handle === false) throw new RuntimeException('Cannot create a new setup output file.');
    try {
        if (fwrite($handle, $contents) !== strlen($contents)) throw new RuntimeException('Incomplete setup file write.');
    } finally {
        fclose($handle);
    }
    chmod($file, $mode);
}

if (PHP_VERSION_ID < 80200 || !extension_loaded('mysqli')) stop('Use PHP 8.2+ CLI with mysqli/mysqlnd enabled.');
$options = getopt('', ['config:', 'confirm-database:']);
$configFile = $options['config'] ?? '';
if (!is_string($configFile) || !is_file($configFile)) stop('Usage: php install.php --config=/private/config.php --confirm-database=ACCOUNT_attaie_test');
$config = require $configFile;
if (!is_array($config)) stop('Configuration must return an array.');
foreach (['site_url', 'document_root', 'database_host', 'database_name', 'database_user', 'database_password', 'admin_username', 'ai_private_directory'] as $key) {
    if (!isset($config[$key]) || !is_string($config[$key]) || trim($config[$key]) === '' || str_contains($config[$key], 'CPANEL_USER') || str_contains($config[$key], 'REPLACE_WITH')) stop('Complete the private config field: ' . $key);
}
if ($config['site_url'] !== 'https://website.attaieproperties.com') stop('This kit is restricted to https://website.attaieproperties.com.');
if (!preg_match('/_(test|staging)\z/', $config['database_name'])) stop('Use a NEW database name ending in _test or _staging.');
if (($options['confirm-database'] ?? '') !== $config['database_name']) stop('The --confirm-database value must exactly match the new test database name.');
if (!preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9_.@-]{0,99}\z/', $config['admin_username'])) stop('Admin username must contain 1-100 ASCII letters, digits, underscores, periods, @ signs, or hyphens, starting with a letter or digit.');
$documentRoot = realpath($config['document_root']);
if (!$documentRoot || basename($documentRoot) !== 'website.attaieproperties.com') stop('Use a dedicated document root named website.attaieproperties.com.');
$setupRoot = realpath(__DIR__);
foreach ([realpath($configFile), $setupRoot] as $privatePath) {
    if ($privatePath === $documentRoot || str_starts_with((string) $privatePath, $documentRoot . DIRECTORY_SEPARATOR)) stop('Setup and config must be outside the website document root.');
}
if (!is_file($documentRoot . '/api/bootstrap.php') || !is_file($documentRoot . '/index.html') || !is_file($documentRoot . '/admin/index.html')) stop('Extract the site files into the empty staging document root first.');
if (file_exists($documentRoot . '/api/db.php')) stop('Refusing to overwrite an existing api/db.php. Use a fresh staging installation.');
$password = getenv('ATTAIE_SETUP_ADMIN_PASSWORD');
if (!is_string($password) || strlen($password) < 16 || strlen($password) > 72 || trim($password) !== $password) stop('Set ATTAIE_SETUP_ADMIN_PASSWORD to 16-72 bytes with no leading/trailing whitespace.');
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
if (!password_verify($password, $passwordHash)) stop('Password hash verification failed.');
unset($password);
$privateDir = rtrim($config['ai_private_directory'], '/');
if (!preg_match('#\A/[a-zA-Z0-9_./-]+\z#', $privateDir) || str_contains($privateDir, '..') || is_link($privateDir) || file_exists($privateDir)) stop('AI storage must be a new absolute directory with a simple path, outside web roots.');
$parent = realpath(dirname($privateDir));
if (!$parent || $parent === $documentRoot || str_starts_with($parent, $documentRoot . '/')) stop('AI storage must be outside the staging document root.');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$phase = 'database connection';
try {
    $connection = new mysqli($config['database_host'], $config['database_user'], $config['database_password'], $config['database_name']);
    $connection->set_charset('utf8mb4');
    if ($connection->query('SHOW TABLES')->num_rows !== 0) stop('Refusing installation: the target database is not empty. No tables were changed.');
    $catalog = json_decode((string) file_get_contents(__DIR__ . '/catalog.json'), true, 512, JSON_THROW_ON_ERROR);
    if (count($catalog['projects']) !== 0 || count($catalog['units']) !== 0) stop('Project seeds are disabled.');
    // Validate the template and every artifact before running any DDL.
    $template = file_get_contents(__DIR__ . '/db.template.php');
    if ($template === false) throw new RuntimeException('Missing database template.');
    $replacements = [
        "define('DB_HOST',    'localhost');" => "define('DB_HOST', " . var_export($config['database_host'], true) . ');',
        "define('DB_USER',    'your_cpanel_db_user');" => "define('DB_USER', " . var_export($config['database_user'], true) . ');',
        "define('DB_PASS',    'your_cpanel_db_password');" => "define('DB_PASS', " . var_export($config['database_password'], true) . ');',
        "define('DB_NAME',    'your_cpanel_db_name');" => "define('DB_NAME', " . var_export($config['database_name'], true) . ');',
        "define('ADMIN_USER', 'admin');" => "define('ADMIN_USER', '');",
        "define('ADMIN_PASS', 'choose_a_strong_password');" => "define('ADMIN_PASS', '');",
    ];
    foreach ($replacements as $from => $to) {
        if (substr_count($template, $from) !== 1) throw new RuntimeException('Database template changed; review the installer.');
        $template = str_replace($from, $to, $template);
    }
    $sqlFiles = [];
    foreach (['01-schema.sql', '02-five-projects.sql'] as $name) {
        $sqlFiles[] = file_get_contents(__DIR__ . '/' . $name);
        if (end($sqlFiles) === false) throw new RuntimeException('Missing SQL file.');
    }
    if (!mkdir($privateDir, 0700)) throw new RuntimeException('Cannot create isolated AI storage.');
    $htaccess = file_get_contents($documentRoot . '/.htaccess');
    if ($htaccess === false || !is_writable($documentRoot . '/.htaccess')) throw new RuntimeException('Staging .htaccess must be writable.');
    foreach ($sqlFiles as $index => $sql) {
        $phase = $index === 0 ? 'schema import' : 'project seed import';
        $connection->multi_query($sql);
        do {
            $result = $connection->store_result();
            if ($result instanceof mysqli_result) $result->free();
            if (!$connection->more_results()) break;
            $connection->next_result();
        } while (true);
    }
    $phase = 'admin creation and database verification';
    $statement = $connection->prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)');
    $statement->bind_param('ss', $config['admin_username'], $passwordHash);
    $statement->execute();
    $row = $connection->query('SELECT password_hash FROM admin_users LIMIT 1')->fetch_assoc();
    if (!hash_equals($passwordHash, $row['password_hash'])) throw new RuntimeException('Stored password hash mismatch.');
    if ((int) $connection->query('SELECT COUNT(*) AS n FROM projects')->fetch_assoc()['n'] !== 0 || (int) $connection->query('SELECT COUNT(*) AS n FROM project_units')->fetch_assoc()['n'] !== 0) throw new RuntimeException('Expected empty project tables.');
    $tableCount = $connection->query('SHOW TABLES')->num_rows;
    if ($tableCount !== 19) throw new RuntimeException('Expected 19 tables.');
    // This new config disables the legacy plaintext admin constant login.
    $phase = 'staging configuration and private storage';
    writeNewFile($documentRoot . '/api/db.php', $template);
    $environmentRules = "\n# Keep test AI settings separate from every other deployment\nSetEnv ATTAIE_AI_PRIVATE_DIR \"" . $privateDir . "\"\n";
    if (file_put_contents($documentRoot . '/.htaccess', $htaccess . $environmentRules) === false) throw new RuntimeException('Cannot set isolated AI storage.');
    // Keep file-based chat data private in this new installation.
    if (!is_dir($documentRoot . '/uploads/chat_store') && !mkdir($documentRoot . '/uploads/chat_store', 0700, true)) throw new RuntimeException('Cannot create private test chat storage.');
    writeNewFile($documentRoot . '/uploads/chat_store/.htaccess', "Require all denied\n");
    $connection->close();
    echo "Created 19 tables, an empty project catalog, and one bcrypt admin.\n";
    echo "Admin: https://website.attaieproperties.com/admin\n";
    echo "Username: " . $config['admin_username'] . "\nPassword: the value you entered; never stored as plaintext.\n";
    echo "Outbound calls and AI endpoints remain blocked in this testing kit.\n";
} catch (Throwable $error) {
    // Do not print database exceptions: they may contain account information.
    fwrite(STDERR, 'Failed phase: ' . $phase . ' (error code ' . (int) $error->getCode() . ").\n");
    fwrite(STDERR, "Setup failed. A fresh test database may now contain partial tables. Do not rerun against V1.\n");
    fwrite(STDERR, "Check PHP/MySQL compatibility and file permissions. Recreate only the dedicated test database for a clean retry.\n");
    exit(1);
}
