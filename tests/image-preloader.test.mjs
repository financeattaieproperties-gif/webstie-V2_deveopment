import test from "node:test";
import assert from "node:assert/strict";
import {
  clearImagePreloadCache,
  extractCriticalProjectImageUrls,
  isImagePreloaded,
  preloadCriticalProjectImages,
} from "../src/lib/imagePreloader.ts";

test("extractCriticalProjectImageUrls deduplicates URLs and prioritizes active card index", () => {
  const items = [
    { imgSrc: "/assets/img-1.jpg" },
    { imgSrc: "/assets/img-2.jpg" },
    { imgSrc: "/assets/img-1.jpg" },
    { imgSrc: "" },
  ];

  const urls = extractCriticalProjectImageUrls(items, {
    priorityIndex: 1,
    fallbackUrl: "/assets/fallback.jpg",
  });

  assert.deepEqual(urls, [
    "/assets/img-2.jpg",
    "/assets/img-1.jpg",
    "/assets/fallback.jpg",
  ]);
});

test("preloadCriticalProjectImages decodes and caches critical images with high priority on first item", async () => {
  clearImagePreloadCache();
  const createdImages = [];

  const createImage = () => {
    const mock = {
      _src: "",
      decoding: "auto",
      fetchPriority: "auto",
      onload: null,
      onerror: null,
      decode() {
        return Promise.resolve();
      },
      set src(value) {
        this._src = value;
        queueMicrotask(() => {
          if (this.onload) this.onload();
        });
      },
      get src() {
        return this._src;
      },
    };
    createdImages.push(mock);
    return mock;
  };

  const results = await preloadCriticalProjectImages(
    [{ imgSrc: "/assets/a.jpg" }, { imgSrc: "/assets/b.jpg" }],
    { priorityIndex: 1, createImage },
  );

  assert.equal(results.length, 2);
  assert.deepEqual(results[0], { url: "/assets/b.jpg", loaded: true });
  assert.deepEqual(results[1], { url: "/assets/a.jpg", loaded: true });
  assert.equal(createdImages[0].fetchPriority, "high");
  assert.equal(createdImages[1].fetchPriority, "auto");
  assert.equal(isImagePreloaded("/assets/a.jpg"), true);
  assert.equal(isImagePreloaded("/assets/b.jpg"), true);
});
