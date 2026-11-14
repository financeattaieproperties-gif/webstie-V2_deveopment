# Attaie Sales CRM — Dedicated Android Application (`sales-android/`)

This folder contains the complete Android Studio & Capacitor project structure for the **Attaie Properties Sales Agent Android App** (`af.attaieproperties.sales`).

It locks the workspace strictly to the **Sales Agent (`sales`)** role, shares the **exact same backend** (`/staff-api/v1/*` + Firebase Auth), and delivers a responsive, mobile-first field interface with a thumb-friendly 5-tab bottom navigation bar, bottom-sheet modals, native phone dialer (`tel:`), and native camera/gallery file uploads.

---

## Directory Structure

```text
sales-android/
├── README.md                                 # Build & deployment guide
├── .gitignore                                # Android Studio & Gradle ignore rules
├── gradlew / gradlew.bat                     # Gradle 8.9 wrapper executables (Linux/macOS/Windows)
├── gradle/wrapper/                           # Gradle 8.9 wrapper jar & properties
├── capacitor.config.json                     # Capacitor configuration (af.attaieproperties.sales)
├── settings.gradle                           # Gradle root project settings
├── build.gradle                              # Top-level Android Gradle plugin (8.7.2 + Kotlin 2.0.21)
├── gradle.properties                         # JVM & AndroidX configuration
├── www/                                      # Standalone Sales Agent web bundle (Capacitor webDir)
└── app/
    ├── build.gradle                          # App module config (minSdk 24, targetSdk 35, STAFF_API_BASE_URL)
    ├── proguard-rules.pro                    # ProGuard/R8 keep rules for Biometric & Battery JS bridges
    └── src/main/
        ├── AndroidManifest.xml               # Permissions, FileProvider, adaptive icon, RTL, tel:/https: queries
        ├── assets/www/                       # Bundled Sales Agent SPA loaded via WebViewAssetLoader
        ├── java/af/attaieproperties/sales/
        │   ├── MainActivity.kt               # Native Kotlin host Activity (Cookies, Camera/Gallery, Dialer, Back)
        │   ├── BiometricAuthBridge.kt        # AndroidX BiometricPrompt + Keystore EncryptedSharedPreferences
        │   └── DeviceBatteryBridge.kt        # Hardware BatteryManager & charging bridge for header badge
        └── res/
            ├── drawable/                     # Adaptive launcher foreground & Alabaster background
            ├── mipmap-anydpi-v26/            # Adaptive launcher icon descriptors
            ├── mipmap-{mdpi..xxxhdpi}/       # Launcher icons across all Android screen densities
            ├── values/
            │   ├── strings.xml               # App title ("Attaie Sales CRM") & Biometric prompt strings
            │   ├── colors.xml                # Option 2 Alabaster palette (#F7F8FA, #FFFFFF, #0F172A, #E2E8F0)
            │   └── themes.xml                # Light status bar & navigation bar theme
            └── xml/
                ├── file_paths.xml            # FileProvider cache paths for buyer photo camera capture
                └── network_security_config.xml # Enforces HTTPS for attaieproperties.com / attaieproperties.af
```

---

## How the Shared Backend & Biometric Auth Work

1. **Authentication & Biometric Unlock (AndroidX Biometric)**:
   - On first sign-in, the Sales Agent can check **Enable Fingerprint / Face unlock for faster sign-in** (or turn it on/off later from the **Profile** tab).
   - Once verified with Android `BiometricPrompt` (`BIOMETRIC_STRONG | BIOMETRIC_WEAK`), the agent's credentials are encrypted at rest inside `EncryptedSharedPreferences` backed by an Android Keystore AES-256-GCM `MasterKey`.
   - On subsequent launches or session expirations, the Sales Agent unlocks with a single Fingerprint or Face scan, and the app silently re-authenticates with Firebase Auth (`signIn`) and `POST /staff-api/v1/auth/login`.
   - `panelSpec.allowedRoles` strictly enforces `["sales"]` — accounts from other roles cannot switch into or use the Sales Agent Android app.
2. **Configurable API Endpoint (`resolveStaffApiEndpoint`)**:
   - On the Web (`/sales/`), requests use `/staff-api/v1/*` with `credentials: "same-origin"`.
   - In the Android App (`sales-android`), `VITE_STAFF_API_BASE_URL` and `MainActivity.kt` set `window.__ATTAIE_STAFF_API_BASE_URL__ = "https://website.attaieproperties.com/staff-api/v1"`, automatically switching `fetch()` to full HTTPS URLs with `credentials: "include"` and persistent `CookieManager` cookies.

---

## Everyday Sales Agent Workflow in the Android App

- **Bottom Navigation Bar (`<= 760px`)**:
  1. **Leads**: View assigned leads (and cached offline leads when disconnected), filter by pipeline status (`All`, `Active`, `Needs details`, `Deal closed`, `Deal lost`), tap any customer phone number to launch the Android Phone Dialer (`tel:`), or log a new walk-in/direct call lead (`New entry`).
  2. **Follow-ups**: View scheduled 24-hour follow-ups (`Today`, `All due`, `Upcoming`, `Overtime` badge, `Completed`) and submit outcomes (`Follow up`, `Visit`, `Deal closed` with Pre-Sale Project + Apartment selection + Buyer 3×4 Photo & Tazkira upload from Android Camera/Gallery, or `Deal lost`).
  3. **Customers**: Search customer requirements and linked inquiries.
  4. **Projects**: Browse Pre-Sale Projects, floors, apartment availability, and pricing.
  5. **Overview**: 2×2 mobile KPI grid (`New inquiries`, `Due now`, `Overtime`, `My Tasks`) + upcoming follow-ups + assigned tasks.

---

## Opening in Android Studio & Building the APK

### Step 1 (Optional): Rebuild Web Assets Inside `sales-android/`
The compiled Sales Agent bundle is already copied into `sales-android/app/src/main/assets/www/`. Whenever you update web code under `apps/staff/`, run from the repository root:

```bash
npm run build:sales-android
```

To point the APK to the live domain instead of the testing subdomain:

```bash
VITE_STAFF_API_BASE_URL="https://attaieproperties.af/staff-api/v1" npm run build:sales-android
```

And update `STAFF_API_BASE_URL` in `sales-android/app/build.gradle` if building directly for production.

### Step 2: Open `sales-android/` in Android Studio & Build APK
1. Copy or select **only the `sales-android/` folder** and open it in **Android Studio** (**File → Open → `sales-android`**).
2. Android Studio detects `gradle/wrapper/gradle-wrapper.properties` (Gradle 8.9) automatically and syncs all AndroidX dependencies (`compileSdk 35`, Java 17).
3. To build an installable **Debug APK** right away:
   - Menu: **Build → Build App(s) / APK(s) → Build APK(s)**
   - Output APK: `sales-android/app/build/outputs/apk/debug/AttaieSalesCRM-debug.apk`
4. To build a signed **Release APK / AAB** for distribution:
   - Menu: **Build → Generate Signed App Bundle / APK → APK** (creates/uses your `.jks` keystore)
   - Output APK: `sales-android/app/build/outputs/apk/release/AttaieSalesCRM-release.apk`
5. Or build from terminal inside `sales-android/`:
   - Linux / macOS: `./gradlew assembleDebug`
   - Windows: `gradlew.bat assembleDebug`
