import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";

const localRoleRouting: Plugin = {
  name: "staff-local-role-routing",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const [pathname, query] = (request.url || "").split("?");
      const match = pathname.match(
        /^\/(callcenter|management|dashboard|sales)(?:\/(?:overview|followups|customers|leads|projects|tasks|team|hr|finance|marketing|submissions|engineering|profile))?\/?$/,
      );
      if (match) {
        const entry = match[1] === "sales" ? "dashboard" : match[1];
        request.url = `/${entry}/index.html${query ? `?${query}` : ""}`;
      }
      next();
    });
  },
};

export default defineConfig(({ command }) => {
  const role = process.env.STAFF_ROLE || "callcenter";
  if (!["callcenter", "management", "dashboard", "sales"].includes(role))
    throw new Error("Unsupported staff build role.");
  const isMobileApp = process.env.STAFF_MOBILE_APP === "1";
  const isSalesPwa = role === "sales";
  const htmlEntryRole = role === "sales" ? "dashboard" : role;
  const allowPreview =
    command === "serve" || process.env.STAFF_ALLOW_PREVIEW === "1";

  const plugins = [react(), localRoleRouting];
  if (isSalesPwa) {
    const scope = isMobileApp ? "./" : "/sales/";
    const startUrl = isMobileApp ? "./index.html" : "/sales/leads";
    const navigateFallback = isMobileApp ? "index.html" : "/sales/index.html";
    plugins.push(
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: [
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-512x512.png",
          "apple-touch-icon.png",
        ],
        manifest: {
          id: scope,
          name: "Attaie Sales CRM",
          short_name: "Attaie Sales",
          description:
            "Offline-capable Sales Agent CRM workspace for Attaie Properties.",
          start_url: startUrl,
          scope,
          display: "standalone",
          orientation: "portrait",
          theme_color: "#0F172A",
          background_color: "#F7F8FA",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2,webmanifest}"],
          navigateFallback,
          navigateFallbackDenylist: [/^\/staff-api\//, /^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          manifestTransforms: [
            async (entries) => ({
              manifest: entries.map((entry) => ({
                ...entry,
                url: entry.url
                  .replace(/\/dashboard\/index\.html$/, "/index.html")
                  .replace(/^dashboard\/index\.html$/, "index.html"),
              })),
            }),
          ],
          runtimeCaching: [
            {
              urlPattern: ({ url, request }) =>
                request.method === "GET" &&
                (url.pathname.includes("/staff-api/v1/dashboard") ||
                  url.pathname.includes("/staff-api/v1/leads/")),
              handler: "NetworkFirst",
              options: {
                cacheName: "attaie-sales-api-cache",
                networkTimeoutSeconds: 4,
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          navigateFallback: "/sales/index.html",
        },
      }),
    );
  }

  return {
    root: import.meta.dirname,
    publicDir: isSalesPwa ? resolve(import.meta.dirname, "pwa-assets") : false,
    plugins,
    base: command === "build" ? (isMobileApp ? "./" : `/${role}/`) : "/",
    define: {
      __STAFF_PREVIEW_ALLOWED__: JSON.stringify(allowPreview),
      __STAFF_ROLE__: JSON.stringify(role),
    },
    build: {
      rollupOptions: {
        input: resolve(import.meta.dirname, `${htmlEntryRole}/index.html`),
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
