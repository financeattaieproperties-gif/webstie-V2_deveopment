<?php
declare(strict_types=1);

namespace Attaie\AiChat;

/**
 * Narrowly-scoped, read-only MySQL property & project lookup tools.
 *
 * Security invariants:
 * - Fixed allowlist of tool names (`search_properties`, `get_property_details`, `get_project_details`, `check_property_availability`).
 * - Strict server-side argument validation.
 * - Parameterized SQL queries only (`mysqli::prepare` + `bind_param`).
 * - Enforces `SET SESSION TRANSACTION READ ONLY` on the database connection.
 * - Sanitizes untrusted database descriptions against HTML/XSS and prompt injection.
 */
final class PropertyTools
{
    public const ALLOWED_TOOLS = [
        'search_properties',
        'get_property_details',
        'get_project_details',
        'check_property_availability',
    ];

    public const ALLOWED_TYPES = ['Villa', 'Apartment', 'House', 'Commercial', 'Land'];
    public const ALLOWED_LISTING_TYPES = ['sale', 'rent'];

    private static ?\mysqli $conn = null;

    /**
     * Opens a strictly read-only MySQL connection.
     * Supports dedicated read-only DB credentials via environment variables (`AI_READONLY_DB_USER`),
     * falling back to `public/api/db.php` constants with `SET SESSION TRANSACTION READ ONLY`.
     */
    public static function getReadOnlyDb(): ?\mysqli
    {
        if (self::$conn !== null) {
            return self::$conn;
        }

        $dbFile = dirname(__DIR__, 2) . '/api/db.php';
        if (@is_file($dbFile) && !defined('DB_HOST')) {
            @include_once $dbFile;
        }

        $host = getenv('AI_READONLY_DB_HOST') ?: (defined('DB_HOST') ? (string) constant('DB_HOST') : '');
        $user = getenv('AI_READONLY_DB_USER') ?: (defined('DB_USER') ? (string) constant('DB_USER') : '');
        $pass = getenv('AI_READONLY_DB_PASS') ?: (defined('DB_PASS') ? (string) constant('DB_PASS') : '');
        $name = getenv('AI_READONLY_DB_NAME') ?: (defined('DB_NAME') ? (string) constant('DB_NAME') : '');

        if ($host === '' || $user === '' || $name === '' || $user === 'your_cpanel_db_user') {
            return null;
        }

        mysqli_report(MYSQLI_REPORT_OFF);
        $mysqli = mysqli_init();
        if (!$mysqli) {
            return null;
        }
        $mysqli->options(MYSQLI_OPT_CONNECT_TIMEOUT, 4);
        if (defined('MYSQLI_OPT_READ_TIMEOUT')) {
            $mysqli->options(MYSQLI_OPT_READ_TIMEOUT, 5);
        }

        $ok = @$mysqli->real_connect($host, $user, $pass, $name);
        if (!$ok || $mysqli->connect_errno) {
            Security::logDiagnostic('db_connect_failed', ['errno' => $mysqli->connect_errno]);
            return null;
        }

        $mysqli->set_charset('utf8mb4');
        // Enforce read-only transaction session & query execution timeout
        @$mysqli->query('SET SESSION TRANSACTION READ ONLY');
        @$mysqli->query('SET SESSION max_execution_time = 3000');

        self::$conn = $mysqli;
        return self::$conn;
    }

    /**
     * Sanitizes untrusted text from database descriptions or customer inputs to prevent
     * HTML injection and indirect prompt injection.
     */
    public static function sanitizeUntrustedText(?string $text, int $maxLength = 420): string
    {
        if ($text === null || $text === '') {
            return '';
        }
        $clean = strip_tags($text);
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // Neutralize prompt-injection directives embedded inside listing descriptions
        $injectionPatterns = [
            '/ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i',
            '/disregard\s+(all\s+)?(previous|prior|system)\s+instructions/i',
            '/system\s*prompt\s*:/i',
            '/you\s+are\s+now\s+/i',
            '/reveal\s+(your\s+)?(api\s+key|secret|password|instructions)/i',
            '/javascript\s*:/i',
            '/data\s*:\s*text\/html/i',
        ];
        $clean = (string) preg_replace($injectionPatterns, '[redacted]', $clean);
        $clean = (string) preg_replace('/\s+/u', ' ', trim($clean));
        if (mb_strlen($clean, 'UTF-8') > $maxLength) {
            $clean = mb_substr($clean, 0, $maxLength, 'UTF-8') . '…';
        }
        return $clean;
    }

    /**
     * Validates and sanitizes a relative internal listing link.
     */
    public static function buildSafePropertyLink(int $id): string
    {
        return '/properties/' . max(1, $id);
    }

    public static function buildSafeProjectLink(int $id): string
    {
        return '/projects/' . max(1, $id);
    }

    /**
     * Formats a database property row into a verified, safe public listing card & tool record.
     */
    public static function formatPropertyRecord(array $row): array
    {
        $id = (int) ($row['id'] ?? 0);
        $imageUrl = isset($row['image_url']) && is_string($row['image_url']) ? trim($row['image_url']) : null;
        if ($imageUrl !== null && $imageUrl !== '' && !preg_match('#^(https?://|/)#i', $imageUrl)) {
            $imageUrl = '/' . ltrim($imageUrl, '/');
        }

        return [
            'id'            => $id,
            'serial_number' => (string) ($row['serial_number'] ?? ('ATP-' . $id)),
            'title'         => self::sanitizeUntrustedText((string) ($row['title'] ?? ''), 160),
            'price'         => (float) ($row['price'] ?? 0),
            'currency'      => 'USD',
            'location'      => self::sanitizeUntrustedText((string) ($row['location'] ?? ''), 140),
            'beds'          => isset($row['beds']) && $row['beds'] !== null ? (int) $row['beds'] : null,
            'baths'         => isset($row['baths']) && $row['baths'] !== null ? (int) $row['baths'] : null,
            'area'          => isset($row['area']) && $row['area'] !== null ? (float) $row['area'] : null,
            'area_unit'     => 'm²',
            'floor'         => isset($row['floor']) && $row['floor'] !== null ? (int) $row['floor'] : null,
            'status'        => (string) ($row['status'] ?? 'available'),
            'type'          => (string) ($row['type'] ?? 'Apartment'),
            'listing_type'  => (string) ($row['listing_type'] ?? 'sale'),
            'image_url'     => $imageUrl,
            'description'   => self::sanitizeUntrustedText((string) ($row['description'] ?? ''), 380),
            'url'           => self::buildSafePropertyLink($id),
        ];
    }

    /**
     * Executes an allowlisted tool with strict argument validation.
     */
    public static function executeTool(string $toolName, array $rawArgs): array
    {
        if (!in_array($toolName, self::ALLOWED_TOOLS, true)) {
            return [
                'ok'    => false,
                'error' => 'Tool not in server allowlist.',
                'cards' => [],
            ];
        }

        switch ($toolName) {
            case 'search_properties':
                return self::searchProperties($rawArgs);
            case 'get_property_details':
                return self::getPropertyDetails($rawArgs);
            case 'check_property_availability':
                return self::checkPropertyAvailability($rawArgs);
            case 'get_project_details':
                return self::getProjectDetails($rawArgs);
            default:
                return ['ok' => false, 'error' => 'Unsupported tool.', 'cards' => []];
        }
    }

    /**
     * Tool 1: search_properties
     * Searches published properties using parameterized SQL and Dari/English normalization.
     */
    public static function searchProperties(array $args): array
    {
        $db = self::getReadOnlyDb();
        if (!$db) {
            return [
                'ok'      => false,
                'error'   => 'DATABASE_UNAVAILABLE',
                'message' => 'ارتباط با دیتابیس املاک در حال حاضر برقرار نیست.',
                'cards'   => [],
            ];
        }

        $where  = ["status IN ('available', 'pending')"];
        $params = [];
        $types  = '';

        // Validate property type
        if (!empty($args['type']) && is_string($args['type'])) {
            $typeArg = ucfirst(strtolower(trim($args['type'])));
            if (in_array($typeArg, self::ALLOWED_TYPES, true)) {
                $where[]  = 'type = ?';
                $params[] = $typeArg;
                $types   .= 's';
            }
        }

        // Validate listing_type (sale / rent)
        if (!empty($args['listing_type']) && is_string($args['listing_type'])) {
            $ltArg = strtolower(trim($args['listing_type']));
            if (in_array($ltArg, self::ALLOWED_LISTING_TYPES, true)) {
                $where[]  = 'listing_type = ?';
                $params[] = $ltArg;
                $types   .= 's';
            }
        }

        // Validate min_beds / max_beds
        if (isset($args['min_beds']) && is_numeric($args['min_beds'])) {
            $minBeds = max(0, min(20, (int) $args['min_beds']));
            if ($minBeds > 0) {
                $where[]  = 'beds >= ?';
                $params[] = $minBeds;
                $types   .= 'i';
            }
        }
        if (isset($args['max_beds']) && is_numeric($args['max_beds'])) {
            $maxBeds = max(0, min(20, (int) $args['max_beds']));
            if ($maxBeds > 0) {
                $where[]  = 'beds <= ?';
                $params[] = $maxBeds;
                $types   .= 'i';
            }
        }

        // Validate min_price / max_price
        if (isset($args['min_price']) && is_numeric($args['min_price'])) {
            $minPrice = max(0.0, (float) $args['min_price']);
            if ($minPrice > 0) {
                $where[]  = 'price >= ?';
                $params[] = $minPrice;
                $types   .= 'd';
            }
        }
        if (isset($args['max_price']) && is_numeric($args['max_price'])) {
            $maxPrice = max(0.0, (float) $args['max_price']);
            if ($maxPrice > 0) {
                $where[]  = 'price <= ?';
                $params[] = $maxPrice;
                $types   .= 'd';
            }
        }

        // Location filter (supports explicit bilingual Kabul district aliases)
        if (!empty($args['location']) && is_string($args['location'])) {
            $locRaw = mb_substr(trim($args['location']), 0, 80, 'UTF-8');
            $extracted = DariNormalizer::extractSearchFilters($locRaw);
            $aliases = $extracted['location_aliases'] ?? [$locRaw, DariNormalizer::normalizeText($locRaw)];
            $aliases = array_values(array_unique(array_filter($aliases)));

            if (count($aliases) === 1) {
                $where[]  = '(location LIKE ? OR title LIKE ?)';
                $like     = '%' . $aliases[0] . '%';
                $params[] = $like;
                $params[] = $like;
                $types   .= 'ss';
            } elseif (count($aliases) > 1) {
                $orParts = [];
                foreach ($aliases as $alias) {
                    $orParts[] = 'location LIKE ?';
                    $orParts[] = 'title LIKE ?';
                    $like = '%' . $alias . '%';
                    $params[] = $like;
                    $params[] = $like;
                    $types   .= 'ss';
                }
                $where[] = '(' . implode(' OR ', $orParts) . ')';
            }
        }

        // Keyword filter
        if (!empty($args['keyword']) && is_string($args['keyword'])) {
            $kw = mb_substr(trim($args['keyword']), 0, 80, 'UTF-8');
            $where[]  = '(title LIKE ? OR description LIKE ? OR serial_number = ?)';
            $like     = '%' . $kw . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $kw;
            $types   .= 'sss';
        }

        $limit = isset($args['limit']) && is_numeric($args['limit'])
            ? max(1, min(Config::MAX_SEARCH_RESULTS, (int) $args['limit']))
            : Config::MAX_SEARCH_RESULTS;

        $sql = 'SELECT id, serial_number, title, price, location, beds, baths, area, floor, status, type, listing_type, image_url, description
                FROM properties
                WHERE ' . implode(' AND ', $where) . '
                ORDER BY (status = \'available\') DESC, created_at DESC
                LIMIT ?';
        $params[] = $limit;
        $types   .= 'i';

        $stmt = $db->prepare($sql);
        if (!$stmt) {
            return ['ok' => false, 'error' => 'QUERY_PREPARE_FAILED', 'cards' => []];
        }
        $stmt->bind_param($types, ...$params);
        if (!$stmt->execute()) {
            return ['ok' => false, 'error' => 'QUERY_EXEC_FAILED', 'cards' => []];
        }

        $res = $stmt->get_result();
        $cards = [];
        while ($row = $res->fetch_assoc()) {
            $cards[] = self::formatPropertyRecord($row);
        }
        $stmt->close();

        return [
            'ok'          => true,
            'tool'        => 'search_properties',
            'count'       => count($cards),
            'properties'  => $cards,
            'cards'       => $cards,
        ];
    }

    /**
     * Tool 2: get_property_details
     * Retrieves exact, fresh details for a single property by ID or serial_number.
     */
    public static function getPropertyDetails(array $args): array
    {
        $db = self::getReadOnlyDb();
        if (!$db) {
            return ['ok' => false, 'error' => 'DATABASE_UNAVAILABLE', 'cards' => []];
        }

        $propertyId   = isset($args['property_id']) && is_numeric($args['property_id']) ? (int) $args['property_id'] : 0;
        $serialNumber = isset($args['serial_number']) && is_string($args['serial_number']) ? trim($args['serial_number']) : '';

        if ($propertyId <= 0 && $serialNumber === '') {
            return ['ok' => false, 'error' => 'INVALID_ARGUMENTS', 'cards' => []];
        }

        if ($propertyId > 0) {
            $stmt = $db->prepare(
                'SELECT id, serial_number, title, price, location, beds, baths, area, floor, status, type, listing_type, image_url, description
                 FROM properties WHERE id = ? LIMIT 1'
            );
            if (!$stmt) {
                return ['ok' => false, 'error' => 'QUERY_FAILED', 'cards' => []];
            }
            $stmt->bind_param('i', $propertyId);
        } else {
            $serialClean = mb_substr($serialNumber, 0, 50, 'UTF-8');
            $stmt = $db->prepare(
                'SELECT id, serial_number, title, price, location, beds, baths, area, floor, status, type, listing_type, image_url, description
                 FROM properties WHERE serial_number = ? LIMIT 1'
            );
            if (!$stmt) {
                return ['ok' => false, 'error' => 'QUERY_FAILED', 'cards' => []];
            }
            $stmt->bind_param('s', $serialClean);
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res ? $res->fetch_assoc() : null;
        $stmt->close();

        if (!$row) {
            return [
                'ok'       => true,
                'found'    => false,
                'property' => null,
                'cards'    => [],
            ];
        }

        $formatted = self::formatPropertyRecord($row);
        return [
            'ok'       => true,
            'found'    => true,
            'property' => $formatted,
            'cards'    => [$formatted],
        ];
    }

    /**
     * Tool 3: check_property_availability
     * Always performs a fresh database query for current status and price.
     */
    public static function checkPropertyAvailability(array $args): array
    {
        $details = self::getPropertyDetails($args);
        if (!$details['ok'] || empty($details['found']) || empty($details['property'])) {
            return $details;
        }
        $prop = $details['property'];
        return [
            'ok'           => true,
            'found'        => true,
            'property_id'  => $prop['id'],
            'serial_number'=> $prop['serial_number'],
            'title'        => $prop['title'],
            'status'       => $prop['status'],
            'is_available' => ($prop['status'] === 'available'),
            'price'        => $prop['price'],
            'currency'     => $prop['currency'],
            'listing_type' => $prop['listing_type'],
            'checked_at'   => gmdate('c'),
            'property'     => $prop,
            'cards'        => [$prop],
        ];
    }

    /**
     * Tool 4: get_project_details
     * Searches or retrieves development projects from `projects` and `project_units`.
     */
    public static function getProjectDetails(array $args): array
    {
        $db = self::getReadOnlyDb();
        if (!$db) {
            return ['ok' => false, 'error' => 'DATABASE_UNAVAILABLE', 'cards' => []];
        }

        $projectId = isset($args['project_id']) && is_numeric($args['project_id']) ? (int) $args['project_id'] : 0;
        $keyword   = isset($args['keyword']) && is_string($args['keyword']) ? mb_substr(trim($args['keyword']), 0, 80, 'UTF-8') : '';

        if ($projectId > 0) {
            $stmt = $db->prepare(
                'SELECT id, name, location, delivery_date, status, available_units, total_units, image_url, description
                 FROM projects WHERE id = ? LIMIT 1'
            );
            if (!$stmt) {
                return ['ok' => false, 'error' => 'QUERY_FAILED', 'cards' => []];
            }
            $stmt->bind_param('i', $projectId);
        } elseif ($keyword !== '') {
            $stmt = $db->prepare(
                'SELECT id, name, location, delivery_date, status, available_units, total_units, image_url, description
                 FROM projects WHERE name LIKE ? OR location LIKE ? ORDER BY created_at DESC LIMIT 4'
            );
            if (!$stmt) {
                return ['ok' => false, 'error' => 'QUERY_FAILED', 'cards' => []];
            }
            $like = '%' . $keyword . '%';
            $stmt->bind_param('ss', $like, $like);
        } else {
            $stmt = $db->prepare(
                'SELECT id, name, location, delivery_date, status, available_units, total_units, image_url, description
                 FROM projects ORDER BY created_at DESC LIMIT 4'
            );
            if (!$stmt) {
                return ['ok' => false, 'error' => 'QUERY_FAILED', 'cards' => []];
            }
        }

        $stmt->execute();
        $res = $stmt->get_result();
        $projects = [];
        while ($row = $res->fetch_assoc()) {
            $id = (int) $row['id'];
            $projects[] = [
                'id'              => $id,
                'name'            => self::sanitizeUntrustedText((string) ($row['name'] ?? ''), 150),
                'location'        => self::sanitizeUntrustedText((string) ($row['location'] ?? ''), 140),
                'delivery_date'   => self::sanitizeUntrustedText((string) ($row['delivery_date'] ?? ''), 60),
                'status'          => (string) ($row['status'] ?? 'In Progress'),
                'available_units' => (int) ($row['available_units'] ?? 0),
                'total_units'     => (int) ($row['total_units'] ?? 0),
                'image_url'       => $row['image_url'] ?? null,
                'description'     => self::sanitizeUntrustedText((string) ($row['description'] ?? ''), 380),
                'url'             => self::buildSafeProjectLink($id),
            ];
        }
        $stmt->close();

        return [
            'ok'       => true,
            'count'    => count($projects),
            'projects' => $projects,
            'cards'    => [],
        ];
    }
}
