import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roles = ["callcenter", "management", "dashboard"];

const standalonePanels = [
  { id: "ceo", title: "CEO Executive Command · Attaie Properties" },
  { id: "sales-leader", title: "Sales Team Leader Workspace · Attaie Properties" },
  { id: "sales", title: "Sales Agent Workspace · Attaie Properties" },
  { id: "finance", title: "Finance Manager Workspace · Attaie Properties" },
  { id: "marketing", title: "Marketing & Media Workspace · Attaie Properties" },
  { id: "engineering", title: "Engineering & 3D Workspace · Attaie Properties" },
];

for (const role of roles) {
  const outDir = path.join(root, "public", role);
  process.env.STAFF_ROLE = role;
  process.env.STAFF_ALLOW_PREVIEW = "1";

  await build({
    configFile: path.join(root, "apps/staff/vite.config.ts"),
    logLevel: "warn",
    build: {
      outDir,
      emptyOutDir: true,
    },
  });

  const nestedHtml = path.join(outDir, role, "index.html");
  const rootHtml = path.join(outDir, "index.html");
  if (fs.existsSync(nestedHtml)) {
    fs.copyFileSync(nestedHtml, rootHtml);
    fs.rmSync(path.join(outDir, role), { recursive: true, force: true });
  }

  const htaccessSrc = path.join(root, "deployment/staff/dashboard.htaccess");
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(outDir, ".htaccess"));
  }

  console.log(`[build-public-staff] Built /${role}/ into ${outDir}`);
}

const dashboardDir = path.join(root, "public", "dashboard");
const dashboardHtml = fs.readFileSync(path.join(dashboardDir, "index.html"), "utf8");
const htaccessSrc = path.join(root, "deployment/staff/dashboard.htaccess");

for (const panel of standalonePanels) {
  const panelDir = path.join(root, "public", panel.id);
  fs.rmSync(panelDir, { recursive: true, force: true });
  fs.mkdirSync(panelDir, { recursive: true });
  fs.cpSync(path.join(dashboardDir, "assets"), path.join(panelDir, "assets"), {
    recursive: true,
  });

  for (const assetFile of fs.readdirSync(path.join(panelDir, "assets"))) {
    if (assetFile.endsWith(".js") || assetFile.endsWith(".css")) {
      const assetPath = path.join(panelDir, "assets", assetFile);
      const raw = fs.readFileSync(assetPath, "utf8");
      if (raw.includes("/dashboard/assets/")) {
        fs.writeFileSync(
          assetPath,
          raw.replaceAll("/dashboard/assets/", `/${panel.id}/assets/`),
          "utf8",
        );
      }
    }
  }

  const panelHtml = dashboardHtml
    .replaceAll("/dashboard/assets/", `/${panel.id}/assets/`)
    .replace(/<title>.*?<\/title>/, `<title>${panel.title}</title>`);
  fs.writeFileSync(path.join(panelDir, "index.html"), panelHtml, "utf8");

  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(panelDir, ".htaccess"));
  }
  console.log(`[build-public-staff] Created standalone panel /${panel.id}/ into ${panelDir}`);
}
