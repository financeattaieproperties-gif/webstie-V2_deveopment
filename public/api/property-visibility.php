<?php
declare(strict_types=1);

/**
 * Legacy public property visibility policy.
 *
 * Website DB property status currently mixes availability and review status.
 * "pending" must never be readable through anonymous listing/detail APIs.
 * The existing "sold" and "rented" statuses remain browsable for compatibility
 * until publication state is modeled separately in the customer marketplace.
 *
 * Administrative endpoints do not use this helper.
 */
function public_property_visibility_sql(): string {
    return "status IN ('available','sold','rented')";
}

/**
 * Retain the legacy status filter for public statuses; a request for pending
 * or any unknown status returns no results (and cannot override the policy).
 */
function public_property_requested_status(mixed $requested): ?string {
    if (!is_string($requested) || $requested === '') {
        return null;
    }
    return in_array($requested, ['available', 'sold', 'rented'], true)
        ? $requested
        : '__not_public__';
}
