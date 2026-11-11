import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const localRoleRouting: Plugin = {
  name: "staff-local-role-routing",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [pathname, query] = (request.url || "").split("?");
      const match = pathname.match(/^\/(callcenter|management)(?:\/(?:overview|followups|customers|leads|tasks|team|profile))?\/?$/);
      if (match) request.url = `/${match[1]}/index.html${query ? `?${query}` : ""}`;
      next();
    });
  },
};

export default defineConfig(({ command }) => {
  const role = process.env.STAFF_ROLE || "callcenter";
  if (!["callcenter", "management"].includes(role))
    throw new Error("No sales dashboard is included.");
  return {
    root: import.meta.dirname,
    publicDir: false,
    plugins: [react(), localRoleRouting],
    base: command === "build" ? `/${role}/` : "/",
    define: {
      __STAFF_PREVIEW_ALLOWED__: JSON.stringify(command === "serve"),
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
