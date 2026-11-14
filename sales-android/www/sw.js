/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-970124e6'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "1d86fbaf605299570d6340b76373c16e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "deaa8668e4124f54852f91f06afd6aa5"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c53fb9ea8269a21799ba04eaf7217004"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6a6c559b6989dfdc8f1f8a38bf963386"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e04fc45d2129633250578fe6f19126af"
  }, {
    "url": "index.html",
    "revision": "a54f721094cfb8e3de3725df7e59b077"
  }, {
    "url": "assets/window-4-C9gUup8J.png",
    "revision": null
  }, {
    "url": "assets/window-3-BDxAokBF.png",
    "revision": null
  }, {
    "url": "assets/window-2-Efk2mi8V.png",
    "revision": null
  }, {
    "url": "assets/window-1-CFFOBQvH.png",
    "revision": null
  }, {
    "url": "assets/tower-E0iw_gMn.png",
    "revision": null
  }, {
    "url": "assets/swoosh-DlgFXbyr.png",
    "revision": null
  }, {
    "url": "assets/roof-DvZVvg-m.png",
    "revision": null
  }, {
    "url": "assets/properties-C6ZTuQY_.png",
    "revision": null
  }, {
    "url": "assets/keys-C3odUwaQ.png",
    "revision": null
  }, {
    "url": "assets/index-C6EjMNWq.css",
    "revision": null
  }, {
    "url": "assets/index-BaXdezBX.js",
    "revision": null
  }, {
    "url": "assets/fa-CFWleIc4.js",
    "revision": null
  }, {
    "url": "assets/attaie-original-D6FwvO_c.png",
    "revision": null
  }, {
    "url": "assets/attaie-CCD2gqn6.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e04fc45d2129633250578fe6f19126af"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c53fb9ea8269a21799ba04eaf7217004"
  }, {
    "url": "pwa-512x512.png",
    "revision": "deaa8668e4124f54852f91f06afd6aa5"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "1d86fbaf605299570d6340b76373c16e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "6a6c559b6989dfdc8f1f8a38bf963386"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/staff-api\//, /^\/api\//]
  }));
  workbox.registerRoute(({
    url,
    request
  }) => request.method === "GET" && (url.pathname.includes("/staff-api/v1/dashboard") || url.pathname.includes("/staff-api/v1/leads/")), new workbox.NetworkFirst({
    "cacheName": "attaie-sales-api-cache",
    "networkTimeoutSeconds": 4,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
