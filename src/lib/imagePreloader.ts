export interface PreloadableImageItem {
  imgSrc?: string | null;
  image_url?: string | null;
}

export interface ImagePreloadResult {
  url: string;
  loaded: boolean;
}

export interface ImagePreloaderOptions {
  /** Index of the active/initial card to prioritize with fetchPriority="high" */
  priorityIndex?: number;
  /** Fallback image URL to include and use when an item has no valid image URL */
  fallbackUrl?: string;
  /** Optional custom image constructor for deterministic unit testing */
  createImage?: () => {
    src: string;
    decoding?: string;
    fetchPriority?: string;
    onload: (() => void) | null;
    onerror: (() => void) | null;
    decode?: () => Promise<void>;
  };
}

const preloadPromiseCache = new Map<string, Promise<ImagePreloadResult>>();
const decodedUrlCache = new Set<string>();

/**
 * Extracts a deduplicated, ordered list of non-empty image URLs from card/project items.
 * Moves the `priorityIndex` item's URL to the front of the preload queue so the active
 * card image is always decoded first.
 */
export function extractCriticalProjectImageUrls(
  items: ReadonlyArray<PreloadableImageItem | string | null | undefined>,
  options: Pick<ImagePreloaderOptions, "priorityIndex" | "fallbackUrl"> = {},
): string[] {
  const { priorityIndex = 0, fallbackUrl } = options;
  const rawUrls: string[] = [];

  items.forEach((item) => {
    if (!item) return;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) rawUrls.push(trimmed);
      return;
    }
    const candidate = (item.imgSrc || item.image_url || fallbackUrl || "").trim();
    if (candidate) {
      rawUrls.push(candidate);
    }
  });

  if (fallbackUrl && fallbackUrl.trim()) {
    rawUrls.push(fallbackUrl.trim());
  }

  // Prioritize the active card index at the head of the queue
  if (
    priorityIndex >= 0 &&
    priorityIndex < items.length &&
    items[priorityIndex]
  ) {
    const priorityItem = items[priorityIndex];
    const priorityUrl =
      typeof priorityItem === "string"
        ? priorityItem.trim()
        : (
            priorityItem?.imgSrc ||
            priorityItem?.image_url ||
            fallbackUrl ||
            ""
          ).trim();
    if (priorityUrl) {
      rawUrls.unshift(priorityUrl);
    }
  }

  return Array.from(new Set(rawUrls));
}

/**
 * Returns true if the given image URL has already been preloaded and decoded in memory.
 */
export function isImagePreloaded(url?: string | null): boolean {
  if (!url) return false;
  return decodedUrlCache.has(url.trim());
}

/**
 * Clears the in-memory preload cache (primarily used for isolated unit tests).
 */
export function clearImagePreloadCache(): void {
  preloadPromiseCache.clear();
  decodedUrlCache.clear();
}

/**
 * Preloads and decodes a single image URL in memory so expanding a card never triggers
 * a network fetch delay or layout/paint shift.
 */
export function preloadImageAsset(
  url: string,
  highPriority = false,
  createImage?: ImagePreloaderOptions["createImage"],
): Promise<ImagePreloadResult> {
  const normalizedUrl = (url || "").trim();
  if (!normalizedUrl) {
    return Promise.resolve({ url: "", loaded: false });
  }

  if (decodedUrlCache.has(normalizedUrl)) {
    return Promise.resolve({ url: normalizedUrl, loaded: true });
  }

  const cachedPromise = preloadPromiseCache.get(normalizedUrl);
  if (cachedPromise) {
    return cachedPromise;
  }

  if (typeof window === "undefined" && !createImage) {
    return Promise.resolve({ url: normalizedUrl, loaded: false });
  }

  const promise = new Promise<ImagePreloadResult>((resolve) => {
    try {
      const img = createImage ? createImage() : new window.Image();
      img.decoding = "async";
      if ("fetchPriority" in img) {
        img.fetchPriority = highPriority ? "high" : "auto";
      }

      let settled = false;
      const finish = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        if (loaded) {
          decodedUrlCache.add(normalizedUrl);
        } else {
          preloadPromiseCache.delete(normalizedUrl);
        }
        resolve({ url: normalizedUrl, loaded });
      };

      img.onload = () => {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(() => finish(true))
            .catch(() => finish(true));
        } else {
          finish(true);
        }
      };

      img.onerror = () => {
        finish(false);
      };

      img.src = normalizedUrl;
    } catch {
      resolve({ url: normalizedUrl, loaded: false });
    }
  });

  preloadPromiseCache.set(normalizedUrl, promise);
  return promise;
}

/**
 * Preloads and decodes all critical project card images concurrently.
 */
export function preloadCriticalProjectImages(
  items: ReadonlyArray<PreloadableImageItem | string | null | undefined>,
  options: ImagePreloaderOptions = {},
): Promise<ImagePreloadResult[]> {
  const urls = extractCriticalProjectImageUrls(items, options);
  return Promise.all(
    urls.map((url, idx) =>
      preloadImageAsset(url, idx === 0, options.createImage),
    ),
  );
}
