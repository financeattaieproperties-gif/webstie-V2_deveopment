<?php
declare(strict_types=1);

/**
 * Run: php tests/website/public-property-visibility.php
 * Unit/policy and endpoint wiring regression checks.
 * This does not replace HTTP/MySQL integration tests in staging.
 */
require_once __DIR__ . '/../../public/api/property-visibility.php';

function check(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

check(
    public_property_visibility_sql() === "status IN ('available','sold','rented')",
    'Legacy public visibility policy changed unexpectedly'
);

foreach (['available','sold','rented'] as $status) {
    check(public_property_requested_status($status) === $status, "Public status rejected: $status");
}
foreach (['pending','draft','approved','rejected','archived','Published','anything'] as $status) {
    check(public_property_requested_status($status) === '__not_public__', "Nonpublic status accepted: $status");
}
check(public_property_requested_status(null) === null, 'Absent status filter should keep base visibility rule');
check(public_property_requested_status('') === null, 'Empty status filter should keep base visibility rule');
check(public_property_requested_status(['pending']) === '__not_public__', 'Array status must not bypass filter');

foreach (['get-properties.php','get-property.php'] as $file) {
    $source = file_get_contents(__DIR__ . '/../../public/api/' . $file);
    check($source !== false, "Could not read $file");
    check(str_contains($source, "require_once __DIR__ . '/property-visibility.php';"), "Missing visibility helper in $file");
    check(str_contains($source, 'public_property_visibility_sql()'), "Missing public visibility predicate in $file");
}

echo "Public property visibility policy and endpoint wiring checks passed.\n";
