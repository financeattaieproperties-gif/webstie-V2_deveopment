let cleanup: Promise<boolean> | undefined;

/** Retire the old unpartitioned API cache before any authenticated request. */
export function clearLegacyStaffApiCache(): Promise<boolean> {
  if (typeof caches === 'undefined') return Promise.resolve(false);
  cleanup ??= caches.delete('attaie-sales-api-cache');
  return cleanup;
}
