import type { Property, Project, Agent, CareerJob, SiteSeoSettings } from './dbService';

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage: string;
  twitterImage?: string | null;
  ogImageAlt?: string;
  keywords?: string[];
  NoIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

let runtimeSeoOverrides: SiteSeoSettings | null = null;

function getInitialOverrides(): SiteSeoSettings | null {
  if (runtimeSeoOverrides) return runtimeSeoOverrides;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('attaie_seo_settings_v1');
      if (raw) {
        runtimeSeoOverrides = JSON.parse(raw) as SiteSeoSettings;
        return runtimeSeoOverrides;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function setRuntimeSeoSettings(settings: SiteSeoSettings | null): void {
  runtimeSeoOverrides = settings;
}

export function getRuntimeSeoSettings(): SiteSeoSettings | null {
  return getInitialOverrides();
}

function getBaseSiteUrl(): string {
  const overrides = getInitialOverrides();
  if (overrides?.canonical_base_url?.trim()) {
    const cleaned = overrides.canonical_base_url.trim().replace(/\/+$/, '');
    if (cleaned === 'https://attaieproperties.af' || cleaned === 'https://website.attaieproperties.com') {
      return 'https://www.attaieproperties.com';
    }
    return cleaned;
  }
  const envUrl = (import.meta.env?.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://www.attaieproperties.com';
}

export const SEO_CONFIG = {
  get siteName(): string {
    return getInitialOverrides()?.site_name?.trim() || 'Attaie Properties';
  },
  get siteUrl(): string {
    return getBaseSiteUrl();
  },
  get defaultTitle(): string {
    return (
      getInitialOverrides()?.default_title?.trim() ||
      'Attaie Properties — Premier Real Estate in Kabul, Afghanistan'
    );
  },
  get titleTemplate(): string {
    return getInitialOverrides()?.title_template?.trim() || '%s | Attaie Properties';
  },
  get defaultDescription(): string {
    return (
      getInitialOverrides()?.default_description?.trim() ||
      'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.'
    );
  },
  get defaultKeywords(): string[] {
    const overrides = getInitialOverrides();
    if (overrides && overrides.keywords !== undefined && overrides.keywords !== null) {
      return overrides.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);
    }
    return [
      'Attaie Properties',
      'Kabul real estate',
      'properties for sale in Kabul',
      'properties for rent in Kabul',
      'luxury villas Kabul',
      'apartments in Kabul',
      'Afghanistan property agency',
    ];
  },
  get defaultImage(): string {
    const customOg = getInitialOverrides()?.og_image?.trim();
    if (customOg) {
      if (/^https?:\/\//i.test(customOg)) return customOg;
      const normalized = customOg.startsWith('/') ? customOg : `/${customOg}`;
      return `${getBaseSiteUrl()}${normalized}`;
    }
    return `${getBaseSiteUrl()}/logo.png`;
  },
  get defaultTwitterImage(): string | null {
    const customTw = getInitialOverrides()?.twitter_image?.trim();
    if (!customTw) return null;
    if (/^https?:\/\//i.test(customTw)) return customTw;
    const normalized = customTw.startsWith('/') ? customTw : `/${customTw}`;
    return `${getBaseSiteUrl()}${normalized}`;
  },
  locale: 'en_US',
  alternateLocale: 'fa_AF',
  get twitterCard(): 'summary_large_image' | 'summary' {
    return getInitialOverrides()?.twitter_card || 'summary_large_image';
  },
  get twitterSite(): string | null {
    return getInitialOverrides()?.twitter_site?.trim() || null;
  },
  get robotsIndex(): boolean {
    const overrides = getInitialOverrides();
    return overrides?.robots_index !== undefined ? Boolean(overrides.robots_index) : true;
  },
  get organizationJsonLd(): Record<string, unknown> {
    const baseUrl = getBaseSiteUrl();
    const name = SEO_CONFIG.siteName;
    const logoUrl = SEO_CONFIG.defaultImage;
    return {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      '@id': `${baseUrl}/#organization`,
      name,
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      image: logoUrl,
      telephone: '+93782222279',
      email: 'info@attaieproperties.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Street #13, Wazir Akbar Khan',
        addressLocality: 'Kabul',
        addressCountry: 'AF',
      },
      areaServed: {
        '@type': 'City',
        name: 'Kabul',
      },
      sameAs: [
        'https://www.facebook.com/profile.php?id=61554275223244',
        'https://www.facebook.com/attaiepropertiesofficialRahnomaonlineAttaie',
        'https://www.youtube.com/@attaieproperties-buy-sell-Rent',
        'https://www.youtube.com/@AttaieRealEstate',
      ],
    };
  },
};

/**
 * Ensures any relative asset or upload path (e.g. `/uploads/img_123.jpg`)
 * is converted into an absolute URL required by OpenGraph & Twitter crawlers.
 */
export function resolveAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl || !pathOrUrl.trim()) {
    return SEO_CONFIG.defaultImage;
  }
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${SEO_CONFIG.siteUrl}${normalizedPath}`;
}

/**
 * Truncates text cleanly at word boundaries to fit meta description limits (120–160 chars).
 */
export function truncateMetaDescription(text: string, maxLength = 158): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

/**
 * Dynamically generates SEO metadata for the Properties / Projects listing route (`/properties`).
 */
export function buildPropertiesListingSeo(options?: {
  isProjects?: boolean;
  search?: string;
}): SeoMetadata {
  const isProjects = Boolean(options?.isProjects);
  const search = options?.search?.trim() || '';

  if (isProjects) {
    const canonicalUrl = resolveAbsoluteUrl('/properties?category=projects');
    const title = 'Signature Projects in Kabul | Attaie Properties';
    const description =
      'Explore premium residential and commercial development projects in Kabul, Afghanistan. View masterplans, delivery dates, and apartments by Attaie Properties.';
    return {
      title,
      description,
      canonicalUrl,
      ogType: 'website',
      ogImage: SEO_CONFIG.defaultImage,
      ogImageAlt: 'Signature Development Projects in Kabul — Attaie Properties',
      keywords: [
        'Kabul real estate projects',
        'Kabul apartments under construction',
        'new developments Kabul',
        'Attaie Properties projects',
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonicalUrl,
        isPartOf: {
          '@type': 'WebSite',
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.siteUrl,
        },
      },
    };
  }

  const canonicalUrl = resolveAbsoluteUrl('/properties');
  const title = search
    ? `Search Results for "${search}" — Kabul Properties | Attaie Properties`
    : PAGE_SEO.properties.title;
  const description = search
    ? truncateMetaDescription(
        `Browse verified properties matching "${search}" for sale and rent in Kabul with live pricing, photos, and direct inquiry on Attaie Properties.`
      )
    : PAGE_SEO.properties.description;

  return {
    ...PAGE_SEO.properties,
    title,
    description,
    canonicalUrl,
  };
}

/**
 * Dynamically generates SEO metadata, OpenGraph tags, and Schema.org JSON-LD
 * for an individual Property Detail page.
 */
export function buildPropertySeo(property: Property | null, fallbackId?: string | number): SeoMetadata {
  const idPart = property?.id ?? fallbackId ?? '';
  const canonicalUrl = resolveAbsoluteUrl(`/properties/${idPart}`);

  if (!property) {
    return {
      title: 'Property Details | Attaie Properties',
      description:
        'Explore detailed specifications, photo galleries, pricing, and visit scheduling for verified properties in Kabul on Attaie Properties.',
      canonicalUrl,
      ogType: 'article',
      ogImage: SEO_CONFIG.defaultImage,
      ogImageAlt: 'Attaie Properties Kabul',
    };
  }

  const listingLabel = property.listing_type === 'rent' ? 'For Rent' : 'For Sale';
  const numericPrice = Number(property.price || 0);
  const hasPrice = numericPrice > 0;
  const formattedPrice = hasPrice
    ? property.listing_type === 'rent'
      ? `$${numericPrice.toLocaleString()}/mo`
      : `$${numericPrice.toLocaleString()}`
    : '';

  const title = hasPrice
    ? `${property.title} — ${property.type} ${listingLabel} in ${property.location} (${formattedPrice}) | ${SEO_CONFIG.siteName}`
    : `${property.title} — ${property.type} ${listingLabel} in ${property.location} | ${SEO_CONFIG.siteName}`;

  const specSummary = [
    property.beds != null ? `${property.beds} bed` : null,
    property.baths != null ? `${property.baths} bath` : null,
    property.area != null ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const priceSentence = hasPrice
    ? `Priced at ${formattedPrice} in ${property.location}, Kabul.`
    : `Located in ${property.location}, Kabul.`;

  const rawDescription =
    property.description && property.description.trim().length > 30
      ? `${property.description.trim()} — ${specSummary ? `${specSummary}. ` : ''}${priceSentence}`
      : `${property.title}: ${specSummary ? `${specSummary} ` : ''}${property.type.toLowerCase()} ${listingLabel.toLowerCase()}. ${priceSentence} Ref: ${property.serial_number || property.id}.`;

  const description = truncateMetaDescription(rawDescription, 158);

  const primaryImage =
    property.image_url ||
    (Array.isArray(property.gallery_images) && property.gallery_images.length > 0
      ? property.gallery_images[0]
      : null);
  const ogImage = resolveAbsoluteUrl(primaryImage);

  const allAbsoluteImages = Array.from(
    new Set(
      [property.image_url, ...(property.gallery_images ?? [])]
        .filter((img): img is string => Boolean(img && img.trim()))
        .map(img => resolveAbsoluteUrl(img))
    )
  );

  const availabilityMap: Record<Property['status'], string> = {
    available: 'https://schema.org/InStock',
    pending: 'https://schema.org/LimitedAvailability',
    sold: 'https://schema.org/SoldOut',
    rented: 'https://schema.org/OutOfStock',
  };

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${canonicalUrl}#listing`,
    name: property.title,
    url: canonicalUrl,
    description,
    identifier: property.serial_number || String(property.id),
    datePosted: property.created_at || undefined,
    image: allAbsoluteImages.length > 0 ? allAbsoluteImages : [ogImage],
    offers: {
      '@type': 'Offer',
      price: Number(property.price),
      priceCurrency: 'USD',
      availability: availabilityMap[property.status] || 'https://schema.org/InStock',
      url: canonicalUrl,
    },
    mainEntity: {
      '@type': property.type === 'Apartment' ? 'Apartment' : property.type === 'Villa' || property.type === 'House' ? 'SingleFamilyResidence' : 'Place',
      name: property.title,
      description: property.description || description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: property.location,
        addressLocality: 'Kabul',
        addressCountry: 'AF',
      },
      ...(property.beds != null ? { numberOfBedrooms: Number(property.beds) } : {}),
      ...(property.baths != null ? { numberOfBathroomsTotal: Number(property.baths) } : {}),
      ...(property.area != null
        ? {
            floorSize: {
              '@type': 'QuantitativeValue',
              value: Number(property.area),
              unitCode: 'MTK',
            },
          }
        : {}),
    },
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    ogImage,
    ogImageAlt: `${property.title} — ${property.location}, Kabul`,
    keywords: [
      property.title,
      property.type,
      property.location,
      `Kabul ${property.type.toLowerCase()} for ${property.listing_type}`,
      property.serial_number,
      'Attaie Properties',
    ].filter(Boolean),
    jsonLd,
  };
}

/**
 * Dynamically generates SEO metadata, OpenGraph tags, and Schema.org JSON-LD
 * for an individual Project Detail page.
 */
export function buildProjectSeo(project: Project | null, fallbackId?: string | number): SeoMetadata {
  const idPart = project?.id ?? fallbackId ?? '';
  const canonicalUrl = resolveAbsoluteUrl(`/projects/${idPart}`);

  if (!project) {
    return {
      title: 'Development Project Details | Attaie Properties',
      description:
        'Explore residential and commercial development projects in Kabul, including masterplans, available apartments, and delivery timelines.',
      canonicalUrl,
      ogType: 'article',
      ogImage: SEO_CONFIG.defaultImage,
      ogImageAlt: 'Attaie Properties Development Project',
    };
  }

  const title = `${project.name} — ${project.status} Development in ${project.location} | ${SEO_CONFIG.siteName}`;

  const unitSummary =
    project.available_units != null && project.total_units != null && project.total_units > 0
      ? `${project.available_units} of ${project.total_units} units available.`
      : project.available_units != null && project.available_units > 0
      ? `${project.available_units} units available.`
      : '';

  const deliverySummary = project.delivery_date ? `Estimated delivery: ${project.delivery_date}.` : '';

  const rawDescription =
    project.description && project.description.trim().length > 30
      ? `${project.description.trim()} ${unitSummary} ${deliverySummary}`.trim()
      : `${project.name} is a ${project.status.toLowerCase()} real estate development in ${project.location}, Kabul by Attaie Properties. ${unitSummary} ${deliverySummary}`.trim();

  const description = truncateMetaDescription(rawDescription, 158);

  const primaryImage =
    project.image_url ||
    (Array.isArray(project.gallery_images) && project.gallery_images.length > 0
      ? project.gallery_images[0]
      : project.masterplan_image);
  const ogImage = resolveAbsoluteUrl(primaryImage);

  const allAbsoluteImages = Array.from(
    new Set(
      [project.image_url, project.masterplan_image, ...(project.gallery_images ?? [])]
        .filter((img): img is string => Boolean(img && img.trim()))
        .map(img => resolveAbsoluteUrl(img))
    )
  );

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    '@id': `${canonicalUrl}#project`,
    name: project.name,
    url: canonicalUrl,
    description,
    image: allAbsoluteImages.length > 0 ? allAbsoluteImages : [ogImage],
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.location,
      addressLocality: 'Kabul',
      addressCountry: 'AF',
    },
    ...(project.total_units
      ? {
          numberOfAccommodationUnits: {
            '@type': 'QuantitativeValue',
            value: Number(project.total_units),
          },
        }
      : {}),
    ...(project.available_units != null
      ? {
          numberOfAvailableAccommodationUnits: {
            '@type': 'QuantitativeValue',
            value: Number(project.available_units),
          },
        }
      : {}),
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    ogImage,
    ogImageAlt: `${project.name} — ${project.location}, Kabul`,
    keywords: [
      project.name,
      project.location,
      project.status,
      'Kabul real estate development',
      'Attaie Properties projects',
    ].filter(Boolean),
    jsonLd,
  };
}

/**
 * Dynamically generates SEO metadata and Person/RealEstateAgent JSON-LD
 * for an individual Agent Profile page.
 */
export function buildAgentSeo(agent: Agent | null, fallbackId?: string | number): SeoMetadata {
  const idPart = agent?.id ?? fallbackId ?? '';
  const canonicalUrl = resolveAbsoluteUrl(`/agents/${idPart}`);

  if (!agent) {
    return {
      title: 'Agent Profile | Attaie Properties',
      description: 'Connect with a dedicated real estate advisor at Attaie Properties in Kabul.',
      canonicalUrl,
      ogType: 'profile',
      ogImage: SEO_CONFIG.defaultImage,
    };
  }

  const title = `${agent.name} — ${agent.role} | ${SEO_CONFIG.siteName}`;
  const description = truncateMetaDescription(
    agent.background && agent.background.trim().length > 20
      ? `${agent.name} (${agent.role} at Attaie Properties): ${agent.background.trim()}`
      : `Contact ${agent.name}, ${agent.role} at Attaie Properties in Kabul, for property sales, rentals, and investment advisory.`,
    158
  );
  const ogImage = resolveAbsoluteUrl(agent.portrait_url);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: agent.name,
    jobTitle: agent.role,
    description,
    image: ogImage,
    url: canonicalUrl,
    telephone: agent.phone,
    email: agent.email,
    worksFor: {
      '@type': 'RealEstateAgent',
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
    },
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'profile',
    ogImage,
    ogImageAlt: `${agent.name} — ${agent.role}`,
    keywords: [agent.name, agent.role, 'Kabul real estate agent', 'Attaie Properties'].filter(Boolean),
    jsonLd,
  };
}

/**
 * Dynamically generates SEO metadata and JobPosting JSON-LD for a Career Detail page.
 */
export function buildCareerSeo(job: CareerJob | null, fallbackId?: string | number): SeoMetadata {
  const idPart = job?.id ?? fallbackId ?? '';
  const canonicalUrl = resolveAbsoluteUrl(`/careers/${idPart}`);

  if (!job) {
    return {
      title: 'Career Opportunity | Attaie Properties',
      description: 'Explore career opportunities and apply to join Attaie Properties in Kabul, Afghanistan.',
      canonicalUrl,
      ogType: 'article',
      ogImage: SEO_CONFIG.defaultImage,
    };
  }

  const title = `${job.title} (${job.employment_type}) — Careers in ${job.location} | ${SEO_CONFIG.siteName}`;
  const description = truncateMetaDescription(
    job.description && job.description.trim().length > 20
      ? `${job.title} in ${job.location}: ${job.description.trim()}`
      : `Apply for ${job.title} (${job.employment_type}) at Attaie Properties in ${job.location}.`,
    158
  );

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description,
    employmentType: job.employment_type,
    datePosted: job.created_at ? job.created_at.slice(0, 10) : undefined,
    validThrough: job.deadline_at,
    hiringOrganization: {
      '@type': 'Organization',
      name: SEO_CONFIG.siteName,
      sameAs: SEO_CONFIG.siteUrl,
      logo: SEO_CONFIG.defaultImage,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Kabul',
        addressCountry: 'AF',
      },
    },
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    ogImage: SEO_CONFIG.defaultImage,
    ogImageAlt: `${job.title} — ${SEO_CONFIG.siteName}`,
    keywords: [job.title, job.employment_type, 'Kabul jobs', 'Attaie Properties careers', 'real estate jobs Afghanistan'].filter(Boolean),
    jsonLd,
  };
}

/**
 * Static page SEO presets for core routes.
 */
export const PAGE_SEO: Record<'home' | 'properties' | 'projects' | 'agents' | 'careers' | 'about' | 'contact' | 'notFound', SeoMetadata> = {
  home: {
    get title() {
      return SEO_CONFIG.defaultTitle;
    },
    get description() {
      return SEO_CONFIG.defaultDescription;
    },
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    get ogImageAlt() {
      return SEO_CONFIG.defaultTitle;
    },
    get keywords() {
      return SEO_CONFIG.defaultKeywords;
    },
    get jsonLd() {
      const baseUrl = SEO_CONFIG.siteUrl;
      return [
        SEO_CONFIG.organizationJsonLd,
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          name: SEO_CONFIG.siteName,
          url: baseUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/properties?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ];
    },
  },
  properties: {
    title: 'Properties for Sale & Rent in Kabul | Attaie Properties',
    description:
      'Search verified villas, apartments, houses, commercial spaces, and land for sale and rent across Kabul with live pricing and photos.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/properties`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'Verified Properties for Sale & Rent in Kabul — Attaie Properties',
    keywords: [
      'buy property in Kabul',
      'rent apartment in Kabul',
      'villas for sale Kabul',
      'Wazir Akbar Khan properties',
      'Attaie Properties listings',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/properties`;
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Properties for Sale & Rent in Kabul | Attaie Properties',
        description:
          'Search verified villas, apartments, houses, commercial spaces, and land for sale and rent across Kabul.',
        url,
        isPartOf: {
          '@type': 'WebSite',
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.siteUrl,
        },
      };
    },
  },
  projects: {
    title: 'Real Estate Developments & Signature Projects in Kabul | Attaie Properties',
    description:
      'Explore Attaie Properties residential and commercial developments in Kabul: view masterplans, delivery dates, and available apartments.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/projects`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'Signature Real Estate Developments in Kabul — Attaie Properties',
    keywords: [
      'Kabul real estate developments',
      'signature projects Kabul',
      'new residential towers Kabul',
      'Attaie Properties developments',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/projects`;
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Real Estate Developments & Signature Projects in Kabul | Attaie Properties',
        description:
          'Explore Attaie Properties residential and commercial developments in Kabul: view masterplans, delivery dates, and available apartments.',
        url,
        isPartOf: {
          '@type': 'WebSite',
          name: SEO_CONFIG.siteName,
          url: SEO_CONFIG.siteUrl,
        },
      };
    },
  },
  agents: {
    title: 'Our Real Estate Advisors & Agents | Attaie Properties',
    description:
      'Meet the experienced Kabul property advisors and agents at Attaie Properties ready to assist with buying, selling, and leasing.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/agents`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'Real Estate Advisors & Agents — Attaie Properties Kabul',
    keywords: [
      'Kabul real estate agents',
      'property advisors Afghanistan',
      'Attaie Properties team',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/agents`;
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Our Real Estate Advisors & Agents | Attaie Properties',
        description:
          'Meet the experienced Kabul property advisors and agents at Attaie Properties ready to assist with buying, selling, and leasing.',
        url,
      };
    },
  },
  careers: {
    title: 'Careers & Job Opportunities in Kabul | Attaie Properties',
    description:
      'Join Attaie Properties in Kabul, Afghanistan. Browse open real estate sales, engineering, marketing, and operations positions and apply online.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/careers`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'Careers at Attaie Properties Kabul',
    keywords: [
      'Attaie Properties careers',
      'jobs in Kabul',
      'real estate jobs Afghanistan',
      'property advisor jobs Kabul',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/careers`;
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Careers & Job Opportunities in Kabul | Attaie Properties',
        description:
          'Join Attaie Properties in Kabul, Afghanistan. Browse open positions and submit your job application online.',
        url,
      };
    },
  },
  about: {
    title: "About Attaie Properties — Kabul's Trusted Real Estate Agency",
    description:
      'Learn about Attaie Properties, our mission, local expertise, and commitment to transparent real estate services in Kabul, Afghanistan.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/about`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'About Attaie Properties Kabul',
    keywords: [
      'About Attaie Properties',
      'trusted real estate agency Kabul',
      'Wazir Akbar Khan real estate office',
      'Afghan diaspora property services',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/about`;
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: "About Attaie Properties — Kabul's Trusted Real Estate Agency",
          description:
            'Learn about Attaie Properties, our mission, local expertise, and commitment to transparent real estate services in Kabul, Afghanistan.',
          url,
          mainEntity: SEO_CONFIG.organizationJsonLd,
        },
      ];
    },
  },
  contact: {
    title: 'Contact Us & Schedule a Consultation | Attaie Properties',
    description:
      'Get in touch with Attaie Properties in Kabul by phone (+93 782 222 279), WhatsApp, or inquiry form to buy, sell, rent, or schedule a property visit.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/contact`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    ogImageAlt: 'Contact Attaie Properties in Kabul',
    keywords: [
      'contact Attaie Properties',
      'Kabul real estate phone number',
      'schedule property visit Kabul',
      'Wazir Akbar Khan property office',
    ],
    get jsonLd() {
      const url = `${SEO_CONFIG.siteUrl}/contact`;
      return {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Us & Schedule a Consultation | Attaie Properties',
        description:
          'Get in touch with Attaie Properties in Kabul by phone, WhatsApp, or inquiry form to buy, sell, rent, or schedule a property visit.',
        url,
        mainEntity: SEO_CONFIG.organizationJsonLd,
      };
    },
  },
  notFound: {
    title: '404 — Page Not Found | Attaie Properties',
    description:
      'The page you are looking for could not be found. Browse verified properties and development projects in Kabul on Attaie Properties.',
    get canonicalUrl() {
      return `${SEO_CONFIG.siteUrl}/404`;
    },
    ogType: 'website',
    get ogImage() {
      return SEO_CONFIG.defaultImage;
    },
    NoIndex: true,
  },
};
