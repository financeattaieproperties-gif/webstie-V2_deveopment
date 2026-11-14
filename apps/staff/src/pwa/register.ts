export function registerSalesServiceWorker(panelId: string): void {
  if (typeof window === "undefined" || panelId !== "sales") return;
  if (!("serviceWorker" in navigator)) return;
  if (window.location.protocol !== "https:" && window.location.protocol !== "http:") {
    return;
  }

  const win = window as unknown as {
    __ATTAIE_ANDROID_APP__?: boolean;
    AttaieBiometric?: unknown;
  };
  // Native APK bundles assets locally via WebViewAssetLoader and uses offline snapshot storage.
  if (win.__ATTAIE_ANDROID_APP__ || win.AttaieBiometric) return;

  const isLocalSalesPath = window.location.pathname.startsWith("/sales");
  const swUrl = isLocalSalesPath ? "/sales/sw.js" : "./sw.js";
  const scope = isLocalSalesPath ? "/sales/" : "./";

  const register = () => {
    navigator.serviceWorker
      .register(swUrl, { scope })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const nextWorker = registration.installing;
          if (!nextWorker) return;
          nextWorker.addEventListener("statechange", () => {
            if (
              nextWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // skipWaiting/clientsClaim already activate updated Sales assets silently
            }
          });
        });
      })
      .catch(() => {
        // Ignore registration errors in constrained preview/sandboxed contexts
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
