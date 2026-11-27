<?php
declare(strict_types=1);

/**
 * Run: php tests/website/public-property-visibility.php
 * Policy and endpoint wiring regression assertions.
 * Additional HTTP/MySQL integration testing is required before merging.
 */
require_once __DIR__ . '/../../public/api/property-visibility.php';

function check(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check(
    public_property_search_visibility_sql() === "status = 'available'",
    'Catalog must only expose available properties'
);
check(
    public_property_detail_visibility_sql() === "status IN ('available','sold','rented')",
    'Details must preserve direct links for sold and rented records'
);
check(public_property_requested_status(null) === null, 'Default search should use available-only predicate');
check(public_property_requested_status('') === null, 'Empty filter should use available-only predicate');
check(public_property_requested_status('available') === 'available', 'Explicit available filter should be allowed');
foreach (['pending','draft','approved','rejected','archived','sold','rented','Published','anything'] as $status) {
    check(public_property_requested_status($status) === '__not_public__', "Nonavailable search status accepted: $status");
}
check(public_property_requested_status(['available']) === '__not_public__', 'Array status filter must not bypass policy');

$list = file_get_contents(__DIR__ . '/../../public/api/get-properties.php');
$detail = file_get_contents(__DIR__ . '/../../public/api/get-property.php');
check(is_string($list) && is_string($detail), 'Could not read both public endpoints');
foreach ([$list,$detail] as $source) {
    check(str_contains($source, "require_once __DIR__ . '/property-visibility.php';"), 'Missing shared visibility helper');
}
check(str_contains($list, 'public_property_search_visibility_sql()'), 'List endpoint must enforce available-only policy');
check(str_contains($list, 'public_property_requested_status('), 'List endpoint must reject nonavailable status filters');
check(str_contains($detail, 'public_property_detail_visibility_sql()'), 'Detail endpoint must preserve historical detail access');
check(!str_contains($list, 'public_property_detail_visibility_sql()'), 'Listing must never use historical visibility');

echo "Public property visibility policy and wiring checks passed.\n";
