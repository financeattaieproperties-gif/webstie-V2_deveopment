import { build } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const option = (name) => process.argv[process.argv.indexOf(name) + 1];
const role = option("--role");
const output = option("--out");
if (
  !["callcenter", "management"].includes(role) ||
  !output ||
  output.startsWith("--")
)
  throw new Error(
    "Usage: node scripts/build-staff.mjs --role callcenter|management --out <new directory>. Sales dashboard is excluded.",
  );
const out = path.resolve(output);
if (fs.existsSync(out))
  throw new Error(
    "Output must be a new directory; existing builds are never overwritten.",
  );
process.env.STAFF_ROLE = role;
await build({
  configFile: path.join(root, "apps/staff/vite.config.ts"),
  build: { outDir: out, emptyOutDir: false },
});
fs.renameSync(path.join(out, role, "index.html"), path.join(out, "index.html"));
fs.rmdirSync(path.join(out, role));
fs.copyFileSync(
  path.join(root, "deployment/staff/dashboard.htaccess"),
  path.join(out, ".htaccess"),
);
const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
if (!html.includes("noindex") || !html.includes(`/${role}/assets/`))
  throw new Error("Incorrect role base or missing noindex.");
for (const entry of fs.readdirSync(path.join(out, "assets"))) {
  if (
    entry.endsWith(".js") &&
    /Sample workspace only|Explore sample workspace/.test(
      fs.readFileSync(path.join(out, "assets", entry), "utf8"),
    )
  )
    throw new Error("Sample preview code leaked into production.");
}
console.log(`Built /${role}/ at ${out}. Public website and backend unchanged.`);
