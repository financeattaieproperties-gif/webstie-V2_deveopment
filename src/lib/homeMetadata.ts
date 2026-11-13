import { SEO_CONFIG, type SeoMetadata } from './seoConfig';
import {
  buildHeadTagDescriptors,
  generateMetaTagsByPath,
  type GeneratedHeadTags,
} from './metaTagService';
import type { SiteSeoSettings } from './dbService';

export interface GenerateHomeMetadataOptions {
  /** Active UI language ('en' | 'fa') */
  language?: string;
  /** Current route pathname (defaults to '/') */
  pathname?: string;
  /** Optional query string */
  search?: string;
  /** Optional runtime SEO settings from the database/admin panel */
  siteSettings?: SiteSeoSettings | null;
  /** Explicit SEO field overrides */
  overrides?: Partial<SeoMetadata>;
}

/**
 * Pure helper that computes the resolved SEO metadata and head tag descriptors
 * for the Home page across English and Dari/Farsi ('fa') locales.
 */
export function resolveHomeMetadata(
  options: GenerateHomeMetadataOptions = {}
): GeneratedHeadTags & { seo: SeoMetadata } {
  const language = options.language || 'en';
  const pathname = options.pathname || '/';
  const search = options.search || '';
  const currentPath = `${pathname}${search}`;
  const siteSettings = options.siteSettings ?? null;

  const hasExplicitSiteKeywords =
    siteSettings?.keywords !== undefined && siteSettings?.keywords !== null;

  const globalKeywords = hasExplicitSiteKeywords
    ? String(siteSettings?.keywords ?? '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const resolvedSeo = generateMetaTagsByPath(currentPath, {
    language,
    overrides: {
      ...(hasExplicitSiteKeywords ? { keywords: globalKeywords } : {}),
      ...options.overrides,
    },
  });

  const siteName = siteSettings?.site_name?.trim() || SEO_CONFIG.siteName;
  const globalNoIndex =
    siteSettings?.robots_index !== undefined
      ? !siteSettings.robots_index
      : !SEO_CONFIG.robotsIndex;

  const headTags = buildHeadTagDescriptors(resolvedSeo, {
    language,
    siteName,
    twitterCard: siteSettings?.twitter_card || SEO_CONFIG.twitterCard,
    twitterSite: siteSettings?.twitter_site?.trim() || SEO_CONFIG.twitterSite,
    globalKeywords,
    globalNoIndex,
  });

  return {
    ...headTags,
    seo: resolvedSeo,
  };
}
