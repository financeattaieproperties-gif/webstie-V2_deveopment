#!/usr/bin/env bash
# Phase 2 local checks. Read-only; no DB migrations, deploys or credentials.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Phase 2 PHP syntax =="
for file in \
  public/api/customer-identity.php \
  public/api/customer-firebase-auth.php \
  public/api/customer-agency-policy.php \
  public/api/customer-agency-verification-policy.php \
  public/api/customer-agency-revision-policy.php \
  public/api/customer/me.php \
  public/api/customer/agencies.php \
  public/api/customer/agency-verification.php \
  public/api/customer/agency-document.php \
  public/api/customer/agency-documents.php \
  public/api/customer/agency-revision.php \
  public/api/customer/agency-revision-details.php \
  public/api/admin/customer-agencies.php \
  public/api/admin/customer-agency-document.php \
  public/api/admin/customer-agency-history.php; do
  php -l "$file"
done

echo "== Phase 2 policy tests =="
php tests/website/customer-identity.php
php tests/website/customer-agency-policy.php
php tests/website/customer-agency-revision.php
php tests/website/customer-agency-verification.php
php tests/website/customer-firebase.php

if [[ ! -d node_modules ]]; then
  echo "Dependencies are missing. Run 'npm ci' first." >&2
  exit 2
fi

echo "== Public website TypeScript =="
npx tsc --noEmit
echo "== Website Admin TypeScript =="
npx tsc --noEmit -p admin-panel/tsconfig.json
echo "Phase 2 local syntax, policy and TypeScript checks passed."
echo "NOTE: MySQL HTTP integration, Firebase phone OTP, staging and browser acceptance are NOT covered."
