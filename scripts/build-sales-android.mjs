import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidRoot = path.join(root, "sales-android");
const wwwDir = path.join(androidRoot, "www");
const androidAssetsWwwDir = path.join(
  androidRoot,
  "app",
  "src",
  "main",
  "assets",
  "www",
);

const backendBaseUrl =
  process.env.VITE_STAFF_API_BASE_URL ||
  "https://website.attaieproperties.com/staff-api/v1";

process.env.STAFF_ROLE = "sales";
process.env.STAFF_MOBILE_APP = "1";
process.env.STAFF_ALLOW_PREVIEW = process.env.STAFF_ALLOW_PREVIEW || "0";
process.env.VITE_STAFF_API_BASE_URL = backendBaseUrl;

await build({
  configFile: path.join(root, "apps/staff/vite.config.ts"),
  logLevel: "warn",
  build: {
    outDir: wwwDir,
    emptyOutDir: true,
  },
});

const nestedHtml = path.join(wwwDir, "dashboard", "index.html");
const rootHtml = path.join(wwwDir, "index.html");
if (fs.existsSync(nestedHtml)) {
  fs.copyFileSync(nestedHtml, rootHtml);
  fs.rmSync(path.join(wwwDir, "dashboard"), { recursive: true, force: true });
}

if (fs.existsSync(rootHtml)) {
  let html = fs.readFileSync(rootHtml, "utf8");
  html = html
    .replaceAll("../assets/", "./assets/")
    .replace(
      /<title>.*?<\/title>/,
      "<title>Sales Agent Workspace · Attaie Properties</title>",
    )
    .replace(
      /<meta name="viewport"[^>]*>/,
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />',
    )
    .replace(
      "</head>",
      `  <script>window.__ATTAIE_ANDROID_APP__ = true; window.__ATTAIE_STAFF_API_BASE_URL__ = window.__ATTAIE_STAFF_API_BASE_URL__ || ${JSON.stringify(backendBaseUrl)};</script>\n  </head>`,
    );
  if (!html.includes("apple-touch-icon")) {
    html = html.replace(
      "</head>",
      '<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png"/>\n  </head>',
    );
  }
  fs.writeFileSync(rootHtml, html, "utf8");
}

// Copy self-hosted logo so offline/bundled WebView assets resolve cleanly
const logoSrc = path.join(root, "public", "logo.png");
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, path.join(wwwDir, "logo.png"));
}

// Mirror www/ into app/src/main/assets/www/ for direct Android Studio Gradle builds
fs.rmSync(androidAssetsWwwDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(androidAssetsWwwDir), { recursive: true });
fs.cpSync(wwwDir, androidAssetsWwwDir, { recursive: true });

console.log(
  `[build-sales-android] Built Sales Agent Android bundle into ${wwwDir} and ${androidAssetsWwwDir} (Backend: ${backendBaseUrl})`,
);
