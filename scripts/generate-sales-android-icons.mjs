import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resDir = path.join(root, "sales-android", "app", "src", "main", "res");
const logoPath = path.join(root, "public", "logo.png");
const logoDataUri = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

const launcherSpecs = [
  { folder: "mipmap-mdpi", file: "ic_launcher.png", size: 48, round: false, foregroundOnly: false },
  { folder: "mipmap-mdpi", file: "ic_launcher_round.png", size: 48, round: true, foregroundOnly: false },
  { folder: "mipmap-hdpi", file: "ic_launcher.png", size: 72, round: false, foregroundOnly: false },
  { folder: "mipmap-hdpi", file: "ic_launcher_round.png", size: 72, round: true, foregroundOnly: false },
  { folder: "mipmap-xhdpi", file: "ic_launcher.png", size: 96, round: false, foregroundOnly: false },
  { folder: "mipmap-xhdpi", file: "ic_launcher_round.png", size: 96, round: true, foregroundOnly: false },
  { folder: "mipmap-xxhdpi", file: "ic_launcher.png", size: 144, round: false, foregroundOnly: false },
  { folder: "mipmap-xxhdpi", file: "ic_launcher_round.png", size: 144, round: true, foregroundOnly: false },
  { folder: "mipmap-xxxhdpi", file: "ic_launcher.png", size: 192, round: false, foregroundOnly: false },
  { folder: "mipmap-xxxhdpi", file: "ic_launcher_round.png", size: 192, round: true, foregroundOnly: false },
  { folder: "drawable", file: "ic_launcher_foreground.png", size: 432, round: false, foregroundOnly: true },
];

function buildIconHtml({ size, round, foregroundOnly }) {
  const paddingPct = foregroundOnly ? 24 : 14;
  const radius = round ? "50%" : foregroundOnly ? "0px" : `${Math.round(size * 0.22)}px`;
  const tagFont = Math.max(6, Math.round(size * (foregroundOnly ? 0.055 : 0.085)));
  const tagPadY = Math.max(2, Math.round(size * 0.022));
  const tagPadX = Math.max(4, Math.round(size * 0.06));
  const gap = Math.max(3, Math.round(size * 0.045));

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
        background: transparent;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .tile {
        width: ${size}px;
        height: ${size}px;
        padding: ${paddingPct}%;
        border-radius: ${radius};
        background: ${foregroundOnly ? "transparent" : "linear-gradient(180deg, #FFFFFF 0%, #F7F8FA 100%)"};
        border: ${foregroundOnly ? "0" : `${Math.max(1, Math.round(size * 0.015))}px solid #E2E8F0`};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: ${gap}px;
      }
      .logo {
        width: 100%;
        height: auto;
        max-height: ${foregroundOnly ? "56%" : "58%"};
        object-fit: contain;
        display: block;
      }
      .role-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: ${tagPadY}px ${tagPadX}px;
        border-radius: ${Math.max(3, Math.round(size * 0.035))}px;
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
  for (const spec of launcherSpecs) {
    const outPath = path.join(resDir, spec.folder, spec.file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const page = await browser.newPage({
      viewport: { width: spec.size, height: spec.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(buildIconHtml(spec), { waitUntil: "load" });
    await page.screenshot({ path: outPath, omitBackground: true });
    await page.close();
    console.log(`[generate-sales-android-icons] Generated ${spec.folder}/${spec.file} (${spec.size}x${spec.size})`);
  }
} finally {
  await browser.close();
}
