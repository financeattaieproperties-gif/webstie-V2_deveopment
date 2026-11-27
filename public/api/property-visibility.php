<?php
declare(strict_types=1);

/**
 * Legacy website property visibility.
 *
 * The existing website schema stores availability in status, not a separate
 * publication flag. Until a dedicated publication state exists, only the
 * existing available/sold/rented rows are eligible for public detail pages.
 * Pending rows are private. Once added, a separate publication predicate
 * must be enforced in BOTH public endpoints.
 *
 * Administrative endpoints are not governed by these public read rules.
 */
function public_property_detail_visibility_sql(): string {
    return "status IN ('available','sold','rented')";
}

/**
 * Search and catalog pages include actively available properties ONLY.
 * Sold and rented records are reachable exclusively by their public detail URL.
 */
function public_property_search_visibility_sql(): string {
    return "status = 'available'";
}

/** An explicit attempt to search a non-available status must return no rows. */
function public_property_requested_status(mixed $requested): ?string {
    if ($requested === null || $requested === '') {
        return null;
    }
    return $requested === 'available' ? 'available' : '__not_public__';
}
