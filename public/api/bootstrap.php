<?php
/**
 * Production Bootstrap & Auto-Migration Helper for Attaie Properties
 *
 * Ensures full compatibility with existing cPanel `api/db.php` files and
 * automatically upgrades the current MySQL database schema (tables & columns)
 * on first run without requiring manual phpMyAdmin SQL imports or losing data.
 */

mysqli_report(MYSQLI_REPORT_OFF);

if (is_file(__DIR__ . '/db.php')) {
    require_once __DIR__ . '/db.php';
}

mysqli_report(MYSQLI_REPORT_OFF);

if (!function_exists('ctc_env')) {
    function ctc_env(string $key, string $default = ''): string {
        $envVal = getenv($key);
        if ($envVal !== false && trim((string) $envVal) !== '') {
            return trim((string) $envVal);
        }
        if (!empty($_ENV[$key])) {
            return trim((string) $_ENV[$key]);
        }
        if (!empty($_SERVER[$key])) {
            return trim((string) $_SERVER[$key]);
        }
        if (defined($key) && trim((string) constant($key)) !== '') {
            return trim((string) constant($key));
        }
        return $default;
    }
}

if (!function_exists('init_secure_session')) {
    function init_secure_session(): void {
        if (session_status() === PHP_SESSION_NONE) {
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'secure'   => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            @session_start();
        }
    }
}

if (!function_exists('csrf_token')) {
    function csrf_token(): string {
        init_secure_session();
        if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}

if (!function_exists('verify_csrf_token')) {
    function verify_csrf_token(): void {
        $expected = csrf_token();
        $provided = trim((string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
        if ($provided === '' || !hash_equals($expected, $provided)) {
            json_out(['error' => 'Invalid or missing CSRF token'], 403);
        }
    }
}

/**
 * Ensures CORS headers support www.attaieproperties.com and X-CSRF-Token
 * even when running alongside an older `api/db.php` on the server.
 */
function attaie_augment_cors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (
        $origin !== '' &&
        preg_match('#^https?://([a-z0-9-]+\.)*attaieproperties\.(com|af)$#i', $origin)
    ) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
}

attaie_augment_cors();

/**
 * Idempotently ensures all required tables and columns exist in the current database.
 * Runs once per deployment (cached via a local marker file).
 */
function attaie_ensure_schema(): void {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    if (!function_exists('db')) {
        return;
    }

    $markerFile = __DIR__ . '/.schema_v2026_11_com.migrated';
    $tempMarker = rtrim(sys_get_temp_dir(), '/\\') . '/attaie_schema_v2026_11_com_' . md5(__DIR__) . '.migrated';
    if (@is_file($markerFile) || @is_file($tempMarker)) {
        return;
    }

    $conn = @db();
    if (!$conn || $conn->connect_error) {
        return;
    }

    mysqli_report(MYSQLI_REPORT_OFF);

    $tableStatements = [
        "CREATE TABLE IF NOT EXISTS admin_users (
          id            INT AUTO_INCREMENT PRIMARY KEY,
          username      VARCHAR(100) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_admin_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS properties (
          id               INT AUTO_INCREMENT PRIMARY KEY,
          serial_number    VARCHAR(50)    NOT NULL DEFAULT '',
          title            VARCHAR(255)   NOT NULL,
          price            DECIMAL(12,2)  NOT NULL,
          location         VARCHAR(255)   NOT NULL,
          beds             TINYINT        DEFAULT NULL,
          baths            TINYINT        DEFAULT NULL,
          area             DECIMAL(8,2)   DEFAULT NULL,
          floor            TINYINT        DEFAULT NULL,
          status           ENUM('available','pending','sold','rented') NOT NULL DEFAULT 'available',
          type             ENUM('Villa','Apartment','House','Commercial','Land') NOT NULL,
          listing_type     ENUM('sale','rent') NOT NULL,
          image_url        VARCHAR(500)   DEFAULT NULL,
          description      TEXT           DEFAULT NULL,
          gallery_images   TEXT           DEFAULT NULL,
          video_url        VARCHAR(1000)  DEFAULT NULL,
          floor_plan_url   VARCHAR(500)   DEFAULT NULL,
          three_d_plan_url VARCHAR(500)   DEFAULT NULL,
          created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
          updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS projects (
          id               INT AUTO_INCREMENT PRIMARY KEY,
          name             VARCHAR(255) NOT NULL,
          location         VARCHAR(255) NOT NULL,
          delivery_date    VARCHAR(50)  DEFAULT NULL,
          status           ENUM('Coming Soon','In Progress','Sold Out','Under Construction','Ready') NOT NULL DEFAULT 'Coming Soon',
          available_units  INT          DEFAULT 0,
          total_units      INT          DEFAULT 0,
          image_url        VARCHAR(500) DEFAULT NULL,
          gallery_images   TEXT         DEFAULT NULL,
          video_url        VARCHAR(1000) DEFAULT NULL,
          masterplan_image VARCHAR(500) DEFAULT NULL,
          description      TEXT         DEFAULT NULL,
          created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS agents (
          id           INT AUTO_INCREMENT PRIMARY KEY,
          name         VARCHAR(255) NOT NULL,
          role         VARCHAR(160) NOT NULL,
          background   TEXT NOT NULL,
          portrait_url VARCHAR(500) NOT NULL,
          phone        VARCHAR(50) NOT NULL,
          email        VARCHAR(255) NOT NULL,
          whatsapp     VARCHAR(50) DEFAULT NULL,
          published    TINYINT(1) NOT NULL DEFAULT 0,
          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_agents_published_name (published, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS branches (
          id         INT AUTO_INCREMENT PRIMARY KEY,
          name       VARCHAR(255) NOT NULL,
          address    VARCHAR(500) NOT NULL,
          phone      VARCHAR(50) DEFAULT NULL,
          email      VARCHAR(255) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_branches_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS leads (
          id            INT AUTO_INCREMENT PRIMARY KEY,
          name          VARCHAR(255) NOT NULL,
          email         VARCHAR(255) NOT NULL,
          phone         VARCHAR(50)  NOT NULL,
          message       TEXT         DEFAULT NULL,
          property_id   VARCHAR(50)  DEFAULT NULL,
          property_name VARCHAR(255) DEFAULT NULL,
          stage         VARCHAR(50)  DEFAULT 'New',
          source        VARCHAR(50)  DEFAULT 'Website',
          status        VARCHAR(50)  DEFAULT 'Pending',
          created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS project_units (
          id           INT AUTO_INCREMENT PRIMARY KEY,
          project_id   INT NOT NULL,
          unit_number  VARCHAR(80) NOT NULL,
          title        VARCHAR(255) DEFAULT NULL,
          beds         TINYINT DEFAULT NULL,
          baths        TINYINT DEFAULT NULL,
          area         DECIMAL(8,2) DEFAULT NULL,
          floor        TINYINT DEFAULT NULL,
          price        DECIMAL(12,2) DEFAULT NULL,
          currency     CHAR(3) NOT NULL DEFAULT 'USD',
          status       ENUM('available','reserved','sold','rented') NOT NULL DEFAULT 'available',
          image_url    VARCHAR(500) DEFAULT NULL,
          description  TEXT DEFAULT NULL,
          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_project_unit (project_id, unit_number),
          INDEX idx_project_units_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS visit_requests (
          id               INT AUTO_INCREMENT PRIMARY KEY,
          name             VARCHAR(255) NOT NULL,
          phone            VARCHAR(20) NOT NULL,
          ip_address       VARCHAR(45) DEFAULT NULL,
          property_id      INT DEFAULT NULL,
          project_id       INT DEFAULT NULL,
          project_unit_id  INT DEFAULT NULL,
          listing_name     VARCHAR(255) NOT NULL,
          requested_at     DATETIME NOT NULL,
          status           ENUM('pending','confirmed','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
          staff_note       TEXT DEFAULT NULL,
          source           VARCHAR(50) NOT NULL DEFAULT 'Website',
          created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_visit_requested_at (requested_at),
          INDEX idx_visit_status (status),
          INDEX idx_visit_property (property_id),
          INDEX idx_visit_project (project_id),
          INDEX idx_visit_unit (project_unit_id),
          INDEX idx_visit_ip_time (ip_address, created_at),
          INDEX idx_visit_phone_time (phone, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS visit_request_events (
          id               INT AUTO_INCREMENT PRIMARY KEY,
          visit_request_id INT NOT NULL,
          previous_status  VARCHAR(30) DEFAULT NULL,
          next_status      VARCHAR(30) NOT NULL,
          actor            VARCHAR(100) NOT NULL DEFAULT 'system',
          note             TEXT DEFAULT NULL,
          created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_visit_event_request (visit_request_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS visit_rate_limit_log (
          id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          ip_address VARCHAR(45) NOT NULL,
          phone_hash CHAR(64) NOT NULL,
          outcome    ENUM('allowed','blocked_ip','blocked_phone') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_visit_rl_ip_time (ip_address, created_at),
          INDEX idx_visit_rl_phone_time (phone_hash, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS ctc_auth_cache (
          id         TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
          id_token   TEXT         NOT NULL,
          expires_at DATETIME     NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS ctc_public_call_log (
          id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          customer_number      VARCHAR(20)  NOT NULL,
          ip_address           VARCHAR(45)  NOT NULL,
          reference_id         INT UNSIGNED NOT NULL,
          etisalat_request_id  VARCHAR(50)  NULL,
          status               ENUM('initiated','failed','blocked') DEFAULT 'initiated',
          response_payload     TEXT         NULL,
          created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ctc_ip_time (ip_address, created_at),
          INDEX idx_ctc_number_time (customer_number, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS seo_settings (
          id                  TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
          site_name           VARCHAR(120)  NOT NULL DEFAULT 'Attaie Properties',
          default_title       VARCHAR(255)  NOT NULL DEFAULT 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
          title_template      VARCHAR(160)  NOT NULL DEFAULT '%s | Attaie Properties',
          default_description TEXT          NOT NULL,
          keywords            TEXT          DEFAULT NULL,
          og_image            VARCHAR(500)  DEFAULT '/logo.png',
          twitter_image       VARCHAR(500)  DEFAULT NULL,
          twitter_card        ENUM('summary_large_image','summary') NOT NULL DEFAULT 'summary_large_image',
          twitter_site        VARCHAR(100)  DEFAULT NULL,
          canonical_base_url  VARCHAR(255)  DEFAULT 'https://www.attaieproperties.com',
          robots_index        TINYINT(1)    NOT NULL DEFAULT 1,
          updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS career_jobs (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          title           VARCHAR(255) NOT NULL,
          location        VARCHAR(255) NOT NULL DEFAULT 'Kabul, Afghanistan',
          employment_type VARCHAR(100) NOT NULL DEFAULT 'Full-Time',
          description     TEXT         NOT NULL,
          qualifications  TEXT         NOT NULL,
          deadline_at     DATETIME     NOT NULL,
          status          ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
          created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_careers_status_deadline (status, deadline_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

        "CREATE TABLE IF NOT EXISTS career_applications (
          id                  INT AUTO_INCREMENT PRIMARY KEY,
          job_id              INT          NOT NULL,
          name                VARCHAR(255) NOT NULL,
          father_name         VARCHAR(255) NOT NULL,
          email               VARCHAR(255) NOT NULL,
          phone               VARCHAR(50)  NOT NULL,
          address             VARCHAR(500) NOT NULL,
          photo_path          VARCHAR(500) NOT NULL,
          photo_original_name VARCHAR(255) NOT NULL,
          photo_mime_type     VARCHAR(100) NOT NULL,
          photo_size          INT UNSIGNED NOT NULL,
          cv_path             VARCHAR(500) NOT NULL,
          cv_original_name    VARCHAR(255) NOT NULL,
          cv_mime_type        VARCHAR(100) NOT NULL,
          cv_size             INT UNSIGNED NOT NULL,
          ip_address          VARCHAR(45)  DEFAULT NULL,
          created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_career_apps_job_created (job_id, created_at),
          INDEX idx_career_apps_ip_created (ip_address, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];

    foreach ($tableStatements as $sql) {
        @$conn->query($sql);
    }

    // Safely add any columns that may be missing in an older database schema
    // (Executed individually so standard MySQL 5.7/8.0 and MariaDB both succeed)
    $alterStatements = [
        "ALTER TABLE properties ADD COLUMN serial_number VARCHAR(50) DEFAULT NULL AFTER id",
        "ALTER TABLE properties ADD COLUMN floor TINYINT DEFAULT NULL AFTER area",
        "ALTER TABLE properties ADD COLUMN gallery_images TEXT DEFAULT NULL",
        "ALTER TABLE properties ADD COLUMN video_url VARCHAR(1000) DEFAULT NULL",
        "ALTER TABLE properties ADD COLUMN floor_plan_url VARCHAR(500) DEFAULT NULL",
        "ALTER TABLE properties ADD COLUMN three_d_plan_url VARCHAR(500) DEFAULT NULL",
        "ALTER TABLE properties ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        "UPDATE properties SET serial_number = CONCAT('AP-', LPAD(id, 4, '0')) WHERE serial_number IS NULL OR serial_number = ''",
        "ALTER TABLE projects ADD COLUMN gallery_images TEXT DEFAULT NULL",
        "ALTER TABLE projects ADD COLUMN video_url VARCHAR(1000) DEFAULT NULL",
        "ALTER TABLE projects ADD COLUMN masterplan_image VARCHAR(500) DEFAULT NULL",
        "ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        "ALTER TABLE projects MODIFY COLUMN status ENUM('Coming Soon','In Progress','Sold Out','Under Construction','Ready') NOT NULL DEFAULT 'Coming Soon'",
        "ALTER TABLE visit_requests ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL AFTER phone",
        "UPDATE seo_settings SET canonical_base_url = 'https://www.attaieproperties.com' WHERE canonical_base_url IN ('https://attaieproperties.af', 'https://website.attaieproperties.com')",
    ];

    foreach ($alterStatements as $sql) {
        @$conn->query($sql);
    }

    @file_put_contents($markerFile, gmdate('c'));
    @file_put_contents($tempMarker, gmdate('c'));
}

// Fresh V2 manual installs import all SQL through phpMyAdmin; requests must not migrate them.
if (!defined('ATTAIE_MANUAL_SCHEMA') || ATTAIE_MANUAL_SCHEMA !== true) {
    attaie_ensure_schema();
}
