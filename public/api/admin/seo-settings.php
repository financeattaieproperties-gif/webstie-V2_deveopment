<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../sitemap-helper.php';
cors();
require_admin();

$mysqli = db();

// Ensure seo_settings table exists so existing deployments upgrade seamlessly
$mysqli->query("
CREATE TABLE IF NOT EXISTS seo_settings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$method = $_SERVER['REQUEST_METHOD'];

$defaults = [
    'id'                  => 1,
    'site_name'           => 'Attaie Properties',
    'default_title'       => 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
    'title_template'      => '%s | Attaie Properties',
    'default_description' => 'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
    'keywords'            => 'Attaie Properties, Kabul real estate, properties for sale in Kabul, properties for rent in Kabul, luxury villas Kabul, apartments in Kabul, Afghanistan property agency',
    'og_image'            => '/logo.png',
    'twitter_image'       => null,
    'twitter_card'        => 'summary_large_image',
    'twitter_site'        => '@AttaieProps',
    'canonical_base_url'  => 'https://www.attaieproperties.com',
    'robots_index'        => true,
    'updated_at'          => null,
];

if ($method === 'GET') {
    $stmt = $mysqli->prepare(
        'SELECT id, site_name, default_title, title_template, default_description, keywords, og_image, twitter_image, twitter_card, twitter_site, canonical_base_url, robots_index, updated_at FROM seo_settings WHERE id = 1 LIMIT 1'
    );
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result ? $result->fetch_assoc() : null;

    if (!$row) {
        json_out($defaults);
    }

    $row['id'] = (int) $row['id'];
    $row['robots_index'] = (bool) $row['robots_index'];
    json_out($row);
}

if ($method === 'POST' || $method === 'PUT') {
    $b = body();

    $site_name           = trim((string) ($b['site_name'] ?? 'Attaie Properties'));
    $default_title       = trim((string) ($b['default_title'] ?? ''));
    $title_template      = trim((string) ($b['title_template'] ?? '%s | Attaie Properties'));
    $default_description = trim((string) ($b['default_description'] ?? ''));
    $keywords            = array_key_exists('keywords', $b) && $b['keywords'] !== null
        ? trim((string) $b['keywords'])
        : null;
    $og_image            = trim((string) ($b['og_image'] ?? '')) ?: '/logo.png';
    $twitter_image       = trim((string) ($b['twitter_image'] ?? '')) ?: null;
    $twitter_card_raw    = trim((string) ($b['twitter_card'] ?? 'summary_large_image'));
    $twitter_card        = in_array($twitter_card_raw, ['summary_large_image', 'summary'], true)
        ? $twitter_card_raw
        : 'summary_large_image';
    $twitter_site        = trim((string) ($b['twitter_site'] ?? '')) ?: null;
    $canonical_base_url  = rtrim(trim((string) ($b['canonical_base_url'] ?? '')), '/') ?: 'https://www.attaieproperties.com';
    $robots_index        = !empty($b['robots_index']) ? 1 : 0;

    if ($site_name === '' || $default_title === '' || $default_description === '') {
        json_out(['error' => 'Site name, default title, and default description are required'], 400);
    }

    $sql = 'INSERT INTO seo_settings (
                id, site_name, default_title, title_template, default_description,
                keywords, og_image, twitter_image, twitter_card, twitter_site,
                canonical_base_url, robots_index
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                site_name = VALUES(site_name),
                default_title = VALUES(default_title),
                title_template = VALUES(title_template),
                default_description = VALUES(default_description),
                keywords = VALUES(keywords),
                og_image = VALUES(og_image),
                twitter_image = VALUES(twitter_image),
                twitter_card = VALUES(twitter_card),
                twitter_site = VALUES(twitter_site),
                canonical_base_url = VALUES(canonical_base_url),
                robots_index = VALUES(robots_index)';

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param(
        'ssssssssssi',
        $site_name,
        $default_title,
        $title_template,
        $default_description,
        $keywords,
        $og_image,
        $twitter_image,
        $twitter_card,
        $twitter_site,
        $canonical_base_url,
        $robots_index
    );
    $stmt->execute();
    @build_and_save_sitemap($canonical_base_url);

    json_out([
        'success'             => true,
        'id'                  => 1,
        'site_name'           => $site_name,
        'default_title'       => $default_title,
        'title_template'      => $title_template,
        'default_description' => $default_description,
        'keywords'            => $keywords,
        'og_image'            => $og_image,
        'twitter_image'       => $twitter_image,
        'twitter_card'        => $twitter_card,
        'twitter_site'        => $twitter_site,
        'canonical_base_url'  => $canonical_base_url,
        'robots_index'        => (bool) $robots_index,
    ]);
}

json_out(['error' => 'Method not allowed'], 405);
