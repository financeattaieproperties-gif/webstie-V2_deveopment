<?php
declare(strict_types=1);

/** Pure transition policy. Never use client-supplied agency owner or status. */
function agency_revision_next_status(string $current, string $action): string {
    if ($action==='start_revision' && $current==='rejected') return 'revision';
    if ($action==='resubmit' && $current==='revision') return 'pending';
    throw new DomainException('Agency correction is not allowed in the current state.');
}
