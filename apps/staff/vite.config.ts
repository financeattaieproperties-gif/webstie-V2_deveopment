import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const localRoleRouting: Plugin = {
  name: "staff-local-role-routing",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [pathname, query] = (request.url || "").split("?");
      const match = pathname.match(
        /^\/(callcenter|management|dashboard)(?:\/(?:overview|followups|customers|leads|projects|tasks|team|hr|finance|marketing|submissions|engineering|profile))?\/?$/,
      );
      if (match) request.url = `/${match[1]}/index.html${query ? `?${query}` : ""}`;
      next();
    });
  },
};

export default defineConfig(({ command }) => {
  const role = process.env.STAFF_ROLE || "callcenter";
  if (!["callcenter", "management", "dashboard"].includes(role))
    throw new Error("No sales dashboard is included.");
  const allowPreview =
    command === "serve" || process.env.STAFF_ALLOW_PREVIEW === "1";
  return {
    root: import.meta.dirname,
    publicDir: false,
    plugins: [react(), localRoleRouting],
    base: command === "build" ? `/${role}/` : "/",
    define: {
      __STAFF_PREVIEW_ALLOWED__: JSON.stringify(allowPreview),
      __STAFF_ROLE__: JSON.stringify(role),
    },
    build: {
      rollupOptions: {
        input: resolve(import.meta.dirname, `${role}/index.html`),
      },
      assetsDir: "assets",
    },
    server: {
      host: "127.0.0.1",
      port: 5175,
      strictPort: true,
      fs: { allow: [resolve(import.meta.dirname, "../..")] },
      proxy: { "/staff-api": "http://127.0.0.1:8891" },
    },
  };
});
