import * as React from "react";
import { Helmet } from "react-helmet-async";
import {
  extractCriticalProjectImageUrls,
  isImagePreloaded,
  preloadCriticalProjectImages,
  type PreloadableImageItem,
} from "@/lib/imagePreloader";

export interface UsePreloadProjectImagesOptions {
  /** Active or default card index whose image should receive highest fetch priority */
  priorityIndex?: number;
  /** Fallback image URL when a card item has no image */
  fallbackUrl?: string;
}

export interface UsePreloadProjectImagesResult {
  /** Ordered, deduplicated critical image URLs (with priority image first) */
  urls: string[];
  /** Set of image URLs that have finished preloading and decoding */
  loadedUrls: ReadonlySet<string>;
  /** True once all critical project images have settled */
  isReady: boolean;
  /** Helper to check if a specific image URL is decoded and ready */
  isUrlReady: (url?: string | null) => boolean;
}

/**
 * React hook that preloads and asynchronously decodes all critical project card images
 * so expanding cards transition smoothly with zero layout shift (CLS = 0) or paint flicker.
 */
export function usePreloadProjectImages(
  items: ReadonlyArray<PreloadableImageItem | string | null | undefined>,
  options: UsePreloadProjectImagesOptions = {},
): UsePreloadProjectImagesResult {
  const { priorityIndex = 0, fallbackUrl } = options;

  const urls = React.useMemo(
    () =>
      extractCriticalProjectImageUrls(items, {
        priorityIndex,
        fallbackUrl,
      }),
    [items, priorityIndex, fallbackUrl],
  );

  const [loadedUrls, setLoadedUrls] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const url of urls) {
      if (isImagePreloaded(url)) {
        initial.add(url);
      }
    }
    return initial;
  });

  const [isReady, setIsReady] = React.useState<boolean>(() =>
    urls.every((url) => isImagePreloaded(url)),
  );

  React.useEffect(() => {
    if (urls.length === 0) {
      setIsReady(true);
      return;
    }

    let cancelled = false;

    preloadCriticalProjectImages(items, {
      priorityIndex,
      fallbackUrl,
    }).then((results) => {
      if (cancelled) return;
      setLoadedUrls((prev) => {
        const next = new Set(prev);
        for (const res of results) {
          if (res.loaded && res.url) {
            next.add(res.url);
          }
        }
        return next;
      });
      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [items, urls, priorityIndex, fallbackUrl]);

  const isUrlReady = React.useCallback(
    (url?: string | null) => {
      if (!url) return false;
      const trimmed = url.trim();
      return loadedUrls.has(trimmed) || isImagePreloaded(trimmed);
    },
    [loadedUrls],
  );

  return {
    urls,
    loadedUrls,
    isReady,
    isUrlReady,
  };
}

export interface CriticalImagePreloaderProps
  extends UsePreloadProjectImagesOptions {
  /** Project or card items whose images should be preloaded */
  items: ReadonlyArray<PreloadableImageItem | string | null | undefined>;
}

/**
 * Helper component that injects `<link rel="preload" as="image">` tags into `<head>`
 * via `react-helmet-async` and warms the browser's decoded image cache to prevent
 * layout shift or paint delay when expanding project cards.
 */
export const CriticalImagePreloader: React.FC<CriticalImagePreloaderProps> = ({
  items,
  priorityIndex = 0,
  fallbackUrl,
}) => {
  const { urls } = usePreloadProjectImages(items, {
    priorityIndex,
    fallbackUrl,
  });

  if (urls.length === 0) return null;

  return (
    <Helmet prioritizeSeoTags={false}>
      {urls.map((url, index) => (
        <link
          key={`preload-project-img-${url}`}
          rel="preload"
          as="image"
          href={url}
          fetchPriority={index === 0 ? "high" : "auto"}
        />
      ))}
    </Helmet>
  );
};
