import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps", "staff", "pwa-assets");
const logoPath = path.join(root, "public", "logo.png");

fs.mkdirSync(outDir, { recursive: true });

const logoBase64 = fs.readFileSync(logoPath).toString("base64");
const logoDataUri = `data:image/png;base64,${logoBase64}`;

const specs = [
  {
    file: "pwa-192x192.png",
    size: 192,
    maskable: false,
  },
  {
    file: "pwa-512x512.png",
    size: 512,
    maskable: false,
  },
  {
    file: "pwa-maskable-512x512.png",
    size: 512,
    maskable: true,
  },
  {
    file: "apple-touch-icon.png",
    size: 180,
    maskable: false,
    opaqueSquare: true,
  },
];

function buildHtml({ size, maskable, opaqueSquare }) {
  const paddingPct = maskable ? 18 : opaqueSquare ? 14 : 12;
  const radius = maskable || opaqueSquare ? "0px" : `${Math.round(size * 0.2)}px`;
  const tagFont = Math.max(9, Math.round(size * 0.062));
  const tagPadY = Math.max(3, Math.round(size * 0.02));
  const tagPadX = Math.max(8, Math.round(size * 0.055));
  const gap = Math.max(6, Math.round(size * 0.045));

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body {
        width: ${size}px;
        height: ${size}px;
        overflow: hidden;
        background: ${maskable || opaqueSquare ? "#F7F8FA" : "transparent"};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .tile {
        width: ${size}px;
        height: ${size}px;
        padding: ${paddingPct}%;
        border-radius: ${radius};
        background: linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%);
        border: ${maskable || opaqueSquare ? "0" : `${Math.max(1, Math.round(size * 0.012))}px solid #E2E8F0`};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${gap}px;
      }
      .logo {
        width: 100%;
        height: auto;
        max-height: ${maskable ? "52%" : "58%"};
        object-fit: contain;
        display: block;
      }
      .role-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: ${tagPadY}px ${tagPadX}px;
        border-radius: ${Math.max(4, Math.round(size * 0.03))}px;
        background: #0F172A;
        color: #FFFFFF;
        font-size: ${tagFont}px;
        font-weight: 700;
        letter-spacing: 0.08em;
        line-height: 1;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="tile">
      <img class="logo" src="${logoDataUri}" alt="Attaie Properties" />
      <span class="role-tag">SALES</span>
    </div>
  </body>
</html>`;
}

function findChromiumExecutable() {
  const roots = ["/ms-playwright", `${process.env.HOME || "/root"}/.cache/ms-playwright`];
  for (const dir of roots) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const candidate = path.join(dir, entry, "chrome-headless-shell-linux64", "chrome-headless-shell");
      if (fs.existsSync(candidate)) return candidate;
      const fullChrome = path.join(dir, entry, "chrome-linux64", "chrome");
      if (fs.existsSync(fullChrome)) return fullChrome;
    }
  }
  return undefined;
}

const executablePath = findChromiumExecutable();
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  for (const spec of specs) {
    const page = await browser.newPage({
      viewport: { width: spec.size, height: spec.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(buildHtml(spec), { waitUntil: "load" });
    await page.screenshot({
      path: path.join(outDir, spec.file),
      omitBackground: !spec.maskable && !spec.opaqueSquare,
    });
    await page.close();
    console.log(`[generate-sales-pwa-icons] Generated ${spec.file} (${spec.size}x${spec.size})`);
  }
} finally {
  await browser.close();
}
