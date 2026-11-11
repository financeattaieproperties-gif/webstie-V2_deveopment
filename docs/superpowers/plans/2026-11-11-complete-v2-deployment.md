# Complete V2 manual deployment kit

**Goal:** Build one reviewable V2 testing kit with public website, web admin, English teal call center, management, PHP backends, manual SQL and private setup materials.

**Execution:** Continue inline under existing authorization. No live upload, import, or production change. Existing unrelated files and all five project artwork folders stay intact.

**Design:** One NEW EMPTY V2 database contains existing website tables plus shared `core_` and `cc_` module tables. Preserve current website admin login separately from Firebase staff accounts. Compile fresh static assets into a new release folder, copy backend files through explicit exclusions, and keep SQL/credentials/staff configuration outside `dist`. Recover the five-project showcase seed from the saved catalog with fixed IDs, verify every referenced local asset, and label sample inventory accurately. Do not invent calibrated explorer geometry.

- [ ] Add and test a private-path locator so shared-host setup needs File Manager only, plus an explicit manual-schema flag preventing runtime schema changes.
- [ ] Build a reproducible full V2 packager with no raw-dist copy, schema/seed integrity checks, current staff builds and private-file isolation.
- [ ] Write the complete cPanel/Firebase/phpMyAdmin/user setup and troubleshooting guide. Include private path examples, SQL order, independent admin login and first CEO provisioning.
- [ ] Import packaged SQL into a fresh fictional local database; exercise packaged PHP/frontend and auth boundaries, asset counts and manifest/ZIP checks.
- [ ] Review final kit, preserve documented limitations, and deliver exact upload archive, SQL/private materials and guide without deploying.

Known limitation: existing current visual config is empty and the calibration/structural editor work is unfinished. Keep project catalog and artwork, do not fabricate publishable floor/unit polygons, and disclose this testing limitation. Automatic Etisalat/AI services remain disabled in the testing kit until independently configured.
