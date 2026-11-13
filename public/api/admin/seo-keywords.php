<?php
require_once __DIR__ . '/../bootstrap.php';
cors();
require_admin();

$mysqli = db();

// Ensure table exists on non-manual-schema environments
if (!defined('ATTAIE_MANUAL_SCHEMA') || ATTAIE_MANUAL_SCHEMA !== true) {
    @$mysqli->query("
        CREATE TABLE IF NOT EXISTS seo_keywords (
          id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          keyword    VARCHAR(180) NOT NULL,
          enabled    TINYINT(1)   NOT NULL DEFAULT 1,
          created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_seo_keyword (keyword),
          INDEX idx_seo_keywords_enabled (enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

const DEFAULT_GLOBAL_KEYWORDS = [
    'Attaie Properties',
    'Kabul real estate',
    'properties for sale in Kabul',
    'properties for rent in Kabul',
    'luxury villas Kabul',
    'apartments in Kabul',
    'Afghanistan property agency',
];

function seed_seo_keywords_if_empty(mysqli $mysqli): void {
    $res = $mysqli->query('SELECT COUNT(*) AS cnt FROM seo_keywords');
    $row = $res ? $res->fetch_assoc() : null;
    if ($row && (int) $row['cnt'] > 0) {
        return;
    }

    // Check seo_settings.keywords first to migrate any existing configuration
    $initial = DEFAULT_GLOBAL_KEYWORDS;
    $settingsRes = @$mysqli->query('SELECT keywords FROM seo_settings WHERE id = 1 LIMIT 1');
    if ($settingsRes && ($settingsRow = $settingsRes->fetch_assoc())) {
        if ($settingsRow['keywords'] !== null) {
            $raw = trim((string) $settingsRow['keywords']);
            if ($raw === '') {
                $initial = [];
            } else {
                $parts = array_values(array_filter(array_map('trim', explode(',', $raw)), fn($k) => $k !== ''));
                if (count($parts) > 0) {
                    $initial = $parts;
                }
            }
        }
    }

    if (count($initial) === 0) {
        return;
    }

    $stmt = $mysqli->prepare('INSERT IGNORE INTO seo_keywords (keyword, enabled) VALUES (?, 1)');
    if (!$stmt) return;
    foreach ($initial as $kw) {
        $stmt->bind_param('s', $kw);
        $stmt->execute();
    }
}

function fetch_all_seo_keywords(mysqli $mysqli): array {
    $res = $mysqli->query('SELECT id, keyword, enabled, created_at, updated_at FROM seo_keywords ORDER BY id ASC');
    $items = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $items[] = [
                'id'         => (int) $row['id'],
                'keyword'    => (string) $row['keyword'],
                'enabled'    => (bool) $row['enabled'],
                'created_at' => $row['created_at'] ?? null,
                'updated_at' => $row['updated_at'] ?? null,
            ];
        }
    }
    return $items;
}

function sync_seo_settings_keywords(mysqli $mysqli): string {
    $items = fetch_all_seo_keywords($mysqli);
    $active = [];
    foreach ($items as $item) {
        if ($item['enabled']) {
            $active[] = $item['keyword'];
        }
    }
    $serialized = implode(', ', $active);

    $existsRes = @$mysqli->query('SELECT id FROM seo_settings WHERE id = 1 LIMIT 1');
    if ($existsRes && $existsRes->fetch_assoc()) {
        $stmt = $mysqli->prepare('UPDATE seo_settings SET keywords = ? WHERE id = 1');
        if ($stmt) {
            $stmt->bind_param('s', $serialized);
            $stmt->execute();
        }
    } else {
        $siteName = 'Attaie Properties';
        $title = 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan';
        $tpl = '%s | Attaie Properties';
        $desc = 'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.';
        $stmt = $mysqli->prepare(
            'INSERT INTO seo_settings (id, site_name, default_title, title_template, default_description, keywords) VALUES (1, ?, ?, ?, ?, ?)'
        );
        if ($stmt) {
            $stmt->bind_param('sssss', $siteName, $title, $tpl, $desc, $serialized);
            $stmt->execute();
        }
    }

    return $serialized;
}

seed_seo_keywords_if_empty($mysqli);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $items = fetch_all_seo_keywords($mysqli);
    $active = array_values(array_map(fn($i) => $i['keyword'], array_filter($items, fn($i) => $i['enabled'])));
    json_out([
        'keywords'        => $items,
        'active_keywords' => implode(', ', $active),
    ]);
}

if ($method === 'POST') {
    $b = body();
    $action = trim((string) ($b['action'] ?? 'add'));

    if ($action === 'restore_defaults') {
        $mysqli->query('DELETE FROM seo_keywords');
        $stmt = $mysqli->prepare('INSERT IGNORE INTO seo_keywords (keyword, enabled) VALUES (?, 1)');
        foreach (DEFAULT_GLOBAL_KEYWORDS as $kw) {
            $stmt->bind_param('s', $kw);
            $stmt->execute();
        }
        $activeStr = sync_seo_settings_keywords($mysqli);
        json_out([
            'success'         => true,
            'keywords'        => fetch_all_seo_keywords($mysqli),
            'active_keywords' => $activeStr,
        ]);
    }

    $rawKeyword = trim((string) ($b['keyword'] ?? ''));
    if ($rawKeyword === '') {
        json_out(['error' => 'Keyword is required'], 400);
    }

    $enabled = !array_key_exists('enabled', $b) || !empty($b['enabled']) ? 1 : 0;
    $parts = preg_split('/[,\n]+/', $rawKeyword) ?: [];
    $stmt = $mysqli->prepare('INSERT IGNORE INTO seo_keywords (keyword, enabled) VALUES (?, ?)');
    $addedCount = 0;

    foreach ($parts as $part) {
        $clean = trim(preg_replace('/\s+/', ' ', $part));
        if ($clean === '') continue;
        $stmt->bind_param('si', $clean, $enabled);
        $stmt->execute();
        if ($stmt->affected_rows > 0) {
            $addedCount++;
        }
    }

    $activeStr = sync_seo_settings_keywords($mysqli);
    json_out([
        'success'         => true,
        'added'           => $addedCount,
        'keywords'        => fetch_all_seo_keywords($mysqli),
        'active_keywords' => $activeStr,
    ], 201);
}

if ($method === 'PUT' || $method === 'PATCH') {
    $b = body();
    $action = trim((string) ($b['action'] ?? 'toggle'));

    if ($action === 'set_all' && array_key_exists('enabled', $b)) {
        $enabledInt = !empty($b['enabled']) ? 1 : 0;
        $stmt = $mysqli->prepare('UPDATE seo_keywords SET enabled = ?');
        $stmt->bind_param('i', $enabledInt);
        $stmt->execute();
        $activeStr = sync_seo_settings_keywords($mysqli);
        json_out([
            'success'         => true,
            'keywords'        => fetch_all_seo_keywords($mysqli),
            'active_keywords' => $activeStr,
        ]);
    }

    $id = isset($b['id']) ? (int) $b['id'] : 0;
    $keyword = trim((string) ($b['keyword'] ?? ''));
    if (!array_key_exists('enabled', $b)) {
        json_out(['error' => 'The enabled boolean field is required'], 400);
    }
    $enabledInt = !empty($b['enabled']) ? 1 : 0;

    if ($id > 0) {
        $stmt = $mysqli->prepare('UPDATE seo_keywords SET enabled = ? WHERE id = ?');
        $stmt->bind_param('ii', $enabledInt, $id);
        $stmt->execute();
    } elseif ($keyword !== '') {
        $stmt = $mysqli->prepare('UPDATE seo_keywords SET enabled = ? WHERE LOWER(keyword) = LOWER(?)');
        $stmt->bind_param('is', $enabledInt, $keyword);
        $stmt->execute();
    } else {
        json_out(['error' => 'Either id or keyword is required'], 400);
    }

    $activeStr = sync_seo_settings_keywords($mysqli);
    json_out([
        'success'         => true,
        'keywords'        => fetch_all_seo_keywords($mysqli),
        'active_keywords' => $activeStr,
    ]);
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        json_out(['error' => 'Valid keyword id is required'], 400);
    }

    $stmt = $mysqli->prepare('DELETE FROM seo_keywords WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();

    $activeStr = sync_seo_settings_keywords($mysqli);
    json_out([
        'success'         => true,
        'keywords'        => fetch_all_seo_keywords($mysqli),
        'active_keywords' => $activeStr,
    ]);
}

json_out(['error' => 'Method not allowed'], 405);
