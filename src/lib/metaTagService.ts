import type { Property, Project, Agent, CareerJob } from './dbService';
import {
  SEO_CONFIG,
  PAGE_SEO,
  buildPropertySeo,
  buildProjectSeo,
  buildAgentSeo,
  buildCareerSeo,
  resolveAbsoluteUrl,
  truncateMetaDescription,
  type SeoMetadata,
} from './seoConfig';

export interface MetaTagContext {
  /** Query string, URLSearchParams, or key-value map from the current URL */
  searchParams?: URLSearchParams | string | Record<string, string | undefined>;
  /** Active UI language ('en' | 'fa') */
  language?: string;
  /** Loaded Property entity for /properties/:id */
  property?: Property | null;
  /** Loaded Project entity for /projects/:id */
  project?: Project | null;
  /** Loaded Agent entity for /agents/:id */
  agent?: Agent | null;
  /** Loaded CareerJob entity for /careers/:id */
  careerJob?: CareerJob | null;
  /** Optional active filter on /projects or /properties */
  filterStatus?: string;
  /** Active property purpose ('buy' | 'rent' | 'commercial') */
  purpose?: 'buy' | 'rent' | 'commercial';
  /** Active property types (e.g. ['Villa', 'Apartment']) */
  propertyTypes?: string[];
  /** Explicit field overrides */
  overrides?: Partial<SeoMetadata>;
}

export interface HtmlMetaTagDescriptor {
  key: string;
  name?: string;
  property?: string;
  content: string;
}

export interface GeneratedHeadTags {
  title: string;
  canonicalUrl: string;
  htmlLang: string;
  htmlDir: 'ltr' | 'rtl';
  metaTags: HtmlMetaTagDescriptor[];
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Normalizes a full URL or path+search into { pathname, searchParams }.
 */
function parsePathAndQuery(
  pathOrUrl: string,
  externalSearchParams?: MetaTagContext['searchParams']
): { pathname: string; params: URLSearchParams } {
  let rawPath = (pathOrUrl || '/').trim();

  try {
    if (/^https?:\/\//i.test(rawPath)) {
      const parsed = new URL(rawPath);
      rawPath = `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Fallback to raw string parsing
  }

  const [pathnamePart, inlineQuery = ''] = rawPath.split('?');
  const normalizedPathname =
    pathnamePart && pathnamePart !== '/'
      ? `/${pathnamePart.replace(/^\/+|\/+$/g, '')}`
      : '/';

  const params = new URLSearchParams(inlineQuery);

  if (externalSearchParams) {
    if (typeof externalSearchParams === 'string') {
      const extra = new URLSearchParams(externalSearchParams);
      extra.forEach((value, key) => params.set(key, value));
    } else if (externalSearchParams instanceof URLSearchParams) {
      externalSearchParams.forEach((value, key) => params.set(key, value));
    } else if (typeof externalSearchParams === 'object') {
      Object.entries(externalSearchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, value);
        }
      });
    }
  }

  return { pathname: normalizedPathname, params };
}

/**
 * localized static route titles & descriptions for Dari/Farsi ('fa') when active.
 */
const FA_STATIC_META: Record<
  'home' | 'properties' | 'projects' | 'agents' | 'careers' | 'about' | 'contact' | 'notFound',
  { title: string; description: string }
> = {
  home: {
    title: 'رهنمای معاملات عطایی — خرید، فروش و کرایه املاک در کابل، افغانستان',
    description:
      'مشاهده ویلاهای لوکس، آپارتمان‌های عصری، دفاتر تجارتی و پروژه‌های ساختمانی معتبر برای فروش و کرایه در کابل با رهنمای معاملات عطایی.',
  },
  properties: {
    title: 'جایدادها برای فروش و کرایه در کابل | رهنمای معاملات عطایی',
    description:
      'جستجوی ویلاها، آپارتمان‌ها، خانه‌ها، املاک تجارتی و زمین‌های تایید شده برای خرید و کرایه در نقاط مختلف کابل با قیمت و تصاویر.',
  },
  projects: {
    title: 'پروژه‌های ساختمانی و شهرک‌های رهایشی در کابل | رهنمای معاملات عطایی',
    description:
      'معرفی پروژه‌های رهایشی و تجارتی رهنمای معاملات عطایی در کابل همراه با ماسترپلان، تاریخ تحویل‌دهی و واحدهای موجود.',
  },
  agents: {
    title: 'مشاورین و نمایندگان املاک ما | رهنمای معاملات عطایی',
    description:
      'با تیم مشاورین باتجربه رهنمای معاملات عطایی در کابل برای خرید، فروش و کرایه جایداد آشنا شوید.',
  },
  careers: {
    title: 'فرصت‌های شغلی و استخدام در کابل | رهنمای معاملات عطایی',
    description:
      'به تیم رهنمای معاملات عطایی در کابل بپیوندید. مشاهده بست‌های خالی در بخش فروشات، انجنیری، بازاریابی و ارسال آنلاین درخواستی.',
  },
  about: {
    title: 'درباره رهنمای معاملات عطایی — مشاور معتبر املاک در کابل',
    description:
      'آشنایی با تاریخچه، خدمات، دفاتر و تعهد رهنمای معاملات عطایی در ارائه خدمات شفاف خرید و فروش جایداد در کابل، افغانستان.',
  },
  contact: {
    title: 'تماس با ما و ثبت درخواست مشاوره | رهنمای معاملات عطایی',
    description:
      'تماس مستقیم با دفتر مرکزی رهنمای معاملات عطایی در وزیر محمد اکبر خان کابل از طریق تلفن، واتساپ یا فرم آنلاین.',
  },
  notFound: {
    title: '۴۰۴ — صفحه مورد نظر یافت نشد | رهنمای معاملات عطایی',
    description:
      'صفحه‌ای که به دنبال آن هستید وجود ندارد. جایدادها و پروژه‌های معتبر کابل را در وبسایت عطایی مشاهده کنید.',
  },
};

/**
 * Generates dynamic, unique SEO metadata (Title, Description, Canonical URL,
 * Open Graph, Twitter Cards, and JSON-LD) based on the current page path and context.
 */
export function generateMetaTagsByPath(
  pathOrUrl: string,
  context: MetaTagContext = {}
): SeoMetadata {
  const { pathname, params } = parsePathAndQuery(pathOrUrl, context.searchParams);
  const isFa = context.language?.toLowerCase().startsWith('fa') ?? false;
  let result: SeoMetadata;

  // 1. Home Page: /
  if (pathname === '/') {
    result = {
      ...PAGE_SEO.home,
      ...(isFa
        ? {
            title: FA_STATIC_META.home.title,
            description: FA_STATIC_META.home.description,
          }
        : {}),
    };
  }
  // 2. Properties & Projects Listing: /properties
  else if (pathname === '/properties') {
    const category = params.get('category');
    const isProjects = category === 'projects';
    const search = (params.get('search') ?? params.get('serial_number') ?? '').trim();
    const purpose = context.purpose || (params.get('purpose') as MetaTagContext['purpose']) || undefined;
    const typeParam =
      context.propertyTypes && context.propertyTypes.length > 0
        ? context.propertyTypes[0]
        : params.get('type') || undefined;

    if (isProjects) {
      const canonicalUrl = resolveAbsoluteUrl('/properties?category=projects');
      const title = isFa
        ? FA_STATIC_META.projects.title
        : `Signature Real Estate Projects in Kabul | ${SEO_CONFIG.siteName}`;
      const description = isFa
        ? FA_STATIC_META.projects.description
        : 'Explore premium residential and commercial development projects in Kabul, Afghanistan. View masterplans, delivery dates, and apartments by Attaie Properties.';

      result = {
        ...PAGE_SEO.projects,
        title,
        description,
        canonicalUrl,
        ogImageAlt: title,
      };
    } else {
      const purposeLabel =
        purpose === 'rent'
          ? 'for Rent'
          : purpose === 'commercial'
          ? 'Commercial Properties'
          : purpose === 'buy'
          ? 'for Sale'
          : 'for Sale & Rent';

      let title = isFa ? FA_STATIC_META.properties.title : PAGE_SEO.properties.title;
      let description = isFa ? FA_STATIC_META.properties.description : PAGE_SEO.properties.description;

      if (search) {
        title = `Search Results for "${search}" — Kabul Properties | ${SEO_CONFIG.siteName}`;
        description = truncateMetaDescription(
          `Browse verified properties matching "${search}" ${purposeLabel.toLowerCase()} in Kabul with live pricing, photos, and direct inquiry on ${SEO_CONFIG.siteName}.`
        );
      } else if (typeParam) {
        title = `${typeParam}s ${purposeLabel} in Kabul | ${SEO_CONFIG.siteName}`;
        description = truncateMetaDescription(
          `Explore verified ${typeParam.toLowerCase()} listings ${purposeLabel.toLowerCase()} across Kabul, Afghanistan. View high-resolution photos, floor plans, and live pricing with ${SEO_CONFIG.siteName}.`
        );
      } else if (purpose === 'rent') {
        title = `Properties for Rent in Kabul — Apartments, Villas & Offices | ${SEO_CONFIG.siteName}`;
        description = truncateMetaDescription(
          `Find verified apartments, luxury villas, and commercial spaces for rent in Kabul, Afghanistan with ${SEO_CONFIG.siteName}.`
        );
      } else if (purpose === 'commercial') {
        title = `Commercial Properties & Offices in Kabul | ${SEO_CONFIG.siteName}`;
        description = truncateMetaDescription(
          `Browse prime commercial spaces, retail units, and office buildings for sale and lease in Kabul with ${SEO_CONFIG.siteName}.`
        );
      }

      const canonicalQuery = new URLSearchParams();
      if (typeParam) canonicalQuery.set('type', typeParam);
      if (purpose && purpose !== 'buy') canonicalQuery.set('purpose', purpose);
      const canonicalSuffix = canonicalQuery.toString() ? `?${canonicalQuery.toString()}` : '';

      result = {
        ...PAGE_SEO.properties,
        title,
        description,
        canonicalUrl: resolveAbsoluteUrl(`/properties${canonicalSuffix}`),
        ogImageAlt: title,
      };
    }
  }
  // 3. Property Detail Page: /properties/:id
  else if (/^\/properties\/([^/]+)$/.test(pathname)) {
    const idMatch = pathname.match(/^\/properties\/([^/]+)$/);
    const propertyId = idMatch?.[1] ?? '';
    const built = buildPropertySeo(context.property ?? null, propertyId);

    if (!context.property && propertyId) {
      built.title = `Property Listing #${propertyId} in Kabul | ${SEO_CONFIG.siteName}`;
      built.description = truncateMetaDescription(
        `View full specifications, photo gallery, pricing, and schedule a viewing for Property #${propertyId} in Kabul with ${SEO_CONFIG.siteName}.`
      );
      built.ogImageAlt = `Property Listing #${propertyId} — ${SEO_CONFIG.siteName}`;
    }
    result = built;
  }
  // 4. Projects Listing Page: /projects
  else if (pathname === '/projects') {
    const statusFilter =
      context.filterStatus && context.filterStatus !== 'All'
        ? context.filterStatus
        : params.get('status') || undefined;

    let title = isFa ? FA_STATIC_META.projects.title : PAGE_SEO.projects.title;
    let description = isFa ? FA_STATIC_META.projects.description : PAGE_SEO.projects.description;

    if (statusFilter) {
      title = `${statusFilter} Real Estate Developments in Kabul | ${SEO_CONFIG.siteName}`;
      description = truncateMetaDescription(
        `Explore ${statusFilter.toLowerCase()} residential and commercial development projects in Kabul, Afghanistan by ${SEO_CONFIG.siteName}.`
      );
    }

    result = {
      ...PAGE_SEO.projects,
      title,
      description,
      canonicalUrl: resolveAbsoluteUrl('/projects'),
      ogImageAlt: title,
    };
  }
  // 5. Project Detail Page: /projects/:id
  else if (/^\/projects\/([^/]+)$/.test(pathname)) {
    const idMatch = pathname.match(/^\/projects\/([^/]+)$/);
    const projectId = idMatch?.[1] ?? '';
    const built = buildProjectSeo(context.project ?? null, projectId);

    if (!context.project && projectId) {
      built.title = `Development Project #${projectId} in Kabul | ${SEO_CONFIG.siteName}`;
      built.description = truncateMetaDescription(
        `Explore architectural masterplans, available apartment units, and delivery timelines for Development Project #${projectId} in Kabul by ${SEO_CONFIG.siteName}.`
      );
      built.ogImageAlt = `Development Project #${projectId} — ${SEO_CONFIG.siteName}`;
    }
    result = built;
  }
  // 6. Agents Directory Page: /agents
  else if (pathname === '/agents') {
    result = {
      ...PAGE_SEO.agents,
      ...(isFa
        ? {
            title: FA_STATIC_META.agents.title,
            description: FA_STATIC_META.agents.description,
          }
        : {}),
      canonicalUrl: resolveAbsoluteUrl('/agents'),
    };
  }
  // 7. Agent Detail Page: /agents/:id
  else if (/^\/agents\/([^/]+)$/.test(pathname)) {
    const idMatch = pathname.match(/^\/agents\/([^/]+)$/);
    const agentId = idMatch?.[1] ?? '';
    const built = buildAgentSeo(context.agent ?? null, agentId);

    if (!context.agent && agentId) {
      built.title = `Real Estate Advisor Profile #${agentId} | ${SEO_CONFIG.siteName}`;
      built.description = truncateMetaDescription(
        `Connect directly with Real Estate Advisor #${agentId} at ${SEO_CONFIG.siteName} in Kabul for buying, selling, and leasing inquiries.`
      );
      built.ogImageAlt = `Real Estate Advisor #${agentId} — ${SEO_CONFIG.siteName}`;
    }
    result = built;
  }
  // 8. Careers Listing Page: /careers
  else if (pathname === '/careers') {
    result = {
      ...PAGE_SEO.careers,
      ...(isFa
        ? {
            title: FA_STATIC_META.careers.title,
            description: FA_STATIC_META.careers.description,
          }
        : {}),
      canonicalUrl: resolveAbsoluteUrl('/careers'),
    };
  }
  // 9. Career Detail Page: /careers/:id
  else if (/^\/careers\/([^/]+)$/.test(pathname)) {
    const idMatch = pathname.match(/^\/careers\/([^/]+)$/);
    const jobId = idMatch?.[1] ?? '';
    const built = buildCareerSeo(context.careerJob ?? null, jobId);

    if (!context.careerJob && jobId) {
      built.title = `Career Opportunity #${jobId} in Kabul | ${SEO_CONFIG.siteName}`;
      built.description = truncateMetaDescription(
        `View job requirements, application deadline, and apply online for Career Opportunity #${jobId} at ${SEO_CONFIG.siteName} in Kabul.`
      );
      built.ogImageAlt = `Career Opportunity #${jobId} — ${SEO_CONFIG.siteName}`;
    }
    result = built;
  }
  // 10. About Page: /about
  else if (pathname === '/about') {
    result = {
      ...PAGE_SEO.about,
      ...(isFa
        ? {
            title: FA_STATIC_META.about.title,
            description: FA_STATIC_META.about.description,
          }
        : {}),
      canonicalUrl: resolveAbsoluteUrl('/about'),
    };
  }
  // 11. Contact Page: /contact
  else if (pathname === '/contact') {
    result = {
      ...PAGE_SEO.contact,
      ...(isFa
        ? {
            title: FA_STATIC_META.contact.title,
            description: FA_STATIC_META.contact.description,
          }
        : {}),
      canonicalUrl: resolveAbsoluteUrl('/contact'),
    };
  }
  // 12. Fallback / 404 Route
  else {
    result = {
      ...PAGE_SEO.notFound,
      ...(isFa
        ? {
            title: FA_STATIC_META.notFound.title,
            description: FA_STATIC_META.notFound.description,
          }
        : {}),
      canonicalUrl: resolveAbsoluteUrl(pathname),
    };
  }

  if (context.overrides) {
    return {
      ...result,
      ...context.overrides,
      title: context.overrides.title || result.title,
      description: context.overrides.description || result.description,
      canonicalUrl: context.overrides.canonicalUrl || result.canonicalUrl,
      ogImage: context.overrides.ogImage || result.ogImage,
    };
  }

  return result;
}

/**
 * Builds a structured set of HTML meta tag descriptors (standard, Open Graph, and Twitter Card)
 * from a resolved `SeoMetadata` object.
 */
export function buildHeadTagDescriptors(
  seo: SeoMetadata,
  options?: {
    language?: string;
    siteName?: string;
    twitterCard?: 'summary_large_image' | 'summary';
    twitterSite?: string | null;
    globalKeywords?: string[];
    globalNoIndex?: boolean;
  }
): GeneratedHeadTags {
  const isRtl = Boolean(options?.language?.toLowerCase().startsWith('fa'));
  const htmlLang = isRtl ? 'fa' : 'en';
  const htmlDir: 'ltr' | 'rtl' = isRtl ? 'rtl' : 'ltr';
  const primaryLocale = isRtl ? SEO_CONFIG.alternateLocale : SEO_CONFIG.locale;
  const secondaryLocale = isRtl ? SEO_CONFIG.locale : SEO_CONFIG.alternateLocale;

  const siteName = options?.siteName?.trim() || SEO_CONFIG.siteName;
  const title = seo.title || SEO_CONFIG.defaultTitle;
  const description = seo.description || SEO_CONFIG.defaultDescription;
  const canonicalUrl = seo.canonicalUrl || SEO_CONFIG.siteUrl;
  const ogType = seo.ogType || 'website';
  const ogImage = resolveAbsoluteUrl(seo.ogImage || SEO_CONFIG.defaultImage);
  const twitterImage = seo.twitterImage
    ? resolveAbsoluteUrl(seo.twitterImage)
    : SEO_CONFIG.defaultTwitterImage || ogImage;
  const ogImageAlt = seo.ogImageAlt || title;
  const twitterCard = options?.twitterCard || SEO_CONFIG.twitterCard;
  const twitterSite = options?.twitterSite ?? SEO_CONFIG.twitterSite;

  const mergedKeywords = Array.from(
    new Set([...(seo.keywords ?? []), ...(options?.globalKeywords ?? [])])
  );
  const shouldNoIndex = Boolean(seo.NoIndex || options?.globalNoIndex);

  const metaTags: HtmlMetaTagDescriptor[] = [
    { key: 'description', name: 'description', content: description },
    {
      key: 'robots',
      name: 'robots',
      content: shouldNoIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    },
    // Open Graph
    { key: 'og:type', property: 'og:type', content: ogType },
    { key: 'og:site_name', property: 'og:site_name', content: siteName },
    { key: 'og:locale', property: 'og:locale', content: primaryLocale },
    { key: 'og:locale:alternate', property: 'og:locale:alternate', content: secondaryLocale },
    { key: 'og:title', property: 'og:title', content: title },
    { key: 'og:description', property: 'og:description', content: description },
    { key: 'og:url', property: 'og:url', content: canonicalUrl },
    { key: 'og:image', property: 'og:image', content: ogImage },
    { key: 'og:image:secure_url', property: 'og:image:secure_url', content: ogImage },
    { key: 'og:image:alt', property: 'og:image:alt', content: ogImageAlt },
    // Twitter / X Card
    { key: 'twitter:card', name: 'twitter:card', content: twitterCard },
    { key: 'twitter:title', name: 'twitter:title', content: title },
    { key: 'twitter:description', name: 'twitter:description', content: description },
    { key: 'twitter:image', name: 'twitter:image', content: twitterImage },
    { key: 'twitter:image:alt', name: 'twitter:image:alt', content: ogImageAlt },
  ];

  if (mergedKeywords.length > 0) {
    metaTags.push({
      key: 'keywords',
      name: 'keywords',
      content: mergedKeywords.join(', '),
    });
  }

  if (twitterSite) {
    metaTags.push({
      key: 'twitter:site',
      name: 'twitter:site',
      content: twitterSite,
    });
  }

  return {
    title,
    canonicalUrl,
    htmlLang,
    htmlDir,
    metaTags,
    jsonLd: seo.jsonLd,
  };
}

/**
 * Synchronizes resolved head tags directly with `document.head` as a deterministic
 * fallback alongside `react-helmet-async` so static crawlers and browser inspections
 * immediately see updated `<title>`, `<link rel="canonical">`, and `<meta>` tags.
 */
export function syncDocumentMetaTags(tags: GeneratedHeadTags): void {
  if (typeof document === 'undefined') return;

  document.title = tags.title;
  document.documentElement.lang = tags.htmlLang;
  document.documentElement.dir = tags.htmlDir;

  // Update or create <link rel="canonical">
  let canonicalEl = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', tags.canonicalUrl);

  // Update or create each <meta> tag
  for (const tag of tags.metaTags) {
    const selector = tag.property
      ? `meta[property="${tag.property}"]`
      : `meta[name="${tag.name}"]`;
    let metaEl = document.head.querySelector<HTMLMetaElement>(selector);
    if (!metaEl) {
      metaEl = document.createElement('meta');
      if (tag.property) {
        metaEl.setAttribute('property', tag.property);
      } else if (tag.name) {
        metaEl.setAttribute('name', tag.name);
      }
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute('content', tag.content);
  }

  // Remove stale <meta name="keywords"> if all global/page keywords were cleared
  if (!tags.metaTags.some(t => t.name === 'keywords')) {
    const staleKeywordsEl = document.head.querySelector<HTMLMetaElement>('meta[name="keywords"]');
    staleKeywordsEl?.remove();
  }
}
